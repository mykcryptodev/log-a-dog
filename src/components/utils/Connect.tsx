import { useWalletContext } from "@coinbase/waas-sdk-web-react";
import { type FC } from "react";
import { useConnect } from "thirdweb/react";

export const Connect: FC = () => {
  const { connect, isConnecting, error } = useConnect();
  const { waas, user, isCreatingWallet, wallet, isLoggingIn } = useWalletContext();
  
  return (
    <button
      onClick={() =>
        connect(async () => {
          // instantiate wallet
          const wallet = metamaskWallet();
          // connect wallet
          await wallet.connect();
          // return the wallet
          return wallet;
        })
      }
    >
      Connect
    </button>
  );
}

export default Connect;
