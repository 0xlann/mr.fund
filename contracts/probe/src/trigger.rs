//! P0.4 read-only trigger probe; no automatic repay or policy authority.
use crate::{Probe, ProbeExt};
use near_sdk::{
    env, near, require,
    serde_json::{self, json, Value},
    AccountId, Gas, NearToken, Promise,
};
use primitive_types::U512;

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TriggerReject {
    StalePrice,
    UnsupportedPositionShape,
    BadResponse,
    ArithmeticOverflow,
    NoDebt,
    TriggerNotMet,
    InvalidConfig,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug)]
pub struct TriggerResult {
    pub health_bps: Option<u64>,
    pub triggered: bool,
    pub reason: Option<TriggerReject>,
}

#[near(serializers = [json])]
#[derive(Clone)]
pub struct TriggerConfig {
    pub oracle_id: AccountId,
    pub collateral_price_id: String,
    pub debt_price_id: String,
    pub max_price_age_sec: u32,
    pub threshold_bps: u32,
    pub legacy_oracle: bool,
}

#[near]
impl Probe {
    /// Owner-supplied parameters are checked against Rhea config and feed mappings.
    /// This probe reads only. A Guardian must bind these inputs to immutable config.
    #[payable]
    pub fn probe_check_trigger(&mut self, config: TriggerConfig) -> Promise {
        self.assert_owner();
        require!(
            config.max_price_age_sec > 0
                && config.max_price_age_sec <= 3600
                && config.threshold_bps >= 10500,
            "Invalid trigger config"
        );
        for price_id in [&config.collateral_price_id, &config.debt_price_id] {
            require!(
                price_id.len() == 64 && price_id.bytes().all(|b| b.is_ascii_hexdigit()),
                "Invalid feed id"
            );
        }
        let op_id = self.next_op_id;
        self.next_op_id = self
            .next_op_id
            .checked_add(1)
            .expect("Operation id overflow");
        self.in_flight = Some(op_id);
        let view = |target: AccountId, method: &str, args: Value, gas: u64| {
            Promise::new(target).function_call(
                method,
                serde_json::to_vec(&args).expect("JSON encoding"),
                NearToken::from_yoctonear(0),
                Gas::from_tgas(gas),
            )
        };
        let prices = |price_id: &String| {
            let (method, args) = if config.legacy_oracle {
                ("get_price", json!({"price_identifier":price_id}))
            } else {
                (
                    "get_price_no_older_than",
                    json!({"price_id":price_id,"age":config.max_price_age_sec}),
                )
            };
            view(config.oracle_id.clone(), method, args, 10)
        };
        view(
            self.lending_id.clone(),
            "get_account",
            json!({"account_id":env::current_account_id()}),
            15,
        )
        .and(view(
            self.lending_id.clone(),
            "get_assets",
            json!({"token_ids":[self.collateral_token_id,self.debt_token_id]}),
            15,
        ))
        .and(view(
            self.lending_id.clone(),
            "get_token_pyth_info",
            json!({"token_id":self.collateral_token_id}),
            5,
        ))
        .and(view(
            self.lending_id.clone(),
            "get_token_pyth_info",
            json!({"token_id":self.debt_token_id}),
            5,
        ))
        .and(prices(&config.collateral_price_id))
        .and(prices(&config.debt_price_id))
        .and(view(self.lending_id.clone(), "get_config", json!({}), 10))
        .then(
            Self::ext(env::current_account_id())
                .with_static_gas(Gas::from_tgas(60))
                .on_trigger_checked(op_id, config),
        )
    }

    #[private]
    pub fn on_trigger_checked(&mut self, op_id: u64, config: TriggerConfig) -> TriggerResult {
        require!(self.in_flight == Some(op_id), "Operation mismatch");
        let result = (|| {
            if env::promise_results_count() != 7 {
                return Err(TriggerReject::BadResponse);
            }
            let mut results = Vec::new();
            for i in 0..7 {
                let bytes = env::promise_result_checked(i, 32768)
                    .map_err(|_| TriggerReject::BadResponse)?;
                results.push(
                    serde_json::from_slice::<Value>(&bytes)
                        .map_err(|_| TriggerReject::BadResponse)?,
                );
            }
            if results[6]["pyth_oracle_account_id"].as_str() != Some(config.oracle_id.as_str())
                || results[6]["pyth_price_valid_duration_sec"].as_u64()
                    != Some(u64::from(config.max_price_age_sec))
                || results[6]["enable_pyth_oracle"] != true
                || results[2]["price_identifier"] != config.collateral_price_id
                || results[3]["price_identifier"] != config.debt_price_id
            {
                return Err(TriggerReject::InvalidConfig);
            }
            let values = [
                &results[0],
                &results[1],
                &results[2],
                &results[3],
                &results[4],
                &results[5],
            ]
            .map(Clone::clone);
            Ok(evaluate(
                &values,
                env::current_account_id().as_str(),
                self.collateral_token_id.as_str(),
                self.debt_token_id.as_str(),
                env::block_timestamp() / 1_000_000_000,
                config.max_price_age_sec,
                config.threshold_bps,
            ))
        })()
        .unwrap_or_else(rejected);
        self.in_flight = None;
        self.last_trigger_result = Some(result.clone());
        env::log_str(&format!(
            "EVENT_JSON:{}",
            json!({"standard":"mrfund_probe","version":"1.0.0","event":"trigger_checked","data":[result]})
        ));
        result
    }

    pub fn get_last_trigger_result(&self) -> Option<TriggerResult> {
        self.last_trigger_result.clone()
    }
}

fn rejected(reason: TriggerReject) -> TriggerResult {
    TriggerResult {
        health_bps: None,
        triggered: false,
        reason: Some(reason),
    }
}
fn number(v: &Value, max: u64) -> Result<u64, TriggerReject> {
    v.as_u64()
        .filter(|n| *n <= max)
        .ok_or(TriggerReject::BadResponse)
}
fn amount(v: &Value) -> Result<u128, TriggerReject> {
    v.as_str()
        .filter(|s| {
            !s.is_empty()
                && s.len() <= 39
                && s.bytes().all(|b| b.is_ascii_digit())
                && (s.len() == 1 || !s.starts_with('0'))
        })
        .and_then(|s| s.parse().ok())
        .ok_or(TriggerReject::BadResponse)
}
fn mul(a: U512, b: U512) -> Result<U512, TriggerReject> {
    a.checked_mul(b).ok_or(TriggerReject::ArithmeticOverflow)
}
fn power(n: u64) -> Result<U512, TriggerReject> {
    if n > 114 {
        return Err(TriggerReject::ArithmeticOverflow);
    }
    let mut v = U512::one();
    for _ in 0..n {
        v = mul(v, U512::from(10))?;
    }
    Ok(v)
}
fn price(info: &Value, oracle: &Value, now: u64, age: u32) -> Result<(U512, u64), TriggerReject> {
    if !info["extra_call"].is_null() {
        return Err(TriggerReject::UnsupportedPositionShape);
    }
    if !info["default_price"].is_null() {
        let p = &info["default_price"];
        let m = amount(&p["multiplier"])?;
        if m == 0 {
            return Err(TriggerReject::BadResponse);
        }
        return Ok((U512::from(m), number(&p["decimals"], 76)?));
    }
    if oracle.is_null() {
        return Err(TriggerReject::StalePrice);
    }
    let time = number(&oracle["publish_time"], u64::MAX)?;
    if time == 0 || time > now || now - time > u64::from(age) {
        return Err(TriggerReject::StalePrice);
    }
    let raw = amount(&oracle["price"])?;
    if raw == 0 || raw > i64::MAX as u128 {
        return Err(TriggerReject::BadResponse);
    }
    let expo = oracle["expo"]
        .as_i64()
        .filter(|e| (-38..=38).contains(e))
        .ok_or(TriggerReject::BadResponse)?;
    let fraction = number(&info["fraction_digits"], 38)?;
    let decimals = number(&info["decimals"], 38)? + fraction;
    let shift = expo + fraction as i64;
    let m = if shift >= 0 {
        mul(U512::from(raw), power(shift as u64)?)?
    } else {
        U512::from(raw) / power((-shift) as u64)?
    };
    if m.is_zero() {
        return Err(TriggerReject::BadResponse);
    }
    Ok((m, decimals))
}

fn evaluate(
    values: &[Value; 6],
    account_id: &str,
    collateral_id: &str,
    debt_id: &str,
    now: u64,
    age: u32,
    threshold: u32,
) -> TriggerResult {
    let compute = || -> Result<TriggerResult, TriggerReject> {
        if age == 0 || age > 3600 || threshold < 10500 {
            return Err(TriggerReject::InvalidConfig);
        }
        let p = &values[0];
        if p["account_id"].as_str() != Some(account_id) {
            return Err(TriggerReject::UnsupportedPositionShape);
        }
        let debts = p["borrowed"].as_array().ok_or(TriggerReject::BadResponse)?;
        if debts.is_empty() {
            return Err(TriggerReject::NoDebt);
        }
        let collateral = p["collateral"]
            .as_array()
            .ok_or(TriggerReject::BadResponse)?;
        if collateral.len() != 1
            || debts.len() != 1
            || collateral[0]["token_id"].as_str() != Some(collateral_id)
            || debts[0]["token_id"].as_str() != Some(debt_id)
        {
            return Err(TriggerReject::UnsupportedPositionShape);
        }
        let c = amount(&collateral[0]["balance"])?;
        let d = amount(&debts[0]["balance"])?;
        if d == 0 {
            return Err(TriggerReject::NoDebt);
        }
        let assets = values[1]
            .as_array()
            .filter(|a| a.len() == 2)
            .ok_or(TriggerReject::UnsupportedPositionShape)?;
        let asset = |id: &str| -> Result<&Value, TriggerReject> {
            let matching: Vec<_> = assets
                .iter()
                .filter(|a| a["token_id"].as_str() == Some(id))
                .collect();
            if matching.len() != 1 {
                return Err(TriggerReject::UnsupportedPositionShape);
            }
            Ok(&matching[0]["config"])
        };
        let ca = asset(collateral_id)?;
        let da = asset(debt_id)?;
        let cr = number(&ca["volatility_ratio"], 10000)?;
        let dr = number(&da["volatility_ratio"], 10000)?;
        if dr == 0 {
            return Err(TriggerReject::UnsupportedPositionShape);
        }
        let (cp, cd) = price(&values[2], &values[4], now, age)?;
        let (dp, dd) = price(&values[3], &values[5], now, age)?;
        let cs = cd + number(&ca["extra_decimals"], 38)?;
        let ds = dd + number(&da["extra_decimals"], 38)?;
        let mut numerator = mul(
            mul(mul(U512::from(c), cp)?, U512::from(cr))?,
            U512::from(dr),
        )?;
        let mut denominator = mul(mul(U512::from(d), dp)?, U512::from(10000))?;
        if ds >= cs {
            numerator = mul(numerator, power(ds - cs)?)?;
        } else {
            denominator = mul(denominator, power(cs - ds)?)?;
        }
        let bps = (numerator / denominator)
            .min(U512::from(9_007_199_254_740_991u64))
            .low_u64();
        Ok(TriggerResult {
            health_bps: Some(bps),
            triggered: bps < u64::from(threshold),
            reason: if bps < u64::from(threshold) {
                None
            } else {
                Some(TriggerReject::TriggerNotMet)
            },
        })
    };
    compute().unwrap_or_else(rejected)
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::serde_json::{json, Value};

    fn data() -> (Value, Value, Value, Value, Value, Value) {
        (
            json!({"account_id":"probe.test.near","collateral":[{"token_id":"collateral.test.near","balance":"100000000"}],"borrowed":[{"token_id":"debt.test.near","balance":"200000000000000000000"}],"supplied":[]}),
            json!([{"token_id":"collateral.test.near","config":{"volatility_ratio":6000,"extra_decimals":0}},{"token_id":"debt.test.near","config":{"volatility_ratio":9500,"extra_decimals":12}}]),
            json!({"decimals":6,"fraction_digits":4,"extra_call":null,"default_price":null,"price_identifier":"11".repeat(32)}),
            json!({"decimals":6,"fraction_digits":4,"extra_call":null,"default_price":null,"price_identifier":"22".repeat(32)}),
            json!({"price":"500000000","conf":"0","expo":-8,"publish_time":1000}),
            json!({"price":"100000000","conf":"0","expo":-8,"publish_time":1000}),
        )
    }
    fn calculate(threshold: u32, change: impl FnOnce(&mut [Value; 6])) -> TriggerResult {
        let (p, a, c, d, cp, dp) = data();
        let mut values = [p, a, c, d, cp, dp];
        change(&mut values);
        evaluate(
            &values,
            "probe.test.near",
            "collateral.test.near",
            "debt.test.near",
            1000,
            60,
            threshold,
        )
    }
    #[test]
    fn matches_engine_hand_vector_and_strict_trigger() {
        let r = calculate(14250, |_| {});
        assert_eq!(r.health_bps, Some(14250));
        assert!(!r.triggered);
        assert!(calculate(14251, |_| {}).triggered);
    }
    #[test]
    fn matches_shared_typescript_engine_vectors() {
        let fixture: Value =
            serde_json::from_str(include_str!("../../../fixtures/trigger-vectors.json")).unwrap();
        for case in fixture["cases"].as_array().unwrap() {
            let r = calculate(15000, |v| {
                v[0]["collateral"][0]["balance"] = case["collateralInternal"].clone();
                v[0]["borrowed"][0]["balance"] = case["debtInternal"].clone();
            });
            assert_eq!(r.health_bps, case["healthBps"].as_u64(), "{}", case["name"]);
        }
    }
    #[test]
    fn null_expired_and_future_prices_never_trigger() {
        assert_eq!(
            calculate(15000, |v| v[4] = Value::Null).reason,
            Some(TriggerReject::StalePrice)
        );
        assert_eq!(
            calculate(15000, |v| v[4]["publish_time"] = json!(939)).reason,
            Some(TriggerReject::StalePrice)
        );
        assert!(calculate(15000, |v| v[4]["publish_time"] = json!(940)).triggered);
        assert_eq!(
            calculate(15000, |v| v[4]["publish_time"] = json!(1001)).reason,
            Some(TriggerReject::StalePrice)
        );
    }
    #[test]
    fn rejects_extra_assets_and_wrong_account() {
        assert_eq!(
            calculate(15000, |v| v[0]["borrowed"]
                .as_array_mut()
                .unwrap()
                .push(json!({"token_id":"other.test.near","balance":"1"})))
            .reason,
            Some(TriggerReject::UnsupportedPositionShape)
        );
        assert_eq!(
            calculate(15000, |v| v[0]["account_id"] = json!("other.test.near")).reason,
            Some(TriggerReject::UnsupportedPositionShape)
        );
    }
    #[test]
    fn no_debt_does_not_trigger_and_supplied_is_excluded() {
        assert_eq!(
            calculate(15000, |v| v[0]["borrowed"] = json!([])).reason,
            Some(TriggerReject::NoDebt)
        );
        assert_eq!(
            calculate(
                15000,
                |v| v[0]["supplied"] =
                    json!([{"token_id":"collateral.test.near","balance":u128::MAX.to_string()}])
            )
            .health_bps,
            Some(14250)
        );
    }
    #[test]
    fn malformed_ratio_amount_or_derivative_is_rejected() {
        for field in ["volatility_ratio", "extra_decimals"] {
            assert!(
                calculate(15000, |v| v[1][1]["config"][field] = json!(99999))
                    .reason
                    .is_some()
            );
        }
        assert_eq!(
            calculate(15000, |v| v[0]["borrowed"][0]["balance"] = json!("-1")).reason,
            Some(TriggerReject::BadResponse)
        );
        assert_eq!(
            calculate(15000, |v| v[2]["extra_call"] = json!("ft_price")).reason,
            Some(TriggerReject::UnsupportedPositionShape)
        );
    }
}
