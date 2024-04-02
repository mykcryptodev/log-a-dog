import { type FC, useMemo, useContext, useEffect, useCallback, useState } from "react";
import { useActiveAccount, useConnect } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { smartWallet, type SmartWalletOptions } from "thirdweb/wallets";
import ActiveChainContext from "~/contexts/ActiveChain";
import { useWalletContext } from "@coinbase/waas-sdk-web-react";
import { toViem } from "@coinbase/waas-sdk-viem";
import { ProtocolFamily } from "@coinbase/waas-sdk-web";
import { createWalletClient, http } from "viem";
import { baseSepolia as viemBaseSepolia, base as viemBase } from "viem/chains";
import { viemAdapter } from "thirdweb/adapters/viem";

type Props = {
  loginBtnLabel?: string;
}
export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { waas, user, isCreatingWallet, wallet, isLoggingIn } = useWalletContext();
  const [isConnectingToSmartWallet, setIsConnectingToSmartWallet] = useState<boolean>(false);
  const account = useActiveAccount();

  const smartWalletOptions: SmartWalletOptions = useMemo(() => {
    return {
      client,
      chain: activeChain,
      factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
      gasless: true,
    }
  }, [activeChain]);
  const { connect } = useConnect();

  const connectUser = useCallback(async () => {
    try {
      if (!wallet || !user) return;
      const address = await wallet.addresses.for(ProtocolFamily.EVM);
      const viemAccount = toViem(address);
      const viemChain = activeChain.id === viemBaseSepolia.id ? viemBaseSepolia : viemBase;
  
      const walletClient = createWalletClient({
        account: viemAccount,
        chain: viemChain,
        transport: http(activeChain.rpc),
      });
      const personalAccount = viemAdapter.walletClient.fromViem({ walletClient });
  
      await connect(async () => {
        // connect personal acct to smart wallet
        const aaWallet = smartWallet(smartWalletOptions);
        await aaWallet.connect({ personalAccount, client });
        // return the smart wallet
        return aaWallet;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnectingToSmartWallet(false);
    }
  }, [wallet, user, activeChain.id, activeChain.rpc, connect, smartWalletOptions]);

  useEffect(() => {
    if (wallet && user && !isLoggingIn && !isCreatingWallet && !account) {
      void connectUser();
    }
  }, [wallet, user, isLoggingIn, isCreatingWallet, connectUser, account]);

  // Automatically creating or restoring a wallet for a user.
  useEffect(() => {
    // If the user is not yet logged in, the wallet is already loaded,
    // or the wallet is loading, do nothing.
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if (!user || wallet || isCreatingWallet || account) return;

    try {
      // NOTE: This will trigger a reflow of you component, and `wallet` will be set
      // to the created or restored wallet.
      if (user.hasWallet) {
        void user.restoreFromHostedBackup?.(/* optional user-specified passcode */);
      } else {
        void user.create(/* optional user-specified passcode */);
      }
    } catch (e) {
      // Handle error
      console.error(e);
    }
  }, [user, wallet, isCreatingWallet, account]);

  return (
    <button
      className="btn"
      disabled={isLoggingIn || isConnectingToSmartWallet}
      onClick={async () => {
        if (!waas) return;
        setIsConnectingToSmartWallet(true);
        await waas.login();
      }}
    >
      {(isLoggingIn || isConnectingToSmartWallet) && (
        <div className="loading loading-spinner" />
      )}
      {loginBtnLabel ?? "Login"}
    </button>
  )
};

export default Connect;