Gate summary: all implementation is local and needs no external gate. Live latency measurement and the live smoke use public read-only RPC and the configured NEAR AI key only. Owners: A = chat backend (GPT 6.1 Sol), B = voice (GPT 6.1 Terra), C = live UI (Claude Sonnet 5.5), D = docs and OpenSpec housekeeping (GPT 6.1 Terra), L = lead (integration and verification). File ownership and contracts are in design.md.

## 1. Chat latency, deadline and voice of the replies (A)

- [ ] 1.1 Add secret-free per-stage timing to the chat turn (context load, each provider call, repair round, total) and a throwaway measurement run against public testnet: one account with a Rhea position found by read-only paging, and `d-mrf-b1ce96af6a.testnet` (no position). Record the stage table in the owning chat doc. No message content or key in logs.
- [ ] 1.2 Set the server turn deadline to 60 000 ms and add `slow` to `useLiveConsultation` (true after 15 000 ms busy). Tests: 59 900 ms delivers, 60 000 ms reports `timeout`, cancel during slow state, `slow` resets on done, error and cancel.
- [ ] 1.3 Apply the latency reductions the 1.1 numbers justify, one commit each with before/after numbers in the body. The numeric guard still sees the full reply before anything is emitted.
- [ ] 1.4 Persona: fund-manager voice, markdown subset, no data-age sentence unless stale or missing; deterministic em/en dash normalization in the output path that leaves guarded numbers unchanged. Update persona/output tests and `docs/PRD.md` data-age wording (rule 2 is met by the UI label).
- [ ] 1.5 Rerun the D25 multilingual eval live and record the result as observed in the owning doc and OPEN-DECISIONS D25. Tick `add-tool-driven-chat-api` 3.3 only if its acceptance is met.
- [ ] 1.6 Live read-only smoke with the account from 1.1: one HTTP GET and POST to `/api/position`, one chat question and one refresh. Record network, account, block, data age, latency and the engine comparison; close `connect-consultation-to-live-chat` 4.2 and `add-position-read-api` 4.1/4.2 with that evidence, or record the exact blocker.

## 2. Voice (B)

- [x] 2.1 Extract reply speech from `useConsultation.ts` into `apps/web/src/play/speech/` (controller plus hook, `stripReplyMarkup`). Demo behaviour unchanged; existing demo tests pass unmodified. Evidence [V, 2026-11-13]: web suite 69 files, 576 tests passed; demo reply exercised in isolated browser.
- [x] 2.2 Speak live replies through the same hook and wire `speaking`/`speech` into `CharacterPortrait` for live sessions. Tests: each reply spoken once, markup never spoken, cancel on new turn, clear, sound off and unmount, browser without speech support. Evidence [V, 2026-11-13]: `reply-speech.test.ts` covered these cases and watchdog in the 576-test web run; real speech playback remains owner-check.
- [x] 2.3 Pure voice-input state machine with injected timers and a fake recognizer: toggle start/stop, restart on `end` while listening, transcript kept across restarts, 60 000 ms silence stop, 300 000 ms cap, permission/device errors stop without restart, restart-loop guard, language locked while listening. Evidence [V, 2026-11-13]: fake-clock and recognizer scenarios passed in the 576-test web run.
- [x] 2.4 Drive `VoicePanel.tsx` with the state machine; copy for each state; no auto-send. Component test for tap, pause, stop and the 60 s silence notice. Evidence [V, 2026-11-13]: component scenarios passed in the 576-test web run; isolated browser with a fake recognizer showed listening and tap-to-stop states.

## 3. Live chat UI (C)

- [x] 3.1 Safe renderer for the markdown subset (paragraphs, bold, `- ` and `1. ` lists). Tests: unclosed `**`, nested markers, HTML-looking text stays literal, long words wrap. Evidence: `live/richTextParser.ts` + `live/RichText.tsx` (parser file renamed from `richText.ts`: it collides with `RichText.tsx` on case-insensitive file systems), `apps/web/test/live-rich-text.test.ts` 11 passed.
- [x] 3.2 Live chat uses the demo chat look: Mr.Fund avatar, bubble styles and spacing, user bubble like the demo, auto-scroll, thinking and `slow` states, error with Retry. Evidence: shared `ChatRow`/`ThinkingRow` in `chatAppearance.tsx` (demo ChatMessages DOM byte-identical before/after, compared with a throwaway dump), `apps/web/test/live-chat-panel.test.ts` 10 passed; `slow` is read via `live/liveSlow.ts` until the hook field lands.
- [ ] 3.3 State-aware suggestion chips (no position, ready, stale, unavailable), hidden while busy, sent through `live.send`.
- [ ] 3.4 Data-age label for the live position and each live card; card numbers and fees laid out like the demo card without changing any value.
- [ ] 3.5 Live header shows health and debt from the live position (`—` when absent), never fixture values.
- [ ] 3.6 Visible Simulated labels on demo chat and 360 px surfaces (moved from `refactor-consultation-data-source` 5.1).
- [ ] 3.7 Accessibility and responsive pass on live chat, connect dialog and repay confirmation: keyboard-only path ask → card → confirm, visible focus, focus into and back from dialogs, live-region status, 360 px, reduced motion; observed in a real browser with screenshots in ignored `scratch/` (moved from `add-live-wallet-session-ui` 2.5, `add-dual-near-auth` 4.2 and `add-wallet-manual-repay-execution` 3.3).

## 4. OpenSpec housekeeping and follow-up proposals (D)

- [ ] 4.1 Record the owner's 2026-11-13 report that NEAR Auth and NEAR Connect logins work on testnet, tick the tasks that evidence covers, mark moved tasks with their new home, and archive `add-dual-near-auth`, `add-live-wallet-session-ui`, `add-guardian-client-and-tools` and `refactor-consultation-data-source` following the existing archive pattern. DESIGN.md items move to the owner (5.2).
- [ ] 4.2 Write `add-chat-open-position` marked **[EXTEND]**: proposal, design, spec and tasks for opening a position from chat. No code.
- [ ] 4.3 Write `plan-production-deployment`: the deployment specification for the web app (frontend and API routes), the watcher (keeper) host, contract ids and environment matrix, to be executed by a deployment owner, not by the build team. No deployment is performed.

## 5. Integration and evidence (L)

- [ ] 5.1 Rebase each branch on `dev` and fast-forward in order A, B, C; run `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm --filter @mrfund/web build`; record counts. Owner browser check of live chat, voice and speech with the evidence recorded as observed.
- [ ] 5.2 **Owner:** update `docs/DESIGN.md` for the connect surfaces, live chat and voice states (agents do not edit DESIGN.md).

## Commit contract

One behaviour per commit with its tests and the docs it changes, 50 to 400 changed lines, subject `feat|fix|refactor|test|docs(scope): outcome`. Stage only owned paths. No secrets, captured transcripts with account data, or temporary files. Each commit passes `pnpm typecheck` and the tests of the touched package. No push, no merge into `dev` by workers; the lead integrates.
