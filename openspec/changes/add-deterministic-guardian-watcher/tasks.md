## 1. Pure polling core

- [x] 1.1 Confirm typed client/settlement ABI and D27 integration status; allow pure tests but no submission before composed-flow evidence. (2026-11-09: `readGuardian`/`toGuardianState` and `request_repay(amount: U128)` with zero deposit and `outcome`-tagged `RequestOutcome`; D27 has local composed evidence only, public feasibility open, so no submission yet.)
- [x] 1.2 Define injected clock/read/request/log interfaces and implement 30-second scheduler with per-Guardian non-overlap and fresh evaluateTrigger decisions.
- [x] 1.3 Test threshold equality, stale/missing state, pause/cooldown/cap, slow polls and bounded RPC-read backoff.

## 2. Request authority and reconciliation

- [x] 2.1 Implement startup config/access-key verification and transport restricted to one receiver/request_repay/zero deposit; test broad-key and wrong-network refusal. (Pure `verifyAuthority` + `constrainedRequester` over an injected `SignerPort`; the real signer adapter lands with 3.1.)
- [x] 2.2 Implement pending signed-hash tracking and terminal receipt/state reconciliation; test broadcast timeout without blind retransmission.
- [x] 2.3 Implement conservative startup/restart reconciliation, remaining read-only under uncertainty, and scheduled rejection handling without immediate retry loops. (Core consumes injected `StartupEvidence`; the access-key nonce evidence source lands with the 3.1 adapter.)

## 3. Runtime observability and operator test

- [ ] 3.1 Add Node entry with existing local key source only, signal shutdown and structured redacted heartbeat timestamps/errors; document single-instance operation.
- [ ] 3.2 Add explicit over-limit operator script outside polling and run accepted/rejected flows in sandbox after settlement/D27 proof.
- [x] 3.3 Test no agent import, no owner-method transport, timestamp freshness and secret-free logs/status.

## 4. Evidence and external gates

- [ ] 4.1 Run watcher/client suites, typecheck/lint and affected sandbox integration; update P5.3/P5.4 local evidence and runtime instructions.
- [ ] 4.2 Before any public request, verify D18/D19/B7 and configured permissions; keep network evidence unchecked until actual hashes exist.
- [ ] 4.3 Before hosted deployment, obtain D29/B8 host/account/cost authorization; no hosting or account creation is included in local completion.
