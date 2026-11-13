import { isValidAccountId } from "@mrfund/shared";
import type { Network } from "./verify";

/** Public execution settings; none are secret. Missing values block Execute, never default. */
export interface ExecutionConfig {
  network: Network;
  lendingId: string;
  feeRecipientId: string;
  /** Explorer base for observed transactions, e.g. `https://testnet.nearblocks.io/txns/`. */
  explorerTxBase: string;
}

export type ConfigResult = { ok: true; value: ExecutionConfig } | { ok: false; reason: string };

const EXPLORER: Record<Network, string> = {
  testnet: "https://testnet.nearblocks.io/txns/",
  mainnet: "https://nearblocks.io/txns/",
};

const SUFFIX = (id: string, network: Network) =>
  /^[0-9a-f]{64}$/.test(id) || (network === "testnet") === id.endsWith(".testnet");

/** One shared reader for `NEXT_PUBLIC_*` execution settings (task 1.2). */
export function readExecutionConfig(input: {
  network?: string | undefined;
  lendingId?: string | undefined;
  feeRecipientId?: string | undefined;
}): ConfigResult {
  const { network } = input;
  if (network !== "testnet" && network !== "mainnet")
    return { ok: false, reason: "Set NEXT_PUBLIC_NEAR_NETWORK_ID to testnet or mainnet." };
  for (const [name, value] of [
    ["NEXT_PUBLIC_RHEA_LENDING_ID", input.lendingId],
    ["NEXT_PUBLIC_FEE_RECIPIENT_ID", input.feeRecipientId],
  ] as const) {
    if (!value) return { ok: false, reason: `Set ${name} to enable execution.` };
    if (!isValidAccountId(value) || !SUFFIX(value, network))
      return { ok: false, reason: `${name} is not a ${network} account.` };
  }
  return {
    ok: true,
    value: {
      network,
      lendingId: input.lendingId as string,
      feeRecipientId: input.feeRecipientId as string,
      explorerTxBase: EXPLORER[network],
    },
  };
}

export const publicExecutionConfig = () =>
  readExecutionConfig({
    network: process.env.NEXT_PUBLIC_NEAR_NETWORK_ID,
    lendingId: process.env.NEXT_PUBLIC_RHEA_LENDING_ID,
    feeRecipientId: process.env.NEXT_PUBLIC_FEE_RECIPIENT_ID,
  });
