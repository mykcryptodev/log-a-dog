import { type FC, useMemo, useContext, useState } from "react";
import { useConnect } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { smartWallet, type SmartWalletOptions } from "thirdweb/wallets";
import ActiveChainContext from "~/contexts/ActiveChain";
import { toViem } from "@coinbase/waas-sdk-viem";
import { ProtocolFamily } from "@coinbase/waas-sdk-web";
import { createWalletClient, http } from "viem";
import { baseSepolia as viemBaseSepolia, base as viemBase } from "viem/chains";
import { viemAdapter } from "thirdweb/adapters/viem";
import { InitializeWaas, type Wallet } from "@coinbase/waas-sdk-web";
import { COINBASE_WAAS_PROJECT_ID } from "~/constants";

type Props = {
  loginBtnLabel?: string;
}
export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const { activeChain } = useContext(ActiveChainContext);

  const smartWalletOptions: SmartWalletOptions = useMemo(() => {
    return {
      client,
      chain: activeChain,
      factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
      gasless: true,
    }
  }, [activeChain]);
  const { connect } = useConnect();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  return (
    <button
      className="btn"
      disabled={isConnecting}
      onClick={async () => {
        setIsConnecting(true);
        // connect embedded wallet
        const waas = await InitializeWaas({
          collectAndReportMetrics: true,
          enableHostedBackups: true, // DO NOT CHANGE THIS TO FALSE
          projectId: COINBASE_WAAS_PROJECT_ID[activeChain.id],
          prod: process.env.NODE_ENV === "production",
        });
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
        if (!wallet) return;
        // convert the wallet to viem
        const address = await wallet.addresses.for(ProtocolFamily.EVM);
        const viemAccount = toViem(address);
        const viemChain = activeChain.id === viemBaseSepolia.id ? viemBaseSepolia : viemBase;
  
        const walletClient = createWalletClient({
          account: viemAccount,
          chain: viemChain,
          transport: http(activeChain.rpc),
        });
        // convert the viem account to personal account
        const personalAccount = viemAdapter.walletClient.fromViem({ walletClient });
        // connect the smart wallet and return the smart account
        return await connect(async () => {
          // connect personal acct to smart wallet
          const aaWallet = smartWallet(smartWalletOptions);
          await aaWallet.connect({ personalAccount, client });
          // return the smart wallet
          return aaWallet;
        });
      }}
    >
      {isConnecting && (
        <div className="loading loading-spinner" />
      )}
      {loginBtnLabel ?? "Login"}
    </button>
  )
};

export default Connect;