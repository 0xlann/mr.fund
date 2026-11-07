# Non-frontend exploration — 2026-11-07

This is a repository assessment and proposed sequence, not new implementation or deployment evidence. Sources: `CLAUDE.md`, every Markdown file under `docs/`, `README.md`, `contracts/tests/README.md`, and the owning source modules. Product requirements and recorded decisions remain authoritative; these proposals do not resolve founder-owned decisions.

## Findings

| Area | Observed implementation | Remaining work |
| --- | --- | --- |
| Finance/read adapter | Bigint engine, block-pinned reads, protocol APR, recorded responses | Deployed rounding comparison and Rhea display parity remain open; P1.2/P1.4 must not be ticked from fixture tests alone |
| Manual repay | Version-aware builders and TypeScript encoding fixtures | Rust byte parity, complete receipt interpretation, fresh observed post-state; wallet/UI integration excluded |
| Guardian | Policy, owner controls, reserve activation/withdrawal and local negative tests | Automatic request/settlement, composed trigger gas, owner position methods, factory |
| Agent | Validated tools, deterministic cards, number and persona guards | Guardian reads, actual provider loop, multilingual evaluation, server API |
| Watcher | Scaffold only | Deterministic polling, constrained signing, request reconciliation and heartbeat |

Evidence detail remains in BUILD-PLAN and INTEGRATIONS. Imported deployed WASM runs in new sandbox state with Simulated prices; it does not prove public testnet usability. `ft_transfer_call` acceptance is distinct from debt reduction: legacy overpayment can become supplied balance. A successful immediate promise does not prove all detached receipts succeeded.

## Proposed changes and order

Status update (2026-11-07): `verify-rhea-protocol-evidence` completed its eight scoped tasks and was synced to `openspec/specs/protocol-evidence/spec.md`, then [archived](changes/archive/2026-11-07-verify-rhea-protocol-evidence/tasks.md). Public UI parity and legacy scalar health remain explicitly unverified; the six follow-up changes below are still proposals.

| Change | Can start locally? | Dependencies / completion gate |
| --- | --- | --- |
| `verify-rhea-protocol-evidence` | Yes | Public display comparison is separate evidence; do not fabricate it if unavailable |
| `add-repay-outcome-parser` | Yes | Sandbox outcome recordings; no wallet or signer required |
| `complete-guardian-request-settlement` | Yes, sandbox core and experiment | Composed gas proof before automatic integration; D27 remains open until evidence reviewed |
| `add-guardian-client-and-tools` | Yes, typed existing views | Action history depends on settlement; Guardian cards remain conditional on D18 G1/G3 |
| `add-tool-driven-chat-api` | Yes, fake-provider harness and API | Full seven-tool evaluation follows Guardian tools; live inference/model selection needs B6 |
| `add-guardian-position-and-factory` | No, implementation gated | Founder D18 G1/G3 first; local provisioning experiment must settle code/storage strategy |
| `add-deterministic-guardian-watcher` | Pure loop tests can start after client ABI | Settlement and D27 proof before automatic submission; hosting requires D29/B8 |

Recommended next implementation: `add-repay-outcome-parser`, following the completed protocol evidence work. Contract core remains the parallel critical path; this document does not itself start implementation.

## Decisions preserved

- D16 Option A and D30 APR are decided. Stale headings claiming an open stack are documentation drift.
- D18 custody and D19 network remain founder-owned. Guardian cannot repay a wallet-held Rhea loan.
- D27 needs composed check → repay → settlement gas evidence, not subtraction of read-only burn from 300 Tgas. No silent watcher-only fallback; fallback requires zero action fee and updated disclosures.
- D24 fee amounts remain configuration, not invented pricing. D25 requires measured evaluation; historical catalog entries are not a current model guarantee.
- B7 accounts/funding and usable testnet prices are still external prerequisites. No account creation, credentials, chain writes or paid hosting are authorized by these proposals.
- No database, frontend/UI work, mainnet writes, submission or stretch features are included.

## Work intentionally left outside apply-ready implementation

P0.2/P0.3 live completion, P2.8 deployment, P4.5 wallet proof and P5.5 network E2E need B7 and D19; P6 delivery needs final implementation evidence and human submission. Preserve these unchecked tasks in BUILD-PLAN. Security review and fresh-clone rehearsal remain release gates, not claims made by artifact validation. Historical Phase 0/1 plan checklists do not supersede newer BUILD-PLAN evidence.

Each change must update owning technical docs and BUILD-PLAN evidence when implemented. Reconcile stale present-tense summaries without rewriting dated observations. Artifact completeness means a reviewable plan; it does not remove the gates above.
