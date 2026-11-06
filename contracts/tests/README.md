# P0.3 sandbox probe

These tests deploy the actual Rhea bytecode downloaded from public testnet and
mainnet into a **local sandbox with new state**. NEP-141 tokens and Pyth prices
are test fixtures; all prices are **Simulated**. This is not a fork of live
positions, a public deployment, or proof that public testnet has usable prices.

From the repository root:

```sh
pnpm contracts:probe:prepare
pnpm contracts:test
cargo clippy --manifest-path contracts/Cargo.toml --all-targets -- -D warnings
```

Preparation needs Node, Rust with `wasm32-unknown-unknown`, `cargo-near`, and
public RPC access. It downloads code, config and an asset template at one final
block per network, then builds the probe and token/oracle fixture with the lockfile.
Tests need a working near-sandbox binary (near-workspaces installs its pinned
version when one is not provided). All generated artifacts stay under ignored
`contracts/target/`. A fresh clone must run preparation before contract tests;
missing artifacts fail explicitly and are never silently skipped.

The harness checks the WASM SHA-256 against its downloaded provenance before
deployment. It initializes Rhea with sandbox owner/token/oracle ids and records
the source version and block. Asset rates are zero in this controlled cycle to
isolate ownership, units and execution behavior from accrued interest.

The probe registers itself on lending and tokens, collateralizes, borrows and
withdraws, repays its own debt, then releases and withdraws collateral. Tests
inspect failed receipts and read back balances/positions. Negative cases cover
non-owner calls, forged callbacks and a different borrower's debt remaining
unchanged. Unit tests cover deposit rules, target restrictions, checked unit
conversion, operation locking and callback failures.

P0.3 discovery: deployed testnet `0.11.0` calls Pyth `get_price(price_identifier)`
and rejects `OnlyRepay`. Its explicit probe alternative is
`probe_repay_via_execute`: NEP-141 `ft_transfer_call` with
`{"Execute":{"actions":[{"Repay":{"token_id":"...","amount":"..."}}]}}`.
The outer token amount is atomic; the inner `Repay.amount` is Rhea internal.
Mainnet `0.16.2` uses `probe_repay` with `"OnlyRepay"`. There is no automatic
retry or silent fallback. Existing product builders still use `OnlyRepay` and
must be adapted and tested before a testnet repay demo can be claimed.

Permission boundary: operations require the immutable owner as predecessor and
exactly 1 yoctoNEAR. The probe only registers on its configured lending/token
targets and only transfers configured tokens into its configured lending
contract. Token funding accepts only its owner via a configured token. Callback
results are bounded, private and matched to the pending operation.

Probe invariant P0-I1: a non-owner cannot initiate an operation or choose a
borrower/transfer destination. This exercises the I5/I4 permission pattern but
does not implement Guardian reserve accounting or policy limits. The probe is
throwaway code with a deployment key in sandbox, not a Guardian with I10.
`receipt_succeeded` reports the immediate promise only: Rhea may schedule
detached receipts, so it is never sufficient evidence without outcome traversal
and post-state reads. No audit or liquidation protection is claimed.
