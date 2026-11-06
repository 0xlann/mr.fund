//! Sandbox-only: real NEP-141 mechanics and explicitly Simulated Pyth prices.
//! Never deploy as a production token or oracle.
use near_contract_standards::{
    fungible_token::{FungibleToken, FungibleTokenCore, FungibleTokenResolver},
    storage_management::{StorageBalance, StorageBalanceBounds, StorageManagement},
};
use near_sdk::{
    env,
    json_types::U128,
    near, require,
    serde_json::{json, Value},
    AccountId, NearToken, PanicOnDefault, PromiseOrValue,
};
use std::collections::BTreeMap;

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Fixture {
    owner_id: AccountId,
    token: FungibleToken,
    prices: BTreeMap<String, String>,
    ages: BTreeMap<String, u64>,
}
#[near]
impl Fixture {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            token: FungibleToken::new(b"t".to_vec()),
            prices: BTreeMap::new(),
            ages: BTreeMap::new(),
        }
    }
    pub fn mint(&mut self, account_id: AccountId, amount: U128) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Fixture owner only"
        );
        self.token.internal_deposit(&account_id, amount.0);
    }
    pub fn set_price(&mut self, price_id: String, price: String) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Fixture owner only"
        );
        require!(price.parse::<u64>().is_ok(), "Invalid simulated price");
        self.prices.insert(price_id, price);
    }
    pub fn get_price_no_older_than(&self, price_id: String, age: u64) -> Option<Value> {
        if age == 0 {
            return None;
        }
        let time = (env::block_timestamp() / 1_000_000_000)
            .saturating_sub(*self.ages.get(&price_id).unwrap_or(&0));
        self.prices
            .get(&price_id)
            .map(|p| json!({"price":p,"conf":"0","expo":-8,"publish_time":time}))
    }

    pub fn clear_price(&mut self, price_id: String) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Fixture owner only"
        );
        self.prices.remove(&price_id);
    }

    /// Intentionally return an expired reply even through no_older_than so the
    /// probe must independently enforce freshness, rather than trust the oracle.
    pub fn set_price_age(&mut self, price_id: String, age_sec: u64) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Fixture owner only"
        );
        self.ages.insert(price_id, age_sec);
    }

    /// Deployed Rhea testnet 0.11.0 uses the older Pyth interface.
    pub fn get_price(&self, price_identifier: String) -> Option<Value> {
        self.get_price_no_older_than(price_identifier, 60)
    }
}
#[near]
impl FungibleTokenCore for Fixture {
    #[payable]
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
        self.token.ft_transfer(receiver_id, amount, memo)
    }
    #[payable]
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<U128> {
        self.token.ft_transfer_call(receiver_id, amount, memo, msg)
    }
    fn ft_total_supply(&self) -> U128 {
        self.token.ft_total_supply()
    }
    fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        self.token.ft_balance_of(account_id)
    }
}
#[near]
impl FungibleTokenResolver for Fixture {
    #[private]
    fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> U128 {
        self.token
            .internal_ft_resolve_transfer(&sender_id, receiver_id, amount)
            .0
            .into()
    }
}
#[near]
impl StorageManagement for Fixture {
    #[payable]
    fn storage_deposit(
        &mut self,
        account_id: Option<AccountId>,
        registration_only: Option<bool>,
    ) -> StorageBalance {
        self.token.storage_deposit(account_id, registration_only)
    }
    #[payable]
    fn storage_withdraw(&mut self, amount: Option<NearToken>) -> StorageBalance {
        self.token.storage_withdraw(amount)
    }
    #[payable]
    fn storage_unregister(&mut self, force: Option<bool>) -> bool {
        self.token.internal_storage_unregister(force).is_some()
    }
    fn storage_balance_bounds(&self) -> StorageBalanceBounds {
        self.token.storage_balance_bounds()
    }
    fn storage_balance_of(&self, account_id: AccountId) -> Option<StorageBalance> {
        self.token.storage_balance_of(account_id)
    }
}
