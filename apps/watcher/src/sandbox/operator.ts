import { createGuardianClient, readGuardian } from "@mrfund/guardian-client";
import { err } from "@mrfund/shared";
import {
  Account,
  actions,
  baseEncode,
  JsonRpcProvider,
  KeyPairSigner,
  type KeyPairString,
} from "near-api-js";
import {
  constrainedRequester,
  REQUEST_GAS,
  REQUEST_METHOD,
  type VerifiedAuthority,
} from "../core/authority";
import type { WatcherReads } from "../core/types";
import { requestOverLimit } from "../runtime/operator";
import { createGuardedSignerPort } from "../runtime/signer-port";

/** Sandbox test harness only. It must use a freshly created, disposable scoped key. */
export async function sandboxOverLimit(input: {
  rpcUrl: string;
  guardianId: string;
  watcherId: string;
  secretKey: KeyPairString;
}) {
  const url = new URL(input.rpcUrl);
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Sandbox loopback endpoint required");
  const provider = new JsonRpcProvider({ url: url.toString() }, { retries: 1 });
  const signer = KeyPairSigner.fromSecretKey(input.secretKey);
  const publicKey = (await signer.getPublicKey()).toString();
  // The client network field is a parser tag only; this is never public evidence.
  const target = { network: "mainnet" as const, guardianId: input.guardianId };
  const view = createGuardianClient(url.toString(), (url, init) =>
    fetch(url, { ...init, redirect: "error" }),
  );
  const reads: WatcherReads = {
    guardian: (requested) => readGuardian(view, requested),
    position: async () =>
      err({ kind: "rpc_unavailable", detail: "sandbox operator does not read positions" }),
  };
  const verify = async () => {
    const [node, key, guardian] = await Promise.all([
      provider.viewNodeStatus(),
      provider.viewAccessKey({
        accountId: input.watcherId,
        publicKey,
        finalityQuery: { finality: "final" },
      }),
      reads.guardian(target),
    ]);
    if (
      !/^test-chain-[A-Za-z0-9]+$/.test(node.chain_id) ||
      !guardian.ok ||
      guardian.value.config.watcherId !== input.watcherId
    )
      return false;
    const permission = key.permission as unknown as {
      FunctionCall?: { receiver_id?: unknown; method_names?: unknown; allowance?: unknown };
    };
    const call = permission?.FunctionCall;
    return (
      !!call &&
      call.receiver_id === input.guardianId &&
      Array.isArray(call.method_names) &&
      call.method_names.length === 1 &&
      call.method_names[0] === REQUEST_METHOD &&
      typeof call.allowance === "string" &&
      /^[1-9][0-9]*$/.test(call.allowance)
    );
  };
  if (!(await verify())) throw new Error("Sandbox authority invalid");
  const authority: VerifiedAuthority = {
    network: target.network,
    watcherAccountId: input.watcherId,
    guardianId: input.guardianId,
    allowance: 1n,
  };
  const account = new Account(input.watcherId, provider);
  const port = createGuardedSignerPort(authority, {
    verify,
    submissionAllowed: () => true,
    async sign(call) {
      const transaction = await account.createTransaction({
        receiverId: call.receiverId,
        publicKey,
        actions: [actions.functionCall(REQUEST_METHOD, call.args, REQUEST_GAS, 0n)],
      });
      const result = await signer.signTransaction(transaction);
      return { hash: baseEncode(result.txHash), signed: result.signedTransaction };
    },
    async broadcast(signed) {
      await provider.sendTransactionUntil(signed, "NONE");
    },
    async lookup() {
      return { kind: "unknown" };
    },
  });
  return requestOverLimit({
    target,
    reads,
    requester: constrainedRequester(authority, port),
    startup: { kind: "clear" },
    nowMs: Date.now(),
    authorized: true,
  });
}
