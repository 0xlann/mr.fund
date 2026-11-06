use near_sdk::{json_types::U128, near};

pub const MIN_TRIGGER_HF_BPS: u32 = 10500;
pub const MIN_COOLDOWN_SEC: u32 = 300;

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug, PartialEq)]
pub struct Policy {
    pub max_per_action: U128,
    pub lifetime_cap: U128,
    pub reserve_floor: U128,
    pub trigger_hf_bps: u32,
    pub target_hf_bps: Option<u32>,
    pub cooldown_sec: u32,
    pub action_fee: U128,
}
impl Policy {
    pub fn validate(&self) -> Result<(), &'static str> {
        if self.max_per_action.0 == 0 {
            return Err("Max per action must be positive");
        }
        if self.lifetime_cap.0 < self.max_per_action.0 {
            return Err("Lifetime cap below max per action");
        }
        if self.trigger_hf_bps < MIN_TRIGGER_HF_BPS {
            return Err("Trigger below minimum");
        }
        if self
            .target_hf_bps
            .is_some_and(|target| target <= self.trigger_hf_bps)
        {
            return Err("Target must exceed trigger");
        }
        if self.cooldown_sec < MIN_COOLDOWN_SEC {
            return Err("Cooldown below minimum");
        }
        Ok(())
    }
}
