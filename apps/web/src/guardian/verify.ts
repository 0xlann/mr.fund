/**
 * Browser-side check of every Guardian payload before a wallet is asked to sign (invariant
 * G-UI-1, task 2.3). It mirrors `verifyCardPayload` for repays: the payload must be exactly
 * what the `@mrfund/guardian-client` builders emit for the stated intent, and nothing else.
 *
 * Allowlist (one transaction, one function call, exactly the builder's keys):
 *   - factory `create_guardian({policy})`: policy byte-equal to the reviewed policy, deposit
 *     equal to the stated funding and inside `[min_funding, max_funding]`, gas ≥ 145 Tgas;
 *     only while the owner has no Guardian.
 *   - factory `claim_refund({})`, 1 yocto.
 *   - own Guardian `owner_register({target_id, storage_deposit})`, 1 yocto, target the lending
 *     contract or one of the two configured tokens.
 *   - own Guardian `pause` / `resume` / `deactivate` (`{}`) and `owner_withdraw_reserve({amount})`,
 *     1 yocto.
 *   - debt token `ft_transfer_call({receiver_id: <own Guardian>, amount: reserve + activation
 *     fee, msg: {"activate":{}}})`, 1 yocto, with the fee and recipient the factory showed.
 * "Own Guardian" means the account the factory reports for the signer, whose config names the
 * signer as owner. Anything else (AddKey, Transfer, DeployContract, Stake, extra arguments,
 * another receiver) is refused.
 *
 * Does not guarantee: that the wallet displays the call faithfully or that the contract accepts
 * it; each outcome is still observed on-chain.
 */
import {
  ACTIVATE_MSG,
  type FactoryInfo,
  type GuardianSnapshot,
  policyWire,
  type RegistrationTarget,
  registrationTargetId,
} from "@mrfund/guardian-client";
import { type GuardianPolicy, isValidAccountId } from "@mrfund/shared";
import type { Network } from "../execution/verify";

const TGAS = 1_000_000_000_000n;
const MAX_GAS = 300n * TGAS;
const MIN_CREATE_GAS = 145n * TGAS;
const U128_MAX = (1n << 128n) - 1n;
/** Upper bound for a NEP-145 registration paid from the Guardian's NEAR (minimums are ~0.00125). */
export const MAX_STORAGE_DEPOSIT_YOCTO = 10n ** 23n;

export type GuardianIntent =
  | { kind: "create"; policy: GuardianPolicy; funding: bigint }
  | { kind: "claim_refund" }
  | { kind: "register"; target: RegistrationTarget; storageDeposit: bigint }
  | { kind: "activate"; reserve: bigint }
  | { kind: "pause" | "resume" | "deactivate" }
  | { kind: "withdraw"; amount: bigint };

export interface GuardianExpectation {
  network: Network;
  session: { network: Network; accountId: string };
  signerId: string;
  /** Factory facts read from chain (`readFactory`), shown on the review. */
  factory: FactoryInfo;
  /** The signer's Guardian as read from chain; null before creation. */
  guardian: GuardianSnapshot | null;
}

export interface VerifiedGuardianTransaction {
  receiverId: string;
  methodName: string;
  args: Record<string, unknown>;
  gas: bigint;
  deposit: bigint;
}

export interface VerifiedGuardian {
  intent: GuardianIntent["kind"];
  network: Network;
  signerId: string;
  transactions: VerifiedGuardianTransaction[];
}

export type GuardianVerifyResult =
  | { ok: true; value: VerifiedGuardian }
  | { ok: false; reason: string };
const refuse = (reason: string): GuardianVerifyResult => ({ ok: false, reason });

function exact(v: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) return null;
  const own = Object.keys(v);
  if (own.length !== keys.length || !keys.every((k) => own.includes(k))) return null;
  return v as Record<string, unknown>;
}

/** The single function call in a one-transaction payload, with bounded gas. */
function single(payload: unknown, argKeys: readonly string[]) {
  if (!Array.isArray(payload) || payload.length !== 1) return null;
  const t = exact(payload[0], ["receiverId", "actions"]);
  if (!t || typeof t.receiverId !== "string" || !Array.isArray(t.actions)) return null;
  if (t.actions.length !== 1) return null;
  const a = exact(t.actions[0], ["methodName", "args", "gas", "deposit"]);
  if (!a || typeof a.methodName !== "string") return null;
  if (typeof a.gas !== "bigint" || a.gas <= 0n || a.gas > MAX_GAS) return null;
  if (typeof a.deposit !== "bigint" || a.deposit <= 0n || a.deposit > U128_MAX) return null;
  const args = exact(a.args, argKeys);
  if (!args) return null;
  return {
    receiverId: t.receiverId,
    methodName: a.methodName,
    args,
    gas: a.gas,
    deposit: a.deposit,
  };
}

const ARG_KEYS: Record<GuardianIntent["kind"], readonly string[]> = {
  create: ["policy"],
  claim_refund: [],
  register: ["target_id", "storage_deposit"],
  activate: ["receiver_id", "amount", "msg"],
  pause: [],
  resume: [],
  deactivate: [],
  withdraw: ["amount"],
};

const METHOD: Record<GuardianIntent["kind"], string> = {
  create: "create_guardian",
  claim_refund: "claim_refund",
  register: "owner_register",
  activate: "ft_transfer_call",
  pause: "pause",
  resume: "resume",
  deactivate: "deactivate",
  withdraw: "owner_withdraw_reserve",
};

export function verifyGuardianPayload(
  payload: unknown,
  intent: GuardianIntent,
  x: GuardianExpectation,
): GuardianVerifyResult {
  if (x.session.network !== x.network) return refuse("Your wallet is on a different network.");
  if (x.signerId !== x.session.accountId)
    return refuse("The signing account is not the connected account.");
  const f = x.factory;
  for (const id of [x.signerId, f.factoryId, f.debtTokenId, f.lendingId, f.feeRecipientId])
    if (!isValidAccountId(id)) return refuse("Guardian configuration is invalid.");
  const call = single(payload, ARG_KEYS[intent.kind]);
  if (!call) return refuse("The transaction is not the expected Guardian call.");
  if (call.methodName !== METHOD[intent.kind]) return refuse("Unexpected contract method.");

  const g = x.guardian;
  const ownGuardian = () => {
    if (!g) return "No Guardian exists for this account yet.";
    if (g.config.ownerId !== x.signerId || g.status.ownerId !== x.signerId)
      return "This Guardian belongs to another account.";
    if (call.receiverId !== g.guardianId)
      return "The call goes to a contract other than your Guardian.";
    return null;
  };
  const oneYocto = () => (call.deposit === 1n ? null : "The call must attach exactly 1 yoctoNEAR.");

  let problem: string | null = null;
  switch (intent.kind) {
    case "create": {
      if (g) return refuse("This account already has a Guardian.");
      if (call.receiverId !== f.factoryId)
        return refuse("The call goes to a contract other than the configured factory.");
      if (call.gas < MIN_CREATE_GAS) return refuse("Guardian creation needs at least 145 Tgas.");
      if (call.deposit !== intent.funding) return refuse("The funding differs from the review.");
      if (call.deposit < f.minFunding || call.deposit > f.maxFunding)
        return refuse("The funding is outside the factory's limits.");
      if (JSON.stringify(call.args.policy) !== JSON.stringify(policyWire(intent.policy)))
        return refuse("The policy differs from the one you reviewed.");
      break;
    }
    case "claim_refund":
      if (call.receiverId !== f.factoryId)
        return refuse("The call goes to a contract other than the configured factory.");
      problem = oneYocto();
      break;
    case "register": {
      problem = ownGuardian() ?? oneYocto();
      if (problem || !g) break;
      const targetId = registrationTargetId(g, intent.target);
      if (!targetId || call.args.target_id !== targetId)
        return refuse("The registration target is not one of your Guardian's contracts.");
      if (
        intent.storageDeposit <= 0n ||
        intent.storageDeposit > MAX_STORAGE_DEPOSIT_YOCTO ||
        call.args.storage_deposit !== intent.storageDeposit.toString()
      )
        return refuse("The storage deposit is not the expected one.");
      break;
    }
    case "activate": {
      if (!g) return refuse("No Guardian exists for this account yet.");
      if (g.config.ownerId !== x.signerId)
        return refuse("This Guardian belongs to another account.");
      if (
        g.config.activationFee !== f.activationFee ||
        g.config.feeRecipientId !== f.feeRecipientId ||
        g.config.debtTokenId !== f.debtTokenId
      )
        return refuse("The Guardian's fee terms differ from the ones you reviewed.");
      if (call.receiverId !== f.debtTokenId)
        return refuse("The reserve transfer is not for the debt token.");
      if (call.args.receiver_id !== g.guardianId)
        return refuse("The reserve goes to a contract other than your Guardian.");
      if (call.args.msg !== ACTIVATE_MSG) return refuse("The transfer message is not activation.");
      if (
        intent.reserve <= 0n ||
        call.args.amount !== (intent.reserve + f.activationFee).toString()
      )
        return refuse("The amount differs from the reserve plus the activation fee.");
      problem = oneYocto();
      break;
    }
    case "pause":
    case "resume":
    case "deactivate":
      problem = ownGuardian() ?? oneYocto();
      break;
    case "withdraw":
      problem = ownGuardian() ?? oneYocto();
      if (!problem && (intent.amount <= 0n || call.args.amount !== intent.amount.toString()))
        problem = "The withdrawal amount differs from the one you chose.";
      break;
  }
  if (problem) return refuse(problem);

  const value: VerifiedGuardian = Object.freeze({
    intent: intent.kind,
    network: x.network,
    signerId: x.signerId,
    transactions: Object.freeze([Object.freeze({ ...call })]) as VerifiedGuardianTransaction[],
  });
  issued.add(value);
  return { ok: true, value };
}

/** Results this module produced. The signer accepts nothing else (invariant G-UI-1). */
const issued = new WeakSet<VerifiedGuardian>();
export function wasGuardianVerified(value: VerifiedGuardian): boolean {
  return issued.has(value);
}
