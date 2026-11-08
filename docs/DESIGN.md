# Mr.Fund: consultation demo design

## Scope and status

[I, implementation 2026-11-07] `/play` is a local UI demo on `feat/full-frontend`. The landing route `/` is unchanged. The wallet, Rhea position, approvals, receipts and Guardian actions are explicitly simulated. No live Rhea read or wallet signing is implied. Financial values still come from the existing deterministic engine and bigint fixtures. Browser visual review remains with the user.

## Experience

Welcome is a full-bleed dark office with Mr.Fund standing beside the desk. It has no header, framed character card, marketing copy or secondary controls: only Start consultation is visible. The mock wallet dialog opens from that button; cancellation stays in the office.

After connection, a 4.8-second scene timeline walks Mr.Fund around the desk, turns him toward the visitor, lowers him into the chair and only then moves the camera into a close frontal consultation view. Distance-driven strides keep gait timing tied to movement. Panels stay inert until scene completion. The same renderer then contracts from the full viewport into the character column over 1.45 seconds; it is never remounted. Chat opens from the middle first, details follow 160ms later, and both use 700ms inset clips. Reduced motion skips the walk, orbit and panel waits. A labelled 3D fallback still allows access to the consultation.

The consultation focuses on a seated character and conversation. A bounded 3D portrait occupies the left area, the chat occupies the centre and the detail panel occupies the right on screens at least 1280px wide. The character is not a full-screen background. There is no room to explore, object picking, vault opening or walking. Position, Guardian and Activity share keyboard-accessible tabs; switching them keeps the conversation and draft intact. Voice opens from the composer as a review dialog on desktop. There is no desktop dock.

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

The active model remains Jungle Jim's **Businessman (Rigged)**, CC BY 4.0. It preserves original textures and the existing procedural seated skeleton, breathing, head response and greeting wave. The renderer loads only the character GLB. The dark room, table, chair, laptop, mug, window, shelves, books, plant and practical lamp are lightweight procedural geometry. Downloaded furniture GLBs and the old room renderer remain inactive. Warm practical lighting and a cool night window retain the neutral dark theme.

The model is normalized to 3.9 world units and seated with hips at 1.05. The table top is 1.29, its rear edge is z=0.45, and the laptop is moved left, scaled to 0.78. Palms are rotated into a desk-resting pose. Geometry placement is calibrated against actual downloaded-rig bones; the regression verifies fingers stay above the desk and outside the laptop footprint during idle motion. This is CPU spatial verification, not browser visual approval.

The head has no original facial blendshapes or facial skeleton. Project-authored additive morph targets provide mouth, brow and smile cues, with listening, thinking, speaking, concerned and pleased states. Mood remains engine-derived. Mouth movement is procedural, not phoneme-aligned lip-sync. Welcome now uses the standing pose; the earlier typing pose remains a supported rig pose but is not the entry animation. Spoken scripted replies use browser speech synthesis by default when available; speech start/end/error events control the speaking state, and a visible mute button is available. Without speech support, text and timed visual speech cues remain. No live LLM is connected.

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
