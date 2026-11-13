# [EXTEND] Chat open-position implementation plan

**Gate:** Stretch: implement only after the core submission is complete.

**Goal:** A user explicitly approves a plain-wallet Rhea collateral deposit, then a freshly quoted borrow from chat, and receives stage-specific observed outcomes.

**Architecture:** Extend existing deterministic engine/card, Rhea builder/outcome and browser execution modules. The agent proposes and explains; the existing Connect signing seam accepts only operation-specific verifier-issued payloads. No new contracts or Guardian custody.

**Spec:** `specs/chat-open-position/spec.md`; rationale and proposed interfaces are in `design.md`.

**Status [I, 2026-11-13]:** All tasks below are planned, not implemented or exercised by this docs-only change. Checkboxes are acceptance gates, not claims of evidence. Public execution, fee decisions and deployments are not authorized here. The specification changes only this change directory; future behavior changes require owning documentation updates during implementation.

## Global constraints and review focus

- Preserve integer atomic/internal/share distinctions, conservative rounding, Result/Computed error conventions, explicit source/time, APR and existing import rules.
- Preserve manual repay and Guardian behavior; migrate every extended-card/action consumer without compatibility shims or a permissive generic executor.
- Freshness checks include the intended debt price even with zero current debt, protocol validity, fixed-price snapshot age and materially changed pool/share inputs.
- Exercise non-1:1 supplied and borrowed pools, maximum/max+1 boundaries, pre-existing supplied funds and missing USDC price; a 1:1 pool alone cannot prove the builder.
- Exercise each partial outcome: registrations only, deposit applied/borrow absent, debt without delivery, refund, later fee failure, wallet throw and unresolved post-state. Never infer outcome from a hash or root success.
- A failed or ambiguous action never automatically submits again. No signer in agent/server; no signer for Auth; no native wrapping, swaps, oracle writes, watcher or Guardian changes.

## 1. Resolve enablement inputs and pin protocol evidence

**Files:** future recorded fixtures under `fixtures/rhea/`; encoding vectors in `fixtures/encodings.json`; existing imported-bytecode sandbox coverage under `contracts/tests/`; current technical evidence docs only when results actually exist. This task does not deploy a contract.

- [ ] 1.1 After the core submission gate, record supported collateral/debt ids, network/lending id and observed version, raw action flags, storage requirements, token/internal decimals, supplied/borrowed share inputs and available-liquidity derivation at a pinned final block. Treat `0.11.0` and `0.16.2` support independently; unknown/unproved versions stay disabled. Do not infer missing fields from APR or protocol version alone.
- [ ] 1.2 Add failing imported-bytecode tests first for deposit and Borrow + amount-omitted Withdraw on accrued pools. Reproduce the recorded REF ratio and exact-withdraw failure, then prove the chosen encoding, debt rounding and delivery on the same setup. Include zero/positive pre-existing supplied balances, permission flags, overflow and null/expired/future intended-debt price. Label sandbox prices **Simulated**; preserve the public Gate 1 transaction references as historical evidence, not a new run.
- [ ] 1.3 Owner: founder for pricing, lead for configuration/evidence. Record the per-stage fee token/amount/recipient/charging point, including behavior when a split wallet batch applies only a registration, lending action or fee. Confirm fee recipient registration and current storage bounds. D24's USDC fee is not approval of REF fees or two charges for one opening. Missing policy blocks executable stages; never supply an implicit zero schedule.
- [ ] 1.4 Measure gas for the chosen encodings and failure paths in sandbox, pin operation-specific verifier bounds and storage-deposit caps, and run the focused sandbox checks in the supported Linux/macOS/WSL2 environment. Record actual results and remaining public limitations; do not claim testnet fresh-price feasibility, a generic one-bps error bound or Guardian exact-withdraw remediation.

**Acceptance:** Inputs, exact JSON encodings and conservative rounding/gas bounds are grounded in recorded or imported-bytecode evidence, with unavailable-version/fee/price prerequisites named. No production borrowing is enabled from an unverified input.

## 2. Add shared opening context and deterministic engine quotes

**Files:** modify `packages/shared/src/{card,snapshot,errors,index}.ts`, `packages/rhea/src/{views,snapshot,index}.ts`, `packages/engine/src/index.ts`; create `packages/engine/src/open-position.ts`, `packages/engine/test/open-position.test.ts`, `packages/rhea/test/open-position-context.test.ts`; update existing shared tests and exhaustive action consumers as required.

**Interface:** Validated, block-provenanced opening context feeds pure `maxBorrow(input, nowMs)`, `quoteBorrow(input, amountAtomic, nowMs)` and `quoteCollateralDeposit(input, amountAtomic, nowMs)` returning Result/Computed drafts/results. New action details identify `wallet_collateral_deposit` or `wallet_borrow`, wallet custody, account/network, exact amounts and quote assumptions; old actions remain unchanged.

- [ ] 2.1 Write failing context/type tests for canonical bigint parsing, matching provenance, allowed flags, intended-debt prices on empty accounts, unknown assets/version, and correct zero/nonzero supplied-balance guards. Implement only the additional typed pool/share/liquidity/registration inputs required by task 1, reusing pinned read/validation patterns.
- [ ] 2.2 Write failing engine tests for one supported existing pair and empty positions; invalid targets/amounts; u128 internal overflow; zero collateral/maximum; missing/stale prices; non-collateral supply exclusion; fixed defaults; existing debt; and liquidity limits. Implement conservative share-aware projections and largest admissible atomic principal at the target; never size from a model number or silently default unavailable data.
- [ ] 2.3 Add properties and worked vectors: health decreases or stays equal as positive debt increases; adding collateral cannot reduce the admissible maximum; selected `max` satisfies every constraint and `max + 1` violates the reported binding constraint; health floors and debt ceils for extraDecimals 0 and 12 and non-1:1 pools. Cross-check projected protocol liabilities against task 1's imported-bytecode vectors; refusals replace unsupported rounding assumptions.
- [ ] 2.4 Generate engine-owned card numbers/assumptions for chosen deposit, maximum additional principal, estimated delivery, current/resulting total debt and health, target, APR, fixed-price warnings, fees/storage and provenance. Distinguish `no_debt` and missing health. Add an explicitly conditional opening preview and require a fresh post-deposit context for an executable borrow.

**Planned local check:** `pnpm exec vitest run packages/shared packages/engine packages/rhea`; expected result is all affected tests pass after demonstrated failing tests. These commands have not been run for this change.

## 3. Build and independently verify the money path

**Files:** create `packages/rhea/src/tx/open-position.ts`, `packages/rhea/test/open-position-payload.test.ts`, `apps/web/src/execution/open-position-verify.ts`, `apps/web/test/open-position-verify.test.ts`; modify `packages/rhea/src/index.ts` and `apps/web/src/execution/{signer,wire}.ts` plus affected action dispatch consumers/tests.

**Interface:** `collateralDepositPayload(draft, context)` / `borrowPayload(draft, context)` produce Result transaction arrays. `verifyOpenPositionPayload(card, expectation)` issues immutable verified opening output; the existing signer checks that output's issuing verifier and exact session, rather than accepting a structurally compatible object.

- [ ] 3.1 Write failing builder tests for exact verified JSON/order/deposits and atomic-to-internal conversion; implement required storage registration, collateral transfer with only IncreaseCollateral, and Borrow followed by amount-omitted Withdraw. Reuse shared FT/fee helpers; prohibit exact Withdraw amount/max_amount and any silent alternate encoding. Preserve existing repay builders and tests.
- [ ] 3.2 Write adversarial verifier tests for wrong signer/network/version/token/receiver/fee recipient/storage beneficiary, amount or display mismatch, decimal-scale substitution, missing or excess deposit, low/high gas, nested extra fields, action reordering/count, AddKey/DeleteKey/native Transfer/deploy/stake and Guardian calls. Assert zero wallet calls for every refusal. Implement independent exact verification of every operation against trusted current context.
- [ ] 3.3 Extend the existing Connect-only signer to accept the new issuing verifier's output without weakening repay/Guardian issuer checks. Add forged-object, mutated-object, account-switch and Auth-session tests. Never expose signing through a public session object, agent tool or server module.
- [ ] 3.4 Exercise encode/decode and UI summary serialization for bigint opening details. Assert that structured/card/payload amounts, target and fees agree, and that no numeric/prose field can rewrite transaction bytes.

**Money-path review:** OP-1/OP-2; connected wallet only, exact 1-yocto transfer/execute deposits, fixed configured receivers and disclosed bounded storage/fees. Does not guarantee acceptance or a faithful wallet display. Future focused checks: `pnpm exec vitest run packages/rhea apps/web/test/open-position-verify.test.ts` plus the existing signer tests.

## 4. Reconcile stage-specific outcomes without repay assumptions

**Files:** create `packages/rhea/src/open-position-outcome.ts`, `packages/rhea/test/open-position-outcome.test.ts`, `apps/web/src/execution/open-position-run.ts`, `apps/web/test/open-position-run.test.ts`; modify relevant `packages/rhea/src/index.ts` and execution plan/live dispatch consumers. Store appropriately labelled outcome fixtures under `fixtures/rhea/`.

**Interface:** An opening plan binds verified operation/transaction roles to returned hashes and pre-state. Its reader returns submitted/confirmed/failed/partial plus observed collateral/debt/delivery/fees and source/time; the runner executes once or explicitly re-reads, never re-sends.

- [ ] 4.1 Write failing recorded/sandbox outcome tests for each receipt branch and token resolver: full success, full/partial refund, root success with failed receipt, registration-only success, debt without delivery, fee-only success and applied action followed by fee failure. Implement FINAL outcome validation with fresh Rhea/wallet reads and transfer delivery evidence, reusing outcome traversal/RPC patterns rather than treating debt increase as a repay failure.
- [ ] 4.2 Write runner tests for changed quote inputs (including pool shares/liquidity and supplied guards), double activation, stale card, missing signer, account/network change, wallet rejection/throw, incomplete hashes and unavailable post-state. Implement preflight refresh/review invalidation and permanent per-card locking after the wallet request. Unknown results may be reconciled by Check again, never automatically retried.
- [ ] 4.3 Assert no receipt link/confirmed health before observed outcomes, no confirmation from token acceptance alone, and no inference of causal delivery from a balance delta. Track deposit completed/borrow failed or skipped as separate states; retain collateral rather than pretending to roll back the opening.

**Money-path review:** OP-4/OP-5 and SMART-CONTRACT's promise-result discipline, without claiming Guardian I1–I10 apply to a wallet loan. Does not guarantee cross-stage atomicity, current quote execution, exact delivery or concurrent-activity isolation. Future check: `pnpm exec vitest run packages/rhea apps/web/test/open-position-run.test.ts`.

## 5. Connect chat, cards and wallet review end to end

**Files:** modify `packages/agent/src/{tools,numbers,chat-policy,chat-output}.ts`, relevant agent tests, web execution/card/consultation consumers under `apps/web/src/`, and web tests; create `apps/web/test/chat-open-position.test.ts`. Use existing UI modules; no new signing surface.

- [ ] 5.1 Write failing tool/number-guard cases for deposit/borrow intent, missing amount/token/target, invented maximum/health, malicious argument overrides, empty-position flow, unsupported extra pairs and unavailable USDC price. Connect validated intent to engine facts and Rhea-built cards, keeping payloads outside model-visible tool text and signing authority outside agent imports.
- [ ] 5.2 Implement the two reviewable cards and distinct approvals with Adjust/recompute, signer/network/account, requested principal versus estimated delivery, resulting debt/health, target/maximum, APR/price age, storage and stage fees, risk and recovery. Borrow is newly quoted only after observed deposit; declined borrowing leaves the deposited position visible.
- [ ] 5.3 Add browser tests using the labelled dev fake wallet for complete flow, refusal mutations, deposit applied/borrow missing-price rejection, partial fees, unknown outcome and read-only Check again. Assert callback/mood comes from observed data, no pleased-on-debt-open shortcut, no fake receipt links and no automatic borrow after deposit. Cover keyboard/focus, 360 px review layout and reduced motion using existing UI conventions.
- [ ] 5.4 Run focused agent/web tests and the chosen Playwright opening scenarios, then workspace typecheck to catch every new action consumer. Obtain independent money-path review against OP-1–OP-5 with permission boundary, negative tests and non-guarantees recorded. Record actual checks only; do not mark public acceptance from fake-wallet results.

**Acceptance:** One chat conversation reaches real builder → verifier → Connect signing seam → observed stage results, while unsupported/unknown paths stop honestly. Planned commands: `pnpm exec vitest run packages/agent apps/web`, `pnpm typecheck`, and the implementation's explicitly named `pnpm exec playwright test` opening test file.

## 6. Authorized public proof and documentation handoff

- [ ] 6.1 Before public-wallet execution, obtain the applicable human authorization and confirm funded account, token balances, registrations, fee policy, supported version/rounding and usable prices. An executable USDC borrow remains blocked while its mapped fresh quote is null; no feed-update attempt, silent REF switch, mainnet signature or deployment is implied. Fixed-price testnet opening may be exercised only with explicit asset/fee review and fixed-price disclosures.
- [ ] 6.2 Record one authorized real-wallet deposit and borrow with transaction hashes/explorer links only after verified outcomes, before/after account and token balances, delivered amount versus principal, observed debt/health, source blocks/times and actual fees. Record failure/partial outcomes honestly. A recorded older Gate 1 cycle is supporting protocol evidence, not this extension's wallet/UI proof.
- [ ] 6.3 In the future implementation's behavior-change commit, update PRD's empty-position/card behavior, ARCHITECTURE interfaces/imports, INTEGRATIONS evidence and applicable changelog/BUILD-PLAN progress only with observed results. Preserve the source discrepancies and unresolved fresh-price/Guardian gates rather than marking unrelated work complete. This docs-only change does not edit those paths.
- [ ] 6.4 Hand off exact changed files, exercised local/public checks, permission boundary and OP-1–OP-5 evidence, assumptions and remaining risks. Keep public acceptance unchecked if authorization, fees, prices, compatible rounding or actual observed UI execution is unavailable; name the owner and missing prerequisite rather than inserting a mock success.
