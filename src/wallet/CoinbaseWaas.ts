import type { Account, Wallet, WalletMetadata } from "thirdweb/wallets";
import { coinbaseMetadata } from "./CoinbaseWaasMetadata";
import type { Chain } from "thirdweb/chains";
import {
  isHex,
  hexToNumber,
} from "thirdweb";
import { base, baseSepolia, defineChain, getChainMetadata } from "thirdweb/chains";
import { type AsyncStorage } from "node_modules/thirdweb/dist/types/wallets/storage/AsyncStorage.js";
import { InitializeWaas, type Wallet as CoinbaseWaasWalletT, Logout, type User, type Waas } from "@coinbase/waas-sdk-web";
import { type ChainMetadata } from "node_modules/thirdweb/dist/types/chains/types";
import { type LocalAccount, createWalletClient, type Chain as ViemChain, http, type WalletClient } from "viem";
import { baseSepolia as viemBaseSepolia, base as viemBase } from "viem/chains";
import { toViem } from "@coinbase/waas-sdk-viem";
import { ProtocolFamily } from "@coinbase/waas-sdk-web";
import { viemAdapter } from "thirdweb/adapters/viem";
import { COINBASE_WAAS_PROJECT_ID } from "~/constants";
import { DEFAULT_CHAIN } from "~/constants/chains";

/**
 * Options for connecting to the CoinbaseSDK Wallet
 */
export type CoinbaseWaaSConnectionOptions = {
  /**
   * Whether to use Dark theme in the Coinbase Wallet "Onboarding Overlay" popup.
   *
   * This popup is opened when `headlessMode` is set to `true`.
   */
  darkMode?: boolean;

  /**
   * Whether to open Coinbase "Onboarding Overlay" popup or not when connecting to the wallet.
   * By default it is enabled if Coinbase Wallet extension is NOT installed and prompts the users to connect to the Coinbase Wallet mobile app by scanning a QR code
   *
   * If you want to render the QR code yourself, you should set this to `false` and use the `onUri` callback to get the QR code URI and render it in your app.
   * ```ts
   * const account = await wallet.connect({
   *  headlessMode: false,
   *  onUri: (uri) => {
   *    // render the QR code with `uri`
   *    // when user scans the QR code with Coinbase Wallet app, the promise will resolve with the connected account
   *  }
   * })
   * ```
   */
  headlessMode?: boolean;

  /**
   * Whether or not to reload dapp automatically after disconnect, defaults to `true`
   */
  reloadOnDisconnect?: boolean;

  /**
   * If you want the wallet to be connected to a specific blockchain, you can pass a `Chain` object to the `connect` method.
   * This will trigger a chain switch if the wallet provider is not already connected to the specified chain.
   *
   * You can create a `Chain` object using the [`defineChain`](https://portal.thirdweb.com/references/typescript/v5/defineChain) function.
   * At minimum, you need to pass the `id` of the blockchain.
   *
   * ```ts
   * import { defineChain } from "thirdweb";
   * const mumbai = defineChain({
   *  id: 80001,
   * });
   *
   * const address = await wallet.connect({ chain: mumbai })
   */
  chain?: Chain;

  /**
   * This is only relevant when the Coinbase Extension is not installed and you do not want to use the default Coinbase Wallet "Onboarding Overlay" popup.
   *
   * If you want to render the QR code yourself, you need to set `headlessMode` to `false` and use the `onUri` callback to get the QR code URI and render it in your app.
   * ```ts
   * const account = await wallet.connect({
   *  headlessMode: false,
   *  onUri: (uri) => {
   *    // render the QR code with `uri`
   *    // when user scans the QR code with Coinbase Wallet app, the promise will resolve with the connected account
   *  }
   * })
   * ```
   * Callback to be called with QR code URI
   * @param uri - The URI for rendering QR code
   */
  onUri?: (uri: string | null) => void;
};

export type CoinbaseWaasWalletOptions = {
  /**
   * Name of your application. This will be displayed in the Coinbase Wallet app/extension when connecting to your app.
   */
  appName: string;

  /**
   * Chain ID of the blockchain that the wallet should connect to.
   */
  chainId: number;

  /**
   * URL to your application's logo. This will be displayed in the Coinbase Wallet app/extension when connecting to your app.
   */
  appLogoUrl?: string | null;

  /**
   * Storage interface of type [`AsyncStorage`](https://portal.thirdweb.com/references/typescript/v5/AsyncStorage) to save connected wallet data to the storage for auto-connect.
   * If not provided, no wallet data will be saved to the storage by thirdweb SDK
   */
  storage?: AsyncStorage;
};

/**
 * Connect to Coinbase wallet using the Coinbase SDK which allows connecting to Coinbase Wallet extension and Coinbase Wallet Mobile app by scanning a QR code.
 * @param options - Options for connecting to the Coinbase Wallet SDK.
 * Refer to [CoinbaseSDKWalletOptions](https://portal.thirdweb.com/references/typescript/v5/CoinbaseSDKWalletOptions)
 * @example
 * ```ts
 * const wallet = coinbaseSDKWallet({
 *  appName: "My awesome app"
 * })
 * ```
 * @returns A `CoinbaseSDKWallet` instance.
 * @wallet
 */
export function coinbaseWaaS(options: CoinbaseWaasWalletOptions) {
  return new CoinbaseWaasWallet(options);
}

/**
 * Connect to Coinbase wallet using the Coinbase SDK which allows connecting to Coinbase Wallet extension or mobile app.
 */
export class CoinbaseWaasWallet implements Wallet {
  private options: CoinbaseWaasWalletOptions;
  private provider: WalletClient | undefined;
  private chain: Chain | undefined;
  private account?: Account | undefined;
  userId?: string | undefined;
  metadata: WalletMetadata;

  /**
   * Create instance of `CoinbaseSDKWallet`
   * @param options - Options for creating the `CoinbaseSDKWallet` instance.
   * Refer to [CoinbaseSDKWalletOptions](https://portal.thirdweb.com/references/typescript/v5/CoinbaseSDKWalletOptions) for details.
   * @example
   * ```ts
   * const wallet = new CoinbaseSDKWallet({
   *  appName: "My App",
   *  appLogoUrl: "https://path/to/app/logo.png"
   * })
   * ```
   * @returns A `CoinbaseSDKWallet` instance.
   */
  constructor(options: CoinbaseWaasWalletOptions) {
    this.options = options;
    this.chain = defineChain(options.chainId);
    this.metadata = coinbaseMetadata;
  }

  /**
   * Get the `Chain` object of the blockchain that the wallet is connected to.
   * @returns The `Chain` object
   * @example
   * ```ts
   * const chain = wallet.getChain();
   * ```
   */
  getChain(): Chain | undefined {
    return this.chain;
  }

  /**
   * Get the connected `Account`
   * @returns The connected `Account` object
   * @example
   * ```ts
   * const account = wallet.getAccount();
   * ```
   */
  getAccount(): Account | undefined {
    return this.account;
  }

  /**
   * Connect to the Coinbase Wallet extension or mobile app
   * @param options - The options for connecting the wallet.
   * Refer to [CoinbaseSDKWalletConnectionOptions](https://portal.thirdweb.com/references/typescript/v5/CoinbaseSDKWalletConnectionOptions) for details.
   * @example
   * Connect to the Coinbase Wallet Provider with no options.
   * ```ts
   * // no options
   * const address = await wallet.connect()
   * ```
   *
   * If you want the wallet to be connected to a specific blockchain, you can pass a `Chain` object to the `connect` method.
   * This will trigger a chain switch if the wallet provider is not already connected to the specified chain.
   *
   * You can create a `Chain` object using the [`defineChain`](https://portal.thirdweb.com/references/typescript/v5/defineChain) function.
   * At minimum, you need to pass the `id` of the blockchain.
   *
   * ```ts
   * import { defineChain } from "thirdweb";
   * const mumbai = defineChain({
   *  id: 80001,
   * });
   *
   * const address = await wallet.connect({ chain: mumbai })
   * ```
   *
   * If the Coinbase Extension is not installed - By default, the Coinbase Wallet SDK will open the Coinbase Wallet "Onboarding Overlay" popup to prompt the user to connect to the Coinbase Wallet mobile app by scanning a QR code.
   * If you want to render the QR code yourself, you need to set `headlessMode` to `false` and use the `onUri` callback to get the QR code URI and render it in your app.
   * ```ts
   * const account = await wallet.connect({
   *  headlessMode: false,
   *  onUri: (uri) => {
   *    // render the QR code with `uri`
   *    // when user scans the QR code with Coinbase Wallet app, the promise will resolve with the connected account
   *  }
   * })
   * ```
   * @returns A Promise that resolves to connected `Account` object
   */
  async connect() {
    const waas = await InitializeWaas({
      collectAndReportMetrics: true,
      enableHostedBackups: true,
      prod: process.env.NODE_ENV === 'production',
      projectId: COINBASE_WAAS_PROJECT_ID[DEFAULT_CHAIN.id],
    });
    
    // Login the user.
    await waas.auth.login();
    
    const user = waas.auth.user;
    if (!user) {
      throw new Error("No user found");
    }

    // connect the user
    return await this.onConnect(waas, user);
  }

  getUserId() {
    return this.userId;
  }

  /**
   * @internal
   */
  private async initProvider(options: { account: LocalAccount, chain: ViemChain }) {
    const thirdwebRpc = options.chain.id === base.id ? base.rpc : baseSepolia.rpc;

    const walletClient = createWalletClient({
      account: options.account,
      chain: options.chain,
      transport: http(this.chain?.rpc ?? thirdwebRpc),
    });
    this.provider = walletClient;
  }

  /**
   * @internal
   */
  private async onConnect(waas:Waas, user: User) {
    this.userId = user.id;
    
    let wallet: CoinbaseWaasWalletT;
    
    if (waas.wallets.wallet) {
      wallet = waas.wallets.wallet;
    } else if (user.hasWallet) {
      console.log('restoring from hosted backup...');
      wallet = await waas.wallets.restoreFromHostedBackup();
    } else {
      console.log('not restoring...');
      wallet = await waas.wallets.create();
    }
    
    const address = await wallet.addresses.for(ProtocolFamily.EVM);

    if (!address) {
      throw new Error("No accounts found");
    }

    const viemAccount = toViem(address);

    const viemChain = this.chain?.id === viemBaseSepolia.id ? viemBaseSepolia : viemBase;

    await this.initProvider({
      account: viemAccount,
      chain: viemChain,
    });

    const walletClient = createWalletClient({
      account: viemAccount,
      chain: viemChain,
      transport: http(baseSepolia.rpc),
    });
    const account = viemAdapter.walletClient.fromViem({ walletClient });
    this.account = account;
    return account;
  }

  /**
   * Auto connect to the Coinbase wallet. This only succeeds if the Coinbase wallet provider is still connected.
   *
   * Auto connect is useful to avoid asking the user to connect to the wallet provider again on page refresh or revisit.
   * @example
   * ```ts
   * const account = await wallet.autoConnect();
   * ```
   * @returns A Promise that resolves to the connected `Account`
   */
  async autoConnect() {
    const waas = await InitializeWaas({
      collectAndReportMetrics: true,
      enableHostedBackups: true,
      prod: process.env.NODE_ENV === 'production',
      projectId: COINBASE_WAAS_PROJECT_ID[DEFAULT_CHAIN.id],
    });

    const user = waas.auth.user;

    if (!user) {
      throw new Error("No user found");
    }

    return await this.onConnect(waas, user);
  }

  /**
   * Switch the wallet to a different blockchain by passing the `Chain` object of it.
   * If the wallet already has the capability to connect to the blockchain, it will switch to it. If not, Wallet will prompt the user to confirm adding a new blockchain to the wallet.
   * This action may require the user to confirm the switch chain request or add a new blockchain request.
   *
   * This method throws an error if the wallet fails to do the above or user denies the switch chain request or denies adding a new blockchain request.
   *
   * You can create a `Chain` object using the [`defineChain`](https://portal.thirdweb.com/references/typescript/v5/defineChain) function.
   * At minimum, you need to pass the `id` of the blockchain.
   * @param chain - The `Chain` object of the blockchain
   * @example
   * ```ts
   * import { defineChain } from "thirdweb";
   * const mumbai = defineChain({
   *  id: 80001,
   * });
   *
   * await wallet.switchChain(mumbai)
   * ```
   */
  async switchChain(chain: Chain) {
    const provider = this.provider;

    if (!provider) {
      throw new Error("Provider not initialized");
    }

    try {
      await provider.switchChain({ id: chain.id });
      this.onChainChanged(chain.id);
    } catch (error) {
      const apiChain = await getChainMetadata(chain);

      // Indicates chain is not added to provider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      if ((error as any).code === 4902) {
        // try to add the chain
        await provider.addChain({
          chain: {
            id: chain.id,
            name: apiChain.name,
            nativeCurrency: apiChain.nativeCurrency,
            rpcUrls: {
              default: { http: getValidPublicRPCUrl(apiChain) },
            }, // no client id on purpose here
            blockExplorers: {
              default: apiChain?.explorers![0] ?? base.blockExplorers![0] ?? { name: 'base', url: 'http://basescan.org' }            },
          },
        });
      }
    }
  }

  /**
   * NOTE: must be a arrow function
   * @internal
   */
  private onChainChanged = (newChain: number | string) => {
    const chainId = normalizeChainId(newChain);
    this.chain = defineChain(chainId);
  };

  /**
   * NOTE: must be a arrow function
   * @internal
   */
  private onAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      void this.onDisconnect();
    } else {
      // TODO: change account
    }
  };

  /**
   * NOTE: must be a arrow function
   * @internal
   */
  private onDisconnect = async () => {
    const provider = this.provider;
    if (provider) {
      // provider.removeListener("accountsChanged", this.onAccountsChanged);
      // provider.removeListener("chainChanged", this.onChainChanged);
      // provider.removeListener("disconnect", this.onDisconnect);
    }

    await Logout();

    this.account = undefined;
    this.chain = undefined;
    this.userId = undefined;
  };

  /**
   * Disconnect from the Coinbase Wallet
   * @example
   * ```ts
   * await wallet.disconnect()
   * ```
   */
  async disconnect() {
    void this.onDisconnect();
  }
}

function normalizeChainId(chainId: string | number | bigint): number {
  if (typeof chainId === "number") {
    return chainId;
  }
  if (isHex(chainId)) {
    return hexToNumber(chainId);
  }
  if (typeof chainId === "bigint") {
    return Number(chainId);
  }
  return parseInt(chainId, 10);
}

function getValidPublicRPCUrl(chain: ChainMetadata) {
  return getValidChainRPCs(chain).map((rpc) => {
    try {
      const url = new URL(rpc);
      // remove client id from url
      if (url.hostname.endsWith(".thirdweb.com")) {
        url.pathname = "";
        url.search = "";
      }
      return url.toString();
    } catch (e) {
      return rpc;
    }
  });
}

/**
 * Get valid RPCs for given chain
 * @internal
 */
function getValidChainRPCs(
  chain: Pick<ChainMetadata, "rpc" | "chainId">,
  clientId?: string,
  mode: "http" | "ws" = "http",
): string[] {
  const processedRPCs: string[] = [];

  chain.rpc.forEach((rpc) => {
    // exclude RPC if mode mismatch
    if (mode === "http" && !rpc.startsWith("http")) {
      return;
    }

    if (mode === "ws" && !rpc.startsWith("ws")) {
      return;
    }

    // Replace API_KEY placeholder with value
    if (rpc.includes("${THIRDWEB_API_KEY}")) {
      if (clientId) {
        processedRPCs.push(
          rpc.replace("${THIRDWEB_API_KEY}", clientId) +
            (typeof globalThis !== "undefined" && "APP_BUNDLE_ID" in globalThis
              ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                `/?bundleId=${globalThis.APP_BUNDLE_ID}`
              : ""),
        );
      } else {
        // if no client id, let it through with empty string
        // if secretKey is present, it will be used in header
        // if none are passed, will have reduced access
        processedRPCs.push(rpc.replace("${THIRDWEB_API_KEY}", ""));
      }
    }

    // exclude RPCs with unknown placeholder
    else if (rpc.includes("${")) {
      return;
    }

    // add as is
    else {
      processedRPCs.push(rpc);
    }
  });

  if (processedRPCs.length === 0) {
    throw new Error(
      `No RPC available for chainId "${chain.chainId}" with mode ${mode}`,
    );
  }

  return processedRPCs;
}