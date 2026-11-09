Gate summary: sections 1–4 are local (pure builders, validation, UI against a fake client and recorded sandbox fixtures) and need no accounts or network writes. Anything live needs P2.8 (testnet deployment), D19 (network), B7 (funded testnet owner, tokens, watcher account), D24 (the activation fee is immutable in the factory template and must be decided before deployment), D27 (trigger path; sandbox-proven only) and D29 (watcher host); evidence is sequenced in `prove-testnet-guardian-loop`. Creating a Guardian costs real NEAR (floor 2.75325 NEAR for this build) and mainnet needs explicit human authorization. Depends on `refactor-consultation-data-source`, `add-live-wallet-session-ui` and the verifier/signer from `add-wallet-manual-repay-execution`.

## 1. Backend contract first

- [ ] 1.1 Implement unsigned builders for factory creation, `owner_register` and reserve-plus-fee `ft_transfer_call` with the `activate` message in `packages/guardian-client/src/tx/`, from SMART-CONTRACT "Final ABI for the client". Tests: funding below/above range, gas floors, deposits (1 yocto), registration order, fee recipient binding, altered prose leaves bytes unchanged, stale/foreign owner refusal. Closes `add-guardian-client-and-tools` 3.1–3.3 (update that change in the same commit).
- [ ] 1.2 Correct `docs/technical/ARCHITECTURE.md` Flow 3 to the real ABI (`create_guardian({policy})`; no label, watcher id or access key in the batch) and record the contradiction in `docs/LESSONS.md`. The contract and SMART-CONTRACT are authoritative.
- [ ] 1.3 Add a resumable activation-state reader (`get_guardian(owner)`, status, registrations) returning `none | created | registered | active | failed(claimable)`. Tests per state and for pending creation.

## 2. Form and verified payloads

- [ ] 2.1 Form fields and validation exactly per PRD F6 using the contract's rules; test every boundary (104.99/105%, 5-minute cooldown, per-action vs reserve minus floor, total vs per-action, deposit minimum, target above trigger).
- [ ] 2.2 Summary generation from the policy struct with fees (read from chain) and recipient; property test that every number in the summary equals the payload number.
- [ ] 2.3 Extend the payload verifier to Guardian actions (factory, own Guardian, debt token, lending contract; allowlisted methods; deposits and gas floors); negative tests for `AddKey`, wrong factory, wrong receiver and non-owner signer.

## 3. Live port and flows

- [ ] 3.1 Live `guardian` port: block-pinned reads, heartbeat age, retained-ring truncation, unavailable-evidence states; tests with a fake client including malformed and stale responses.
- [ ] 3.2 Step-wise activation flow (create → register → reserve) with per-step observation and resume-from-chain; tests for reload at each step, failed creation with `sent` and `claimable` refund, creation in flight, and a hash-only unresolved state that shows no Guardian.
- [ ] 3.3 Owner controls (Pause, Resume, Deactivate, Withdraw) as verified cards with availability rules; tests for deactivated semantics, in-flight withdraw block and unknown in-flight outcome.

## 4. Surfaces

- [ ] 4.1 Setup and review surfaces over the real form; Auth session viewable and not signable; Connect flow with honest progress and recovery.
- [ ] 4.2 Guardian panel and controls surfaces; remove the simulated flows from the default path while keeping the labelled demo; banned-phrase test over all copy; accessibility, 360 px and reduced-motion pass.

## 5. Decisions, documentation and evidence

- [ ] 5.1 **Lead decision [U]:** record whether P0 offers collateral deposit, `owner_borrow` and `owner_sweep` in the UI or prepares the loan by operator script. Until recorded, no loan-building control is added (spec requirement).
- [ ] 5.2 Update INTEGRATIONS and DESIGN with the module map and money-path statement (permission boundary, invariants, negative tests, limits). No checkbox changes.
- [ ] 5.3 Local verification: `pnpm test`, `pnpm typecheck`, `pnpm lint`, production build, and `pnpm contracts:test` only if contracts changed (none are expected); local smoke with a fake client, labelled; record observed results.
- [ ] 5.4 **External evidence (lead, via `prove-testnet-guardian-loop`):** real activation, owner controls and panel against deployed testnet contracts with transaction links. Until recorded, P5.1/P5.2 stay unchecked and local tests are reported as local.

## Commit contract

Every commit contains one behavior, its tests and relevant docs, and 50–350 added/deleted lines. Pure builders and validators precede the port and surfaces. No keys, secrets, account ids from live runs beyond recorded evidence, or temporary files are committed. Money-path commits state the permission boundary, the invariant and the negative test in the body. Commit identity and no-push/no-merge rules follow the repository instructions.
