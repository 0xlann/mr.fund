Gate summary: local work (sections 1–3) needs no external gate, no D19 decision (testnet is the documented default for D31), no B7 accounts and no credentials. Section 4 has two kinds of evidence: a browser smoke the agent can run, and real passkey or wallet completion that only a human can perform on the configured network; the second is recorded separately and is never inferred from fake-adapter tests. Mainnet NEAR Auth needs an approved client id and is out of scope. Depends on `refactor-consultation-data-source` tasks 2.1, 2.2 and 3.1.

## 1. Provider and binding

- [ ] 1.1 Add the client-only `WalletProvider` and `useWalletSession` (`useSyncExternalStore` over the controller) mounted from `app/play/layout.tsx`; adapters are built lazily in the browser and construction failure becomes the `error` state. Tests with fake adapters: server render yields `checking`; state equals controller snapshots; unmount disposes. Acceptance: landing bundle contains no wallet SDK (checked on the production build).
- [ ] 1.2 Expose the controller as the `session` port (`provenance: "live"`) for the consultation source; the demo source keeps its simulated port. Test the mixed configuration label rule from the consultation-source spec.

## 2. Surfaces

- [ ] 2.1 Connection dialog: NEAR Auth and NEAR Connect choices, explicit "Try the simulated demo" entry, no automatic demo fallback. Tests for success, cancel, failure, double activation and unmount during login. Remove the mock-wallet-as-default path from `Playground`; the simulated wallet remains reachable only through the demo entry.
- [ ] 2.2 Status and recovery states for all six `WalletState.status` values, passive-restore checking state, and explicit configuration errors (missing config, mainnet without client id, wrong-network accounts). Tests per state.
- [ ] 2.3 Account display, network badge and account picker (only when several accounts); the capability line derived from `method`. Tests: only session accounts shown; Auth shows read-only copy; no enabled sign action.
- [ ] 2.4 Logout and remote-logout-failure copy ("this device is signed out; the provider session may remain"). Tests for success and failure paths.
- [ ] 2.5 Accessibility and responsive pass: focus trap and restore, Escape rule, live-region announcements, 360 px, reduced motion. Keyboard-only test of the login path.

## 3. Documentation

- [ ] 3.1 Update `docs/DESIGN.md` with the connect surfaces and the demo-entry rule. Record the route-scoped provider as a deliberate narrowing of `add-dual-near-auth` task 3.3 wording. Do not tick any task yet.

## 4. Evidence (observed only)

- [ ] 4.1 Run `next dev`, exercise: first load (checking → disconnected), cancel, error recovery, demo entry, wrong/missing config, keyboard-only path and 360 px. Record the observed results and screenshots (ignored `scratch/` unless small and useful).
- [ ] 4.2 Run `pnpm test`, `pnpm typecheck`, `pnpm lint` and the production build; record counts and the landing-bundle check.
- [ ] 4.3 **Human gate (lead):** complete one real NEAR Auth login (passkey) and one real NEAR Connect login on the configured network. Record account ids, method, network, date, browser, and any origin/callback rejection as observed. This changes no balance and signs nothing. Until done, tasks 3.3, 4.1 and 4.2 of `add-dual-near-auth` and P4.3a stay unchecked.
- [ ] 4.4 After 4.1–4.3, update `add-dual-near-auth` tasks 3.3/4.1/4.2 and BUILD-PLAN P4.3a with the evidence actually observed.

## Commit contract

Every commit contains one behavior, its tests and relevant docs, and 50–350 added/deleted lines. Interfaces precede consumers. No temporary files, secrets or captures are committed. Commit identity and no-push/no-merge rules follow the repository instructions; the parent integrates and verifies each commit.
