//! Task 1.2 experiment: measures keyless Guardian provisioning strategies on the
//! pinned toolchain (near-sandbox, local state only; nothing touches a public
//! network). Run with `-- --nocapture` to see the measurements recorded in
//! docs/technical/SMART-CONTRACT.md. The spike factory is deliberately
//! unrestricted; these numbers are not a production factory's guarantees.
use anyhow::{Context, Result};
use near_workspaces::{
    types::{Gas, NearToken},
    Account, AccountId, Contract,
};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::path::PathBuf;

/// Protocol storage price. Confirmed by the observed funding boundary below.
const BYTE_COST: u128 = 10_000_000_000_000_000_000;

fn target(path: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../target")
        .join(path)
}

fn init_args(owner: &AccountId) -> Value {
    json!({"config":{"owner_id":owner,"watcher_id":owner,"lending_id":"lending.test","oracle_id":"oracle.test","debt_token_id":"debt.test","collateral_token_ids":["collateral.test"],"fee_recipient_id":owner,"activation_fee":"0","lending_version":"0.11.0","debt_extra_decimals":12,"collateral_extra_decimals":0,"collateral_price_id":"11".repeat(32),"debt_price_id":"22".repeat(32),"max_price_age_sec":60},"policy":{"max_per_action":"1000000","lifetime_cap":"10000000","reserve_floor":"100","trigger_hf_bps":12000,"target_hf_bps":15000,"cooldown_sec":300,"action_fee":"100"}})
}

struct Attempt {
    transaction_succeeded: bool,
    child_exists: bool,
    child_balance: Option<u128>,
    child_storage_usage: Option<u64>,
    callback_succeeded: Option<bool>,
    factory_delta: i128,
    owner_delta: i128,
    failures: Vec<String>,
}

async fn balance_of(account: &Account) -> Result<u128> {
    Ok(account.view_account().await?.balance.as_yoctonear())
}

type Sandbox = near_workspaces::Worker<near_workspaces::network::Sandbox>;

async fn attempt(
    worker: &Sandbox,
    owner: &Account,
    factory: &Contract,
    method: &str,
    label: &str,
    funding: u128,
    args: Value,
) -> Result<Attempt> {
    let (factory_before, owner_before) = (
        balance_of(factory.as_account()).await? as i128,
        balance_of(owner).await? as i128,
    );
    let outcome = owner
        .call(factory.id(), method)
        .args_json(json!({"label":label,"init_args":args}))
        .deposit(NearToken::from_yoctonear(funding))
        .gas(Gas::from_tgas(150))
        .transact()
        .await?;
    // Refund receipts settle after the transaction's own result; wait for them.
    worker.fast_forward(8).await?;
    let child_id: AccountId = format!("{label}.{}", factory.id()).parse()?;
    let details = worker.view_account(&child_id).await.ok();
    let last: Option<Value> = factory.view("get_last").await?.json()?;
    Ok(Attempt {
        transaction_succeeded: outcome.is_success(),
        child_exists: details.is_some(),
        child_balance: details.as_ref().map(|d| d.balance.as_yoctonear()),
        child_storage_usage: details.as_ref().map(|d| d.storage_usage),
        callback_succeeded: last
            .filter(|v| v["child_id"] == child_id.as_str())
            .and_then(|v| v["succeeded"].as_bool()),
        factory_delta: balance_of(factory.as_account()).await? as i128 - factory_before,
        owner_delta: balance_of(owner).await? as i128 - owner_before,
        failures: outcome
            .failures()
            .iter()
            .map(|f| format!("{f:?}"))
            .collect(),
    })
}

fn report(name: &str, a: &Attempt) {
    println!(
        "[{name}] tx_ok={} child_exists={} child_balance={:?} child_storage={:?} callback_ok={:?} factory_delta={} owner_delta={} failures={}",
        a.transaction_succeeded,
        a.child_exists,
        a.child_balance,
        a.child_storage_usage,
        a.callback_succeeded,
        a.factory_delta,
        a.owner_delta,
        a.failures.len()
    );
}

async fn deploy_factory(
    worker: &near_workspaces::Worker<near_workspaces::network::Sandbox>,
) -> Result<(Account, Contract)> {
    let owner = worker.dev_create_account().await?;
    let factory = worker
        .dev_deploy(&std::fs::read(target("near/provision_spike/provision_spike.wasm"))?)
        .await?;
    let init = factory.call("new").transact().await?;
    assert!(init.is_success(), "{:?}", init.failures());
    Ok((owner, factory))
}

#[tokio::test]
async fn provisioning_strategy_measurements() -> Result<()> {
    let worker = near_workspaces::sandbox().await?;
    let (owner, factory) = deploy_factory(&worker).await?;
    let guardian_wasm = std::fs::read(target("near/guardian/guardian.wasm"))?;
    let expected_hash: Vec<u8> = Sha256::digest(&guardian_wasm).to_vec();
    let embedded: Vec<u8> = factory.view("code_hash").await?.json()?;
    assert_eq!(embedded, expected_hash, "factory embeds the prepared Guardian");
    let factory_storage = factory.view_account().await?.storage_usage;
    println!(
        "guardian_wasm_bytes={} factory_storage_bytes={} factory_storage_cost_yocto={}",
        guardian_wasm.len(),
        factory_storage,
        u128::from(factory_storage) * BYTE_COST
    );

    // Global strategy availability: publish from the factory and measure its cost.
    let before = balance_of(factory.as_account()).await?;
    let published = factory
        .as_account()
        .call(factory.id(), "publish_global")
        .gas(Gas::from_tgas(300))
        .transact()
        .await?;
    worker.fast_forward(8).await?;
    println!(
        "[publish_global] ok={} failures={:?} factory_balance_delta={}",
        published.is_success(),
        published.failures(),
        balance_of(factory.as_account()).await? as i128 - before as i128
    );
    let global_available = published.is_success();

    // Strategy A (stored code).
    let funded = 6_000_000_000_000_000_000_000_000u128;
    let stored = attempt(&worker, &owner, &factory, "create_stored", "stored-ok", funded, init_args(owner.id())).await?;
    report("stored funded=6 NEAR", &stored);
    assert!(stored.transaction_succeeded && stored.child_exists);
    let child_id: AccountId = format!("stored-ok.{}", factory.id()).parse()?;
    assert!(worker.view_access_keys(&child_id).await?.is_empty(), "stored child is keyless");
    let status: Value = worker.view(&child_id, "get_status").await?.json()?;
    assert_eq!(status["status"], "created");
    let stored_floor = u128::from(stored.child_storage_usage.context("storage")?) * BYTE_COST;

    // Boundary: exactly the storage cost succeeds, one yocto less fails.
    let at_floor = attempt(&worker, &owner, &factory, "create_stored", "stored-floor", stored_floor, init_args(owner.id())).await?;
    report("stored funded=floor", &at_floor);
    assert!(at_floor.transaction_succeeded && at_floor.child_exists);
    let below = attempt(&worker, &owner, &factory, "create_stored", "stored-below", stored_floor - 1, init_args(owner.id())).await?;
    report("stored funded=floor-1", &below);
    // Atomic failure: no child, callback saw the failure, and the refund lands on
    // the FACTORY (the child receipt's predecessor), never directly on the owner.
    assert!(!below.child_exists && below.callback_succeeded == Some(false));
    assert_eq!(below.factory_delta, (stored_floor - 1) as i128);
    println!("stored_funding_floor_yocto={stored_floor}");

    // Failure phases for stored code.
    let bad = attempt(&worker, &owner, &factory, "create_stored", "stored-badinit", funded, json!({})).await?;
    report("stored init panics", &bad);
    assert!(!bad.child_exists && bad.callback_succeeded == Some(false));
    assert_eq!(bad.factory_delta, funded as i128);
    let dup = attempt(&worker, &owner, &factory, "create_stored", "stored-ok", funded, init_args(owner.id())).await?;
    report("stored duplicate label", &dup);
    assert!(dup.callback_succeeded == Some(false));
    assert_eq!(dup.factory_delta, funded as i128);

    if global_available {
        let global = attempt(&worker, &owner, &factory, "create_global", "global-ok", funded, init_args(owner.id())).await?;
        report("global funded=6 NEAR", &global);
        if global.child_exists {
            let id: AccountId = format!("global-ok.{}", factory.id()).parse()?;
            let state = format!("{:?}", worker.view_account(&id).await?.contract_state);
            println!("global child contract_state={state}");
            assert!(state.contains("GlobalHash"), "child references the global code by hash");
            assert!(worker.view_access_keys(&id).await?.is_empty(), "global child is keyless");
            let s: Result<Value, _> = worker.view(&id, "get_status").await.and_then(|r| r.json());
            println!("global child get_status={s:?}");
            let floor = u128::from(global.child_storage_usage.context("storage")?) * BYTE_COST;
            println!("global_funding_floor_yocto={floor}");
            let g_floor = attempt(&worker, &owner, &factory, "create_global", "global-floor", floor, init_args(owner.id())).await?;
            report("global funded=floor", &g_floor);
            let g_below = attempt(&worker, &owner, &factory, "create_global", "global-below", floor - 1, init_args(owner.id())).await?;
            report("global funded=floor-1", &g_below);
            // The exact 1-yocto boundary seen for stored code did not reproduce here;
            // walk funding down by whole storage bytes to find where creation fails.
            for (n, bytes) in [1u128, 10, 100, 300, 600].into_iter().enumerate() {
                let funding = floor - bytes * BYTE_COST;
                let label = format!("global-minus{n}");
                let a = attempt(&worker, &owner, &factory, "create_global", &label, funding, init_args(owner.id())).await?;
                report(&format!("global funded=floor-{bytes} bytes"), &a);
            }
            // Is an under-funded global child really usable? Grow its state by 60 bytes.
            let thin: AccountId = format!("global-minus4.{}", factory.id()).parse()?;
            let long_watcher = format!("{}.test.near", "w".repeat(50));
            let grow = owner
                .call(&thin, "rotate_watcher")
                .args_json(json!({"watcher_id":long_watcher}))
                .deposit(NearToken::from_yoctonear(1))
                .gas(Gas::from_tgas(30))
                .transact()
                .await;
            match grow {
                Ok(r) => println!("[thin global child grows state] ok={} failures={:?}", r.is_success(), r.failures()),
                Err(e) => println!("[thin global child grows state] error={e:?}"),
            }
            println!("thin child after: {:?}", worker.view_account(&thin).await?);
            let g_bad = attempt(&worker, &owner, &factory, "create_global", "global-badinit", funded, json!({})).await?;
            report("global init panics", &g_bad);
            assert!(!g_bad.child_exists && g_bad.callback_succeeded == Some(false));
            assert_eq!(g_bad.factory_delta, funded as i128);
            let g_dup = attempt(&worker, &owner, &factory, "create_global", "global-ok", funded, init_args(owner.id())).await?;
            report("global duplicate label", &g_dup);
            assert!(g_dup.callback_succeeded == Some(false));
            assert_eq!(g_dup.factory_delta, funded as i128);
        }
    }
    Ok(())
}
