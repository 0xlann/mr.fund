/**
 * Wallet-loan repay payload (BUILD-PLAN P4.2, P4.1; ARCHITECTURE Flow 2).
 *
 * The user's own debt token goes to the lending contract with `OnlyRepay`: Rhea repays only the
 * sender's own debt (OPEN-DECISIONS D18). The token and amount come from the engine's validated
 * `CardDraft`, never from model text. Permission boundary: the user's wallet signs; the 1 yocto
 * deposit forces a full-access key. Invariant: only `draft.amount` of `draft.tokenId` leaves the
 * wallet toward `lendingId`, plus at most the one disclosed fee.
 *
 * Does not guarantee: that Rhea accepts the repay, or that the whole amount is used (Rhea refunds
 * the unused part through the token's `ft_resolve_transfer`).
 */
import {
  type CardDraft,
  type EngineError,
  err,
  type FeeTransferParams,
  feeTransfers,
  ftTransferCall,
  type NearTransaction,
  ok,
  type Result,
} from "@mrfund/shared";

/** The JSON string `"OnlyRepay"` carried inside the NEP-141 `msg` string. */
export const ONLY_REPAY_MSG = JSON.stringify("OnlyRepay");

export interface RepayPayloadParams extends FeeTransferParams {
  /** The Rhea lending contract that receives the repay. */
  lendingId: string;
}

/** Repay first, then (optionally) register the fee recipient and pay the fee. */
export function repayPayload(
  draft: CardDraft,
  p: RepayPayloadParams,
): Result<NearTransaction[], EngineError> {
  if (draft.action !== "repay") {
    return err({ kind: "invalid_input", reason: "this builder only creates repay payloads" });
  }
  const repay = ftTransferCall(draft.tokenId, p.lendingId, draft.amount, ONLY_REPAY_MSG);
  if (!repay.ok) return repay;
  const fee = feeTransfers(draft, p);
  if (!fee.ok) return fee;
  return ok([repay.value, ...fee.value]);
}
