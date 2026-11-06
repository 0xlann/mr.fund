# Mr.Fund: integrations and setup

## TL;DR

- **Exercised so far (read-only, 2026-11-04):** NEAR RPC view calls on testnet and mainnet (Rhea `get_version`, `get_config`, `get_assets_paged`, `get_account`, `storage_balance_bounds`, `get_all_token_pyth_infos`; `pyth-oracle.testnet` `get_price_no_older_than`); the public NEAR AI model catalog; npm, crates.io and Rust release metadata; the skills CLI install and restore. **Nothing else is exercised:** no account, key, transaction, deployment, inference call or payment exists.
- Every integration below is **documented, not working**, until its BUILD-PLAN task records observed evidence here.
- Founder actions: stack (D16), custody (D18), network (D19), NEAR AI key (B6), testnet accounts (B7), watcher host (B8). See [OPEN-DECISIONS](../OPEN-DECISIONS.md#blockers).
- Secrets live only in each developer's local `.env` (gitignored) or the NEAR CLI keychain. Never in docs, chat, logs or commits.

## Integration inventory

| Integration | Purpose | Owner | Manual / automatic | Access or cost gate | Status and source |
| --- | --- | --- | --- | --- | --- |
| Rhea lending, testnet `contract.1689937928.burrow.testnet` | Loan reads and writes for the demo (D19) | external; lead integrates | automatic | Testnet tokens; 0.1 NEAR registration | Views exercised 2026-11-04; reports `0.11.0`; stablecoin prices null (B2) |
| Rhea lending, mainnet `contract.main.burrow.near` | Read-only engine validation; demo only if D19 step 3 | external | automatic reads; writes need founder approval | Real funds for writes | Views exercised 2026-11-04; reports `0.16.2` |
| Price oracle: testnet `pyth-oracle.testnet`, mainnet `aggregate-oracle.near` | Prices for engine and Guardian trigger | external | automatic | None for views; update fee for pushing prices [U] | Testnet USDC/DAI null at 60 s (2026-11-04) |
| NEAR RPC (FastNear) | Reads and transaction submission | external | automatic | Free public; numeric quota unpublished | Exercised; docs.near.org/api/rpc/providers |
| Wallet via NEAR Connect | User signing | user | manual approval per transaction | None | Documented; Meteor and Intear list testnet support in the connector manifest |
| NEAR testnet accounts | Deployer, factory, watcher, demo user | founder (B7) | manual creation, automatic use | Faucet | Not created |
| NEAR AI Cloud | LLM with tool calling | founder key (B6) | manual setup, automatic use | Credits required; hackathon credit request link exists | Catalog exercised; no inference |
| Rust toolchain, `cargo-near`, `near-workspaces` | Contract build and sandbox tests | lead | automatic | None; sandbox needs Linux, macOS or WSL2 | Versions verified, not installed |
| Node and package manager | App, engine, watcher | lead | automatic | None | Latest Node 24 line is 24.22.2 (verified); `near-api-js` 7.4.0 needs Node ≥ 22.22.2; skills CLI needs ≥ 22.20.0. Package manager follows D16 |
| Watcher host | Always-on watcher (Option A) or Cron (Option C) | founder (B8) | manual account, automatic deploy with approval | Railway Hobby USD 5/month; Fly.io about USD 2.19 per 30 days; Cloudflare Workers Paid USD 5/month | Pricing pages read 2026-11-04 |
| Web hosting | Public demo URL | founder | manual | Follows D16 | Not chosen |
| GitHub `0xlann/mr.fund` | Public repository | 0xlann | manual | none | Created by the founder; `main` and `dev` pushed 2026-11-04 (D20, D22) |
| X post and submission | Required public demo and entry | 0xlann only | manual | Human-only by event rules | P6.4, P6.5 |
| NEAR Intents | Cross-chain funding (future, D13) | lead | — | Official: no testnet; community Tidepool sandbox exists | Future only; never claimed |

## P1.4 read adapter evidence (2026-11-06)

[V] `scripts/probes/record-rhea.mjs` exercised only public read-only views; it generates `fixtures/rhea/{testnet,mainnet}-reads.json` with provenance and decoded responses. Reproduce with `node scripts/probes/record-rhea.mjs testnet` and `node scripts/probes/record-rhea.mjs mainnet brianphan01.near`. The fixtures are historical recordings, never live product data. Testnet: block 276419739 / `2CwSM6GRX8jXaSBgDdiHx9DYW3eJy2MruF4zY3QRgGKX`, account `owner.1689937928.burrow.testnet`; mainnet: block 223245720 / `9upbo7URSwA6gqnr5pQVmQjYUF2arAC7EVSrGNkxdSvs`, account `brianphan01.near`. Assets pagination, config, account, Pyth mapping, token metadata, prices and configured derivative views were read at the same block per recording. Testnet oracle responses were null; fixed-price assets retained their configured prices. The generator records metadata RPC errors explicitly (including mainnet `aurora`); the runtime adapter refuses such failures with a typed error.

[V] Opt-in live adapter check passed: `RHEA_LIVE_READ=1 pnpm exec vitest run packages/rhea/test/live.test.ts --reporter=verbose --disableConsoleIntercept`; public mainnet `brianphan01.near`, block 223245899, engine health 258633 bps, data age 36595 ms. UI parity is unverified: web reader failed and computer-use browser host was unavailable. P1.4 stays unchecked pending that comparison. No account creation, key access, funds, deployment or transaction submission was involved. D30 records the user-approved switch from APY assumptions to protocol-reported APR fields.

## Environment variables (names only)

`.env.example` will list these names with empty values at P0.7. Values never enter git.

| Name | Consumer | Purpose | Class |
| --- | --- | --- | --- |
| `NEAR_NETWORK_ID` | all | `testnet` or `mainnet` | public |
| `NEAR_RPC_URL` | server, watcher, scripts | For example `https://test.rpc.fastnear.com` | public |
| `NEXT_PUBLIC_NEAR_NETWORK_ID`, `NEXT_PUBLIC_NEAR_RPC_URL` | web app | Browser copies of the above (Next.js exposes only `NEXT_PUBLIC_*`, D16) | public |
| `RHEA_LENDING_ID` | all | Lending contract for the network | public |
| `GUARDIAN_FACTORY_ID` | all | Factory account | public |
| `FEE_RECIPIENT_ID` | factory deploy, web app (display) | Fee recipient account | public |
| `WATCHER_ACCOUNT_ID` | watcher, factory policy defaults | Watcher account | public id |
| `WATCHER_KEYS_DIR` | watcher | Directory with the watcher's function-call key files (one per Guardian) | secret path |
| `NEARAI_API_KEY` | chat API only | NEAR AI Cloud bearer key | secret |
| `NEARAI_BASE_URL` | chat API | `https://cloud-api.near.ai/v1` | public |
| `NEARAI_MODEL` | chat API | Model id chosen in D25 | public |
| `MAX_DATA_AGE_MS` | engine consumers | Freshness limit for advice and cards (default proposal 120000) | public |

## Step-by-step recipes

Commands are **planned, not run** unless marked exercised. Writes need the authorization noted.

### 1. NEAR testnet accounts (B7)

Docs: https://docs.near.org/tools/cli (near-cli-rs latest release `v0.30.1`, 2026-09-02, read 2026-11-04); faucet https://near-faucet.io/ (docs: may run dry).

Human steps (founder, or the lead with explicit authorization):
1. Choose ids: `<ns>.testnet` as deployer, `guardian.<ns>.testnet` as factory, `watcher.<ns>.testnet`, `demo-user.<ns>.testnet`, `fees.<ns>.testnet`.
2. Create with the faucet-sponsored command and keep keys in the OS keychain: `near account create-account sponsor-by-faucet-service <id> autogenerate-new-keypair save-to-keychain network-config testnet create` (syntax per the CLI docs; confirm with `near account --help` first).
3. Write account ids, never keys, into `.env` and into SMART-CONTRACT "Deployment".

Verification (planned): `near account view-account-summary <id> network-config testnet now` shows a non-zero balance. Stop if the faucet is empty and tell the founder.

### 2. Rhea lending reads (exercised read-only)

Docs: https://guide.rhea.finance/developers/contracts.md ; source `https://github.com/ref-finance/burrowland` @ `2110c7047f2d72a9189abcbaad5eafb4e4a87f9e` (only published ref).

Exercised probe (lead, 2026-11-04), one JSON-RPC object per POST:

```text
POST https://test.rpc.fastnear.com
{"jsonrpc":"2.0","id":"x","method":"query","params":{"request_type":"call_function","finality":"final","account_id":"contract.1689937928.burrow.testnet","method_name":"get_version","args_base64":"e30="}}
```

Observed: `"0.11.0"` at block 276211785. The same call on `https://free.rpc.fastnear.com` for `contract.main.burrow.near` returned `"0.16.2"` at block 223033646; mainnet `get_config` showed `pyth_oracle_account_id: "aggregate-oracle.near"`, `enable_pyth_oracle: true`, `pyth_price_valid_duration_sec: 60`.

Views the adapter uses: `get_account(account_id)`, `get_account_all_positions(account_id)`, `get_assets_paged_detailed(from_index, limit)`, `get_asset(token_id)`, `get_config()`, `get_token_pyth_info(token_id)`, `get_all_token_pyth_infos()`, `storage_balance_of(account_id)`, `storage_balance_bounds()`.

Units: account-view balances are Rhea internal units; divide by `10^extra_decimals` for token atomic units. Testnet `usdc.fakes.testnet` and `usdt.fakes.testnet` have `extra_decimals: 12`; `dai.fakes.testnet` has 0 (observed 2026-11-04).

### 3. Rhea lending writes (P0.2, P0.3; testnet only until D19 says otherwise)

Agent steps (planned, need B7 accounts):
1. `storage_deposit` on the lending contract for the acting account (live minimum `100000000000000000000000` yoctoNEAR = 0.1 NEAR).
2. Register the acting account on each token contract (`storage_deposit` on the token).
3. Supply and collateralize: token `ft_transfer_call` to lending with `msg` `{"Execute":{"actions":[{"IncreaseCollateral":{"token_id":"<token>"}}]}}` and 1 yocto.
4. Borrow and withdraw: lending `execute_with_pyth` with `[{"Borrow":{"token_id":"<debt>","amount":"<internal>"}},{"Withdraw":{"token_id":"<debt>","amount":"<internal>"}}]` and 1 yocto.
5. Repay: debt token `ft_transfer_call` to lending with `msg` `"\"OnlyRepay\""` and 1 yocto.
6. Release: `execute_with_pyth` with `DecreaseCollateral` then `Withdraw`.

Verification: each step's transaction outcome has no failed receipt; `get_account` reflects the change. Record hashes here. Stop condition: a priced step fails with a missing-price error; go to recipe 4.

### 4. Testnet price freshness (P0.2, B2)

Observed (lead, 2026-11-04): `pyth-oracle.testnet` `get_price_no_older_than({"price_id":"41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722","age":60})` returned `null` at block 276211786 (this is the USDC feed id mapped by the testnet lending contract).

Agent steps (planned): find the update method and fee on `pyth-oracle.testnet` from its contract source or ABI; fetch a signed update for the mapped feed ids from Pyth's Hermes service; submit the update from a testnet account; re-run the view and expect a non-null price with a recent `publish_time`; immediately run recipe 3 step 4. Whether `pyth-oracle.testnet` accepts current Hermes data is [U]. Stop condition: rejected update → D19 ladder step 2 (fixed-price assets, Simulated labels).

### 5. Wallet connection (P4.3)

Docs: https://docs.near.org/tools/near-connect.md and https://docs.near.org/web3-apps/tutorials/wallet-login.md (read 2026-11-04). Package `@hot-labs/near-connect` 0.12.0; initialize with `new NearConnector({ network: "testnet" })`; sign with `wallet.signAndSendTransaction(s)`; read state through RPC, not the connector.

Human steps: install a wallet that supports testnet (Meteor and Intear declare testnet support in the connector manifest; HOT does not declare it; NEAR Mobile declares `testnet: false`). Passkey sign-in via NEAR Auth is documented (testnet open, mainnet needs approved client credentials) and stays optional.

Verification (planned): connect, read the account id, sign a zero-risk view-only flow, then the first real repay in P4.5 with its transaction hash recorded.

### 6. NEAR AI Cloud (B6, P0.6)

Docs: https://docs.near.ai/cloud/guides/openai-compatibility.md ; https://docs.near.ai/cloud/models.md ; https://docs.near.ai/cloud/quickstart.md ; credit request link on https://docs.near.org/getting-started/hackathons.md (read 2026-11-04).

Human steps (founder): create an account, add credits or request hackathon credits, create an API key, put it in local `.env` as `NEARAI_API_KEY`.

Exercised: `GET https://cloud-api.near.ai/v1/models` without auth listed `Qwen/Qwen3.8-27B` and `z-ai/glm-5.3-flash`, both with `tools` in `supported_features`.

Agent steps (planned): one chat completion with one declared tool per candidate model; confirm a `tool_calls` response; run the P3.4 multilingual eval. Verification: response contains a tool call with schema-valid arguments. Privacy wording must match the chosen model's tier (own TEE, third-party TEE or provider-hosted).

### 7. Contract toolchain (P0.3, Phase 2)

Docs: https://github.com/near/cargo-near ; https://github.com/near/near-workspaces-rs ; https://github.com/near/near-sdk-rs (read 2026-11-04).

Agent steps (planned): install Rust 1.99.1 with the `wasm32-unknown-unknown` target; install `cargo-near` 0.22.0 from its release (do not pipe unpinned installer scripts); run sandbox tests on Linux or WSL2 (the sandbox does not support native Windows). Verification: `cargo near --version` prints 0.22.0; `cargo test` in `contracts/tests` starts a sandbox.

### 8. Watcher host (B8, P5.3)

After D16: Option A deploys `apps/watcher` as an always-on process (Railway or Fly.io); Option C uses Worker Cron. Human: create the account and approve the cost. Agent: deploy with approval, set environment variables, confirm the heartbeat endpoint or log line updates every polling interval.

### 9. NEAR Intents (future only)

Official docs say there is no testnet (`intents.near` only). A community sandbox, Tidepool (`https://www.usetidepool.tech`, verifier `verifier.tidepool-sandbox.testnet`), was reachable on 2026-11-04 and disclaims any affiliation; it has its own custody model. Nothing is built or claimed (D13).

## Skills: provenance, installation and restore

Project skills are **committed** in `.claude/skills/` (founder decision D21). `skills-lock.json` pins each upstream revision and content hash. License texts and notices: `.claude/skills/LICENSES/`. Read a skill's `SKILL.md` before using it; task authorization in CLAUDE.md always outranks a skill's own instructions (several ask for commits, full-suite runs or installs).

| Skill | Upstream owner / repository | Revision | License | Why needed | Installed path |
| --- | --- | --- | --- | --- | --- |
| writing-plans | obra / https://github.com/obra/superpowers | `22f0b463e7a5e579904dd6211a520321035526f7` | MIT | Exact task plans with interfaces and tests | `.claude/skills/writing-plans/` |
| test-driven-development | obra / superpowers | same | MIT | Red-green for engine math and contract invariants | `.claude/skills/test-driven-development/` |
| systematic-debugging | obra / superpowers | same | MIT | Root-cause RPC, callback and receipt failures | `.claude/skills/systematic-debugging/` |
| verification-before-completion | obra / superpowers | same | MIT | Evidence before any "done" claim | `.claude/skills/verification-before-completion/` |
| requesting-code-review | obra / superpowers | same | MIT | Independent review of money paths | `.claude/skills/requesting-code-review/` |
| codebase-design | mattpocock / https://github.com/mattpocock/skills | `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` | MIT | Deep modules and small interfaces for engine, adapter and policy | `.claude/skills/codebase-design/` |
| near-smart-contracts | near / https://github.com/near/agent-skills | `cb32b6af195e636c1e9c2efe2ea75a6d85b6b67b` | MIT (skill frontmatter) | Guardian and factory in Rust near-sdk | `.claude/skills/near-smart-contracts/` |
| near-contract-audit | near / agent-skills | same | none declared (B10) | Pre-release review checklist for the Guardian | `.claude/skills/near-contract-audit/` |
| near-api-js | near / agent-skills | same | none declared (B10) | RPC reads and service signing | `.claude/skills/near-api-js/` |
| near-dapp | near / agent-skills | same | none declared (B10) | Wallet connection with NEAR Connect | `.claude/skills/near-dapp/` |
| near-ai-cloud | near / agent-skills | same | none declared (B10) | NEAR AI Cloud client and model tiers | `.claude/skills/near-ai-cloud/` |
| motion | motiondivision / https://github.com/motiondivision/ai-kit | `1e424943582cbbdb6e3f410687e39f96451447bb` | MIT declared in `packages/motion-ai/package.json`; no repository LICENSE (B10) | UI and character motion with `motion/react` | `.claude/skills/motion/` |

Review results (2026-11-04, read before install): no secret collection found. Notes that bind usage:
- `near-smart-contracts` contains `curl | sh` installers, forced `cargo near new`, and account creation and deploy commands. Never run them without the task's explicit authorization; use pinned tool versions.
- `near-api-js` contains private-key and seed examples. User signing always goes through the wallet; the only server-side key is the watcher's function-call key.
- `motion` points to a hosted MCP and paid Motion+ features; copying the skill configures neither.
- `systematic-debugging` examples inspect secret presence; redact logs and never touch user keys.

Install commands used (exercised 2026-11-04, CLI `skills@1.7.6`, Node 24.21.0, telemetry disabled with `DISABLE_TELEMETRY=1`):

```bash
npx --yes skills@1.7.6 add "https://github.com/obra/superpowers/tree/22f0b463e7a5e579904dd6211a520321035526f7/skills/<name>" -a claude-code --copy -y -s <name>
npx --yes skills@1.7.6 add "https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/codebase-design" -a claude-code --copy -y -s codebase-design
npx --yes skills@1.7.6 add "https://github.com/near/agent-skills/tree/cb32b6af195e636c1e9c2efe2ea75a6d85b6b67b/skills/<name>" -a claude-code --copy -y -s <name>
npx --yes skills@1.7.6 add "https://github.com/motiondivision/ai-kit/tree/1e424943582cbbdb6e3f410687e39f96451447bb/plugins/motion/skills/motion" -a claude-code --copy -y -s motion
```

Restore (exercised 2026-11-04): the skills are already in git, so a clone needs nothing. To verify or rebuild them from upstream:

```bash
DISABLE_TELEMETRY=1 npx --yes skills@1.7.6 experimental_install   # restores into .agents/skills/ (gitignored), hash-checked against skills-lock.json
diff -rq .agents/skills .claude/skills                              # expected: no output (identical)
```

Observed: 12 skills restored, `diff -rq` reported no differences. `experimental_install` writes to `.agents/skills/`, not `.claude/skills/`; copy from there only if a committed skill is damaged. To update a skill: re-run its `add` command with a newer reviewed revision, review the diff, and commit the folder and `skills-lock.json` together. The CLI requires Node ≥ 22.20.0.

| Skipped candidate | Reason / evidence |
| --- | --- |
| executing-plans (obra/superpowers) | Depends on sibling scripts (`subagent-driven-development`) that a single-skill copy does not include; would be broken |
| brainstorming (obra/superpowers) | Product scope is decided; optional visual server loads an external image and spawns processes |
| code-review (mattpocock/skills) | Duplicates requesting-code-review; assumes tracker setup |
| near-kit, near-intents, near-cli-rs (near/agent-skills) | Second SDK, out-of-scope cross-chain swaps (D13), operator CLI with key export commands |
| gsap-core, gsap-react (greensock/gsap-skills, MIT, `aed9cfd3277740755f6bfc1155c7aa645403b760`) | Clean, but GSAP and Motion are alternatives; install only if D26 picks GSAP |
| impeccable (pbakaus/impeccable, Apache-2.0, `2c95b1968ca74c5d2c4c0503dcee72f6d0d555ea`) | Downloads and runs a native engine; its live-copy feature launches agents with approval and sandbox bypass flags. Too much unattended authority for a finance codebase; reconsider for P4.4 with live-copy disabled |

## Agent tooling configuration

Each developer's agent configuration (model routing, worker limits, personal tool settings) is personal and stays out of the repository (`.omp/` is gitignored; D17). `CLAUDE.md` holds the only shared agent rules.

## Manual actions and blockers

1. Founder: decide D16, D18, D19 at the Phase 0 gate (2026-11-06), with P0.2 to P0.4 evidence.
2. Founder: NEAR AI key or credits (B6) before Phase 3.
3. Founder or authorized lead: testnet accounts (B7) before P0.2.
4. Founder: watcher host account (B8) after D16.
5. 0xlann: team list and other entries (B9) before P6.3.
6. Founder: accept or remove the five skills without a clear license (B10) before the repository is made public.
