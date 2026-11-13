# Tool-driven chat API

## Scope and authority

[I] The backend serves public account reads and unsigned recommendations. An `accountId` in a request is a public-read selector, **not proof of ownership or an authenticated session**. NEAR Auth, NEAR Connect, wallet execution, arbitrary transfers, supply/yield execution and durable chat storage are outside this change.

The model has no signing or sending tool. Existing deterministic builders create supported draft payloads; the provider sees facts and card ids, never those payloads. Guardian automatic execution remains a separate watcher/contract flow. Fees must be configured explicitly; missing pricing does not mean zero pricing.

Implementation: `packages/agent/src/chat*.ts`, `apps/web/src/server/chat/`, and `apps/web/src/app/api/chat/route.ts`. Evaluation: `packages/agent/eval/`.

## Request

`POST /api/chat`, `Content-Type: application/json`:

```json
{
  "accountId": "alice.testnet",
  "message": "Explain my position without making a transaction.",
  "locale": "en",
  "history": [
    { "role": "user", "content": "I want to understand my borrowing costs." },
    { "role": "assistant", "content": "We can compare repaying with supply yield." }
  ]
}
```

`message` and `accountId` are required. `locale` is optional (`en`, `id`, `es`). Optional `guardianId` is only a consistency check against the configured factory's `get_guardian(owner_id)` result; it cannot select an arbitrary contract. Network, RPC, lending target, factory and pricing come from server configuration only.

Limits: 32,768 actual UTF-8 body bytes, message at most 4,000 UTF-16 code units, at most 20 historical messages, at most 4,000 code units per historical message and 16,000 across history. Only `user`/`assistant` text is accepted. Unknown fields, client tool facts, tool/system roles, card payloads and target overrides are rejected. History is conversational context, never numerical evidence or permission.

HTTP rejection codes: 400 invalid request, 405 wrong method (handler), 408 request deadline during body loading, 413 oversized body, 415 wrong content type, 429 rate limit. Responses use `Cache-Control: no-store`.

## Response protocol

Successful admission returns `text/event-stream`. Each SSE record is `data: <JSON>`, followed by a blank line. Read events by `type`, not by network chunk boundaries.

| Event | Fields | Meaning |
| --- | --- | --- |
| `progress` | `stage`, optional `tool` | `reading`, `thinking`, `tools` or `checking`; no unvalidated answer text |
| `text` | `text` | Complete guarded prose; candidate token streams are buffered, never forwarded directly |
| `card` | `card` | Deterministically constructed unsigned draft; `bigint` fields serialize as decimal strings |
| `error` | `code` | Sanitized `unavailable`, `timeout`, `cancelled`, `tool_limit` or `invalid_provider` |
| `done` | `summary` | Terminal status, model/template path, guard hits, tool/provider counts, elapsed time and observed token usage |

After HTTP 200, consumers must inspect `error`/`done`, not assume inference succeeded. A template answer is visibly distinguishable through `summary.via`. Cancellation may close the stream without terminal events. A client must never execute a draft automatically because it arrived over chat; preserve review and wallet approval, validate account/network and refresh stale inputs.

`summary.elapsedMs` measures the agent loop after context reads; measure full HTTP latency separately to include RPC preparation and framework overhead. Cached input and reasoning token counts are subsets of input/output, not extra tokens to add again. Usage is provider-reported, observed-only: absent metadata is represented as zero and interrupted/failed calls may consume unreported tokens. It is not a billing statement.

## Runtime limits and failure behavior

- One 60-second server deadline begins before request body/context reads. Request-scoped RPC transports and provider calls inherit cancellation. The agent independently caps its loop at 60 seconds, without extending the enclosing server deadline.
- At most six tool calls total, including calls in a provider batch and during regeneration. Oversized batches are refused before dispatch; tool ids must correlate uniquely.
- Current successful tool facts are the only numerical authority. The existing number checker and additional claim checks run before prose emission. One regeneration is permitted; a second failure produces a localized, number-free fallback. These checks are rejection layers, not a proof of arbitrary natural-language truthfulness.
- Provider HTTP/JSON failures are sanitized; no raw error, credential, reasoning trace or transcript is logged or returned.
- Server `chat_timing` records contain only a generated turn id, static stage (`context`, `provider`, `repair`, `total`), elapsed milliseconds and provider round index. Repair denotes the provider call following guard rejection; it is not added twice to provider time. No account, message, reply, tool arguments, RPC endpoint, usage content or raw error enters these records. Context timing includes failed/aborted loads; total is recorded once on rejection, completion or cancellation. The ignored measurement harness additionally times each RPC through body consumption without logging its arguments.
- The client transport has no shorter deadline. `useLiveConsultation.slow` becomes true after 15,000 ms of the current busy turn; completion, error, cancel, clear, account/network change and a replacement turn reset it. Cancellation remains available through `cancel()`. A timeout preserves the question for manual retry; no automatic retry is added.
- Provider responses are byte-bounded. API credentials are sent only to `https://cloud-api.near.ai/v1/chat/completions`; alternate credential destinations and redirects are rejected.

## Server configuration

Use the names in the root `.env.example`. Next.js starts in `apps/web`; ensure your deployment injects root-local values into that server process, or use an ignored app-local environment file. A root `.env` is not automatically a production secret store. Never use `NEXT_PUBLIC_` for provider or proxy credentials.

| Configuration | Behavior |
| --- | --- |
| `NEARAI_API_KEY`, `NEARAI_MODEL` | Required to enable provider calls; initial candidate is `z-ai/glm-5.3-flash` |
| `NEARAI_BASE_URL` | Optional; only the official HTTPS gateway `/v1` is accepted |
| `NEAR_NETWORK_ID`, `NEAR_RPC_URL`, `RHEA_LENDING_ID` | Required for real context; no implicit demo-network decision or browser-variable fallback |
| `GUARDIAN_FACTORY_ID` | Optional; resolves existing Guardian for the selected owner |
| `FEE_TOKEN_ID`, `FEE_RECIPIENT_ID`, `FEE_ACTIVATION_ATOMIC`, `FEE_ACTION_ATOMIC`, `FEE_EXECUTION_ATOMIC` | Complete explicit configuration enables loading proposal prerequisites; atomic integer amounts, including explicitly chosen zero. Missing prerequisites leave proposals unavailable while position reads continue |
| `CHAT_PROXY_SECRET`, `CHAT_PROXY_SECRET_HEADER`, `CHAT_PROXY_IP_HEADER` | Optional complete trusted-edge configuration; never browser-visible |

The context loader verifies RPC chain id, reads a block-pinned Rhea snapshot and uses validated contract views. Proposal prerequisites additionally read the observed lending version, wallet balances and fee-recipient registration. Unknown versions or malformed prerequisites cannot produce an executable proposal.

Rate limits are per-process, ten requests per minute per IP and per claimed account, with at most 4,096 buckets. IP admission occurs before reading a body; account admission follows validation. Live buckets are not evicted to reset quota. Without an authenticated reverse-proxy header, Next's Request has no authoritative peer IP, so all requests share the conservative `direct-client` IP bucket. `x-forwarded-for` alone is never trusted.

Only configure trusted-edge headers if the edge overwrites them, supplies the secret itself and prevents public origin bypass. Buckets do not coordinate between replicas, and a claimed account is not an authenticated identity; production abuse resistance beyond this single-instance boundary is not claimed.

## GLM settings and evaluation

The native-fetch OpenAI-compatible provider uses temperature `0.2`, `max_tokens: 1024`, and `thinking_token_budget: 256`; the evaluator imports the same `CHAT_GENERATION_SETTINGS` constant rather than duplicating configuration. Minimal `reasoning_effort: "low"` was also exercised and did not consistently satisfy the acceptance gate. No extra SDK dependency is needed for this endpoint. [NEAR AI documentation](https://docs.near.ai/cloud/reasoning-models) explains the GLM-specific budget and that `enable_thinking: false` can move reasoning into answer content rather than improve latency. Reasoning content is never exposed by this adapter.

The 36-case dataset uses 12 scenarios in English, Indonesian and Spanish. Position/prices/Guardian responses are explicitly **Simulated**, even when inference is live. It covers comparison, what-if, repayment drafts, glossary, Guardian limits/history/non-action, stale/missing inputs, unsupported transfers/protocols and injection. No testnet/mainnet execution is implied.

Run offline checks with `pnpm exec vitest run packages/agent/test/eval.test.ts`. An authorized live run uses `LIVE_CHAT_EVAL=1`, configured `NEARAI_API_KEY` / `NEARAI_MODEL`, and `pnpm exec vitest run packages/agent/test/live-eval.test.ts --reporter=verbose`. Synthetic response reports and a review template are written to ignored `scratch/chat-eval/`; ordinary test runs skip inference.

Review the exact saved responses for language, financial meaning and forbidden claims. Re-score without new inference using `CHAT_EVAL_REVIEW_ONLY=1`, `CHAT_EVAL_REPORT_FILE`, `CHAT_EVAL_REVIEW_FILE`, and `pnpm exec vitest run packages/agent/test/eval-review.test.ts`. Reviews bind the original text, case and locale. Offline checks, fallbacks and unreviewed outputs never establish model acceptance. D25 records actual live acceptance evidence and remaining limits.

### Observed evidence (2026-11-08)

[V] All four complete 36-case reports below used real `z-ai/glm-5.3-flash` inference against the same **Simulated** fixture (`chat-eval-2026-11-08-v1`), not live positions or network execution. Timestamps are the reports' `runAt` values (UTC); latency is mean case latency, not end-to-end public HTTP latency. Temperature `0.2` and `max_tokens: 1024` apply throughout; the first three runs used `reasoning_effort: "low"`, and the last uses the current `thinking_token_budget: 256`.

| Report (`scratch/chat-eval/`) | Run at (2026-11-08 UTC) | Model / other outcomes | Mean latency | Tokens: input / cached subset / output | Observed cost estimate (USD) |
| --- | --- | --- | --- | --- | --- |
| `glm-baseline-v1.json` | 03:58:41.340 | 35 model / 1 guard fallback | 8.432 s | 127058 / 97792 / 8966 | 0.007997784 |
| `glm-refinement-v2.json` | 04:06:00.735 | 32 model / 3 guard fallbacks / 1 tool limit | 7.330 s | 153032 / 120320 / 8961 | 0.008541300 |
| `glm-refinement-v3.json` | 04:15:56.019 | 31 model / 3 guard fallbacks / 1 unavailable / 1 timeout | 8.957 s | 130489 / 104192 / 8217 | 0.007462564 |
| `z-ai-glm-5.3-flash.json` | 04:24:01.481 | 34 model / 2 guard fallbacks | 15.591 s | 126152 / 82688 / 23472 | 0.016205376 |

[V, catalog; I, monetary estimate] The [official model catalog](https://cloud-api.near.ai/v1/models), saved locally as `scratch/chat-model-metadata.json` at `2026-11-08T03:41:46.962164+00:00`, quotes USD/token: prompt `0.00000008`, cached input `0.000000012`, completion `0.0000005`. Exact decimal calculation for every row: `(input − cached) × 0.00000008 + cached × 0.000000012 + output × 0.0000005`. The four-run observed estimate totals **USD 0.040207024**. Cached input is already within input; reasoning is already within output and is not charged again. The reports themselves leave `pricing.costComputed: false`; these are subsequent estimates from their aggregates, not provider invoices or total account spend. Missing/interrupted usage and calls outside these four reports are excluded.

[V] Every original full report has `modelAccepted: false`. In the latest run all 36 guarded outputs passed automated number, card-bound, forbidden-claim and language-heuristic checks, but `comparison.id` and `comparison.es` fell back to number-free templates and failed the comparison-content checks. These automated checks do **not** establish semantic truth or acceptance.

[V] Independent **assistant** review of all 36 exact saved outputs completed at `2026-11-08T04:44:14.735636Z`, recorded in ignored `scratch/chat-eval/manual-review.json` (`reviewer: "assistant-reviewer"`); this is neither human review nor provider self-assessment. Language: **36/36 correct**. Content/honesty: **22 approved, 14 rejected**, including exact-turn provenance uncertainty. Rejections cover the two comparison fallbacks; missing **Simulated** fee disclosure in all three repay cases; unsourced glossary thresholds in all three languages; health-threshold/source-unit ambiguity in `position.id`, `position.es` and `what-if.id`; Guardian policy/disclosure errors (`guardian-status.en` says at rather than strictly below the trigger, omits fees from the cap and unavailable activation/heartbeat limitations; `guardian-status.id` omits the synthetic-data label); and `injection.id` offering real rather than fixture data. The original report's pending-review fields predate this separate review; no passing review is implied.

[V] The isolated repeat at `2026-11-08T04:34:39.470Z` (`comparison-diagnostic.json`) produced model answers for those two cases, not a passing full dataset. Its trace also shows an initial Indonesian candidate inventing a `7 USDC` difference and making an unsupported assurance; both were rejected before regeneration. Do not substitute these repeats for the full run or soften the guards.

[V, local production-server HTTP smoke, 2026-11-08] Separately, `scratch/chat-http-production-final.json` records an actual `POST /api/chat` to the local production Next server with public mainnet reads: HTTP 200, terminal `status: "ok"`, `via: "model"`, 28,281 ms full HTTP / 27,171 ms agent latency, two tools, four provider calls and one guard hit. Observed tokens: 8,350 input (5,632 cached subset), 1,532 output (847 reasoning subset). The Indonesian response distinguished collateral wNEAR, non-collateral STNEAR/wNEAR and WBTC debt. This was read-only: no wallet signing, transaction submission or receipts, and it proves neither all flows nor multilingual model acceptance.

**BLOCKER (owner: lead):** D25, P3.4 and OpenSpec task 3.3 remain open until a complete live run satisfies the number/content/card/claim gates and independent review confirms at least 34/36 target-language answers and correct financial meaning. The completed assistant review fails the content/honesty gate; no human review or deployment readiness is claimed.

[V, final branch checks, 2026-11-08] `pnpm test`: **744 passed, 3 skipped**; `pnpm typecheck`, `pnpm lint`, `pnpm --filter @mrfund/web build` and strict OpenSpec validation passed. A direct-runtime smoke also rejected an unsupported `.99%` rate before emitting corrected prose; eight regression cases failed before the leading-decimal tokenizer fix and passed afterward. Saved-review application passed separately without provider calls; its language count is independent from content approval. These are local implementation checks, not model acceptance. Raw synthetic response reports, review templates and credentials stay ignored/local, not committed.
