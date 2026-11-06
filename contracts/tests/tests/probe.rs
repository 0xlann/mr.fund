use anyhow::{bail, Context, Result};
use near_workspaces::{types::NearToken, Account, Contract};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::path::PathBuf;

fn target(path: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../target")
        .join(path)
}

fn verify_wasm(wasm: &[u8], metadata: &Value) -> Result<()> {
    let sha256 = format!("{:x}", Sha256::digest(wasm));
    if metadata["sha256"].as_str() != Some(sha256.as_str()) {
        bail!("Rhea WASM SHA-256 does not match recorded provenance");
    }
    Ok(())
}

#[test]
fn wasm_provenance_rejects_modified_code() -> Result<()> {
    let metadata: Value =
        serde_json::from_slice(&std::fs::read(target("probes/rhea-testnet.json"))?)?;
    let mut wasm = std::fs::read(target("probes/rhea-testnet.wasm"))?;
    verify_wasm(&wasm, &metadata)?;
    wasm[8] ^= 1;
    assert!(verify_wasm(&wasm, &metadata).is_err());
    Ok(())
}

async fn call(
    signer: &Account,
    contract: &Contract,
    method: &str,
    args: Value,
    deposit: NearToken,
) -> Result<Value> {
    let result = signer
        .call(contract.id(), method)
        .args_json(args)
        .deposit(deposit)
        .max_gas()
        .transact()
        .await?;
    if !result.failures().is_empty() {
        bail!("{method}: {:?}", result.failures());
    }
    Ok(result.json().unwrap_or(Value::Null))
}
async fn position(lending: &Contract, account: &Account) -> Result<Value> {
    Ok(lending
        .view("get_account")
        .args_json(json!({"account_id":account.id()}))
        .await?
        .json()?)
}
async fn balance(token: &Contract, account: &Account) -> Result<u128> {
    let v: String = token
        .view("ft_balance_of")
        .args_json(json!({"account_id":account.id()}))
        .await?
        .json()?;
    Ok(v.parse()?)
}

async fn trigger_checks(
    owner: &Account,
    probe: &Contract,
    oracle: &Contract,
    network: &str,
) -> Result<()> {
    let config = json!({"oracle_id":oracle.id(),"collateral_price_id":"11".repeat(32),"debt_price_id":"22".repeat(32),"max_price_age_sec":60,"threshold_bps":57000,"legacy_oracle":network=="testnet"});
    let mut gas = serde_json::Map::new();
    for (name, threshold, expected, reason) in [
        ("at_threshold", 57000, false, Some("trigger_not_met")),
        ("below_threshold", 57001, true, None),
    ] {
        let mut cfg = config.clone();
        cfg["threshold_bps"] = json!(threshold);
        let result = owner
            .call(probe.id(), "probe_check_trigger")
            .args_json(json!({"config":cfg}))
            .deposit(NearToken::from_yoctonear(1))
            .max_gas()
            .transact()
            .await?;
        assert!(result.failures().is_empty(), "{:?}", result.failures());
        let burnt = result.total_gas_burnt.as_gas();
        assert!(
            burnt < 100_000_000_000_000,
            "Read-only trigger check exceeds its 100 Tgas regression budget"
        );
        gas.insert(name.into(), json!(burnt));
        let output: Value = result.json()?;
        assert_eq!(output["health_bps"], 57000);
        assert_eq!(output["triggered"], expected);
        assert_eq!(output["reason"], json!(reason));
    }
    call(
        owner,
        oracle,
        "clear_price",
        json!({"price_id":"11".repeat(32)}),
        NearToken::from_yoctonear(0),
    )
    .await?;
    let output = call(
        owner,
        probe,
        "probe_check_trigger",
        json!({"config":config}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    assert_eq!(output["triggered"], false);
    assert_eq!(output["reason"], "stale_price");
    call(
        owner,
        oracle,
        "set_price",
        json!({"price_id":"11".repeat(32),"price":"500000000"}),
        NearToken::from_yoctonear(0),
    )
    .await?;
    call(
        owner,
        oracle,
        "set_price_age",
        json!({"price_id":"11".repeat(32),"age_sec":61}),
        NearToken::from_yoctonear(0),
    )
    .await?;
    let output = call(
        owner,
        probe,
        "probe_check_trigger",
        json!({"config":config}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    assert_eq!(output["triggered"], false);
    assert_eq!(output["reason"], "stale_price");
    call(
        owner,
        oracle,
        "set_price_age",
        json!({"price_id":"11".repeat(32),"age_sec":0}),
        NearToken::from_yoctonear(0),
    )
    .await?;
    let mut wrong = config.clone();
    wrong["max_price_age_sec"] = json!(120);
    let output = call(
        owner,
        probe,
        "probe_check_trigger",
        json!({"config":wrong}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    assert_eq!(output["reason"], "invalid_config");
    std::fs::write(
        target(&format!("probes/trigger-gas-{network}.json")),
        serde_json::to_vec_pretty(&json!({"network":network,"prices":"Simulated","gas":gas}))?,
    )?;
    println!("P0.4 {network}: health 57000 bps, strict threshold, null/expired prices rejected, gas {gas:?}");
    Ok(())
}

async fn guardian_reserve_flow(
    worker: &near_workspaces::Worker<near_workspaces::network::Sandbox>,
    owner: &Account,
    watcher: &Account,
    lending: &Contract,
    oracle: &Contract,
    collateral: &Contract,
    debt: &Contract,
) -> Result<()> {
    let guardian = worker
        .dev_deploy(&std::fs::read(target("near/guardian/guardian.wasm"))?)
        .await?;
    let init = json!({"config":{"owner_id":owner.id(),"watcher_id":watcher.id(),"lending_id":lending.id(),"oracle_id":oracle.id(),"debt_token_id":debt.id(),"collateral_token_ids":[collateral.id()],"fee_recipient_id":owner.id(),"activation_fee":"1000"},"policy":{"max_per_action":"1000","lifetime_cap":"10000","reserve_floor":"100","trigger_hf_bps":12000,"target_hf_bps":15000,"cooldown_sec":300,"action_fee":"1"}});
    call(
        owner,
        &guardian,
        "new",
        init.clone(),
        NearToken::from_yoctonear(0),
    )
    .await?;
    guardian
        .batch()
        .delete_key(guardian.as_account().secret_key().public_key())
        .transact()
        .await?
        .into_result()?;
    assert!(guardian.view_access_keys().await?.is_empty());
    call(
        owner,
        debt,
        "storage_deposit",
        json!({"account_id":guardian.id(),"registration_only":true}),
        NearToken::from_millinear(10),
    )
    .await?;
    call(
        owner,
        debt,
        "ft_transfer_call",
        json!({"receiver_id":guardian.id(),"amount":"5000","msg":"{\"activate\":{}}"}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    let status: Value = guardian.view("get_status").await?.json()?;
    assert_eq!(status["status"], "active");
    let reserve: Value = guardian.view("get_reserve").await?.json()?;
    assert_eq!(reserve["reserve"], "4000");
    assert_eq!(balance(debt, guardian.as_account()).await?, 4000);
    let denied = watcher
        .call(guardian.id(), "owner_withdraw_reserve")
        .args_json(json!({"amount":"1"}))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?;
    assert!(denied.is_failure());
    assert_eq!(balance(debt, guardian.as_account()).await?, 4000);
    call(
        owner,
        &guardian,
        "pause",
        json!({}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    call(
        owner,
        &guardian,
        "resume",
        json!({}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    call(
        owner,
        &guardian,
        "deactivate",
        json!({}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    // Sandbox fixture only: unregister/burn the owner's test-token wallet to
    // force a real NEP-141 recipient-registration failure, then restore it.
    call(
        owner,
        debt,
        "storage_unregister",
        json!({"force":true}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    let failed = owner
        .call(guardian.id(), "owner_withdraw_reserve")
        .args_json(json!({"amount":"4000"}))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?;
    assert!(!failed.failures().is_empty());
    assert!(!failed.json::<bool>()?);
    let reserve: Value = guardian.view("get_reserve").await?.json()?;
    assert_eq!(reserve["reserve"], "4000");
    let status: Value = guardian.view("get_status").await?.json()?;
    assert!(status["in_flight"].is_null());
    assert_eq!(status["status"], "deactivated");
    assert_eq!(balance(debt, guardian.as_account()).await?, 4000);
    call(
        owner,
        debt,
        "storage_deposit",
        json!({"account_id":owner.id(),"registration_only":true}),
        NearToken::from_millinear(10),
    )
    .await?;
    call(
        owner,
        &guardian,
        "owner_withdraw_reserve",
        json!({"amount":"4000"}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    assert_eq!(balance(debt, guardian.as_account()).await?, 0);
    let reserve: Value = guardian.view("get_reserve").await?.json()?;
    assert_eq!(reserve["reserve"], "0");
    let broken = worker
        .dev_deploy(&std::fs::read(target("near/guardian/guardian.wasm"))?)
        .await?;
    let mut broken_init = init;
    broken_init["config"]["fee_recipient_id"] = json!(watcher.id());
    call(
        owner,
        &broken,
        "new",
        broken_init,
        NearToken::from_yoctonear(0),
    )
    .await?;
    call(
        owner,
        debt,
        "storage_deposit",
        json!({"account_id":broken.id(),"registration_only":true}),
        NearToken::from_millinear(10),
    )
    .await?;
    let before = balance(debt, owner).await?;
    let failed = owner
        .call(debt.id(), "ft_transfer_call")
        .args_json(json!({"receiver_id":broken.id(),"amount":"3000","msg":"{\"activate\":{}}"}))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?;
    assert!(!failed.failures().is_empty());
    assert_eq!(failed.json::<String>()?, "0");
    assert_eq!(balance(debt, owner).await?, before);
    assert_eq!(balance(debt, broken.as_account()).await?, 0);
    let status: Value = broken.view("get_status").await?.json()?;
    assert_eq!(status["status"], "created");
    assert!(status["in_flight"].is_null());
    let reserve: Value = broken.view("get_reserve").await?.json()?;
    assert_eq!(reserve["reserve"], "0");
    Ok(())
}

async fn cycle(network: &str) -> Result<()> {
    let metadata: Value = serde_json::from_slice(
        &std::fs::read(target(&format!("probes/rhea-{network}.json")))
            .context("Run scripts/probes/fetch-rhea-wasm.mjs first")?,
    )?;
    let rhea_wasm = std::fs::read(target(&format!("probes/rhea-{network}.wasm")))?;
    verify_wasm(&rhea_wasm, &metadata)?;
    let worker = near_workspaces::sandbox().await?;
    let owner = worker.dev_create_account().await?;
    let attacker = worker.dev_create_account().await?;
    let fixtures = std::fs::read(target("near/probe_fixtures/probe_fixtures.wasm"))?;
    let collateral = worker.dev_deploy(&fixtures).await?;
    let debt = worker.dev_deploy(&fixtures).await?;
    let oracle = worker.dev_deploy(&fixtures).await?;
    for token in [&collateral, &debt, &oracle] {
        call(
            token.as_account(),
            token,
            "new",
            json!({"owner_id":owner.id()}),
            NearToken::from_yoctonear(0),
        )
        .await?;
    }
    let lending = worker.dev_deploy(&rhea_wasm).await?;
    let mut config = metadata["config"].clone();
    config["owner_id"] = json!(owner.id());
    config["pyth_oracle_account_id"] = json!(oracle.id());
    config["oracle_account_id"] = json!(oracle.id());
    config["booster_token_id"] = json!(debt.id());
    config["max_num_assets"] = json!(20);
    call(
        &owner,
        &lending,
        "new",
        json!({"config": config}),
        NearToken::from_yoctonear(0),
    )
    .await?;
    let version: String = lending.view("get_version").await?.json()?;
    assert_eq!(version, metadata["version"].as_str().unwrap());
    for (token, ratio, extra, price_id) in [
        (&collateral, 6000, 0, "11".repeat(32)),
        (&debt, 9500, 12, "22".repeat(32)),
    ] {
        let mut asset = metadata["assetTemplate"].clone();
        asset["can_deposit"] = json!(true);
        asset["can_withdraw"] = json!(true);
        asset["can_use_as_collateral"] = json!(true);
        asset["can_borrow"] = json!(true);
        asset["extra_decimals"] = json!(extra);
        asset["volatility_ratio"] = json!(ratio);
        asset["net_tvl_multiplier"] = json!(10000);
        asset["supplied_limit"] = json!(u128::MAX.to_string());
        asset["borrowed_limit"] = json!(u128::MAX.to_string());
        asset["min_borrowed_amount"] = json!("1");
        asset["target_utilization_rate"] = json!("1000000000000000000000000000");
        asset["max_utilization_rate"] = json!("1000000000000000000000000000");
        call(
            &owner,
            &lending,
            "add_asset",
            json!({"token_id":token.id(),"asset_config":asset}),
            NearToken::from_yoctonear(1),
        )
        .await?;
        call(&owner, &lending, "add_token_pyth_info", json!({"token_id":token.id(),"token_pyth_info":{"decimals":6,"fraction_digits":4,"price_identifier":price_id,"extra_call":null,"default_price":null}}), NearToken::from_yoctonear(1)).await?;
        call(
            &owner,
            &oracle,
            "set_price",
            json!({"price_id":price_id,"price":if extra==0 {"500000000"} else {"100000000"}}),
            NearToken::from_yoctonear(0),
        )
        .await?;
    }
    let probe = worker
        .dev_deploy(&std::fs::read(target("near/probe/probe.wasm"))?)
        .await?;
    call(&owner, &probe, "new", json!({"owner_id":owner.id(),"lending_id":lending.id(),"collateral_token_id":collateral.id(),"debt_token_id":debt.id(),"debt_extra_decimals":12,"collateral_extra_decimals":0}), NearToken::from_yoctonear(0)).await?;
    probe
        .batch()
        .delete_key(probe.as_account().secret_key().public_key())
        .transact()
        .await?
        .into_result()?;
    assert!(probe.view_access_keys().await?.is_empty());
    for token in [&collateral, &debt] {
        for account in [&owner, lending.as_account()] {
            call(
                &owner,
                token,
                "storage_deposit",
                json!({"account_id":account.id(),"registration_only":true}),
                NearToken::from_millinear(10),
            )
            .await?;
        }
        call(
            &owner,
            &probe,
            "probe_register",
            json!({"target_id":token.id(),"storage_deposit":"10000000000000000000000"}),
            NearToken::from_yoctonear(1),
        )
        .await?;
    }
    call(
        &owner,
        &lending,
        "storage_deposit",
        json!({"account_id":owner.id(),"registration_only":true}),
        NearToken::from_near(1),
    )
    .await?;
    call(
        &owner,
        &probe,
        "probe_register",
        json!({"target_id":lending.id(),"storage_deposit":"1000000000000000000000000"}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    assert!(!position(&lending, probe.as_account()).await?.is_null());
    // Seed real NEP-141 liquidity into the imported Rhea code.
    call(
        &owner,
        &debt,
        "mint",
        json!({"account_id":owner.id(),"amount":"2000000000"}),
        NearToken::from_yoctonear(0),
    )
    .await?;
    call(
        &owner,
        &debt,
        "ft_transfer_call",
        json!({"receiver_id":lending.id(),"amount":"1000000000","msg":""}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    call(
        &owner,
        &collateral,
        "mint",
        json!({"account_id":owner.id(),"amount":"300000000"}),
        NearToken::from_yoctonear(0),
    )
    .await?;
    call(
        &owner,
        &collateral,
        "ft_transfer_call",
        json!({"receiver_id":probe.id(),"amount":"100000000","msg":""}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    call(
        &owner,
        &probe,
        "probe_supply_collateral",
        json!({"amount":"100000000"}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    let supplied = position(&lending, probe.as_account()).await?;
    assert_eq!(supplied["collateral"][0]["balance"], "100000000");
    call(
        &owner,
        &probe,
        "probe_borrow",
        json!({"amount":"50000000"}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    let borrowed = position(&lending, probe.as_account()).await?;
    assert_eq!(borrowed["borrowed"][0]["balance"], "50000000000000000000");
    assert_eq!(balance(&debt, probe.as_account()).await?, 50_000_000);
    assert_eq!(position(&lending, &owner).await?["borrowed"], json!([]));
    trigger_checks(&owner, &probe, &oracle, network).await?;
    // Missing owner check would allow this call and reduce probe debt.
    let before = position(&lending, probe.as_account()).await?;
    let rejected = attacker
        .call(probe.id(), "probe_repay")
        .args_json(json!({"amount":"1"}))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?;
    assert!(rejected.is_failure());
    assert!(format!("{:?}", rejected.failures()).contains("Owner only"));
    assert_eq!(position(&lending, probe.as_account()).await?, before);
    let forged = owner
        .call(probe.id(), "on_result")
        .args_json(json!({"op_id":0,"operation":"repay"}))
        .max_gas()
        .transact()
        .await?;
    assert!(forged.is_failure());
    assert!(format!("{:?}", forged.failures()).contains("private"));
    // Owner opens a different debt: OnlyRepay from probe must not touch it.
    call(&owner, &collateral, "ft_transfer_call", json!({"receiver_id":lending.id(),"amount":"100000000","msg":format!("{{\"Execute\":{{\"actions\":[{{\"IncreaseCollateral\":{{\"token_id\":\"{}\"}}}}]}}}}",collateral.id())}), NearToken::from_yoctonear(1)).await?;
    call(&owner, &lending, "execute_with_pyth", json!({"actions":[{"Borrow":{"token_id":debt.id(),"amount":"10000000000000000001"}},{"Withdraw":{"token_id":debt.id(),"amount":"10000000000000000000"}}]}), NearToken::from_yoctonear(1)).await?;
    let owner_before = position(&lending, &owner).await?;
    assert_eq!(
        owner_before["borrowed"][0]["balance"],
        "10000000000000000001"
    );
    if network == "testnet" {
        let before = position(&lending, probe.as_account()).await?;
        let rejected = owner
            .call(probe.id(), "probe_repay")
            .args_json(json!({"amount":"50000000"}))
            .deposit(NearToken::from_yoctonear(1))
            .max_gas()
            .transact()
            .await?;
        let failures = format!("{:?}", rejected.failures());
        assert!(
            failures.contains("unknown variant `OnlyRepay`"),
            "{failures}"
        );
        assert_eq!(position(&lending, probe.as_account()).await?, before);
        assert_eq!(balance(&debt, probe.as_account()).await?, 50_000_000);
        let resolved: Value = rejected.json()?;
        assert_eq!(resolved["used"], "0");
    }
    let repaid = call(
        &owner,
        &probe,
        if network == "testnet" {
            "probe_repay_via_execute"
        } else {
            "probe_repay"
        },
        json!({"amount":"50000000"}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    assert_eq!(repaid["receipt_succeeded"], true);
    assert_eq!(repaid["used"], "50000000");
    assert_eq!(
        position(&lending, probe.as_account()).await?["borrowed"],
        json!([])
    );
    assert_eq!(
        position(&lending, &owner).await?["borrowed"],
        owner_before["borrowed"]
    );
    if network == "testnet" {
        let supplied_before: u128 = owner_before["supplied"]
            .as_array()
            .unwrap()
            .iter()
            .find(|a| a["token_id"] == debt.id().as_str())
            .unwrap()["balance"]
            .as_str()
            .unwrap()
            .parse()?;
        let msg=json!({"Execute":{"actions":[{"Repay":{"token_id":debt.id(),"max_amount":"10000001000000000000"}}]}}).to_string();
        call(
            &owner,
            &debt,
            "ft_transfer_call",
            json!({"receiver_id":lending.id(),"amount":"10000001","msg":msg}),
            NearToken::from_yoctonear(1),
        )
        .await?;
        let after = position(&lending, &owner).await?;
        assert_eq!(after["borrowed"], json!([]));
        let supplied_after: u128 = after["supplied"]
            .as_array()
            .unwrap()
            .iter()
            .find(|a| a["token_id"] == debt.id().as_str())
            .unwrap()["balance"]
            .as_str()
            .unwrap()
            .parse()?;
        assert_eq!(supplied_after, supplied_before + 999_999_999_999);
    }
    call(
        &owner,
        &probe,
        "probe_release",
        json!({"amount":"100000000"}),
        NearToken::from_yoctonear(1),
    )
    .await?;
    assert_eq!(
        position(&lending, probe.as_account()).await?["collateral"],
        json!([])
    );
    assert_eq!(balance(&collateral, probe.as_account()).await?, 100_000_000);
    guardian_reserve_flow(
        &worker,
        &owner,
        &attacker,
        &lending,
        &oracle,
        &collateral,
        &debt,
    )
    .await?;
    println!("P0.3 {network} WASM {version}: full contract-owned cycle, owner isolation and cross-account repay isolation passed; P2.2 Guardian activation and deactivated reserve withdrawal passed; prices Simulated; source block {}", metadata["blockHeight"]);
    Ok(())
}

#[tokio::test]
async fn probe_testnet_wasm_cycle() -> Result<()> {
    cycle("testnet").await
}

#[tokio::test]
async fn probe_mainnet_wasm_cycle() -> Result<()> {
    cycle("mainnet").await
}
