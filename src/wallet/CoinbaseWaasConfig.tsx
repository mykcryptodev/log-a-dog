import { coinbaseMetadata } from "~/wallet/CoinbaseWaasMetadata"
import { type WalletConfig } from "node_modules/thirdweb/dist/types/react/core/types/wallets.js";
import { coinbaseWaaS } from "~/wallet/CoinbaseWaas";

export type CoinbaseConfigOptions = {
  /**
   * If `true`, Coinbase Wallet will be shown as "recommended" to the user in [`ConnectButton`](https://portal.thirdweb.com/typescript/v5/react/components/ConnectButton)
   * or [`ConnectEmbed`](https://portal.thirdweb.com/typescript/v5/react/components/ConnectEmbed) 's UI
   */
  recommended?: boolean;
};

/**
 * Integrate Coinbase wallet connection in
 * [`ConnectButton`](https://portal.thirdweb.com/typescript/v5/react/components/ConnectButton)
 * or [`ConnectEmbed`](https://portal.thirdweb.com/typescript/v5/react/components/ConnectEmbed) by adding it in the `wallets` prop.
 * @param options - Options for configuring the Coinbase wallet.
 * Refer to [`CoinbaseConfigOptions`](https://portal.thirdweb.com/references/typescript/v5/MetamaskConfigOptions) for more details.
 * @example
 * ```tsx
 * import { ConnectButton, coinbaseConfig } from "thirdweb/react";
 *
 * function Example() {
 *   return (
 *     <ConnectButton
 *      client={client}
 *      wallets={[coinbaseConfig()]}
 *      appMetadata={appMetadata}
 *     />
 *   );
 * }
 * ```
 * @returns `WalletConfig` object which can be added to the `wallets` prop in either `ConnectButton` or `ConnectEmbed` component.
 * @walletConfig
 */
export const coinbaseWaasConfig = (
  options?: CoinbaseConfigOptions,
): WalletConfig => {
  return {
    recommended: options?.recommended,
    metadata: coinbaseMetadata,
    create(createOptions) {
      return coinbaseWaaS({
        appName: createOptions.appMetadata.name,
      });
    },
    isInstalled() {
      return true;
    },
  };
};