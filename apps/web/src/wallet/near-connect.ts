import { validateAccounts } from "./accounts";
import type { AuthAdapter, NearNetwork, WalletConfig } from "./types";

interface AccountWallet {
  getAccounts(options: { network: NearNetwork }): Promise<unknown>;
}
type ConnectionEvent = "wallet:signIn" | "wallet:signOut";

/** Narrow SDK boundary: the adapter never exposes a wallet or signing methods. */
export interface NearConnectSDK {
  connect(): Promise<AccountWallet>;
  getConnectedWallet(): Promise<{ wallet: AccountWallet }>;
  disconnect(wallet: AccountWallet): Promise<void>;
  on(event: ConnectionEvent, changed: () => void): void;
  off(event: ConnectionEvent, changed: () => void): void;
}

export function createNearConnectAdapter(
  config: WalletConfig,
  connector?: NearConnectSDK,
): AuthAdapter {
  let loading: Promise<NearConnectSDK> | undefined;
  function getConnector(): Promise<NearConnectSDK> {
    if (connector) return Promise.resolve(connector);
    if (!loading) {
      loading = (async () => {
        if (typeof window === "undefined") throw new Error("Wallet login requires a browser.");
        // Platform-specific SDK injects DOM styles on import; defer to the browser boundary.
        const { NearConnector } = await import("@hot-labs/near-connect");
        const instance = new NearConnector({
          network: config.network,
          providers: { [config.network]: [config.rpcUrl] },
          autoConnect: false,
        });
        await instance.whenManifestLoaded;
        // SDK 0.12.0 swallows manifest fetch errors into an empty manifest.
        // With no registered wallets, that is unavailable, not a restored logout.
        if (instance.manifest.wallets.length === 0 && instance.wallets.length === 0) {
          throw new Error("Wallet providers are unavailable. Reload to try again.");
        }
        return {
          connect: () => instance.connect(),
          getConnectedWallet: () => instance.getConnectedWallet(),
          async disconnect(wallet) {
            const current = await instance.getConnectedWallet();
            if (current.wallet !== wallet) throw new Error("The connected wallet changed.");
            await instance.disconnect(current.wallet);
          },
          on: (event, changed) => instance.on(event, changed),
          off: (event, changed) => instance.off(event, changed),
        } satisfies NearConnectSDK;
      })();
    }
    return loading;
  }

  async function current(sdk: NearConnectSDK): Promise<AccountWallet | null> {
    try {
      return (await sdk.getConnectedWallet()).wallet;
    } catch (error) {
      // Exact absence messages from getConnectedWallet in the pinned SDK.
      // wallet() is deliberately unused: it masks unexpected provider errors.
      if (
        error instanceof Error &&
        (error.message === "No wallet selected" || error.message === "No accounts found")
      ) {
        return null;
      }
      throw error;
    }
  }

  return {
    method: "near-connect",
    async restore() {
      const sdk = await getConnector();
      const wallet = await current(sdk);
      if (!wallet) return [];
      // getConnectedWallet's internal read omits network; never trust its accounts.
      return validateAccounts(await wallet.getAccounts({ network: config.network }));
    },
    async login() {
      const wallet = await (await getConnector()).connect();
      const accounts = validateAccounts(await wallet.getAccounts({ network: config.network }));
      if (accounts.length === 0) throw new Error("The wallet returned no connected accounts.");
      return accounts;
    },
    async logout() {
      const sdk = await getConnector();
      const wallet = await current(sdk);
      if (wallet) await sdk.disconnect(wallet);
    },
    subscribe(changed) {
      let active = true;
      let attached: NearConnectSDK | undefined;
      const notify = () => {
        if (active) changed();
      };
      void getConnector().then((sdk) => {
        if (!active) return;
        attached = sdk;
        sdk.on("wallet:signIn", notify);
        sdk.on("wallet:signOut", notify);
      }, notify);
      return () => {
        active = false;
        attached?.off("wallet:signIn", notify);
        attached?.off("wallet:signOut", notify);
      };
    },
  };
}
