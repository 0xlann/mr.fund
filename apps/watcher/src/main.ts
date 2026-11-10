import { readWatcherConfig } from "./runtime/config";
import { loadWatcherKey } from "./runtime/keys";
import { createWatcherProvider } from "./runtime/near-signer";
import { createWatcherReads } from "./runtime/reads";
import { startWatcher } from "./runtime/start";

async function main() {
  const config = readWatcherConfig(process.env, process.argv.slice(2));
  const key = await loadWatcherKey({
    directory: config.keysDirectory,
    guardianId: config.guardianId,
    watcherAccountId: config.watcherAccountId,
    network: config.network,
  });
  await startWatcher({
    config,
    key,
    provider: createWatcherProvider(config.rpcUrl),
    reads: createWatcherReads(config.network, config.rpcUrl),
    write: (line) => process.stdout.write(`${line}\n`),
  });
}

main().catch(() => {
  // Never print a path, RPC error, key or exception from a provider.
  process.stderr.write('{"event":"startup_failed"}\n');
  process.exitCode = 1;
});
