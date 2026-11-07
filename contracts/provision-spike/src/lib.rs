//! Task 1.2 experiment (throwaway). Compares two keyless-child strategies on the
//! pinned toolchain. Sandbox only: methods are deliberately unrestricted so the
//! harness can drive failure phases; nothing here is a production factory.
use near_sdk::{
    env, near, require,
    serde_json::{self, Value},
    AccountId, Gas, NearToken, PanicOnDefault, Promise,
};

const CODE: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/guardian.wasm"));

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Spike {
    last: Option<Created>,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Created {
    pub child_id: AccountId,
    pub strategy: String,
    pub succeeded: bool,
}

#[near]
impl Spike {
    #[init]
    pub fn new() -> Self {
        Self { last: None }
    }

    pub fn code_len(&self) -> u64 {
        CODE.len() as u64
    }

    pub fn code_hash(&self) -> Vec<u8> {
        env::sha256(CODE)
    }

    /// Publishes the Guardian code as a global contract from this account.
    pub fn publish_global(&mut self) -> Promise {
        require!(!CODE.is_empty(), "Guardian code not prepared");
        Promise::new(env::current_account_id()).deploy_global_contract(CODE.to_vec())
    }

    /// Strategy A: the child gets its own copy of the embedded code.
    #[payable]
    pub fn create_stored(&mut self, label: String, init_args: Value) -> Promise {
        require!(!CODE.is_empty(), "Guardian code not prepared");
        let child = self.child(&label);
        let base = Promise::new(child.clone())
            .create_account()
            .transfer(env::attached_deposit())
            .deploy_contract(CODE.to_vec());
        self.finish(base, child, "stored", init_args)
    }

    /// Strategy B: the child references the global contract by immutable hash.
    #[payable]
    pub fn create_global(&mut self, label: String, init_args: Value) -> Promise {
        let child = self.child(&label);
        let hash: [u8; 32] = env::sha256_array(CODE);
        let base = Promise::new(child.clone())
            .create_account()
            .transfer(env::attached_deposit())
            .use_global_contract(hash);
        self.finish(base, child, "global", init_args)
    }

    #[private]
    pub fn on_created(&mut self, child_id: AccountId, strategy: String) -> Created {
        let succeeded = env::promise_results_count() == 1
            && env::promise_result_checked(0, 64).is_ok();
        let created = Created {
            child_id,
            strategy,
            succeeded,
        };
        self.last = Some(created.clone());
        created
    }

    pub fn get_last(&self) -> Option<Created> {
        self.last.clone()
    }
}

impl Spike {
    fn child(&self, label: &str) -> AccountId {
        format!("{label}.{}", env::current_account_id())
            .parse()
            .unwrap_or_else(|_| env::panic_str("Invalid child id"))
    }
    fn finish(&self, base: Promise, child: AccountId, strategy: &str, init_args: Value) -> Promise {
        base.function_call(
            "new",
            serde_json::to_vec(&init_args).expect("JSON encoding"),
            NearToken::from_yoctonear(0),
            Gas::from_tgas(30),
        )
        .then(
            Self::ext(env::current_account_id())
                .with_static_gas(Gas::from_tgas(10))
                .on_created(child, strategy.into()),
        )
    }
}
