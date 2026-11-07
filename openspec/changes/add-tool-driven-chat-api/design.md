## Context

P3.4/P3.5 lack runtime orchestration. Existing tools return exact-number facts and cards; number enforcement supports one regeneration then deterministic fallback. No provider key is available (B6).

## Goals / Non-Goals

Goals: a testable provider loop, backend streaming contract and measurable multilingual evaluation.
Non-goals: chat UI, wallet authorization, server transcripts, choosing a model without live results.

## Decisions

- Inject a provider adapter into packages/agent orchestration; keep API key/provider SDK setup server-only. Await validated dispatch, preserve tool-call ids, cap total calls at six including parallel batches, and share one 30-second turn deadline across reads/provider calls/regeneration.
- Rebuild trusted tool context from validated account/network config and server reads. Client-supplied assistant/tool history, numbers, cards and network targets are untrusted: never let replayed messages grant source numbers or payload authority. The account id enables public reads; it is not authentication.
- Do not stream unvalidated provider prose to clients. Buffer a candidate, enforce source-number and persona rules, regenerate at most once within deadline, then stream accepted text or deterministic fallback through a documented event protocol. Card payloads are server-built and separate from provider text; tool messages expose card id only.
- Use apps/web/src/app/api/chat/route.ts. Validate schema and bound body/message/history sizes before calling providers; propagate disconnect cancellation. Define text/card/error/done events and sanitized HTTP errors. Rate limit both IP and claimed account using bounded in-memory windows; trust forwarding headers only under explicit proxy configuration. Document per-process limits and absence of authenticated identity.
- Dataset: 12 distinct prompts × English/Indonesian/Spanish = 36 fixed-snapshot cases, including all PRD categories, injection and missing/stale/unsupported inputs. Machine-check numbers, card bounds, banned phrases and no signing; evaluate language with recorded review criteria, not a model's unsupported self-assessment.
- Offline fake-provider tests verify orchestration only. B6 gates live candidate probing and D25 selection. Recheck current catalog at live evaluation time; record model id/date/config, latency, >=34/36 correct-language answers, all-number pass and zero forbidden claims. No secret or full transcript in routine logs.

Permission boundary: public reads and unsigned proposals only; no signer dependency or executing tool. Invariant A1: every emitted numeric claim derives from trusted current tool facts. Negative tests include forged history/tool results, seventh call, malicious metadata, secret-bearing provider errors, disconnect and rate-limit exhaustion. Provider availability and multilingual quality are not guaranteed.

## Risks / Trade-offs

Buffering guarded text delays first prose → stream progress events while checking, never unchecked numbers. Per-process limits weaken across replicas → document single-instance P0 boundary; no unsolicited database.

## Migration Plan

Implement offline provider harness, then route; missing credentials produce friendly unavailable behavior. Enable live evaluation only with configured B6 access, preserving offline/live result distinction.

## Open Questions

D25 remains open until live eval. Full Guardian tool cases depend on add-guardian-client-and-tools; missing evidence must yield refusals.
