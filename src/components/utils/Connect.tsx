import { type FC, useMemo, useContext } from "react";
import { useConnect } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { coinbaseWaaS } from "~/wallet/CoinbaseWaas";
import { smartWallet, type SmartWalletOptions } from "thirdweb/wallets";
import ActiveChainContext from "~/contexts/ActiveChain";

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
  const { connect, isConnecting } = useConnect();

  return (
    <button
      className="btn"
      disabled={isConnecting}
      onClick={() =>
        connect(async () => {
          // instantiate wallet
          const wallet = coinbaseWaaS({
            appName: "Log a Dog",
            chainId: activeChain.id,
          });
          // connect wallet
          const personalAccount = await wallet.connect();
          
          // connect personal acct to smart wallet
          const aaWallet = smartWallet(smartWalletOptions);
          await aaWallet.connect({ personalAccount });

          // return the smart wallet
          return aaWallet;
        })
      }
    >
      {isConnecting && (<div className="loading loading-spinner" />)}
      {loginBtnLabel ?? "Login"}
    </button>
  )
};

export default Connect;