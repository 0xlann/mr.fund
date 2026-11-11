# Watcher sandbox operator test

The sandbox-only operator exercises `requestOverLimit` outside the polling loop.
Run it through the disposable contract harness from the repository root, after
installing workspace dependencies and preparing the contract sandbox artifacts:

```sh
cargo test --manifest-path contracts/Cargo.toml -p contract-tests --test probe probe_testnet_wasm_cycle -- --nocapture
cargo test --manifest-path contracts/Cargo.toml -p contract-tests --test probe probe_mainnet_wasm_cycle -- --nocapture
```

Each run starts a local sandbox, deploys fixtures with simulated prices, and
creates a new disposable watcher function-call key for each Guardian. The harness
passes the key to `apps/watcher/src/sandbox/operator-cli.ts` on stdin; it is not
printed or persisted by the operator. The operator accepts only a loopback HTTP
endpoint and a sandbox `test-chain-*` chain id, checks that the key permits only
`request_repay` on the selected Guardian, checks a fresh Guardian snapshot and
submits one `max_per_action + 1` request with zero deposit. It prints the signed
hash as a pending result. The harness resolves that hash and verifies the
rejection event, history, unchanged debt and reserve, then submits an in-limit
request using the same scoped key. Output is sandbox evidence only.
The operator uses a dedicated sandbox-scoped journal directory supplied by the
harness. After resolving the first request, the harness starts a second operator
process with the same journal and verifies it refuses and creates no second
history entry. The disposable test directory is removed only by the harness.
The sandbox adapter derives its clock offset from the local final block because
the harness can advance simulated time. Public freshness checks use wall time.
Transient sandbox authority reads receive bounded retries before signing; a
signed transaction or broadcast is never retried automatically.

The command `pnpm --filter @mrfund/watcher sandbox:over-limit` is the underlying
explicit entry point; it expects the harness's JSON on stdin and must only be used
with a newly created disposable sandbox key. Do not use a public or existing key.
It has no durable record across invocations, so an uncertain submission must not
be retried. Public operation needs a separate operator flow with restart-safe
reconciliation and the D18/D19/B7 gates; the normal watcher remains read-only.

To inspect the configured public network and scoped key without signing or
sending, run `pnpm --filter @mrfund/watcher operator:preflight <guardian-id>`
with the same `NEAR_NETWORK_ID`, `NEAR_RPC_URL`, `WATCHER_ACCOUNT_ID` and
`WATCHER_KEYS_DIR` configuration as the watcher. The command exits nonzero and
reports `read_only`, including when the key is valid: current chain views and a
key nonce do not prove that an earlier signed transaction cannot still arrive.
Errors are sanitized and never include key material or RPC details. This is a
preflight only; it neither authorizes nor provides a public submission path.

The guarded signer also has an optional single-use local journal for future
operator integration. It synchronizes an intent before signing and the hash
before broadcast; an existing or incomplete record blocks a subsequent attempt.
It does not delete records, retry, or establish what happened before the journal
was installed. The public runtime does not use it yet. Any integration must use
a private stable directory shared by all processes for the same Guardian and
establish independent reconciliation before allowing another request.
