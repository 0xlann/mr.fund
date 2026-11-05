import type { AccountId, Atomic } from "./errors";

export type CardAction =
  | "repay"
  | "guardian_activate"
  | "guardian_deactivate"
  | "guardian_withdraw";

export interface FeeLine {
  label: string;
  amount: Atomic;
  tokenId: AccountId;
  recipientId: AccountId;
  /** When it is charged, in plain words. */
  when: string;
}

export interface NearFunctionCall {
  methodName: string;
  args: Record<string, unknown>;
  gas: bigint;
  /** yoctoNEAR */
  deposit: bigint;
}

export interface NearTransaction {
  receiverId: AccountId;
  actions: NearFunctionCall[];
}

export interface CardNumber {
  label: string;
  before?: string;
  after?: string;
  unit: string;
}

export interface CardReceipt {
  status: "submitted" | "confirmed" | "failed" | "partial";
  txHashes: string[];
  observed?: Record<string, string>;
  atMs: number;
}

/** `payload` is built only by `rhea` or `guardian-client` builders, never from model text. */
export interface Card {
  id: string;
  action: CardAction;
  headline: string;
  reason: string;
  numbers: CardNumber[];
  assumptions: string[];
  fees: FeeLine[];
  risks: string[];
  dataAgeMs: number;
  maxDataAgeMs: number;
  payload: NearTransaction[];
  receipt?: CardReceipt;
}
