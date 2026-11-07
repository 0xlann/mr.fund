## 1. Contracts and recorded inputs

- [ ] 1.1 Define pure parser result, trusted expected-transaction plan and typed errors using existing Result/BigInt conventions; define status mapping including unresolved mixed batches.
- [ ] 1.2 Record raw sandbox receipt graphs with provenance for successful repay, full/partial refund, legacy supplied surplus, detached Rhea failure and successful repay/failed fee.

## 2. Pure outcome interpretation

- [ ] 2.1 Write failing tests for graph completeness/finality, transaction identity, unrelated resolver, malformed base64/u128, duplicate receipts and impossible used amounts.
- [ ] 2.2 Implement bounded reachable-receipt traversal and version-aware resolver interpretation without signing or transport retry.
- [ ] 2.3 Implement ordered batch aggregation preserving applied effects, and the existing CardReceipt adapter; test pending, failed, partial and confirmed boundaries.

## 3. Observed post-state

- [ ] 3.1 Add bounded read orchestration with network/account/lending identity and block-order validation; keep unobserved debt/health fields unknown.
- [ ] 3.2 Test stale/read-failed/concurrent-state cases and legacy surplus so accepted tokens never substitute for debt decrease or mood improvement.

## 4. Verification and handoff

- [ ] 4.1 Run rhea/shared/engine receipt-related suites, typecheck and lint; rerun affected sandbox fixture generation and validate provenance.
- [ ] 4.2 Update ARCHITECTURE, INTEGRATIONS and P4.3 parser evidence; retain wallet/UI and live-wallet proof as separate unchecked work.
