# Mr.Fund: lessons

Read the headlines before starting work. Record actual surprises only, never invented seed lessons. Newest entry first. Each entry uses `### YYYY-MM-DD: headline`, followed by bullets: what happened, root cause with evidence, and the rule going forward. Update this file in the same commit as the related behavior change.

### 2026-11-05: a formatter run over the whole repo rewrote the docs

- What happened: `biome check --write .` reformatted `CLAUDE.md` and every file in `docs/` (Markdown tables re-padded, 407 lines changed) while the intent was to format new TypeScript. The changes were reverted with `git checkout` because the files were clean before.
- Root cause: Biome 2.x includes Markdown in its default file set, and the first `biome.json` excluded paths instead of listing what to format.
- Rule: scope formatters and linters by allow-list (`apps/**`, `packages/**`, root config files), run `git status` after any `--write`, and never run a formatter over `docs/` or `CLAUDE.md`.

### 2026-11-04: Rhea repays only the caller's own debt, and deployed code differs from the published source

- What happened: the product brief assumed a Guardian contract could repay a user's existing Rhea loan. Source inspection showed `Repay` and `OnlyRepay` act only on the caller or token sender; no beneficiary field exists. Live `get_version` returned `0.11.0` on testnet and `0.16.2` on mainnet, while the only published source is `0.15.7`.
- Root cause: the protocol's permission model is "you act on your own account"; the brief's mechanism came from other chains' products (BRACE on Kamino), not from Rhea's interface. Version drift exists because Rhea publishes one `main` branch and deploys separately.
- Rule: before designing any flow that acts for a user on an external protocol, find the exact method, read who it acts on, and prove it on the deployed contract (BUILD-PLAN P0.3). Cite the source commit and the live `get_version` together; never treat source behavior as deployed behavior.
