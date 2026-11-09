Gate summary: all local work (sections 1–3) uses fake `fetch` and recorded SSE and needs no external gate, no accounts and no keys. Section 4 live smoke needs server env in `apps/web/.env.local`, a model key and an account with a position on the configured network (D19 undecided; the change records whichever network it observes). D25 GLM acceptance and its quality verdict are separate and untouched. Depends on `refactor-consultation-data-source` (ports, tasks 2.1–2.4), `add-live-wallet-session-ui` (task 1.2) and `add-position-read-api` (route available locally with fake RPC).

## 1. Clients

- [ ] 1.1 Implement the SSE framing parser and chat client with abort support and the failure taxonomy. Tests: split UTF-8 and frame boundaries, unknown event, malformed JSON, missing `done`, 400/429/5xx/network, abort mid-stream and after `done`.
- [ ] 1.2 Implement request building with the history and message bounds and locale rule. Tests at each exact limit (20 messages, 4 000 characters each, 16 000 total) and one over.
- [ ] 1.3 Implement the live `position` port over `/api/position` with `networkId` match, data age and explicit refresh. Tests: mismatch, stale, no position, RPC unavailable, abort, no polling.
- [ ] 1.4 Add the pure atomic-unit formatter and use it for every money value shown. Tests: zero, 6- and 24-decimal values, very large bigint, no floating arithmetic (property test against a bigint reference).

## 2. Surface wiring

- [ ] 2.1 Wire the live chat port to the chat panel: progress and thinking tied to real events, partial text discarded if interrupted, message preserved on failure, no automatic retry. Demo mode unchanged.
- [ ] 2.2 Render `card` events with server values; Execute disabled with the stated reason; stale data disables actions and shows Refresh. Test that no success, pending or receipt appears.
- [ ] 2.3 Position surface for a real account: data age, network-mismatch and empty states; chat disabled on mismatch. Demo isolation test: a real account never shows fixtures; switching to demo switches all ports.
- [ ] 2.4 Accessibility and responsive pass for new states (live regions for streaming status, focus after errors, 360 px, reduced motion).

## 3. Documentation

- [ ] 3.1 Record the live ports and error mapping in `docs/DESIGN.md`; note the Execute-disabled interim state. Do not tick P4.4 yet.

## 4. Evidence (observed only)

- [ ] 4.1 Local smoke with the real route and a fake RPC/provider: ask, card, error and cancel behavior in `next dev`; record observed results.
- [ ] 4.2 **Live smoke (lead provides env and account):** with `apps/web/.env.local` set, a connected account that has a position, one real question and one position refresh; record network, account id, model id, data age shown, latency and any failure verbatim. Mark as exercised only what ran. If no public account with a position exists on the configured network, record that as the blocker [U].
- [ ] 4.3 Run `pnpm test`, `pnpm typecheck`, `pnpm lint` and the production build; record counts.
- [ ] 4.4 Update BUILD-PLAN P4.4 progress with the observed evidence only; the P4.4 box stays open until execution and receipts are wired.

## Commit contract

Every commit contains one behavior, its tests and relevant docs, and 50–350 added/deleted lines. Interfaces and pure modules (parser, formatter, request builder) precede the surfaces that use them. No secrets, captured live responses with account data, or temporary files are committed. Commit identity and no-push/no-merge rules follow the repository instructions.
