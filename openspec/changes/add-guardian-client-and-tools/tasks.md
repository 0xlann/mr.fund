## 1. Validated reads

- [ ] 1.1 Define injectable view client and typed status/policy/reserve/history results against actual Rust views, including missing evidence and retained-ring semantics.
- [ ] 1.2 Implement block-pinned reads and strict u128/U64/enum validation with typed not-found/unavailable/bad-response errors.
- [ ] 1.3 Add backend history sinceMs/limit handling, provenance and truncation tests; no frontend filtering.

## 2. Agent integration

- [ ] 2.1 Migrate dispatch and every caller/test to an awaitable API, preserving existing validation/refusal behavior.
- [ ] 2.2 Implement guardian_status and guardian_history with SourceNumbers from validated reads and explicit unknown/stale heartbeat/hash/activation-fee evidence.
- [ ] 2.3 Test malformed state, history truncation, missing links, stale liveness, hostile arguments and secret-free failures; do not mark full F7 evidence complete.

## 3. Conditional owner payloads

- [ ] 3.1 Verify D18 G1/G3 before implementing Guardian product cards; wait final provisioning ABI from add-guardian-position-and-factory for factory-dependent activation sequence.
- [ ] 3.2 Add unsigned deterministic activate/deactivate/withdraw drafts and pause/resume/policy/rotation payloads with existing owner deposit rules and explicit configured fees.
- [ ] 3.3 Test stale drafts, altered model prose, registration/funding order, fee recipient binding and deactivated reserve withdrawal.

## 4. Verification and documentation

- [ ] 4.1 Run guardian-client/agent/engine suites, typecheck and lint; check no signer dependency enters these packages.
- [ ] 4.2 Update ARCHITECTURE tool/client/card contracts and P3.1/P4.1/P5.1/P5.2 backend evidence only; preserve missing event-link sources and frontend tasks.
