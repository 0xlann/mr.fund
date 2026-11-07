# Playground asset provenance

## Archived character trial: Jake by Canino 3D

Source: https://www.turbosquid.com/3d-models/game-stylized-cartoon-man-3d-model-3d-model-2135257
Author: Canino 3D. Listed as free under the TurboSquid Standard License.
The user temporarily tried the source FBX, then requested a return to Jungle Jim on 2026-11-07 because of loading time. The FBX is no longer present. The unused controller, fixture-dependent tests and author preview are archived in local, ignored `scratch/inactive-jake/`, not shipped by the app.

## User-selected office furnishings

- `public/office table/office_desk.glb`: **Office desk**, Narr.yworld, https://sketchfab.com/3d-models/office-desk-8b5bb3e1f9804ac7ab701fe2ce1c2018, CC BY 4.0. Runtime rotation and proportional scale/placement.
- `public/office chair/office_chair.glb`: **Office chair**, Pricey1600, https://sketchfab.com/3d-models/office-chair-95160ce5a52f4e379f66527d2735d96c, CC BY-NC 4.0. Local noncommercial preview only. Runtime proportional scale/placement.
- `public/brankas/simple_safe.glb`: **Simple safe**, avhatar, https://sketchfab.com/3d-models/simple-safe-2e308cb3fe1d4676beb43e75fdd27e8e, CC BY 4.0. Runtime proportional scale/placement, Guardian surface lettering and status lamp. The source door is posed open; the runtime closes it at a -90° local Z hinge angle by default, then animates it outward for Guardian entry.

CC BY: https://creativecommons.org/licenses/by/4.0/
CC BY-NC: https://creativecommons.org/licenses/by-nc/4.0/

## Active character (temporary): Businessman (Rigged) by Jungle Jim

Source: https://sketchfab.com/3d-models/businessman-rigged-8933d61fcb1e46f3aead661227bb4fed
Author: Jungle Jim (https://sketchfab.com/jungle_jim).
License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/ .

The user downloaded the official ZIP on 2026-11-07. `jungle-jim/businessman.glb` was extracted from `source/Businessman.glb`; all textures are embedded. The original mesh, texture maps and skeleton are preserved. Runtime changes: standing arm pose, subtle idle movement, procedural skeleton wave, walking, hip/knee seated pose, scale/placement and alpha-tested hair. Chat uses the executive chair with a frontal camera; no downloaded motion-capture clip is claimed. No source animation clips were included. `jungle-jim/preview.jpg` is the author's Sketchfab thumbnail, used as the labelled WebGL fallback. Attribution is also accessible through How it works in the app.

## Previous character: Business Man

Author: Quaternius. Title: Business Man.
Source: https://poly.pizza/m/JFrLIKqvCH
Downloaded 2026-11-07 from the source page's published asset location:
https://static.poly.pizza/e599abbe-7d73-488c-9d7e-3ead281e705c.glb

The source page labels the model **Public Domain (CC0 1.0)**, published February 22, 2022.
License: https://creativecommons.org/publicdomain/zero/1.0/

`business-man.glb` is the downloaded model. The demo customizes materials at runtime and exposes the idle/wave clips. Office props are procedural geometry authored for this project. `business-man-poster.webp` is the model preview from the same source, used only as a labelled WebGL fallback.

## Fonts

Bricolage Grotesque (display, weight 200–800) and Instrument Sans (body, weight 400–700) are self-hosted variable fonts from the official Google Fonts repository. Their SIL Open Font License texts are preserved in `licenses/bricolagegrotesque-OFL.txt` and `licenses/instrumentsans-OFL.txt`.

Original font/license sources:
- https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque
- https://github.com/google/fonts/tree/main/ofl/instrumentsans

### Raised wall lettering

`src/play/assets/wordmark.typeface.json` is a glyph subset derived from the existing Bricolage Grotesque variable font at weight 800, renamed Mr Fund Wordmark, under the same SIL OFL 1.1 license above. `scripts/build-wordmark-font.py` regenerates it using fontTools in an isolated Python environment (build-time only). Three.js TextGeometry extrudes and bevels the outlines at runtime; no new font download or runtime package is required.

## Window garden scenery

`window-garden.webp` was generated with the built-in imagegen tool on 2026-11-07 for this project, then resized and encoded as WebP (768 × 1024, 253,514 bytes). The complete generation prompt is preserved in `window-garden.prompt.txt`. It depicts a sunlit garden with trees and sky, without a baked-in window or interior. The runtime centres and crops it to the window opening without stretching; the existing frame and blinds remain actual 3D geometry.
