## 1. Contract and dependencies

- [x] 1.1 Record user-approved D31 dual-login scope and reconcile PRD/architecture/P4.3; keep D19, public wallet proof and backend authentication separate. Strict OpenSpec validation passed (2026-11-08); no runtime evidence is implied by this specification commit.
- [x] 1.2 Add pinned browser dependencies and public configuration/types. Config tests failed before implementation and all 12 passed afterward (2026-11-08); no silent chain/mainnet-client fallback. Frozen install passed after explicitly denying the reviewed sponsorship-only postinstall and unrequested connector skills. No global build-policy weakening.

## 2. Independent login adapters

- [x] 2.1 Key-resolution regressions failed before implementation and passed afterward; wrong chain, malformed RPC/key, curve/length and exact-address boundaries are covered. Public testnet MPC read completed in 775 ms (2026-11-08), using a synthetic probe subject: real public derivation, not a user login, account creation, funding or signing.
- [x] 2.2 Hosted lifecycle regressions failed before implementation and passed afterward. Official Auth0 memory-cache login/session restoration maps validated `sub`, not email; cancellation/resolution failures remain sanitized. Logout clears the local SDK cache, not global hosted SSO. Typecheck/focused Biome passed (2026-11-08); human hosted-login completion remains separate evidence.
- [x] 2.3 Connector regressions failed before implementation and passed afterward: passive configured-network reads, validated multiple/empty/malformed accounts, provider failures, current-wallet logout and detachable account-change signals. No access-key/plugin request or signer exposure. Web typecheck and focused Biome passed (2026-11-08); controller concurrency and real-wallet completion remain separate tasks.

## 3. Shared account lifecycle

- [ ] 3.1 Write failing controller tests for stored-hint forgery, multiple-account selection, unavailable selection and disconnect. Implement `createWalletSession` over the adapters with one active method/network/account and account-scoped context key.
- [ ] 3.2 Write failing delayed login/restore/logout and external account-change tests; implement generation invalidation so superseded results/events never revive the prior account. Test failed remote logout without claiming the provider session ended.
- [ ] 3.3 Wire a browser-only `WalletProvider`/`useWalletSession` into root layout; load adapters only on the client and preserve server secret separation. Restore only the explicitly selected provider; no unsolicited prompts.

## 4. Reachable UI and proof

- [ ] 4.1 Add a minimal `/connect` page with both choices, account selection/full address/network, loading/error/config states, cancellation recovery and logout. Link from the placeholder home without redesigning the team's UI. Record scoped interaction rules in DESIGN.
- [ ] 4.2 Exercise actual Next UI and real provider entry surfaces without login credentials or transactions; verify keyboard, 360 px, visible focus and reduced motion. Controlled adapter smoke is explicitly synthetic, never real login proof.
- [ ] 4.3 Run affected tests after each coherent unit, one final workspace test/typecheck/lint/build and strict OpenSpec validation. Independent review checks stale sessions, wrong accounts, OAuth callback recovery and key/token handling. Fix evidence-backed findings in separate small commits.
- [ ] 4.4 Record exact observed evidence and external gates in docs and these checkboxes. Human biometric/real-wallet completion and mainnet approved client remain owner prerequisites if unavailable; do not fabricate successful login or mark public money-flow tasks complete.

## Commit contract

Every commit contains one behavior, its relevant tests/docs and 50–350 added/deleted lines (including generated files). Parent integrates worker changes and commits only verified paths. Dependencies/interfaces precede consumers; no empty scaffolds, temporary artifacts or secrets are committed. No merge/push unless the user authorizes it for this branch.
