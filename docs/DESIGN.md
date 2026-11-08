# Mr.Fund: consultation demo design

## Scope and status

[I, implementation 2026-11-07] `/play` is a local UI demo on `feat/full-frontend`. The landing route `/` is unchanged. The wallet, Rhea position, approvals, receipts and Guardian actions are explicitly simulated. No live Rhea read or wallet signing is implied. Financial values still come from the existing deterministic engine and bigint fixtures. Browser visual review remains with the user.

## Experience

Welcome is a full-bleed dark office with Mr.Fund standing beside the desk. It has no header, framed character card, marketing copy or secondary controls: only Start consultation is visible. The mock wallet dialog opens from that button; cancellation stays in the office.

After connection, a 4.8-second scene timeline walks Mr.Fund around the desk, turns him toward the visitor, lowers him into the chair and only then moves the camera into a close frontal consultation view. Distance-driven strides keep gait timing tied to movement. Panels stay inert until scene completion. The same renderer then contracts from the full viewport into the character column over 1.45 seconds; it is never remounted. Chat opens from the middle first, details follow 160ms later, and both use 700ms inset clips. Reduced motion skips the walk, orbit and panel waits. A labelled 3D fallback still allows access to the consultation.

The consultation focuses on a seated character and conversation. A bounded 3D portrait occupies the left area, the chat occupies the centre and the detail panel occupies the right on screens at least 1280px wide. The character is not a full-screen background. There is no room to explore, object picking, vault opening or walking. Position, Guardian and Activity share keyboard-accessible tabs; switching them keeps the conversation and draft intact. Voice opens from the composer as a review dialog on desktop. There is no desktop dock. Panel tops omit the decorative eyebrow/title strips; detail tabs lead directly into the content, and Clear conversation lives beside the voice control in the composer. Mobile tools retain a compact close control. Panel names remain available to screen readers.

Tablets from 768px use a character column and a tool column. Phones use a compact portrait above the tool panel, with the five-action dock below. Tools return to the conversation when closed. Portrait is allowed. Short phone viewports prioritise the conversation. When the on-screen keyboard reduces the visual viewport, the character and dock hide temporarily, then return on blur. Session state is preserved.

## Appearance and typography

The user explicitly rejected Linear as a visual reference. Product references researched are Replika for character presence, Cleo for approachable financial conversation, and HeyElsa for conversational DeFi. These are references for interaction, not claims of equivalent functionality. Later user feedback retained the consultation layout while requesting neutral colours, a desk/laptop, blurred welcome and token-list pills.

All panels, cards and buttons use solid fills. No CSS gradients, glass panels or decorative box shadows. Thin borders and distinct flat surface colours provide separation. The welcome office fills the viewport. Actual 3D materials retain physical lighting and shading.

| Role | Colour |
| --- | --- |
| Page | `#0c0c10` |
| Primary surfaces | `#121416` / `#17191b` |
| Raised controls and asset pills | `#242729` |
| Character backdrop | `#222426` |
| Primary action | `#d3e5d7` |
| Warm identity accent | `#e4d7ba` |
| Health / positive emphasis | `#d7f8a4` |

Body text uses **Manrope** (200–800); display text uses **Space Grotesk** (300–700), both locally hosted variable fonts from Google Fonts with SIL Open Font License texts. Financial values use tabular numerals. Instrument Sans and Bricolage remain inactive source assets. New font provenance is in `public/play/ASSETS.md`.

All authored styling uses Tailwind utilities and utility recipes. `tailwind.css` contains Tailwind imports/layers only. No global preflight is introduced onto the landing page.

## Character and desk

The active trial model is Microsoft Rocketbox **Business Male 01**, MIT, wearing a dark suit and red tie. The 1,292,448-byte GLB has 7,435 triangles, the original 80-joint skeleton with normalized body bone names, 15 speech visemes and seven expression/blink shapes. Colour maps are reduced to 1024px (512px alpha hair); unused shapes, animation clips, normal/specular maps and source FBX metadata are omitted. Existing procedural seated motion, breathing, head response and greeting wave drive the retained body rig. The renderer loads only the character GLB. The dark room, table, chair, laptop, mug, window, shelves, books, plant and practical lamp are lightweight procedural geometry. Downloaded furniture GLBs and the old room renderer remain inactive. Warm practical lighting and a cool night window retain the neutral dark theme.

The model is normalized to 3.9 world units and seated with hips at 1.05. The table top is 1.29, its rear edge is z=0.45, and the laptop is moved left, scaled to 0.78. Palms are rotated into a desk-resting pose. Geometry placement is calibrated against actual downloaded-rig bones; the regression verifies fingers stay above the desk and outside the laptop footprint during idle motion. This is CPU spatial verification, not browser visual approval.

The face uses Rocketbox's artist-authored visemes, brow, blink and smile shapes. No runtime lip cutting or artificial mouth interior remains. Restrained, damped viseme blending is driven by a text-based sound approximation and browser word-boundary events where available. This is not phoneme-timed audio lip-sync; visual naturalness remains subject to user review. Mood remains engine-derived. Welcome now uses the standing pose; the earlier typing pose remains a supported rig pose but is not the entry animation. Spoken scripted replies use browser speech synthesis by default when available; speech start/end/error events control the speaking state, and a visible mute button is available. Replies wait two seconds in a thinking state, then reveal text progressively inside an isolated text component. Speaking remains active until both text reveal and available browser speech finish. Clearing the conversation cancels pending replies. Without speech support, the text reveal controls visual speech duration. No live LLM is connected.

Reduced motion stops cyclical mouth/body movement and camera glides. The renderer is bounded to its portrait area, caps pixel ratio, pauses offscreen and disposes models, geometry, materials, skeletons, textures and renderer resources on unmount. Fallback is explicitly labelled when 3D cannot load.

## Position and actions

Position health leads the panel. NEAR collateral and USDC debt use compact rounded token pills inspired by the user's reference: token icon/name on the left and a value badge on the right. Only existing fixture assets appear. Price history and returns are unavailable, so no invented PnL percentage or fabricated market sparkline is shown; the centre line is a dashed placeholder. Collateral quantities, liquidation estimate, APR and provenance remain visible.

The existing engine-driven repay-versus-yield comparison, what-if scenario, adjustment, mock approval/rejection/failure/partial outcome, receipt, refresh and stale-data refusal remain available. Guardian setup uses shared policy validation and separates the Guardian-held loan from the wallet loan. Reserve limits, pause/resume, withdrawals, trigger replays and rejected attempts remain labelled simulations. Browser microphone input is explicit; transcripts are reviewed before sending and speaking never authorizes a transaction. Enter sends a chat question, Shift+Enter adds a line and IME composition is respected.

Custody, network, pricing and production renderer decisions remain governed by their existing OPEN-DECISIONS entries. No UI simulation proves contract enforcement or live availability.

## Verification

Verification evidence is recorded in BUILD-PLAN as local demo progress. Browser visual QA remains with the user. Asset attribution and licenses are recorded in `public/play/ASSETS.md` and linked from How it works.

### Entrance rendering refinement — 2026-11-08

The CSS portrait may resize throughout the entrance, but its WebGL drawing buffer stays at its original resolution during the orbit and panel reveals. Camera projection still follows the actual element aspect. A queued final buffer size is committed after layout has settled and the panel transitions have finished; ordinary window resizing also waits for a 120ms quiet period. The regression simulates 60 animated layout updates and verifies only the initial and final buffer allocations. This verifies allocation behaviour, not measured browser FPS.

Panel clips now use plain rectangular insets with the panel's own rounded corners, paint containment and an explicit compositing hint. A gentler easing replaces the former abrupt opening. Motion remains disabled for reduced-motion users. Browser visual QA remains with the user.

### Raised wall branding — 2026-11-08

`mr.fund` is actual bevelled, extruded Space Grotesk lettering on the inner left wall, facing into the room. It has cream front faces, darker edge materials and casts a shadow; there is no plaque or box behind it. The glyph subset is generated from the already licensed Space Grotesk variable font at weight 700 by `scripts/build-wordmark-font.py`. A geometry test verifies its left-wall position, orientation, width and nonzero depth.

### Chat bubble refinement — 2026-11-08

The conversation follows the user-supplied messenger reference while keeping existing panel grid dimensions and the solid charcoal/sage/beige palette. Messages sit toward the bottom when the transcript is short. Mr.Fund uses a small beige brand avatar and charcoal bubbles with a softened lower corner; user bubbles align right in the existing sage accent. Repeated visible speaker labels are removed but remain accessible. Starting questions use compact outline chips; thinking is a three-dot bubble. A compact pill composer grows for multiline text and retains clear, voice and send controls. Progressive text, mock financial cards and all transaction permission boundaries remain unchanged. No invented timestamps, audio recordings or read receipts are shown.

The chat panel has a small centred `mr.fund` name at the top, without the former title strip, eyebrow or divider.

The chat background repeats a lightweight, project-authored SVG dot texture in low-opacity beige/sage over the same solid charcoal base. Bubbles and composer remain opaque for legibility; no gradient, animation or panel size change is introduced.

Position uses the same dot texture across its panel background on desktop and mobile; health, token and other content cards retain their solid fills.

Header position stats use 14px labels, 16px semibold values and a 12px simulation/PnL note. The note wraps below the pair on narrower desktops; the optional brand tagline appears only on wider desktops to leave space for the larger stats.

Position keeps “Talk me through it” in a fixed panel footer without a separator or the repeated illustrative-input paragraph. Only position metrics/content scroll; the action stays at the panel bottom on desktop and mobile.

The repeated “You approve every move” demo-chat footer below the composer is removed at the user’s request. Existing simulation labels and explanatory help remain elsewhere.

The compact “Simulated · Fresh snapshot” label above the position health card is removed at the user’s request. Refresh is placed inside the Position health card beside the protocol label; the separate toolbar above it is removed.

The mock-wallet dialog displays official Meteor, Intear and NEAR marks beside their names in its future-wallet row. Assets are local; those brands remain informational, with only Demo wallet offering a connection.

### Wallet access layout — 2026-11-08

The wallet dialog uses a dedicated 500px maximum-width treatment with responsive single-line display typography, a compact simulated-network indicator and a sage access card as the primary Demo wallet action. The card has asymmetric icon/edition and title/arrow rows, with honest pending state and an explicit accessible connection label. Future wallet marks sit in an open three-column row at 40px, with names below; no plate, circle, border or box surrounds them. NEAR's existing black symbol is inverted to white for dark-background contrast; source SVGs are unchanged. Other dialogs keep their existing layout.

All shared toast notifications appear at the top right, with 16px/safe-area insets and a 420px maximum width clamped to the viewport. Inline field validation remains next to its field.

Toast styling uses a compact charcoal card with a subtle border, sage information icon, Mr.Fund sender label, readable 13px message text, and an independent close control. The neutral icon avoids marking failures or cancellations as successful. Entry is a short fade/slide respecting reduced motion; existing dismissal and auto-hide timing remain unchanged.

The wallet dialog repeats the same low-opacity SVG dot texture as the consultation panels. Its title scales from 24px to 38px to keep “Connect to begin.” on one line, with room for the close control.

### Guardian card refinement — 2026-11-08

Guardian now matches the Position card’s solid charcoal surface and restrained sage accents. Removed the large tilted shield, spark, green background, section index and older promotional treatment. The card shows a small shield/name, configuration-state badge, shorter title and description, two plain policy/control rows, and a full-width sage setup action. Active policy states retain existing deterministic values and controls, with neutral borders, readable labels and pill actions. No policy, permissions, fee, reserve or transaction behavior was changed.

### Detail tab content motion — 2026-11-08

Opening Position, Guardian or Activity starts a top-to-bottom content cascade: sections translate down from 12px above and fade in over 400ms, with 45ms stagger steps capped at 225ms. Keyed content mounts replay the animation when the selected tool changes or the consultation first becomes visible, without changing the outer panel, renderer or stored tool state. Position’s fixed footer remains outside its scroll body. Tailwind starting-style utilities implement all motion without a runtime animation dependency; reduced motion disables transitions. Rapid switches replace the selected content immediately without queued exit animations.
