import { Connector, WalletOptions } from "@thirdweb-dev/wallets";
import { type WalletConfig } from "@thirdweb-dev/react";
import { InitializeWaas, type Wallet, Logout, type Address, type ProtocolFamily } from "@coinbase/waas-sdk-web";
import { ZERO_ADDRESS } from "@ethereum-attestation-service/eas-sdk";
import { createThirdwebClient } from "thirdweb";
import { env } from "~/env";
import { WaasEthersSigner } from "@coinbase/waas-sdk-ethers";
import { type Signer } from "ethers";
import { type Provider } from "ethers";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { base, type Chain } from "thirdweb/chains";

const COINBASE_WAAS_PROJECT_ID = '9418738b-c109-4db5-9ac0-3333e0aabbe9';

const waas = await InitializeWaas({
  collectAndReportMetrics: true,
  enableHostedBackups: true,
  prod: false,
  projectId: COINBASE_WAAS_PROJECT_ID,
});

const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

type CoinbaseWaasConfig = {
  chain: Chain;
}

export class CoinbaseWaaS extends Connector {
  constructor(private chain: Chain) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
    this.chain = chain;
  }

  async connect(): Promise<string> {
    const user = await waas.auth.login();

    let wallet: Wallet;

    if (waas.wallets.wallet) {
      wallet = waas.wallets.wallet;
      console.log("wallet is resumed");
    } else if (user.hasWallet) {
      wallet = await waas.wallets.restoreFromHostedBackup();
      console.log("wallet is restored");
    } else {
      wallet = await waas.wallets.create();
      console.log("wallet is created");
    }
    const addresses = await wallet.addresses.all();
    return addresses[0]?.address as unknown as string;
  }

  disconnect(): Promise<void> {
    return Logout();
  }

  getAddress(): Promise<string> {
    return waas.wallets.wallet?.addresses.all().then((addresses) => 
      addresses[0]?.address as unknown as string
    ) ?? new Promise((resolve) => resolve(ZERO_ADDRESS));
  }

  async getSigner(): Promise<Signer> {
    const addresses = await waas.wallets.wallet?.addresses.all();
    if (!addresses) throw new Error("No address found");
    return new WaasEthersSigner(addresses[0] as unknown as Address<ProtocolFamily>) as unknown as Signer;
  }

  async getProvider(): Promise<Provider> {
    const addresses = await waas.wallets.wallet?.addresses.all();
    if (!addresses) throw new Error("No address found");
    return ethers6Adapter.provider.toEthers(client, this.chain) as Provider;
  }

  isConnected(): Promise<boolean> {
    return waas.wallets.wallet?.addresses.all().then((addresses) =>
      addresses.length > 0
    ) ?? new Promise((resolve) => resolve(false));
  }

  switchChain(_chainId: number): Promise<void> {
    return new Promise((resolve) => resolve());
  };
  setupConnectorListeners(): void {
    return;
  };
  setupListeners(): Promise<void> {
    return new Promise((resolve) => resolve());
  };
  updateChains(_chains: Chain[]): void {
    // Implement your logic here
  };
}


export function coinbaseWaasWallet (options?: CoinbaseWaasConfig) {
  return {
    metadata: {
      id: 'coinbase-waas',
      name: "Coinbase WaaS",
      iconUrl: "ipfs://QmcJBHopbwfJcLqJpX2xEufSS84aLbF7bHavYhaXUcrLaH/coinbase.svg",
    },

    // create and return wallet instance
    create({ client, appMetadata }) {
      return new CoinbaseWaaS({ chain: client });
    }
  };
};
