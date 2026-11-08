# Mr.Fund: lessons

Read the headlines before starting work. Record actual surprises only, never invented seed lessons. Newest entry first. Each entry uses `### 2026-11-08: Keep WebGL resolution stable during CSS layout motion

The portrait's ResizeObserver called renderer.setSize for every animated grid/viewport size change. That repeatedly reallocates the drawing buffer during the camera orbit; a second camera lerp also added a trailing stop. Keep projection responsive but defer buffer allocation until motion settles, and use one eased camera timeline. A 60-frame resize regression verifies one allocation during motion and one final commit. No browser FPS claim is implied.

### 2026-11-07: Calibrate a seated desk against finger geometry

A table placed by appearance intersected the seated model's torso and hands. The table rear edge extended through the body, the top sat above the wrist/finger height, and source palms remained edge-on. Calibrate the back edge and height from the actual seated rig; rotate palms, account for finger thickness and keep the laptop out of their footprint. The CPU regression fails at the former 1.5175 table height and passes at the corrected pose/placement. Browser visual confirmation remains separate.

### 2026-11-07: arm swing must use the actor's axis, not bone-local X

The downloaded Businessman arm bones use local axes that differ from the actor's axes. Applying an X Euler offset after the resting arm rotation swung the hands sideways. The walking controller now converts the actor's left/right axis into each resting arm's coordinates, then applies the fore/aft swing about that calibrated axis. The arms move opposite their matching leg. A regression on the actual downloaded skeleton failed before the fix and passes for both forward-facing and 90°-turned actors.

### 2026-11-07: a safe's zero rotation is not its closed pose

The downloaded safe is authored with an open door and geometry baked relative to its hinge. Resetting local Z rotation to zero left the door open and made the entry animation close it. CPU checks on the original mesh identified -90° as the closed position: the door spans the cabinet front and its depth ends flush with the body. Calibrate hinge endpoints against actual geometry, then test the default, open and restored states rather than assuming zero means closed. The regression fails with the old zero-angle pose and passes at the calibrated angle.

### YYYY-MM-DD: headline`, followed by bullets: what happened, root cause with evidence, and the rule going forward. Update this file in the same commit as the related behavior change.

### 2026-11-07: floating decoration can block pointer access to wall tools

- What happened: the user reported missing Position and Activity hover feedback. The hit-test stopped at the first scene intersection, including decorative floating objects in front of interactive boards.
- Root cause: decorative geometry and real occluders shared the same pointer policy. A noninteractive first hit returned null before checking the board behind it.
- Rule: explicitly mark pointer-transparent decorations and share one target resolver between hover and click. Three regression tests cover decoration passthrough to both boards, genuine wall occlusion, nested prop surfaces and the character. Typecheck passed; browser inspection remains with the user.

### 2026-11-06: a strict legacy repay amount fails when full debt rounds up

- What happened: review asked for the legacy full-repay dust boundary. A sandbox debt of 10000000000000000001 internal units failed when the atomic-ceiled repayment used strict `Repay.amount`; deployed testnet bytecode panicked in pool subtraction.
- Root cause: exact `amount` exceeded the real internal debt. Atomic rounding makes that a normal full-repay boundary, not merely an invalid user amount.
- Rule: use bounded `Repay.max_amount` on verified legacy Rhea. The regression now clears debt and checks the exact excess supplied balance. Do not infer debt reduction or refund from token acceptance alone.

### 2026-11-06: trigger gas burnt is not the continuation's available gas

- What happened: P0.4's read-only check burnt about 31 Tgas; the initial assertion described the difference from 300 Tgas as repayment margin. Independent review caught that branches and callbacks reserve gas separately.
- Root cause: total burn was treated as proof of continuation allocation without scheduling repayment after the callback.
- Rule: keep D27 open until a sandbox transaction composes check, repay and settlement with the intended budgets. Report read-only measurements separately.

### 2026-11-06: the deployed testnet Rhea rejects the repay message the docs and builders use

- What happened: the P0.3 sandbox deployed the actual testnet bytecode (`0.11.0`) and the probe's `"OnlyRepay"` transfer failed with `unknown variant`. The same message works on the mainnet bytecode (`0.16.2`). The docs, the Guardian spec and the TypeScript repay builders (P4.2, 389 tests) all assumed `OnlyRepay` everywhere.
- Root cause: the message was verified from published source `0.15.7` and mainnet behavior, but the network we would demo on runs an older deployed version. Source and one network's behavior are not evidence for another network.
- Rule: exercise every money-path encoding against the bytecode deployed on the network it will run on, and key encodings by Rhea version. Unit tests that assert bytes only prove the bytes are what we wrote.

### 2026-11-06: real RPC rate fields contradicted the APY-only engine interface

- What happened: P1.4 recorded testnet and mainnet views returning `supply_apr` and `borrow_apr`, while shared types and engine inputs were named APY.
- Root cause: the interface adopted a UI label before validating the integration payload. Relabelling live values would hide the rate convention mismatch.
- Rule: preserve protocol rate conventions and disclose estimation assumptions. Surface mismatches first; the user chose APR end to end (D30). Recorded fixtures and parsing tests now pin the actual payload.

### 2026-11-05: an independent review found the engine trusted its inputs and read a bad policy as "spend the maximum"

- What happened: a fresh-context review of the engine (P1.1 to P1.5, P3.3) found no arithmetic error but four Important gaps. A Guardian policy with `targetHfBps: 0` made `evaluateTrigger` treat the failed sizing as "target unreachable" and size the largest allowed repay. A fixed-price (`default_price`) position was never aged, so balances read hours ago were advised on as fresh. Negative balances, out-of-range ratios and fractional clocks reached `BigInt` and threw out of functions that promise a `Result`.
- Root cause: one error kind (`invalid_amount`) meant both "bad input" and "no solution", and the engine checked price age but not the age of the snapshot it was computed from. Validation lived in the contract spec, not in the code that mirrors it.
- Rule: validate policy, snapshot and clock at the engine boundary and return an error, never size from a malformed input. Give "no solution" its own error kind. Every freshness rule applies to the balances too, not only to prices. Ask for the independent review before UI and contracts depend on the engine.

### 2026-11-05: a formatter run over the whole repo rewrote the docs

- What happened: `biome check --write .` reformatted `CLAUDE.md` and every file in `docs/` (Markdown tables re-padded, 407 lines changed) while the intent was to format new TypeScript. The changes were reverted with `git checkout` because the files were clean before.
- Root cause: Biome 2.x includes Markdown in its default file set, and the first `biome.json` excluded paths instead of listing what to format.
- Rule: scope formatters and linters by allow-list (`apps/**`, `packages/**`, root config files), run `git status` after any `--write`, and never run a formatter over `docs/` or `CLAUDE.md`.

### 2026-11-04: Rhea repays only the caller's own debt, and deployed code differs from the published source

- What happened: the product brief assumed a Guardian contract could repay a user's existing Rhea loan. Source inspection showed `Repay` and `OnlyRepay` act only on the caller or token sender; no beneficiary field exists. Live `get_version` returned `0.11.0` on testnet and `0.16.2` on mainnet, while the only published source is `0.15.7`.
- Root cause: the protocol's permission model is "you act on your own account"; the brief's mechanism came from other chains' products (BRACE on Kamino), not from Rhea's interface. Version drift exists because Rhea publishes one `main` branch and deploys separately.
- Rule: before designing any flow that acts for a user on an external protocol, find the exact method, read who it acts on, and prove it on the deployed contract (BUILD-PLAN P0.3). Cite the source commit and the live `get_version` together; never treat source behavior as deployed behavior.
