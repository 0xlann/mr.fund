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
    pub lending_version: String,
    pub debt_extra_decimals: u8,
    pub collateral_extra_decimals: u8,
    pub collateral_price_id: String,
    pub debt_price_id: String,
    pub max_price_age_sec: u32,
}

impl GuardianConfig {
    pub fn validate(&self) {
        near_sdk::require!(
            matches!(self.lending_version.as_str(), "0.11.0" | "0.16.2"),
            "Unsupported lending version"
        );
        near_sdk::require!(
            self.debt_extra_decimals <= 38 && self.collateral_extra_decimals <= 38,
            "Invalid extra decimals"
        );
        near_sdk::require!(
            (1..=3600).contains(&self.max_price_age_sec),
            "Invalid price age"
        );
        for feed in [&self.collateral_price_id, &self.debt_price_id] {
            near_sdk::require!(
                feed.len() == 64 && feed.bytes().all(|b| b.is_ascii_hexdigit()),
                "Invalid feed id"
            );
        }
    }
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RepayPhase {
    Reading,
    Repaying,
    Fee { used: U128 },
    Unresolved,
}

#[near(serializers=[json])]
#[derive(Clone, Debug)]
#[serde(tag = "outcome", rename_all = "snake_case")]
pub enum RequestOutcome {
    Rejected { op_id: U64, reason: RejectReason },
    Executed { op_id: U64, used: U128, fee: U128 },
    Failed { op_id: U64 },
    Unresolved { op_id: U64 },
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
    Unresolved,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug, PartialEq)]
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
    InvalidConfig,
    BadResponse,
    ArithmeticOverflow,
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
