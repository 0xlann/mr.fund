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
    call(&owner, &lending, "execute_with_pyth", json!({"actions":[{"Borrow":{"token_id":debt.id(),"amount":"10000000000000000000"}},{"Withdraw":{"token_id":debt.id(),"amount":"10000000000000000000"}}]}), NearToken::from_yoctonear(1)).await?;
    let owner_before = position(&lending, &owner).await?;
    assert_eq!(
        owner_before["borrowed"][0]["balance"],
        "10000000000000000000"
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
    println!("P0.3 {network} WASM {version}: full contract-owned cycle, owner isolation and cross-account repay isolation passed; prices Simulated; source block {}", metadata["blockHeight"]);
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
