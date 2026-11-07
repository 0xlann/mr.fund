# Mr.Fund: frontend design

## Scope and status

The user requested a local UI demo at `/play` on `feat/full-frontend`, with a real 3D suited character, bold solid colors, a distinctive layout, and a mock wallet. The landing route `/` remains unchanged. Nothing is deployed, committed, or pushed by this task.

This document describes the demo implementation, not proof of a live integration. Browser inspection is assigned to the user at their request. Production custody (D18), network (D19), pricing (D24), and model choice (D25) remain open. Three.js is the rendering choice for this demo; D26's production decision is not silently finalized.

## Art direction

A miniature financial office inside an editorial dashboard. Mr.Fund wears a navy suit and lime tie and stands beside a desk with a laptop, mug, plant, coins, and a floating ring. The office is the orange focal point; the chat and position data remain separate readable surfaces.

Palette (solid fills only):

| Role | Color |
| --- | --- |
| Ink / header / position panel | `#1c2331` |
| Vermilion / character stage | `#ff643b` |
| Cobalt / actions and identity | `#284bdf` |
| Lime / Guardian and positive emphasis | `#dbf884` |
| Cream / workspace | `#f6f4ec` |
| Paper / chat and dialogs | `#fffef9` |

No CSS gradients. Three-dimensional surfaces have actual scene lighting, material shading, and shadows. Body type is Instrument Sans; display type is Bricolage Grotesque, selected after the user requested a more distinctive typographic identity. Display headings use expressive forms and heavier weights; financial values use tabular numerals. Both fonts are self-hosted through `next/font/local`.

Styling uses Tailwind CSS v4 utilities in JSX, with reusable utility recipes for conditional states. The stylesheet entry contains Tailwind imports only. Tailwind preflight is omitted so this route's new styling does not reset the landing page. Scoped utilities provide the demo's reset, focus indicators, responsive rules, and reduced-motion behavior.

## Layout and screens

Desktop: an ink header with office, Guardian, and Activity tabs; an editorial workspace heading; an asymmetric orange 3D stage beside the chat; a dark position card and lime Guardian card underneath. A small insight strip links back to the recommendation flow.

On narrow screens the header navigation becomes a second row and the stage, chat, position, and Guardian stack. Breakpoints: 1500, 1100, 820, and 620 px. The layout is authored for 360 px and larger; final visual inspection is the user's task.

- **Connect:** a modal explains the mock wallet, shows available simulated USDC, supports connection, account copy, and disconnection. Real wallet providers are visibly unavailable.
- **Main:** real GLB stage, data-derived character mood, scripted chat, suggested questions, an inline recommendation, and the position panel.
- **Recommendation:** the existing engine computes repay-versus-yield, before/after debt, health, liquidation price, and annual interest cost. Adjust recomputes and applies wallet/debt bounds. Fees, assumptions, and risks are expandable.
- **Approval:** a mock-wallet dialog supports success, cancellation, transaction failure, and a partially completed batch. Partial simulation applies no balance changes and explicitly records that limitation.
- **Receipt:** local reference, simulated status, explanatory outcome, fee information, and computed post-state. No fake hash or explorer link is created.
- **Guardian setup:** separate Guardian-held loan explanation; fixed repay action/debt token; per-action cap, lifetime cap, reserve floor/deposit, trigger, optional target, and cooldown; shared policy validation; plain-language review; fee disclosure; mock approval.
- **Guardian panel:** status, reserve/spendable, cap/budget, allowed action, target, cooldown, fees/recipient, watcher heartbeat, history, pause/resume, deactivate, withdraw, and reserve top-up. Trigger replay and over-limit rejection are visibly local simulations. Replay is limited to one per demo activation/session and explains the cooldown simplification.
- **Activity:** successful, failed, partial, and rejected demo attempts with receipt details.
- **Demo settings:** fresh/loading/stale/empty/error position states, comfort line, watcher online/offline, and reset. Session state is in memory and resets on reload.

## Character and interaction

The asset is Quaternius's animated **Business Man**, distributed as Public Domain CC0 by Poly Pizza: https://poly.pizza/m/JFrLIKqvCH . It is served locally as `/play/business-man.glb`; suit, tie, shirt, and skin materials are customized at runtime. Only neutral idle and wave animations are exposed. The office props are procedural Three.js meshes authored for this demo.

A drag rotates the office within bounded angles. The wave button triggers the supplied wave clip. Loading or tool work shows Thinking. The engine determines Calm, Concerned, and Pleased using simulated position and receipt data. Failed transactions and stale/missing inputs affect mood. Model playback and decorative motion respect reduced-motion; offscreen rendering pauses. WebGL failure shows a labelled poster fallback.

## Honesty and boundaries

All balances, rates, prices, transactions, Guardian state, and heartbeat are simulated and labelled. Chat is scripted in English with selected Indonesian responses; no LLM is connected. Financial comparisons and what-if values are computed with the existing deterministic engine and bigint amounts. The illustrative borrow/supply rates are APR, with linear estimates and no compounding claim.

A wallet-held loan and the separate Guardian-held fixture are distinct. Activation never claims to move the wallet loan. Demo fees are illustrative, not a production pricing decision. Owner approvals never request a private key or send a transaction. Local replay outcomes do not prove smart-contract enforcement.

The product reduces liquidation risk within limits; it cannot prevent liquidation. Stale advice refuses execution, and missing data never becomes a guessed health number. Live integration, real wallet signing, explorer evidence, a deployed Guardian, and final production validation remain outside this UI demo.

## References and assets

- Character and CC0 source: https://poly.pizza/m/JFrLIKqvCH
- Visual reference for integrating a 3D focal point into DeFi: https://www.awwwards.com/sites/everswap (reference only; no site code or artwork copied).
- Local asset provenance and font license texts: `apps/web/public/play/ASSETS.md` and `apps/web/public/play/licenses/`.

## Verification

Evidence for this task is recorded as demo-only progress under BUILD-PLAN P4.4. Existing live-flow acceptance checkboxes remain open. Browser visual verification is intentionally left to the user.
