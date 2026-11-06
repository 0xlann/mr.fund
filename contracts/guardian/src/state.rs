use near_sdk::{
    json_types::{U128, U64},
    near, AccountId,
};

pub const HISTORY_LEN: usize = 50;

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    Created,
    Active,
    Paused,
    Deactivated,
}

#[near(serializers = [borsh])]
pub struct InFlight {
    pub op_id: u64,
    pub amount: u128,
    pub fee: u128,
    pub started_ns: u64,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct GuardianConfig {
    pub owner_id: AccountId,
    pub watcher_id: AccountId,
    pub lending_id: AccountId,
    pub oracle_id: AccountId,
    pub debt_token_id: AccountId,
    pub collateral_token_ids: Vec<AccountId>,
    pub fee_recipient_id: AccountId,
    pub activation_fee: U128,
}

#[near(serializers = [borsh])]
#[derive(PartialEq)]
pub enum ReserveOperation {
    Activate,
    Withdraw,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
#[serde(rename_all = "snake_case")]
pub enum Outcome {
    Rejected,
    Started,
    Settled,
    Failed,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
#[serde(rename_all = "snake_case")]
pub enum RejectReason {
    NotActive,
    InFlight,
    Cooldown,
    ZeroAmount,
    AboveMaxPerAction,
    AboveLifetimeCap,
    BelowReserveFloor,
    TriggerNotMet,
    StalePrice,
    UnsupportedPositionShape,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Attempt {
    pub op_id: U64,
    pub at_ns: U64,
    pub requested: U128,
    pub outcome: Outcome,
    pub reason: Option<RejectReason>,
    pub used: U128,
    pub fee: U128,
}
