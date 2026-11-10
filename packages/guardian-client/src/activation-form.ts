/**
 * PRD F6 activation form: exact parsing and per-field validation with the contract's rules,
 * and the plain-language summary generated from the same values the payload carries
 * (invariant G-UI-2). Numbers never pass through floating point.
 */
import {
  decimalString,
  type GuardianPolicy,
  MIN_COOLDOWN_SEC,
  MIN_TRIGGER_HF_BPS,
  validatePolicy,
} from "@mrfund/shared";
import type { FactoryInfo } from "./tx/activation";

export interface ActivationFields {
  maxPerAction: string;
  /** Optional: empty means reserve deposit minus reserve floor (PRD F6 default). */
  lifetimeCap: string;
  reserveFloor: string;
  reserveDeposit: string;
  /** Health percent, up to two decimals, e.g. "120" or "104.99". */
  trigger: string;
  /** Optional health percent above the trigger. */
  target: string;
  /** Whole minutes. */
  cooldownMinutes: string;
}
export type ActivationField = keyof ActivationFields;
export interface FieldError {
  field: ActivationField;
  message: string;
}
export interface ActivationTerms {
  policy: GuardianPolicy;
  /** Reserve booked after activation; the activation fee is sent on top. */
  reserve: bigint;
}
export interface FormContext {
  /** Debt token decimals (for example 6 for USDC). */
  decimals: number;
  /** Configured per-action fee in debt-token atomic units (display only for the user). */
  actionFee: bigint;
}

/** Exact decimal text → atomic units; refuses more fraction digits than the token has. */
export function parseDecimal(text: string, decimals: number): bigint | null {
  const s = text.trim();
  const m = /^(0|[1-9]\d{0,37})(?:\.(\d+))?$/.exec(s);
  if (!m) return null;
  const fraction = m[2] ?? "";
  if (fraction.length > decimals) return null;
  return (
    BigInt(m[1] ?? "0") * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0")
  );
}

const bps = (text: string): number | null => {
  const v = parseDecimal(text, 2);
  return v === null || v > 1_000_000n ? null : Number(v);
};

/** Every PRD F6 rule, each reported on the field the user must change. */
export function parseActivationForm(
  fields: ActivationFields,
  context: FormContext,
): { ok: true; value: ActivationTerms } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const fail = (field: ActivationField, message: string) => errors.push({ field, message });
  const amount = (field: ActivationField) => {
    const v = parseDecimal(fields[field], context.decimals);
    if (v === null) fail(field, `Use a token amount with up to ${context.decimals} decimals.`);
    return v;
  };
  const max = amount("maxPerAction");
  const floor = amount("reserveFloor");
  const deposit = amount("reserveDeposit");
  const capText = fields.lifetimeCap.trim();
  let cap: bigint | null = null;
  if (capText) cap = amount("lifetimeCap");
  else if (deposit !== null && floor !== null) cap = deposit > floor ? deposit - floor : 0n;

  if (max !== null && max <= 0n) fail("maxPerAction", "Max per action must be above zero.");
  if (max !== null && floor !== null && deposit !== null) {
    if (max > (deposit > floor ? deposit - floor : 0n))
      fail("maxPerAction", "Max per action cannot exceed the reserve minus the reserve floor.");
    else if (deposit < max + context.actionFee + floor)
      fail(
        "reserveDeposit",
        "Reserve deposit must cover max per action, one action fee and the reserve floor.",
      );
  }
  if (cap !== null && max !== null && cap < max)
    fail("lifetimeCap", "Max total must be at least max per action.");

  const trigger = bps(fields.trigger);
  if (trigger === null) fail("trigger", "Enter a health percent with up to 2 decimals.");
  else if (trigger < MIN_TRIGGER_HF_BPS) fail("trigger", "Trigger must be at least 105%.");
  let target: number | null = null;
  if (fields.target.trim()) {
    target = bps(fields.target);
    if (target === null) fail("target", "Enter a health percent with up to 2 decimals.");
    else if (trigger !== null && target <= trigger)
      fail("target", "Target must be above the trigger.");
  }
  const minutes = /^\d{1,6}$/.test(fields.cooldownMinutes.trim())
    ? Number(fields.cooldownMinutes.trim())
    : null;
  if (minutes === null) fail("cooldownMinutes", "Enter whole minutes.");
  else if (minutes * 60 < MIN_COOLDOWN_SEC)
    fail("cooldownMinutes", "Cooldown must be at least 5 minutes.");

  if (
    errors.length > 0 ||
    max === null ||
    floor === null ||
    deposit === null ||
    cap === null ||
    trigger === null ||
    minutes === null
  )
    return { ok: false, errors };
  const policy: GuardianPolicy = {
    maxPerAction: max,
    lifetimeCap: cap,
    reserveFloor: floor,
    triggerHfBps: trigger,
    targetHfBps: target,
    cooldownSec: minutes * 60,
    actionFee: context.actionFee,
  };
  // Same rules the contract applies; a disagreement here is a bug, so it blocks review.
  const valid = validatePolicy(policy);
  if (!valid.ok) return { ok: false, errors: [{ field: "trigger", message: valid.error.kind }] };
  return { ok: true, value: { policy, reserve: deposit } };
}

const percent = (b: number) => decimalString(BigInt(b), 2);

/**
 * Plain-language review lines. Every number is formatted from the exact policy struct, reserve
 * and on-chain fee that the payloads carry; nothing is re-typed or rounded.
 */
export function activationSummary(
  terms: ActivationTerms,
  factory: Pick<FactoryInfo, "activationFee" | "feeRecipientId">,
  token: { symbol: string; decimals: number },
): string[] {
  const { policy, reserve } = terms;
  const t = (v: bigint) => `${decimalString(v, token.decimals)} ${token.symbol}`;
  return [
    `Repay at most ${t(policy.maxPerAction)} per action, only from your reserve.`,
    `Spend at most ${t(policy.lifetimeCap)} in total.`,
    `Never spend the reserve below ${t(policy.reserveFloor)}.`,
    policy.targetHfBps === null
      ? `Act only when health is below ${percent(policy.triggerHfBps)}%.`
      : `Act only when health is below ${percent(policy.triggerHfBps)}%, aiming for ${percent(policy.targetHfBps)}%.`,
    `Wait at least ${policy.cooldownSec / 60} minutes between actions.`,
    `Each action costs a fee of ${t(policy.actionFee)}.`,
    `You send ${t(reserve + factory.activationFee)}: ${t(reserve)} to the reserve and a one-time activation fee of ${t(factory.activationFee)} paid to ${factory.feeRecipientId}.`,
    "Mr.Fund reduces liquidation risk within limits you set. It cannot prevent liquidation; the contract can reject an action.",
  ];
}
