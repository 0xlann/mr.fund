# Mr.Fund: frontend design

## Scope and status

The user requested a local UI demo at `/play` on `feat/full-frontend`, with a real 3D suited character, bold solid colors, a distinctive layout, and a mock wallet. The landing route `/` remains unchanged. Changes stay local; nothing is deployed or pushed.

This document describes the demo implementation, not proof of a live integration. Browser inspection is assigned to the user at their request. Production custody (D18), network (D19), pricing (D24), and model choice (D25) remain open. Three.js is the rendering choice for this demo; D26's production decision is not silently finalized.

## Art direction

A seated consultation in a petrol-blue office. The desk, laptop and executive chair sit on the left; Mr.Fund is the focal point, with the conversation and position details alongside him. Charcoal and slate surfaces, cobalt chat, lime accents and orange voice controls use bold solid colors. The welcome card is dark petrol with oversized pale typography and a lime invitation. All tool panels, dialogs, fields, receipts, voice and settings surfaces use dark mode. The room has dark petrol walls, dark timber floor and slate trim; character materials retain natural lighting.

Palette (solid fills only):

| Role | Color |
| --- | --- |
| Foreground | `#edf3f5` |
| Page / position surface | `#0d141c` |
| Vermilion / character stage | `#ff643b` |
| Cobalt / actions and identity | `#284bdf` |
| Lime / Guardian and positive emphasis | `#dbf884` |
| Raised surfaces | `#1d2833` |
| Chat and dialogs | `#141d27` |

No CSS gradients. Three-dimensional surfaces have actual scene lighting, material shading, and shadows. Body type is Instrument Sans; display type is Bricolage Grotesque, selected after the user requested a more distinctive typographic identity. Display headings use expressive forms and heavier weights; financial values use tabular numerals. Both fonts are self-hosted through `next/font/local`.

Styling uses Tailwind CSS v4 utilities in JSX, with reusable utility recipes for conditional states. The stylesheet entry contains Tailwind imports only. Tailwind preflight is omitted so this route's new styling does not reset the landing page. Scoped utilities provide the demo's reset, focus indicators, responsive rules, and reduced-motion behavior.

## Layout and screens

The flow is welcome, then Start consultation, then connect the mock wallet, then the consultation. The **welcome screen** shows the 3D office blurred behind a single card: product sentence, a demo label and one Start consultation button. Starting opens the wallet dialog (network badge *Testnet · Simulated*, a connecting state), after which the camera eases to the seated Mr.Fund. The consultation is a side-by-side layout, as PRD requires: the seated character on the left, the chat in the middle-right and the position panel at the far right (≥1280px; below that the position panel is a dock tool). A stats panel at the top right shows health, debt and unavailable PnL with a simulation caption. At ≥1280px the dock is removed: chat stays visible, Voice is a microphone button in its composer opening a review dialog, and Position / Guardian / Activity are keyboard-accessible tabs in the right column. Both columns extend down to 16px from the viewport bottom. Below 1280px the five-action dock (Chat, Position, Voice, Guardian, Activity) remains. Settings, audio and help sit at the top left. The mr.fund wordmark remains raised 3D lettering on the rear wall. The character does not interact with props: no click-to-wave, hover outlines or room shortcuts.

On desktop, switching detail tabs keeps the chat, input draft and scene intact. Tabs support arrow keys, Home and End. On smaller screens each dock action opens one dismissible overlay over the same room. Escape and the close button dismiss that sheet and return focus to the opening control. Confirmation, setup, wallet, and receipt dialogs appear above tool overlays. The room has a fixed viewport and does not turn into a scrolling dashboard on phones.

Chat opens automatically after wallet connection; the position column is persistent on wide screens. Guardian controls, setup/review, activity history and all existing mock approval outcomes remain available. Voice has explicit microphone activation through the browser's SpeechRecognition API when available; permission, no-speech, unsupported-browser and start failures have visible recovery states. The transcript is editable and must be explicitly sent. A labelled sample transcript supports the demo without microphone access. Spoken scripted replies can be enabled with the sound control using browser speech synthesis; no live LLM or transaction authorization is implied.

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

[I, implementation 2026-11-07] The active character remains **Businessman (Rigged) by Jungle Jim**, `/play/jungle-jim/businessman.glb`, CC BY 4.0. Original skin and suit materials remain. Mr.Fund is seated from the outset, with hip/knee bends, resting arms, breathing, a subtle head response and greeting wave. Connecting changes the camera from a wide room view to a frontal consultation view. There is no walk, prop picking, outline, vault or door animation. Guardian remains accessible through the desktop detail tabs or smaller-screen dock. Original user-supplied vault files remain on disk but are not requested by the scene.

The face has no source blendshapes or facial skeleton. `characterFace.ts` builds three small additive morph targets on the actual head geometry for mouth motion, concerned brows and a smile. Five expression frames (listening, thinking, speaking, concerned, pleased) blend at runtime. Mouth motion uses a syllable-like visual cycle during a scripted response; browser speech events control the speaking state when audio is enabled. This is a procedural preview, not phoneme-aligned lip-sync or a finished artist-authored expression sheet. Financial mood stays engine-derived. Reduced motion stops speech cycling and camera glides.

The user's downloaded desk and chair GLBs remain, translated together to the left. A laptop faces the seated character; the Position chart stays on the rear wall. The garden texture remains behind the left window. All wall materials share the same petrol color. The raised wall wordmark and shelves remain. Asset attribution and the chair's noncommercial license are recorded in `public/play/ASSETS.md` and How it works. A lighter character asset remains deferred.

## Tablet and phone viewports

[I, implementation 2026-11-07] The phone-portrait orientation gate was removed. Portrait is a supported layout: the room reframes so the seated character sits above a bottom sheet, and the sheet holds one tool at a time.

On screens narrower than 1024px the tool sheet is a bottom sheet (top at 38dvh, above the dock) and the camera reserves 56% of the height while it is open, 20% when closed. From 1024px the sheet is a right column of `min(560px, 48vw)` (at ≥1280px, `clamp(440px, 32vw, 620px)`); from 1280px a `clamp(380px, 28vw, 500px)` position column sits to its right and the camera reserves both. Short viewports (height at most 600px) use a compact dock and a shorter chat header. Chat input remains 16px to avoid iOS input zoom. UI styling remains Tailwind utilities. Automated tests cover the welcome gate, the wallet connecting state, direct seated consultation, and camera fit at 1024×768, 1180×820, 1280×800, 1920×1080 and portrait 360×640, 390×844 and 768×1024; browser visual QA remains with the user.

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
