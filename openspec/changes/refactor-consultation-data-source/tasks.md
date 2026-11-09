Gate summary: no external gate. No D19, B7, D24, credentials or network access is needed. Commit contract: one extraction per commit, 50–350 changed lines (pure moves are labelled as such and reviewed with `git diff --color-moved`); every commit passes `pnpm lint`, `pnpm typecheck` and the playground tests.

## 1. Baseline

- [x] 1.1 Record the current baseline: `pnpm test` summary, `pnpm --filter @mrfund/web build`, and rendered text of the welcome, wallet dialog, chat reply, position, Guardian and activity panels captured from `next dev` at one desktop and one 360 px viewport. Store captures only in ignored `scratch/`.
  Evidence [V, 2026-11-10]: `pnpm test`: 67 files passed, 3 skipped; 936 tests passed, 3 skipped. Production build passed. Managed Chromium captures at 1440×900 and 360×800: `scratch/consultation-baseline.json`.
- [x] 1.2 List behaviors in `Playground.tsx` that no existing test covers (receipt detail, partial wallet batch, Guardian replay, data-state switch in Demo settings, voice sample). Add characterization tests for each before moving code; they must pass on the unmodified file.
  Evidence [V, 2026-11-10]: `pnpm exec vitest run apps/web/test/consultation-characterization.test.ts apps/web/test/playground.test.ts`: 25 passed on unchanged production code; eight additions cover failed/partial receipts and unchanged funds, confirmed receipt metadata/health, repeated-replay cooldown, loading/empty/error recovery, editable voice approval. Basic replay, stale switch and voice sample were already covered. `pnpm typecheck` and `pnpm lint` passed (202 files).

## 2. Ports and demo source

- [x] 2.1 Define `ConsultationSource`, port types and `ChatEvent`/`ExecutionEvent` in `apps/web/src/play/source/types.ts`, reusing `@mrfund/shared` types; unit-test the type-level contract with a minimal fake.
  Evidence [V, 2026-11-10]: web typecheck first failed on missing source types, then `pnpm typecheck` passed; `pnpm exec vitest run apps/web/test`: 194 passed; `pnpm lint`: 204 files clean. Final interface recorded in design.md.
- [x] 2.2 Implement `ProvenanceTag` for existing labels; test simulated-with-label, live-without-label and mixed configurations, plus the negative case (simulated label absent/invalid fails). Known unlabelled surfaces remain section 5.
  Evidence [V, 2026-11-10]: provenance tests first failed on the missing component; all 199 web tests now pass, workspace typecheck and Biome (206 files) pass. Parent explicitly preserved visible copy and deferred missing chat/mobile labels.
- [x] 2.3 Extract the position/engine fixture logic to the demo source `position` port (no UI change).
  Evidence [V, 2026-11-10]: position tests first failed on the missing adapter; `pnpm exec vitest run apps/web/test`: 201 passed, including original health, repayment, cached subscription and stale advice checks. Workspace typecheck and Biome (208 files) pass. UI cutover follows at 3.1.
- [x] 2.4 Extract scripted chat into the demo `chat` port as an `AsyncIterable<ChatEvent>`; keep the two-second thinking and progressive reveal in the UI; test abort leaves no stale event.
  Evidence [V, 2026-11-10]: stream tests first failed on the missing adapter; `pnpm exec vitest run apps/web/test`: 204 passed, including protocol events and cancellation before/mid-stream. Workspace typecheck and Biome (210 files) pass. UI timing is unchanged pending 3.1 cutover.
- [x] 2.5 Extract mock wallet connection and the four outcomes into the demo `session` and `execution` ports; test cancel/failure/partial/success keep or change balances exactly as before.
  Evidence [V, 2026-11-10]: execution tests first failed on missing adapters; `pnpm exec vitest run apps/web/test`: 209 passed, including all four outcomes, connection progress and cancellation before settlement. Workspace typecheck and Biome (213 files) pass. UI cutover follows at 3.1.
- [ ] 2.6 Extract simulated Guardian lifecycle, over-limit rejection, replay, reserve and receipts into the demo `guardian` port.

## 3. Hook and component split

- [ ] 3.1 Add `useConsultation(source)` and move state and intents into it; `Playground` renders from the view model only.
- [ ] 3.2 Extract `WalletDialog`, `ChatPanel`, `PositionPanel`, `GuardianPanel`, `ActivityPanel` and `ReceiptDetail` one per commit; no style or copy change.
- [ ] 3.3 Mount `demoSource` from `app/play/page.tsx`; verify the landing route's bundle does not include `play/source/`.

## 4. Verification

- [ ] 4.1 Run the unmodified `playground.test.ts` plus new tests, full `pnpm test`, `pnpm typecheck`, `pnpm lint` and production build; compare against the task 1.1 baseline (same text and numbers in every panel).
- [ ] 4.2 Run `next dev`, exercise welcome → connect → ask → repay → Guardian activation → over-limit rejection → deactivate; record the observed result. Browser visual QA stays with the user.
- [ ] 4.3 Update BUILD-PLAN P4.4 (progress note only, no checkbox) and `docs/DESIGN.md` (module map); no feature or evidence claim beyond what ran.

## 5. Known honesty gap (deliberate visible change)

- [ ] 5.1 Add visible Simulated labels to chat and 360 px surfaces; deliberate visible change, to be done with `add-live-wallet-session-ui` task 2.1 where the demo entry is labelled.
