# Mr.Fund: frontend design

## Scope and status

The user requested a local UI demo at `/play` on `feat/full-frontend`, with a real 3D suited character, bold solid colors, a distinctive layout, and a mock wallet. The landing route `/` remains unchanged. Changes stay local; nothing is deployed or pushed.

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

The office is now the entire interface, inspired by the user's Talking Tom reference: Mr.Fund stands prominently at the centre of a furnished 3D room. There is no default dashboard or persistent chat panel. The mr.fund wordmark is raised 3D lettering on the rear wall above the vault, centred at y=4.5 after the user requested a higher placement. Bricolage Grotesque letter shapes have cream fronts, muted lime sides, bevels and cast shadows, without a box or fixed logo badge. A compact wallet HUD sits at the top right, small settings/audio/help controls sit at the side, and a tactile five-action dock anchors the bottom: Chat, Position, Voice, Guardian, Activity. The character's name/mood chip sits above the dock. Promotional speech bubbles and room labels were removed at the user's request.

Each dock action opens one dismissible overlay over the same room. On desktop it is a right-hand sheet; on mobile it occupies the central area above the dock. Switching tools keeps the scene and demo state intact. Escape and the close button dismiss the sheet and return focus to the opening control. Confirmation, setup, wallet, and receipt dialogs appear above tool overlays. The room has a fixed viewport and does not turn into a scrolling dashboard on phones.

Chat and position are opt-in overlays. Guardian controls, setup/review, activity history and all existing mock approval outcomes remain available. Voice has explicit microphone activation through the browser's SpeechRecognition API when available; permission, no-speech, unsupported-browser and start failures have visible recovery states. The transcript is editable and must be explicitly sent. A labelled sample transcript supports the demo without microphone access. Spoken scripted replies can be enabled with the sound control using browser speech synthesis; no live LLM or transaction authorization is implied.

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

[V, 2026-11-07] At the user's request, the active character temporarily returns to **Businessman (Rigged) by Jungle Jim**, `/play/jungle-jim/businessman.glb`. It preserves the original suit and skin textures and uses the standing-pose, breathing, damped head tracking and staggered procedural wave controller. Feet remain planted; reduced motion restores the still standing pose. Its own preview is the labelled fallback. Attribution is visible in How it works and `public/play/ASSETS.md` (CC BY 4.0).

[I] The user prefers a professional character with a fun, clearly readable face; a suit and facial hair are optional. Jake's approximately 30 MB FBX loaded too slowly. Its unused controller, tests and preview are archived in ignored local scratch; the FBX is no longer present and the scene no longer requests Jake. A lighter replacement is deferred.

[V, local source inspection 2026-11-07] The desk, chair and vault now load the user's GLB files; other room geometry remains procedural. Furniture normalization handles different source units and pivots. The vault's body, rather than its open door, anchors the Guardian lettering and lamp. Provenance and the chair's noncommercial license are recorded in `public/play/ASSETS.md`.

Guardian entry now uses scene completion rather than a UI delay: either the dock button or vault click starts the character's walk to the safe, a reach/handle gesture and outward door opening, then reveals the Guardian overlay. Repeated requests do not restart the walk. Switching tools, closing the panel or Escape cancels the visit and returns him home. Reduced motion skips the choreography; WebGL fallback still permits the panel. The door starts closed at its actual source hinge angle (-90°), opens only during the visit, and closes on return. The floating coin was removed at the user's request; no floating ornament remains.

Chat now shares the same actor timeline as Guardian. Clicking Chat or the workstation walks Mr.Fund through the aisle to the left of the desk, turns him forward, and lowers him into the executive chair using hip/knee and arm poses. A frontal camera moves in during seating, with room for the chat overlay, and the panel opens only on seating completion. The laptop screen faces the seated character. Closing Chat or changing destinations stands him up before walking away; repeated requests and stale completions cannot reopen an old panel. Reduced motion uses the seated pose immediately without walking or camera animation. All movement remains a procedural rig animation, not motion capture. Walking arms swing fore/aft using axes calibrated from the actual resting arm bones to the actor's left/right axis, opposite the matching leg; this remains aligned when the actor turns.

The character retains click-to-wave and hover outline interactions. The vault, desk, chart and activity board open their matching overlays. Scene ornaments indicate simulated engine state; numeric figures stay in the HTML panels. Reduced motion disables parallax and camera glides. Offscreen rendering pauses.

## Tablet and phone viewports

[V, implementation and automated checks 2026-11-07] Phone portrait is detected before the playground mounts, using a coarse-pointer, width-under-768 and portrait media query. The rotation notice opens the office automatically after landscape is detected. Later portrait rotations hide and make the existing app inert, preserving the demo session; the hidden canvas stops through its visibility observer. Tablets at 768px and wider can use either orientation.

Tool panels reserve `min(460px, 44vw)` on the right. Camera framing accounts for that occupied width, including tablet portrait and phone landscape. Short viewports (height at most 600px) use a compact dock, a horizontal right-side control row, a shorter header, a nearly full-height side panel and a simplified chat header. Chat input remains 16px to avoid small touch text and iOS input zoom. UI styling remains Tailwind utilities. Automated tests cover the orientation gate/session preservation and camera fit at 768×1024, 820×1180, 1024×768, 1180×820, 844×390 and 568×320; browser visual QA remains with the user.

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
