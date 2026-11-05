import type { AccountId, Atomic, Bps } from "./errors";

/** Contract constants (SMART-CONTRACT "Constants", D28). */
export const MIN_TRIGGER_HF_BPS = 10_500;
export const MIN_COOLDOWN_SEC = 300;

export interface GuardianPolicy {
  maxPerAction: Atomic;
  lifetimeCap: Atomic;
  reserveFloor: Atomic;
  triggerHfBps: Bps;
  targetHfBps: Bps | null;
  cooldownSec: number;
  actionFee: Atomic;
}

export type GuardianStatus = "created" | "active" | "paused" | "deactivated";

export interface GuardianState {
  status: GuardianStatus;
  ownerId: AccountId;
  watcherId: AccountId;
  debtTokenId: AccountId;
  reserve: Atomic;
  spentTotal: Atomic;
  inFlight: { opId: bigint; amount: Atomic; fee: Atomic } | null;
  /** Nanoseconds since epoch, as stored by the contract. */
  lastActionStartedNs: bigint;
}

/** Lead proposals (D28): user-editable, never presented as a safety guarantee. */
export const DEFAULT_COMFORT_HF_BPS = 15_000;
export const DEFAULT_TRIGGER_HF_BPS = 12_000;
