import type { ProposalContext, ToolContext } from "@mrfund/agent";
import { createGuardianClient } from "@mrfund/guardian-client";
import type { FeeSchedule } from "@mrfund/shared";
import { networkAccount, readPositionConfig } from "../position/config";
import { createPositionLoader } from "../position/loader";
import { record } from "../transport";
import type { ChatRequest } from "./handler";

export interface ChatConfig {
  network: "testnet" | "mainnet";
  rpcUrl: string;
  lendingId: string;
  factoryId?: string;
  fees?: FeeSchedule;
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
    const readConfig = readPositionConfig(env);
    if (!readConfig) return null;
    const { network } = readConfig;
    const factoryId = env.GUARDIAN_FACTORY_ID || undefined;
    if (factoryId && !networkAccount(factoryId, network)) return null;
    const config: ChatConfig = {
      ...readConfig,
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
      const { snapshot, client, boundFetch } = await createPositionLoader(
        config,
        fetchImpl,
        false,
      )(input.accountId, signal);
      const context: ToolContext = { snapshot, nowMs: Date.now() };
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
          // These views do not depend on one another. Keep validation before publishing a proposal.
          const [version, balances, registration] = await Promise.all([
            client.view(config.lendingId, "get_version", {}),
            Promise.all(
              Object.keys(context.snapshot.assets).map(
                async (tokenId) =>
                  [
                    tokenId,
                    await client.view(tokenId, "ft_balance_of", { account_id: input.accountId }),
                  ] as const,
              ),
            ),
            client.view(config.fees.tokenId, "storage_balance_of", {
              account_id: config.fees.recipientId,
            }),
          ]);
          if (!version.ok || !["0.11.0", "0.16.2"].includes(String(version.value.data)))
            throw new Error();
          const walletBalances: Record<string, bigint> = Object.create(null);
          for (const [tokenId, balance] of balances) {
            if (!balance.ok) throw new Error();
            walletBalances[tokenId] = atomic(balance.value.data);
          }
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
