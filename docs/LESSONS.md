# Mr.Fund: lessons

Read the headlines before starting work. Record actual surprises only, never invented seed lessons. Newest entry first. Each entry uses `### YYYY-MM-DD: headline`, followed by bullets: what happened, root cause with evidence, and the rule going forward. Update this file in the same commit as the related behavior change.

### 2026-11-08: a provenance guard must tokenize leading-decimal amounts

- What happened: final review found that `.99%` bypassed the numeric checker without any tool source. Eight regression cases reproduced the missing rejection, including an actual chat turn that emitted the unsupported rate.
- Root cause: the tokenizer required an initial digit and prevented matching digits immediately after a decimal separator, so leading-dot and leading-comma amounts disappeared from validation.
- Rule: parse leading decimals with the same exact-value, sign and unit rules as other numbers. Keep both lexical boundary tests and a consumer-visible no-emission regression; passing ordinary decimal examples does not establish coverage of numerical notation.

### 2026-11-08: a successful gateway response can contain null usage-detail objects

- What happened: the first real chat HTTP smoke reached NEAR AI but returned the sanitized unavailable response. The actual gateway returned `prompt_tokens_details: null`; the provider adapter only accepted absent or object-valued details. A regression reproduced the rejection, then passed after nullish optional metadata was accepted.
- Root cause: the scripted response fixture covered an object-valued cached-token breakdown, not the nullable shape observed from the gateway.
- Rule: exercise the actual provider protocol before declaring integration complete. Treat optional metadata separately from required response data, keep errors sanitized, and describe observed usage as incomplete when a request fails or is interrupted.

### 2026-11-07: a failed child creation is atomic, so the design's keyless failed child never exists

- What happened: the factory design assumed a failed initialization could leave a keyless, half-initialized child holding committed funds, and planned phase reporting around it. The sandbox experiment showed create-account, transfer, deploy and `new` in one batch revert together: no child survives, and the whole deposit returns to the factory (the batch receipt's predecessor), not to the owner.
- Root cause: the failure model was reasoned from multi-step creation instead of measured against the one-receipt batch that the protocol applies atomically.
- Rule: measure failure phases before designing recovery. The factory forwards the refund to the owner in a checked callback and keeps `claim_refund` for a failed forward. Re-measure if creation is ever split into separate receipts.

### 2026-11-07: a global-contract child was created and grew state with far too little balance

- What happened: in the pinned sandbox (2.14.0) a child using a global contract by hash was created with 0.00086 NEAR against 686 bytes of storage, then accepted a state-growing call. The same funding boundary for stored code held to the exact yocto.
- Root cause: unknown. The protocol's storage-stake check was not observed to bind for the global-contract child; the exact behavior on testnet is unverified.
- Rule: never let a contract rely on the runtime to refuse under-funding. The factory enforces its own funding bounds, and the global strategy stays unadopted until a testnet publish and use passes and the behavior is explained.

### 2026-11-07: near-sdk `#[private]` is not enforced when a unit test calls a callback directly

- What happened: a unit test expected a direct call to a factory callback by a foreign account to panic with "private"; it ran the body instead.
- Root cause: the `#[private]` check lives in the exported wrapper, which direct Rust calls skip. A `Promise` also schedules its receipt only when dropped, so a test that holds the returned value sees no receipt.
- Rule: prove privacy with a real sandbox call and look for the "private" failure text. Unit tests can only prove checks written in the method body. Drop the promise before reading receipts.

### 2026-11-07: deployed liquidation event fields differ across Rhea versions

- What happened: the sandbox health-evidence test found `old_discount: "0.0725"` on imported 0.16.2, but the same successful liquidation on 0.11.0 emitted no discount fields.
- Root cause: the published source and the newer deployment's event shape were assumed to describe both versions. The legacy raw event carries account ids, repaid/collateral sums and position only.
- Rule: validate event evidence against the observed version. Missing fields remain unknown; never manufacture scalar health from the very engine being compared. Preserve both versions' raw evidence and separately test deployed risk boundaries.

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
