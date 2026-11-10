import type { JsonRpcProvider, KeyPairSigner } from "near-api-js";
import { constrainedRequester } from "../core/authority";
import { createWatcher } from "../core/loop";
import type { WatcherReads } from "../core/types";
import { inspectWatcherAuthority } from "./authority";
import type { WatcherConfig } from "./config";
import { runWatcher } from "./lifecycle";
import { createRuntimeLog } from "./log";
import { createNearSignerPort } from "./near-signer";

/** Runtime remains read-only until separately authorized public and restart evidence exists. */
export async function startWatcher(input: {
  config: WatcherConfig;
  provider: JsonRpcProvider;
  reads: WatcherReads;
  key: { publicKey: string; signer: KeyPairSigner };
  write(line: string): void;
}) {
  const target = { network: input.config.network, guardianId: input.config.guardianId };
  const checked = await inspectWatcherAuthority({
    target,
    watcherAccountId: input.config.watcherAccountId,
    publicKey: input.key.publicKey,
    provider: input.provider,
    reads: input.reads,
  });
  if (!checked.ok) throw new Error("Watcher authority could not be verified");
  const log = createRuntimeLog(input.write);
  const signer = createNearSignerPort({
    target,
    authority: checked.value.authority,
    publicKey: input.key.publicKey,
    signer: input.key.signer,
    provider: input.provider,
    reads: input.reads,
    submissionAllowed: () => false,
  });
  const watcher = createWatcher({
    guardians: [
      {
        target,
        requester: constrainedRequester(checked.value.authority, signer),
        startup: async () => checked.value.startup,
      },
    ],
    reads: input.reads,
    clock: { now: Date.now },
    log: log.event,
  });
  return { watcher, stop: runWatcher(watcher, log) };
}
