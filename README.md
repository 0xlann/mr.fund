# Mr.Fund

The DeFi manager you can talk to: he explains your position in plain words, shows you the
smartest move, and acts only within limits you set.

> Status: local engine, read adapter, manual repay builders, agent tools and Guardian
> policy/reserve lifecycle are implemented and tested. Nothing is publicly deployed;
> chat/wallet UI, automatic Guardian settlement, factory and watcher remain incomplete.
> Scope and progress live in
> [docs/PRD.md](docs/PRD.md) and [docs/BUILD-PLAN.md](docs/BUILD-PLAN.md).

## Layout

```text
apps/web        Next.js app: UI and chat API (Route Handlers)
apps/watcher    Node process that requests Guardian actions (no LLM)
packages/       shared, engine, rhea, guardian-client, agent (TypeScript)
contracts/      Rust workspace: probe, guardian, guardian-factory
docs/           product, plan, decisions and technical specs
```

Import rules are in [ARCHITECTURE](docs/technical/ARCHITECTURE.md) "Codebase structure".

## Prerequisites

Node >= 22.22.2, pnpm 12, Rust >= 1.95 (stable). Contract sandbox tests need Linux, macOS or WSL2.

## Commands

```bash
pnpm install
pnpm test               # vitest, all TypeScript packages
npx vitest run packages/shared   # one package
pnpm typecheck
pnpm lint
pnpm contracts:probe:prepare  # fresh clone: download public WASM and build local fixtures
pnpm contracts:test     # cargo test in contracts/ (needs preparation above)
pnpm --filter @mrfund/web dev
```

Copy `.env.example` to `.env` and fill it locally. Never commit `.env`.

## Honest limits

Unaudited hackathon code. Mr.Fund reduces liquidation risk within limits you set; it does not
prevent liquidation. See [PRD](docs/PRD.md) "Risks and guarantees".
