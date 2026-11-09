## 1. Offline provider orchestration

- [x] 1.1 Define provider adapter and turn event contracts using trusted server ToolContext; align with awaitable dispatcher from add-guardian-client-and-tools.
- [x] 1.2 Add fake-provider tests for tool ids, six-call total including parallel calls, shared 30-second deadline, malformed args, cancellation and provider failure.
- [x] 1.3 Implement bounded tool loop and current-tool source-number collection; reject forged client tool facts and exclude payload bytes from provider tool messages.
- [x] 1.4 Buffer final prose, enforce number/persona guards, regenerate at most once then deterministic fallback; prove no invalid chunk is emitted.

## 2. Server Route Handler

- [x] 2.1 Create backend-only apps/web/src/app/api/chat/route.ts with bounded request/history/body validation and server-only provider configuration.
- [x] 2.2 Implement per-IP/account bounded in-memory rate buckets with explicit proxy-header trust, disconnect propagation and sanitized streaming/error/done events.
- [x] 2.3 Test spoofed forwarded IP, limit exhaustion, oversized history, provider secret errors and log redaction; document account id is public-read context rather than authentication.

## 3. Multilingual evaluation

- [x] 3.1 Author 12 distinct prompts in three languages (36 cases) with expected facts, language review criteria, injections, refusal and card-bound checks.
- [x] 3.2 Implement offline/live eval runners with recorded model/settings/date/latency and separate results; full Guardian cases require real validated tools or explicit simulated fixtures.
- [ ] 3.3 B6 access is configured and the current GLM catalog/protocol probe and four full live runs are recorded. The latest is 34/36 model outputs with two guard fallbacks; comparison-content checks fail. Completed independent assistant review (not human/provider review): 36/36 correct language, 22 content/honesty approvals and 14 rejections, including provenance uncertainty. Isolated successful repeats are not acceptance. Leave this task and D25/P3.4 open until passing complete live evidence and independent review; owner: lead. See `docs/technical/CHAT-API.md`.

## 4. Validation and docs

- [x] 4.1 Final local verification (2026-11-08): 744 tests passed, 3 skipped; build, typecheck, lint and strict OpenSpec validation passed. Production HTTP public-read smoke completed; direct-runtime leading-decimal rejection and saved-review application were also exercised. Provider credentials stay server-only; this backend adds no signer or durable transcript store. These checks do not close the model-acceptance gate.
- [x] 4.2 Document event protocol, per-process rate-limit/privacy boundaries, P3.4/P3.5 evidence, four full-run outcomes, completed assistant-review findings and exact-decimal observed-cost estimates. P3.5 is backend implementation only; D25/P3.4/3.3 stay open pending complete passing live evidence and independent review, not fallbacks or a diagnostic subset. No human review or deployment readiness is claimed.
