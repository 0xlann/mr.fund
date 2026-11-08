Scope update [V, user instruction, 2026-11-08]: all UI-related work is deferred. Deliver adapters and framework-independent session logic with non-UI verification only. Tasks 3.3, 4.1 and 4.2 remain unchecked future frontend work; do not archive this change as end-to-end login complete.

## 1. Contract and dependencies

- [x] 1.1 Record user-approved D31 dual-login scope and reconcile PRD/architecture/P4.3; keep D19, public wallet proof and backend authentication separate. Strict OpenSpec validation passed (2026-11-08); no runtime evidence is implied by this specification commit.
- [x] 1.2 Add pinned browser dependencies and public configuration/types. Config tests failed before implementation and all 12 passed afterward (2026-11-08); no silent chain/mainnet-client fallback. Frozen install passed after explicitly denying the reviewed sponsorship-only postinstall and unrequested connector skills. No global build-policy weakening.

## 2. Independent login adapters

- [x] 2.1 Key-resolution regressions failed before implementation and passed afterward; wrong chain, malformed RPC/key, curve/length and exact-address boundaries are covered. Public testnet MPC read completed in 775 ms (2026-11-08), using a synthetic probe subject: real public derivation, not a user login, account creation, funding or signing.
- [x] 2.2 Hosted lifecycle regressions failed before implementation and passed afterward. Official Auth0 memory-cache login/session restoration maps validated `sub`, not email; cancellation/resolution failures remain sanitized. Logout clears the local SDK cache, not global hosted SSO. Typecheck/focused Biome passed (2026-11-08); human hosted-login completion remains separate evidence.
- [x] 2.3 Connector regressions failed before implementation and passed afterward: passive configured-network reads, validated multiple/empty/malformed accounts, provider failures, current-wallet logout and detachable account-change signals. No access-key/plugin request or signer exposure. Web typecheck and focused Biome passed (2026-11-08); controller concurrency and real-wallet completion remain separate tasks.

## 3. Shared account lifecycle

- [x] 3.1 Account-selection/controller tests passed (2026-11-08): hints cannot authenticate, network preferences are isolated, selected accounts belong to the current provider, identity changes clear prior account context, and errors are sanitized. The focused six-file run passed 88 tests with web typecheck and Biome. Deep provider-side concurrency review remains task 3.2, not claimed by generation checks alone.
- [x] 3.2 Two competing-operation regressions failed before correction; all ten session tests passed afterward (2026-11-08). Login/logout are exclusive, interactive sign-in events cannot supersede the final account read, and passive/disposed results cannot revive cleared context. Remote logout failure clears local identity without claiming provider logout.
- [ ] 3.3 **Deferred by user instruction (2026-11-08):** wire browser-only `WalletProvider`/`useWalletSession` into root layout; restore only the selected provider without unsolicited prompts. No React wiring ships in the current slice.

## 4. Reachable UI and proof

- [ ] 4.1 **Deferred by user instruction (2026-11-08):** connection screen, account picker, loading/error/recovery/logout surface, home link and DESIGN. Existing app UI stays unchanged.
- [ ] 4.2 **Deferred with UI integration:** actual app/provider-entry smoke, keyboard, 360 px, visible focus and reduced motion; separate real human credential/passkey/wallet completion evidence from synthetic tests.
- [x] 4.3 **Authorized non-UI slice verified (2026-11-08):** 837 tests passed, 3 opt-in checks skipped; workspace typecheck/lint, production web build and strict OpenSpec validation passed. Hosted-boundary review found no blockers; two lifecycle findings were reproduced, fixed in a separate commit and confirmed closed by the reviewer. App routes remained unchanged. Credential/callback/device/UI proof is deferred, not claimed by these checks.
- [x] 4.4 Recorded module interfaces, exact local/public-read evidence, user-directed UI deferral and remaining gates in INTEGRATIONS, ARCHITECTURE, BUILD-PLAN, D31 and README. Human biometric/real-wallet completion, origin approval and mainnet approved client remain prerequisites for frontend integration. No real login, account funding or public money-flow completion is claimed.

## Commit contract

Every commit contains one behavior, its relevant tests/docs and 50–350 added/deleted lines (including generated files). Parent integrates worker changes and commits only verified paths. Dependencies/interfaces precede consumers; no empty scaffolds, temporary artifacts or secrets are committed. No merge/push unless the user authorizes it for this branch.
