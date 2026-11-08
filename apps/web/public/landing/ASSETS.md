# Landing artwork

Created for Mr.Fund on 2026-11-08. Generated illustrations are decorative and do not represent real wallet data, performance, integrations or transaction receipts.

## Original generated PNGs

Generated with the image-generation tool, using a consistent friendly dark-haired, clean-shaven Mr.Fund mascot in a charcoal suit, white shirt and burgundy tie. The original prompts requested transparent backgrounds and solid sage, ivory and copper sculptural materials.

| File | Illustration |
| --- | --- |
| mr-fund-avatar.png | Mascot head/bust, used for illustrative identity and WebGL fallback |
| position-orbit.png | Mascot with an orbital portfolio composition |
| decision-route.png | A sculptural decision route |
| position-tokens.png | Token/position sculptures |
| plain-words.png | Conversational mascot and speech composition |
| guardian.png | Protective shield composition |
| languages.png | Multilingual conversation composition |

Feature originals are 1536 × 1024 transparent PNGs. Next/Image provides responsive image sizes and lazy delivery for offscreen illustrations. No third-party mascot/logo artwork was copied into these generated assets.

## Code-native textures

`grain-dark.svg`, `grain-light.svg` and `grid.svg` are original procedural dot/grain and line textures authored for this page. They contain no gradients.

## Actual live character and existing marks

The live 3D character is Microsoft Rocketbox Business Male 01, served from `/play/rocketbox/business-male-01.glb`; it is distinct from the generated illustrative mascot. Its MIT provenance, conversion details and third-party licence are recorded in [the existing play asset inventory](../play/ASSETS.md). Existing NEAR marks retain the provenance in that inventory.

## Design references

[Lusion](https://www.awwwards.com/sites/lusion), [Unseen Studio](https://www.awwwards.com/sites/unseen-studio), and user-supplied HeyElsa screenshots informed motion, card composition and the phone demonstration. [Paper Tiger](https://www.awwwards.com/sites/paper-tiger) and [Pangram Pangram by Locomotive](https://locomotive.ca/en/work/pangram-pangram-foundry) informed the later type/image hierarchy and editorial composition. No website source code, imagery or copy was extracted from them.

## Editorial type

`instrument-serif-italic.ttf` (71,592 bytes) is Instrument Serif Italic from [Google Fonts’ official repository](https://github.com/google/fonts/tree/main/ofl/instrumentserif), downloaded 2026-11-08. It is served locally with `next/font/local`. The original SIL Open Font License and copyright notice are retained in `instrument-serif-OFL.txt`. The font is unmodified.

## User-finalized video hero

The user-provided `../video/gemini_generated_video_92f34b13.mp4` and `../video/hero-poster.webp` are the final hero's local background media. Their original generation process was not independently verified. The live phone character remains the existing Rocketbox model; chat/navbar avatars use `mr-fund-avatar.png` above.

## Code-native feature diagrams

The “Less dashboard” feature grid now renders original HTML/SVG compositions from `src/landing/FeatureArtwork.tsx`, with independent GSAP colour reveals. It reuses only the generated `mr-fund-avatar.png` and the existing official NEAR/USDC token marks. The six full-scene PNGs above are not loaded by this feature grid; existing uses elsewhere remain. Chart traces and orbit sectors are decorative, not portfolio allocations or observed historical returns. Financial labels use the simulated deterministic engine fixture.
