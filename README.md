# Mr.Fund

The DeFi manager you can talk to: he explains your position in plain words, shows you the
smartest move, and acts only within limits you set.

> Status: the local engine, read adapter, unsigned transaction builders, agent tools and
> guarded chat API are implemented. Guardian/factory contract progress and evidence are
> tracked in BUILD-PLAN. Wallet/chat UI integration, watcher operation and public deployment remain incomplete.
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

## Browser login modules

NEAR Auth (email) and NEAR Connect adapters plus an account-session controller live in `apps/web/src/wallet/`, mounted in the `/play` wallet dialog. The owner reported on 2026-11-13 (testnet) that both logins worked and that chat answered in live mode; no transaction was signed and passkey use is not claimed. Interfaces, public configuration and remaining proof: [dual-login handoff](docs/technical/INTEGRATIONS.md#dual-login-module-handoff-d31).

## Chat API

The backend-only `POST /api/chat` streams progress, guarded text, unsigned cards and a terminal summary. Configure the server's `NEARAI_*` and network/Rhea environment variables before starting the web app; root `.env` values must be explicitly injected into the `apps/web` process. Missing pricing disables action proposals rather than inventing zero fees.

Request/event formats, local setup, limits, GLM settings and evaluation commands: [CHAT-API](docs/technical/CHAT-API.md). Account ids select public reads; they are not authenticated identities. NEAR Auth/NEAR Connect and wallet signing are not implemented by this endpoint.

Model acceptance is still open (D25/P3.4): the latest complete live-inference benchmark returned 34 model answers and two guard fallbacks on **Simulated** data. Completed independent assistant review (not human/provider review) found 36/36 correct language but only 22 content/honesty approvals and 14 rejections, including provenance uncertainty. Local implementation checks do not establish deployment readiness. See the [observed evidence](docs/technical/CHAT-API.md#observed-evidence-2026-11-08).

## What to look at (judges and teammates)

| Do this | See |
| --- | --- |
| Read the scope, honesty rules and demo | [PRD](docs/PRD.md) |
| See what is done and its evidence, task by task | [BUILD-PLAN](docs/BUILD-PLAN.md) |
| Try the consultation UI (labelled **Simulated** unless a live account is connected) | `pnpm --filter @mrfund/web dev`, open `/play` |
| Read a live position (read-only, no signing) | `GET /api/position`; run notes in [INTEGRATIONS](docs/technical/INTEGRATIONS.md) |
| Check the Guardian contract rules and invariants | [SMART-CONTRACT](docs/technical/SMART-CONTRACT.md) |
| Re-run the contract evidence in a local sandbox | `pnpm contracts:probe:prepare && pnpm contracts:test` |
| Re-run the TypeScript evidence | `pnpm test && pnpm typecheck && pnpm lint` |

## Evidence status (2026-11-13)

Labels follow [CLAUDE.md](CLAUDE.md): planned, tested locally, exercised on a network.

- **Tested locally or in a sandbox:** finance engine, Rhea read adapter, transaction builders and outcome parser, number-provenance checker, Guardian and factory contracts run against the deployed Rhea bytecode (testnet 0.11.0, mainnet 0.16.2) with **Simulated** prices.
- **Exercised on public testnet (read-only):** position reads and refresh, with fixed `default_price` inputs, not market prices. Browser login worked for the owner.
- **Not done:** no Guardian or factory is deployed, no wallet-signed repay, no automatic repay by the watcher on a public network, and the chat model is not accepted (D25/P3.4). Testnet USDC has no fresh oracle price, so the demo debt token is the fixed-price REF test token.
- Mr.Fund makes no cross-chain claim and does not claim to be the first liquidation-protection tool.

## Prior art

Automatic debt protection exists: [DeFi Saver liquidation protection](https://help.defisaver.com/automations/liquidation-protection), BRACE and Hobba. What Mr.Fund adds is a conversational explanation layer with deterministic numbers and a contract-enforced policy, not the idea of protection itself. Comparison: [PRD](docs/PRD.md).

## Honest limits

Unaudited hackathon code. Mr.Fund reduces liquidation risk within limits you set; it does not
prevent liquidation. See [PRD](docs/PRD.md) "Risks and guarantees".
