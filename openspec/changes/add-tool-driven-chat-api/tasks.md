## 1. Offline provider orchestration

- [ ] 1.1 Define provider adapter and turn event contracts using trusted server ToolContext; align with awaitable dispatcher from add-guardian-client-and-tools.
- [ ] 1.2 Add fake-provider tests for tool ids, six-call total including parallel calls, shared 30-second deadline, malformed args, cancellation and provider failure.
- [ ] 1.3 Implement bounded tool loop and current-tool source-number collection; reject forged client tool facts and exclude payload bytes from provider tool messages.
- [ ] 1.4 Buffer final prose, enforce number/persona guards, regenerate at most once then deterministic fallback; prove no invalid chunk is emitted.

## 2. Server Route Handler

- [ ] 2.1 Create backend-only apps/web/src/app/api/chat/route.ts with bounded request/history/body validation and server-only provider configuration.
- [ ] 2.2 Implement per-IP/account bounded in-memory rate buckets with explicit proxy-header trust, disconnect propagation and sanitized streaming/error/done events.
- [ ] 2.3 Test spoofed forwarded IP, limit exhaustion, oversized history, provider secret errors and log redaction; document account id is public-read context rather than authentication.

## 3. Multilingual evaluation

- [ ] 3.1 Author 12 distinct prompts in three languages (36 cases) with expected facts, language review criteria, injections, refusal and card-bound checks.
- [ ] 3.2 Implement offline/live eval runners with recorded model/settings/date/latency and separate results; full Guardian cases require real validated tools or explicit simulated fixtures.
- [ ] 3.3 When B6 access is configured, recheck current model catalog, probe candidates and run live evaluation; leave this task and D25 open without access or passing evidence.

## 4. Validation and docs

- [ ] 4.1 Run agent/route/eval offline tests, typecheck and lint; verify provider/keys remain server-only and no signer/transcript storage is introduced.
- [ ] 4.2 Document event protocol, per-process rate-limit/privacy boundaries and P3.4/P3.5 evidence; select D25 only from actual >=34/36 language and all-number/zero-banned-claim passing live results.
