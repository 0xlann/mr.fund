## 1. Pure polling core

- [x] 1.1 Confirm typed client/settlement ABI and D27 integration status; allow pure tests but no submission before composed-flow evidence. (2026-11-09: `readGuardian`/`toGuardianState` and `request_repay(amount: U128)` with zero deposit and `outcome`-tagged `RequestOutcome`; D27 has local composed evidence only, public feasibility open, so no submission yet.)
- [x] 1.2 Define injected clock/read/request/log interfaces and implement 30-second scheduler with per-Guardian non-overlap and fresh evaluateTrigger decisions.
- [x] 1.3 Test threshold equality, stale/missing state, pause/cooldown/cap, slow polls and bounded RPC-read backoff.

## 2. Request authority and reconciliation

- [x] 2.1 Implement startup config/access-key verification and transport restricted to one receiver/request_repay/zero deposit; test broad-key and wrong-network refusal. (Pure `verifyAuthority` + `constrainedRequester` over an injected `SignerPort`; the real signer adapter lands with 3.1.)
- [x] 2.2 Implement pending signed-hash tracking and terminal receipt/state reconciliation; test broadcast timeout without blind retransmission.
- [x] 2.3 Implement conservative startup/restart reconciliation, remaining read-only under uncertainty, and scheduled rejection handling without immediate retry loops. (Core consumes injected `StartupEvidence`; the access-key nonce evidence source lands with the 3.1 adapter.)

## 3. Runtime observability and operator test

- [x] 3.1 Add Node entry with existing local key source only, signal shutdown and structured redacted heartbeat timestamps/errors; document single-instance operation.
  - Local evidence [V, 2026-11-11]: entry, scoped near-api-js signer, fresh chain/final access-key validation, block-pinned reads, conservative receipt/state reconciliation, redacted heartbeat and signal cleanup are implemented. Node startup without configuration refuses with sanitized `startup_failed`; watcher/client suites, typecheck and lint passed. The entry is deliberately read-only: a key nonce alone cannot prove restart reconciliation, and the public submission gate is hard-disabled. No public account, signature or transaction was used.
- [ ] 3.2 Add explicit over-limit operator script outside polling and run accepted/rejected flows in sandbox after settlement/D27 proof.
  - Partial local evidence: an explicit operator helper computes `max_per_action + 1`, checks authorization, startup certainty, freshness, active/no-in-flight/cooldown conditions, and never retries. Fake-requester tests passed. It is not yet a runnable operator script and has not been exercised against sandbox. The current runtime accepts only `testnet`/`mainnet`, checks public-network account suffixes, and requires HTTPS; the sandbox harness uses local accounts/endpoints. A separate, explicitly isolated sandbox transport/identity design is needed before running the operator against it without weakening public network checks.
- [x] 3.3 Test no agent import, no owner-method transport, timestamp freshness and secret-free logs/status.

## 4. Evidence and external gates

- [ ] 4.1 Run watcher/client suites, typecheck/lint and affected sandbox integration; update P5.3/P5.4 local evidence and runtime instructions.
  - Partial local evidence [V, 2026-11-11]: watcher/client suites: 147 tests passed; full workspace: 1321 passed, 3 skipped; typecheck and lint passed. `guardian_controlled_refund_fixtures` passed for both protocol versions; `probe_testnet_wasm_cycle` passed after rebuilding local Guardian and factory WASM. These are contract sandbox observations, not watcher submission evidence. Runtime instructions are in INTEGRATIONS. The separate operator/sandbox acceptance remains open.
- [ ] 4.2 Before any public request, verify D18/D19/B7 and configured permissions; keep network evidence unchecked until actual hashes exist.
- [ ] 4.3 Before hosted deployment, obtain D29/B8 host/account/cost authorization; no hosting or account creation is included in local completion.
