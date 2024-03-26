import { type FC, useMemo } from "react";
import { baseSepolia } from "thirdweb/chains";
import { useConnect } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { coinbaseWaaS } from "~/wallet/CoinbaseWaas";
import { smartWallet, type SmartWalletOptions } from "thirdweb/wallets";

type Props = {
  loginBtnLabel?: string;
}
export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const smartWalletOptions: SmartWalletOptions = useMemo(() => {
    return {
      client,
      chain: baseSepolia,
      factoryAddress: SMART_WALLET_FACTORY[baseSepolia.id]!,
      gasless: true,
    }
  }, []);
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