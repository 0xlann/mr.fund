## 1. Mandatory custody and provisioning gates

- [ ] 1.1 STOP: verify founder-recorded D18 G1/G3 before implementation; if open wait, if G2 rescope instead of executing later tasks.
- [ ] 1.2 Confirm settlement operation/config ABI and version encodings are stable; run a local stored-code/global-contract provisioning/storage/failure-phase experiment on pinned toolchain.
- [ ] 1.3 Record chosen code strategy, account-id derivation, funding floor and create/refund ABI from measured results before factory/client implementation.

## 2. Owner position operations

- [ ] 2.1 Write failing owner+1-yocto/foreign-watcher/private-callback tests and reserve/in-flight sweep-race vectors.
- [ ] 2.2 Implement configured-token registration/collateral funding and owner borrow/release with fixed Rhea targets and complete receipt/post-state assertions.
- [ ] 2.3 Implement fee-free owner manual reserve repay with refund settlement, plus sweep that excludes all committed reserve/in-flight/fee obligations under the shared lock.

## 3. Factory lifecycle

- [ ] 3.1 Implement validated child creation/deployment/init with a pending-per-owner guard and immutable config; add no access keys or upgrade method.
- [ ] 3.2 Implement phase-bound creation/refund callbacks and publish owner mapping only after successful initialization.
- [ ] 3.3 Test underfunding, duplicate creates, deploy/init/refund failures, callback replay and keyless failed-child reporting without a fictional full refund.

## 4. Sandbox proof and handoff

- [ ] 4.1 Prove empty child key list/I10 and complete owner collateral → borrow → repay → release lifecycle using imported Rhea versions and Simulated prices.
- [ ] 4.2 Run Rust unit/sandbox suites and Clippy; record storage/gas/failure-phase costs and update SMART-CONTRACT/P2.4/P2.6/P2.7 evidence.
- [ ] 4.3 Publish final ABI for add-guardian-client-and-tools; keep public creation/deployment behind D19/B7 and explicit account/funding authorization.
