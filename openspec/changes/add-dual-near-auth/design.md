## Context

D16 uses Next App Router/React, strict TypeScript and source workspace packages. No wallet module is implemented on current dev; the page is still a placeholder. The user approved this auth-only frontend slice, not a redesign or a new money flow. D19 remains open.

## Decisions

- Put browser login code in `apps/web/src/wallet/`; never import it from agent, watcher or server modules. Use two adapters behind one small lifecycle interface and a React context. Add `/connect` rather than replacing the team's consultation screen.
- Use pinned `@hot-labs/near-connect` for ecosystem wallets. Request no login access key/plugin. Restore using provider accounts and handle sign-in/out events; expose all validated accounts rather than silently choosing an unrelated one.
- Use the official Auth0 SPA SDK for NEAR Auth's hosted login lifecycle, memory token caching, SDK-owned PKCE/state validation and passive session checking. Do not implement OAuth/cryptography. The published FastAuth 1.4.x bundles depend on legacy near-api-js 5, mobile auth packages and missing declaration modules; the login-only adapter needs none of their signing machinery. This narrow integration follows their published provider path and MPC view exactly, without another near-api-js version or browser Buffer polyfill.
- Follow `JavascriptProvider.getPath()` (`jwt#https://{network tenant}/#{sub}`), not illustrative protocol paths. Query `derived_public_key` at domain id 1, predecessor `fast-auth.testnet`/`fast-auth.near`; validate the RPC chain and Ed25519 key. Use a pinned base58 codec, not custom cryptography. Read-only identity derivation reveals the path to the configured RPC, as the upstream SDK does; never log it.
- Expose the deterministic implicit account address. Do not discover or link arbitrary named accounts, allocate extra identity paths, create accounts, or claim the address is funded. Existing named wallets use NEAR Connect. Named Auth account provisioning is a separate explicit money-path change.
- Persist only a versioned method/account hint scoped to network; it is not authority. The selected adapter must restore real provider state. Generation invalidation prevents older operations or wallet events from reviving logged-out/replaced sessions. Clear old account context before changing identity; expose a context key for account-scoped frontend state.
- Network and RPC come from existing `NEXT_PUBLIC_NEAR_*`; Auth client id is public `NEXT_PUBLIC_NEAR_AUTH_CLIENT_ID`. Testnet may use the documented public development client, while mainnet requires explicit approved credentials. Do not expose server secrets or introduce a database/cookie session.

## Interface

`AuthAdapter`: `restore()` and `login()` return validated account candidates, `logout()` ends provider state; optional account-change subscription invalidates/rechecks the connection. `ConnectedAccount` contains accountId and optional publicKey. One controller publishes lifecycle state, active method/network/account and account candidates; selection is restricted to that set. The context never exposes a signer or raw identity token.

## Permission and honesty

Permission boundary: the user's provider authenticates browser identity only. No Mr.Fund code in this change signs or sends. Invariant U1: browser hints cannot establish a session. U2: account selection stays within the current provider's set. U3: logout/method/account changes invalidate old asynchronous results. Guardian I1–I10 are unchanged. Negative tests cover forged hints/accounts, wrong network/keys, cancellation/provider errors and delayed login after logout. This does not guarantee provider/device passkey support, continued login under third-party-cookie restrictions, on-chain account existence/funding, permission to spend, fewer signing prompts, mainnet onboarding approval or server-side ownership verification.

## Evidence and rollout

Run adapter/controller boundary regressions and real browser smoke at desktop/360 px. Open the actual ecosystem selector and hosted authorization screen without entering credentials, creating an account or signing. A human passkey/real-wallet completion is recorded separately when authorized and available; synthetic adapters never count as that proof. Keep D19, P4.5 and the independent GLM acceptance gate open. Ship small coherent commits of 50–350 changed lines; do not split a lockfile into invalid intermediate states.

## Sources (read 2026-11-08)

- https://docs.near.org/web3-apps/tutorials/near-auth
- https://docs.auth.near.org/sdks/javascript-provider.md
- https://docs.auth.near.org/resources/testnet.md
- https://docs.auth.near.org/resources/mainnet.md
- https://docs.near.org/web3-apps/tutorials/wallet-login
- Published `@fast-auth-near/javascript-provider@1.4.1` and `@fast-auth-near/browser-sdk@1.4.2` artifacts; account key derivation is public read only.
- https://auth0.com/docs/libraries/auth0-single-page-app-sdk
