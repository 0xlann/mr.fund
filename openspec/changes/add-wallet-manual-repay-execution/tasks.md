Gate summary: sections 1–3 are local: a fake wallet plus the recorded sandbox fixtures (`fixtures/outcomes/`, six scenarios for each of Rhea 0.11.0 and 0.16.2) need no external gate, account or network write. Public wallet execution (P4.5) needs D19 (network decision), B7 (a funded testnet account holding the repay token and a Rhea position) and an authorized spend; that proof is sequenced by `prove-testnet-guardian-loop`, not claimed here. Depends on `refactor-consultation-data-source`, `add-live-wallet-session-ui` and `connect-consultation-to-live-chat` (cards, formatter, position reads).

## 1. Pure logic first

- [ ] 1.1 Inventory every transaction the repay and fee builders can emit (`packages/rhea/src/tx/repay.ts`, `packages/shared/src/nep141.ts`) and implement `verifyCardPayload(card, expected)` with the method/deposit/receiver allowlist. Tests: valid card for each Rhea version; extra `AddKey`/`Transfer`/`DeployContract`/`Stake`; wrong receiver, method, deposit, amount, fee recipient; fee sum mismatch; wrong network; signer mismatch. Record the final allowlist in the design.
- [ ] 1.2 Add the public configuration needed by the verifier (lending id, fee recipient id) with one shared reader and a mismatch check against server-provided card fields; no silent defaults. Tests: missing, malformed and inconsistent values block Execute.
- [ ] 1.3 Implement plan assembly from the verified payload plus the hashes in the wallet's `FinalExecutionOutcome[]`, validated with `validateRepayPlan`. Tests: hash count mismatch, duplicated hash, missing outcome, role order (repay then fees).
- [ ] 1.4 Confirm `@mrfund/rhea` outcome reading imports no Node-only modules in the browser path (bundle check). If it does, stop and write a follow-up proposal; do not move reading to the server silently.

## 2. Signer and execution port

- [ ] 2.1 Add the Connect-only `TransactionSigner` wrapper around `signAndSendTransactions` (`signerId`, `network` set from the session); the controller state still exposes no signer. Tests: Auth session has none; wrong signer or network refused; wallet result passed through unmodified.
- [ ] 2.2 Implement the live `execution` port state machine (`idle → confirming → signing → submitted → confirmed | partial | failed | unconfirmed`), the per-card in-flight lock, pre-sign freshness and fresh `before` read. Tests: double activation, stale card, changed position, one-per-card.
- [ ] 2.3 Wire outcome reading and receipts: `readRepayOutcome` with the injected engine health, `toCardReceipt`, fresh post-state; the unconfirmed-error path (re-read; unchanged debt → draft, changed debt → observed receipt). Tests per recorded fixture mapping to the documented receipt table, wallet rejection, error after partial progress, reader timeout, and that a thrown error never yields `confirmed`.

## 3. Surfaces

- [ ] 3.1 Enable Execute for Connect sessions only and show disabled reasons (Auth, stale, signer missing, network mismatch, verification failed). Add the in-app confirmation showing amount, token, each fee with recipient, network and account from the verified payload. Tests for each reason and for fees-before-signing.
- [ ] 3.2 Receipt surface: pending with Check again, confirmed/partial/failed copy with observed values and data time, explorer link only after observation (network-specific base URL from configuration), post-transaction position refresh, mood from engine data. Banned-phrase test over all receipt copy.
- [ ] 3.3 Accessibility and responsive pass (focus into confirmation and back, live-region status, 360 px, reduced motion). Keyboard-only path ask → card → confirm.

## 4. Documentation and evidence

- [ ] 4.1 Add the money-path statement (permission boundary, E1–E5, negative tests, limits) to `docs/technical/ARCHITECTURE.md` and extend `docs/technical/REPAY-OUTCOMES.md` with the browser composition. No checkbox changes.
- [ ] 4.2 Local smoke in `next dev` with the fake wallet adapter, labelled as such: success, rejection, partial, failed and unconfirmed paths; record observed behavior. Run `pnpm test`, `pnpm typecheck`, `pnpm lint` and the production build; record counts.
- [ ] 4.3 **External evidence (lead, via `prove-testnet-guardian-loop`):** one real wallet-signed repay on the D19 network with transaction hash, explorer link and the observed health change. Until recorded, P4.3 and P4.5 stay unchecked; local tests are reported as local.

## Commit contract

Every commit contains one behavior, its tests and relevant docs, and 50–350 added/deleted lines. Pure modules (verifier, plan assembly) precede the signer, the port and the surfaces. No keys, secrets, captured wallet data or temporary files are committed. Money-path commits state the permission boundary, the invariant and the negative test in the body. Commit identity and no-push/no-merge rules follow the repository instructions.
