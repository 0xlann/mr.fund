import type { ProposalContext, ToolContext } from "@mrfund/agent";
import { createGuardianClient } from "@mrfund/guardian-client";
import { createRheaClient, readPosition } from "@mrfund/rhea";
import { type FeeSchedule, isValidAccountId } from "@mrfund/shared";
import type { ChatRequest } from "./handler";
import { bindTurnFetch, record } from "./transport";

export interface ChatConfig {
  network: "testnet" | "mainnet";
  rpcUrl: string;
  lendingId: string;
  factoryId?: string;
  fees?: FeeSchedule;
}
function networkAccount(value: string, network: ChatConfig["network"]): boolean {
  return (
    isValidAccountId(value) &&
    (network === "testnet"
      ? value.endsWith(".testnet") || /^[a-f0-9]{64}$/.test(value)
      : !value.endsWith(".testnet"))
  );
}
function atomic(value: unknown): bigint {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,38})$/.test(value))
    throw new Error("Chat context unavailable");
  const amount = BigInt(value);
  if (amount > (1n << 128n) - 1n) throw new Error("Chat context unavailable");
  return amount;
}

/** No public/browser env fallbacks: a missing deployment choice is not a network choice. */
export function readChatConfig(
  env: Readonly<Record<string, string | undefined>>,
): ChatConfig | null {
  try {
    const network = env.NEAR_NETWORK_ID;
    if (network !== "testnet" && network !== "mainnet") return null;
    const rpc = new URL(env.NEAR_RPC_URL ?? "");
    if (rpc.protocol !== "https:" || rpc.username || rpc.password || rpc.hash) return null;
    const lendingId = env.RHEA_LENDING_ID ?? "";
    const factoryId = env.GUARDIAN_FACTORY_ID || undefined;
    if (!networkAccount(lendingId, network) || (factoryId && !networkAccount(factoryId, network)))
      return null;
    const config: ChatConfig = {
      network,
      rpcUrl: rpc.toString(),
      lendingId,
      ...(factoryId ? { factoryId } : {}),
    };
    const tokenId = env.FEE_TOKEN_ID;
    const recipientId = env.FEE_RECIPIENT_ID;
    const activationFee = env.FEE_ACTIVATION_ATOMIC;
    const actionFee = env.FEE_ACTION_ATOMIC;
    const executionFee = env.FEE_EXECUTION_ATOMIC;
    // An incomplete pricing decision disables proposals, not honest public position reads.
    if (tokenId && recipientId && activationFee && actionFee && executionFee) {
      if (!networkAccount(tokenId, network) || !networkAccount(recipientId, network)) return null;
      config.fees = {
        tokenId,
        recipientId,
        activationFee: atomic(activationFee),
        actionFee: atomic(actionFee),
        executionFee: atomic(executionFee),
      };
    }
    return config;
  } catch {
    return null;
  }
}

/** Read-only, request-scoped clients: every nested adapter request inherits the same deadline. */
export function createContextLoader(config: ChatConfig, fetchImpl: typeof fetch = fetch) {
  return async (input: ChatRequest, signal: AbortSignal): Promise<ToolContext> => {
    try {
      signal.throwIfAborted();
      if (!networkAccount(input.accountId, config.network)) throw new Error();
      const boundFetch = bindTurnFetch(fetchImpl, signal);
      const status = await boundFetch(config.rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "chat-network", method: "status", params: [] }),
        signal: AbortSignal.timeout(10_000),
      });
      const chain: unknown = await status.json();
      if (!record(chain) || !record(chain.result) || chain.result.chain_id !== config.network)
        throw new Error();
      const client = createRheaClient(config.rpcUrl, boundFetch);
      const result = await readPosition(
        client,
        { network: config.network, lendingId: config.lendingId },
        input.accountId,
      );
      signal.throwIfAborted();
      if (!result.ok) throw new Error();
      const context: ToolContext = { snapshot: result.value, nowMs: Date.now() };
      if (config.factoryId) {
        // Actual repository ABI: get_guardian, not an invented get_latest_guardian method.
        const lookup = await client.view(config.factoryId, "get_guardian", {
          owner_id: input.accountId,
        });
        if (!lookup.ok) throw new Error();
        const guardianId = lookup.value.data;
        if (
          guardianId !== null &&
          (typeof guardianId !== "string" ||
            !networkAccount(guardianId, config.network) ||
            !guardianId.endsWith(`.${config.factoryId}`))
        )
          throw new Error();
        if (input.guardianId !== undefined && input.guardianId !== guardianId) throw new Error();
        if (typeof guardianId === "string")
          context.guardian = {
            client: createGuardianClient(config.rpcUrl, boundFetch),
            target: { network: config.network, guardianId },
          };
      } else if (input.guardianId !== undefined) throw new Error();
      if (config.fees && context.snapshot.assets[config.fees.tokenId]) {
        // Proposal prerequisites are optional: a missing token/version view never fabricates fees.
        try {
          const version = await client.view(config.lendingId, "get_version", {});
          if (!version.ok || !["0.11.0", "0.16.2"].includes(String(version.value.data)))
            throw new Error();
          const walletBalances: Record<string, bigint> = Object.create(null);
          for (const tokenId of Object.keys(context.snapshot.assets)) {
            const balance = await client.view(tokenId, "ft_balance_of", {
              account_id: input.accountId,
            });
            if (!balance.ok) throw new Error();
            walletBalances[tokenId] = atomic(balance.value.data);
          }
          const registration = await client.view(config.fees.tokenId, "storage_balance_of", {
            account_id: config.fees.recipientId,
          });
          if (!registration.ok) throw new Error();
          let registered = false;
          if (registration.value.data !== null) {
            if (!record(registration.value.data)) throw new Error();
            const total = atomic(registration.value.data.total);
            const available = atomic(registration.value.data.available);
            if (available > total) throw new Error();
            registered = total > 0n;
          }
          const proposal: ProposalContext = {
            walletBalances,
            fees: config.fees,
            lendingId: config.lendingId,
            lendingVersion: String(version.value.data),
            feeRecipientRegistered: registered,
          };
          if (!registered) {
            const bounds = await client.view(config.fees.tokenId, "storage_balance_bounds", {});
            if (!bounds.ok || !record(bounds.value.data)) throw new Error();
            proposal.storageDepositYocto = atomic(bounds.value.data.min);
            if (proposal.storageDepositYocto === 0n) throw new Error();
          }
          context.proposal = proposal;
        } catch {
          signal.throwIfAborted();
          // Public position tools remain available; propose_card returns its typed not_available.
        }
      }
      signal.throwIfAborted();
      context.nowMs = Date.now();
      return context;
    } catch {
      throw new Error("Chat context unavailable");
    }
  };
}
