## Context

`Playground()` mixes presentation (Three.js scene, panels, dialogs, motion), interaction logic and simulated domain state. Examples: `useState` for `connected`, `debt`, `walletBalance`, `walletOutcome` ("success" | "cancel" | "failure" | "partial"), `guardian`, `reserve`, `receipts`; scripted reply text for chat; `setNotice("Connect the mock wallet…")`. The finance numbers already come from `@mrfund/engine` through `demo.ts`, so the numbers are real engine output on fixture inputs, but the inputs and effects are in-component.

The 16 tests in `apps/web/test/playground.test.ts` exercise behavior through the DOM (repay rejection/approval, Guardian validation/over-limit rejection/replay/deactivate/withdraw, stale recovery, voice, mobile keyboard, entrance sequencing). They are the safety net and are not rewritten.

## Decisions

- **Ports by capability, not one big object.** `session`, `position`, `chat`, `execution`, `guardian`. Live changes replace one port at a time; a mixed configuration (live session, simulated position) stays legal and honest because each port reports its own provenance. A single "demo vs live" boolean would hide mixed states.
- **Provenance is data, not CSS.** Every port exposes `provenance`. Components render a visible label from it ("Simulated" for demo, network name for live). A component cannot render an unlabelled value from a simulated port: the label is part of the shared surface components (`ProvenanceTag`), tested.
- **State is read through one hook.** `useConsultation(source)` returns a view model (state + intents) built with `useSyncExternalStore`-compatible subscriptions where a port is external, and plain reducers for the demo. Presentation components receive view-model slices; they never import `demo.ts`.
- **Intents, not setters.** The UI calls `connect()`, `sendMessage()`, `executeCard(id)`, `guardian.pause()`; it never calls `setDebt` or `setReserve`. The demo implements intents by updating its fixture with the same engine calls as today.
- **Chat is an async event stream.** The chat port returns an `AsyncIterable<ChatEvent>` with the same event kinds as `/api/chat` (`progress`, `text`, `card`, `error`, `done`). The demo emits scripted equivalents, so the later live adapter is a drop-in and the UI is written once against the real protocol. The existing two-second thinking and progressive reveal stay in the presentation layer.
- **No behavior change is a testable claim.** Acceptance is: `playground.test.ts` passes unmodified at every commit; a before/after render comparison (production build, same viewport) shows identical text for the welcome, wallet dialog, chat reply, position panel, Guardian panel and activity panel.
- **Where the provider goes.** Only a type and a `demoSource` factory are added here. No React context is mounted at the root; `/play` receives its source from `app/play/page.tsx` so the landing page never imports wallet or network code.

## Interface sketch (illustrative, finalized in task 2.1)

```ts
type Provenance = "simulated" | "live";
interface Port { readonly provenance: Provenance }
interface SessionPort extends Port { snapshot(); subscribe(l); connect(method?); disconnect(); }
interface PositionPort extends Port { read(signal): Promise<Result<PositionView, PositionError>>; }
interface ChatPort extends Port { send(req, signal): AsyncIterable<ChatEvent>; }
interface ExecutionPort extends Port { execute(cardId, signal): AsyncIterable<ExecutionEvent>; }
interface GuardianPort extends Port { read(signal); control(action, signal): AsyncIterable<ExecutionEvent>; }
```

`PositionView` carries exact decimal strings and engine outputs (health, liquidation price, data age), never floating-point money. Types reuse `@mrfund/shared` (`PositionSnapshot`, `Card`, `CardReceipt`).

## Risks and limits

- A refactor of this size can silently change rendering order or focus behavior. Mitigation: one extraction per commit, tests after each, and explicit render comparison at the end. Focus management and the entrance sequencing tests are the likeliest to fail and are checked after every step.
- Moving code inflates diffs past the 50–350 line commit rule. Mitigation: extraction commits are split by component; pure moves are reviewed with `git diff --color-moved`; if a single move cannot be split below 350 lines, the commit message says it is a pure move and the follow-up edit is a separate commit.
- This change does not verify browser performance or visual fidelity beyond the render comparison; the user keeps visual QA, as in every previous frontend change.
- No guarantee about live data, wallet or chain behavior: nothing live exists yet.

## Permission and honesty

Permission boundary: unchanged. Nothing here signs, sends, reads a network or stores credentials. Invariant S1: every rendered financial value originates from a port with a declared provenance, and simulated provenance is always visible beside it. Negative test: a component rendered with a simulated port but without the label fails the surface test. Does not guarantee that later live ports are correct.
