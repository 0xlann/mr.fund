use super::*;
use near_sdk::{
    json_types::U128,
    serde_json,
    test_utils::{get_logs, VMContextBuilder},
    testing_env, NearToken,
};

fn id(s: &str) -> AccountId {
    s.parse().unwrap()
}
fn context(caller: &str, deposit: u128) {
    testing_env!(VMContextBuilder::new()
        .current_account_id(id("guardian.test.near"))
        .predecessor_account_id(id(caller))
        .signer_account_id(id(caller))
        .attached_deposit(NearToken::from_yoctonear(deposit))
        .build());
}
fn policy() -> Policy {
    Policy {
        max_per_action: U128(100),
        lifetime_cap: U128(1000),
        reserve_floor: U128(20),
        trigger_hf_bps: 12000,
        target_hf_bps: Some(15000),
        cooldown_sec: 300,
        action_fee: U128(1),
    }
}
fn guardian() -> Guardian {
    context("factory.test.near", 0);
    Guardian::new(
        GuardianConfig {
            owner_id: id("owner.test.near"),
            watcher_id: id("watcher.test.near"),
            lending_id: id("lending.test.near"),
            oracle_id: id("oracle.test.near"),
            debt_token_id: id("debt.test.near"),
            collateral_token_ids: vec![id("collateral.test.near")],
            fee_recipient_id: id("fees.test.near"),
            activation_fee: U128(5),
        },
        policy(),
    )
}

fn incoming(
    g: &mut Guardian,
    sender: &str,
    token: &str,
    amount: u128,
    msg: &str,
) -> near_sdk::PromiseOrValue<U128> {
    context(token, 0);
    g.ft_on_transfer(id(sender), U128(amount), msg.into())
}
fn unused(value: near_sdk::PromiseOrValue<U128>) -> u128 {
    match value {
        near_sdk::PromiseOrValue::Value(n) => n.0,
        _ => panic!("expected immediate refund"),
    }
}
fn promise_context(result: near_sdk::PromiseResult) {
    let ctx = VMContextBuilder::new()
        .current_account_id(id("guardian.test.near"))
        .predecessor_account_id(id("guardian.test.near"))
        .build();
    testing_env!(
        ctx,
        near_sdk::test_vm_config(),
        near_sdk::RuntimeFeesConfig::test(),
        Default::default(),
        vec![result]
    );
}
#[test]
fn activation_refunds_below_minimum_wrong_token_and_wrong_sender() {
    let mut g = guardian();
    assert_eq!(
        unused(incoming(
            &mut g,
            "owner.test.near",
            "debt.test.near",
            125,
            "{\"activate\":{}}"
        )),
        125
    ); // minimum = fee5 + floor20 + max100 + actionFee1
    assert_eq!(
        unused(incoming(
            &mut g,
            "attacker.test.near",
            "debt.test.near",
            126,
            "{\"activate\":{}}"
        )),
        126
    );
    assert_eq!(
        unused(incoming(
            &mut g,
            "owner.test.near",
            "wrong.test.near",
            126,
            "{\"activate\":{}}"
        )),
        126
    );
    assert_eq!(g.reserve, 0);
    assert_eq!(g.status, Status::Created);
}
#[test]
fn activation_books_reserve_only_after_fee_settles_and_cannot_repeat() {
    let mut g = guardian();
    assert!(matches!(
        incoming(
            &mut g,
            "owner.test.near",
            "debt.test.near",
            126,
            "{\"activate\":{}}"
        ),
        near_sdk::PromiseOrValue::Promise(_)
    ));
    assert_eq!(g.reserve, 0);
    assert_eq!(g.status, Status::Created);
    promise_context(near_sdk::PromiseResult::Successful(Vec::new()));
    assert_eq!(g.on_activation_resolved(0).0, 0);
    assert_eq!(g.reserve, 121);
    assert_eq!(g.status, Status::Active);
    assert_eq!(
        unused(incoming(
            &mut g,
            "owner.test.near",
            "debt.test.near",
            126,
            "{\"activate\":{}}"
        )),
        126
    );
}
#[test]
fn failed_activation_fee_returns_full_amount_without_activation() {
    let mut g = guardian();
    let _ = incoming(
        &mut g,
        "owner.test.near",
        "debt.test.near",
        126,
        "{\"activate\":{}}",
    );
    promise_context(near_sdk::PromiseResult::Failed);
    assert_eq!(g.on_activation_resolved(0).0, 126);
    assert_eq!(g.reserve, 0);
    assert_eq!(g.status, Status::Created);
    assert!(g.in_flight.is_none());
}
#[test]
fn deactivated_owner_can_withdraw_and_failure_restores_reserve() {
    let mut g = guardian();
    g.status = Status::Deactivated;
    assert_eq!(
        unused(incoming(
            &mut g,
            "owner.test.near",
            "debt.test.near",
            100,
            "{\"reserve\":{}}"
        )),
        0
    );
    context("owner.test.near", 1);
    let _ = g.owner_withdraw_reserve(U128(100));
    assert_eq!(g.reserve, 0);
    assert_eq!(
        unused(incoming(
            &mut g,
            "owner.test.near",
            "debt.test.near",
            1,
            "{\"reserve\":{}}"
        )),
        1
    );
    promise_context(near_sdk::PromiseResult::Failed);
    assert!(!g.on_withdraw_resolved(0));
    assert_eq!(g.reserve, 100);
    context("owner.test.near", 1);
    let _ = g.owner_withdraw_reserve(U128(100));
    promise_context(near_sdk::PromiseResult::Successful(Vec::new()));
    assert!(g.on_withdraw_resolved(1));
    assert_eq!(g.reserve, 0);
}
#[test]
#[should_panic(expected = "Operation in flight")]
fn reserve_withdrawal_is_blocked_while_locked() {
    let mut g = guardian();
    g.reserve = 100;
    g.in_flight = Some(InFlight {
        op_id: 0,
        amount: 1,
        fee: 0,
        started_ns: 0,
    });
    context("owner.test.near", 1);
    let _ = g.owner_withdraw_reserve(U128(1));
}
#[test]
fn initialization_exposes_created_policy_and_zero_reserve() {
    let g = guardian();
    assert_eq!(g.get_status().status, Status::Created);
    assert_eq!(g.get_status().owner_id, id("owner.test.near"));
    assert_eq!(g.get_policy().max_per_action, U128(100));
    assert_eq!(g.get_reserve().reserve, U128(0));
    assert_eq!(g.get_reserve().spendable, U128(0));
    assert!(g.get_history(0, 50).is_empty());
}
#[test]
fn policy_accepts_exact_minimums_and_rejects_each_invalid_boundary() {
    let mut p = policy();
    p.trigger_hf_bps = 10500;
    p.lifetime_cap = p.max_per_action;
    assert!(p.validate().is_ok());
    for field in 0..5 {
        let mut p = policy();
        match field {
            0 => p.trigger_hf_bps = 10499,
            1 => p.lifetime_cap = U128(99),
            2 => p.cooldown_sec = 299,
            3 => p.max_per_action = U128(0),
            _ => p.target_hf_bps = Some(12000),
        }
        assert!(p.validate().is_err());
    }
}
#[test]
#[should_panic(expected = "Owner only")]
fn watcher_cannot_change_policy() {
    let mut g = guardian();
    context("watcher.test.near", 1);
    g.set_policy(policy());
}
#[test]
#[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
fn function_call_key_cannot_pause() {
    let mut g = guardian();
    context("owner.test.near", 0);
    g.pause();
}
#[test]
fn owner_transitions_are_terminal_and_emit_nep297() {
    let mut g = guardian();
    g.status = Status::Active;
    context("owner.test.near", 1);
    g.pause();
    assert_eq!(g.get_status().status, Status::Paused);
    g.resume();
    assert_eq!(g.get_status().status, Status::Active);
    g.rotate_watcher(id("new-watcher.test.near"));
    assert_eq!(g.get_status().watcher_id, id("new-watcher.test.near"));
    g.deactivate();
    assert_eq!(g.get_status().status, Status::Deactivated);
    let events: Vec<serde_json::Value> = get_logs()
        .iter()
        .map(|s| serde_json::from_str(s.strip_prefix("EVENT_JSON:").unwrap()).unwrap())
        .collect();
    assert_eq!(events[0]["standard"], "mrfund_guardian");
    assert_eq!(events[0]["version"], "1.0.0");
    assert_eq!(events[0]["event"], "paused");
    assert_eq!(events[3]["event"], "deactivated");
}
#[test]
#[should_panic(expected = "Invalid status transition")]
fn deactivated_cannot_resume() {
    let mut g = guardian();
    g.status = Status::Deactivated;
    context("owner.test.near", 1);
    g.resume();
}
#[test]
#[should_panic(expected = "Operation in flight")]
fn policy_change_is_blocked_during_pending_operation() {
    let mut g = guardian();
    g.in_flight = Some(InFlight {
        op_id: 0,
        amount: 7,
        fee: 1,
        started_ns: 0,
    });
    context("owner.test.near", 1);
    g.set_policy(policy());
}
#[test]
fn owner_controls_make_no_external_calls() {
    let mut g = guardian();
    context("owner.test.near", 1);
    let mut p = policy();
    p.max_per_action = U128(50);
    g.set_policy(p);
    assert_eq!(g.get_policy().max_per_action, U128(50));
    assert!(near_sdk::test_utils::get_created_receipts().is_empty());
}

#[test]
fn all_owner_methods_reject_foreign_predecessors_without_state_change() {
    for operation in 0..5 {
        let mut g = guardian();
        g.status = if operation == 3 {
            Status::Paused
        } else {
            Status::Active
        };
        context("attacker.test.near", 1);
        let before = near_sdk::borsh::to_vec(&g).unwrap();
        let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| match operation {
            0 => g.set_policy(policy()),
            1 => g.rotate_watcher(id("attacker.test.near")),
            2 => g.pause(),
            3 => g.resume(),
            _ => g.deactivate(),
        }));
        assert!(outcome.is_err());
        assert_eq!(near_sdk::borsh::to_vec(&g).unwrap(), before);
    }
}

#[test]
fn lowering_cap_below_cumulative_spend_is_rejected_without_mutation() {
    let mut g = guardian();
    g.spent_total = 500;
    context("owner.test.near", 1);
    let mut proposed = policy();
    proposed.lifetime_cap = U128(499);
    let before = near_sdk::borsh::to_vec(&g).unwrap();
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| g.set_policy(proposed)));
    assert!(result.is_err());
    assert_eq!(near_sdk::borsh::to_vec(&g).unwrap(), before);
    let mut exact = policy();
    exact.lifetime_cap = U128(500);
    g.set_policy(exact);
    assert_eq!(g.get_reserve().lifetime_remaining, U128(0));
}
