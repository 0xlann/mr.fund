Gate summary: local work (sections 1–3) needs no external gate, no D19 decision (testnet is the documented default for D31), no B7 accounts and no credentials. Section 4 has two kinds of evidence: a browser smoke the agent can run, and real passkey or wallet completion that only a human can perform on the configured network; the second is recorded separately and is never inferred from fake-adapter tests. Mainnet NEAR Auth needs an approved client id and is out of scope. Depends on `refactor-consultation-data-source` tasks 2.1, 2.2 and 3.1.

## 1. Provider and binding

- [x] 1.1 Add the client-only `WalletProvider` and `useWalletSession` (`useSyncExternalStore` over the controller) mounted from `app/play/layout.tsx`; adapters are built lazily in the browser and construction failure becomes the `error` state. Tests with fake adapters: server render yields `checking`; state equals controller snapshots; unmount disposes. Acceptance: landing bundle contains no wallet SDK (checked on the production build). (2026-11-10: `wallet/react.tsx` + `app/play/layout.tsx`; production build: the four wallet SDK chunks are referenced by `/play` only, none by `/`.)
- [x] 1.2 Expose the controller as the `session` port (`provenance: "live"`) for the consultation source; the demo source keeps its simulated port. Test the mixed configuration label rule from the consultation-source spec. (`play/source/liveSession.ts`; `PlayViewport` uses it only while the controller reports `connected`.)

## 2. Surfaces

- [x] 2.1 Connection dialog: NEAR Auth and NEAR Connect choices, explicit "Try the simulated demo" entry, no automatic demo fallback. Tests for success, cancel, failure, double activation and unmount during login. Remove the mock-wallet-as-default path from `Playground`; the simulated wallet remains reachable only through the demo entry. (Visual layout kept; the dialog's former "Coming with the live integration" row became the two real methods. The controller does not distinguish cancel from failure (adapters untouched), so a cancel shows the recoverable error state rather than a neutral notice.)
- [x] 2.2 Status and recovery states for all six `WalletState.status` values, passive-restore checking state, and explicit configuration errors (missing config, mainnet without client id, wrong-network accounts). Tests per state. (Wrong-network accounts surface as the controller's sign-in error plus the configured network name.)
- [x] 2.3 Account display, network badge and account picker (only when several accounts); the capability line derived from `method`. Tests: only session accounts shown; Auth shows read-only copy; no enabled sign action.
- [x] 2.4 Logout and remote-logout-failure copy ("this device is signed out; the provider session may remain"). Tests for success and failure paths.
- [x] 2.5 Moved to polish-live-consultation 3.7: accessibility, focus, keyboard, 360 px and reduced motion. Existing partial implementation evidence is recorded in the 2026-11-10 note; the real-browser pass remains open there.

## 3. Documentation

- [x] 3.1 Moved to polish-live-consultation 5.2 (owner): update `docs/DESIGN.md` for connect surfaces and demo entry. [V, source inspection, 2026-11-13] `app/play/layout.tsx` mounts the route-scoped provider, rather than the root-scoped provider originally described in dual-auth 3.3.

## 4. Evidence (observed only)

- [ ] 4.1 Run `next dev`, exercise: first load (checking → disconnected), cancel, error recovery, demo entry, wrong/missing config, keyboard-only path and 360 px. Record the observed results and screenshots (ignored `scratch/` unless small and useful). **Open (2026-11-10):** Not run: browser checks are done by the user.
- [x] 4.2 Run `pnpm test`, `pnpm typecheck`, `pnpm lint` and the production build; record counts and the landing-bundle check. (2026-11-10: `pnpm test` 1078 passed / 3 skipped, `pnpm typecheck` and `pnpm lint` clean, `next build` succeeded with testnet public env.)
- [ ] 4.3 **Human gate (lead):** complete one real NEAR Auth login (passkey) and one real NEAR Connect login on the configured network, recording account ids, method, network, date and browser. Partial evidence [V, owner-reported, 2026-11-13, testnet]: both login methods worked in the app; Auth session account `0b9ef00080505625d3444960ab8bb50d75a6fac77e4d98828a7f40c186aa7cde`; owner imported `d-mrf-b1ce96af6a.testnet` into a wallet, but its identity as the connected account is [U]. Auth passkey use and browser [U]; NEAR Connect account id, wallet and browser [U]. Chat answered in live mode; no transaction was signed. The named passkey and metadata acceptance remains unobserved.
- [ ] 4.4 After 4.1–4.3, update `add-dual-near-auth` tasks 3.3/4.1/4.2 and BUILD-PLAN P4.3a with the evidence actually observed. Partial update [V, 2026-11-13]: dual-auth 3.3 and the moved accessibility portion of 4.2 were recorded; 4.1 and the complete browser/passkey evidence remain open.

## Commit contract

Every commit contains one behavior, its tests and relevant docs, and 50–350 added/deleted lines. Interfaces precede consumers. No temporary files, secrets or captures are committed. Commit identity and no-push/no-merge rules follow the repository instructions; the parent integrates and verifies each commit.
