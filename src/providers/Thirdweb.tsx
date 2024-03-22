import { useContext, useEffect, useMemo, useState } from "react";
import { ThirdwebProvider, embeddedWalletConfig, smartWalletConfig, metamaskConfig, coinbaseConfig, walletConnectConfig, type EmbeddedWalletAuth } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { createThirdwebClient, getAddress } from "thirdweb";
import { env } from "~/env";
import { useWalletContext } from "@coinbase/waas-sdk-web-react";
import { toViem } from "@coinbase/waas-sdk-viem";
import { type Address, type ProtocolFamily } from "@coinbase/waas-sdk-web";
import { type WalletConfig } from "node_modules/thirdweb/dist/types/react/core/types/wallets";
import { coinbaseWaasWallet } from "~/wallets/CoinbaseWaaS";
export const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

export const ThirdwebProviderWithActiveChain = ({ children } : { 
  children: React.ReactNode
 }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { waas, user, isCreatingWallet, wallet, isLoggingIn } = useWalletContext();

  const smartWalletOptions = useMemo(() => ({
    chain: activeChain,
    factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
    clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    gasless: true,
  }), [activeChain]);
  
  // Login the user.
  const handleLogin = async () => {
    await waas?.login();
  }

  // Logout the user.
  const handleLogout = async () => {
    await waas?.logout();
  }

  // Automatically creating or restoring a wallet for a user.
  useEffect(() => {
    // If the user is not yet logged in, the wallet is already loaded,
    // or the wallet is loading, do nothing.
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if (!user || wallet || isCreatingWallet) return;

    // NOTE: This will trigger a reflow of you component, and `wallet` will be set
    // to the created or restored wallet.
    if (user.hasWallet) {
      void user.restoreFromHostedBackup?.(/* optional user-specified passcode */);
    } else {
      void user.create(/* optional user-specified passcode */);
    }
  }, [user, wallet, isCreatingWallet]);

  const [address, setAddress] = useState<Address<ProtocolFamily>>();

  useEffect(() => {
    if (wallet) {
      console.log({ wallet });
      void wallet.addresses.all().then((addresses) => {
        setAddress(addresses[0] as unknown as Address<ProtocolFamily>);
      });
    }
  }, [wallet]);

  if (address) {
    console.log({ address });
    const signer = toViem(address) as unknown as WalletConfig;
    console.log({ signer });
    console.log('config',         smartWalletConfig(
      toViem(address) as unknown as WalletConfig, 
      smartWalletOptions
    ),)
  }
  
  return (
    <ThirdwebProvider 
      client={client}
      dappMetadata={{
        name: "Onchain Hotdogs",
        url: "https://logadog.xyz",
        description: "Who can eat the most hotdogs onchain?",
        logoUrl: "/logo.png",
      }}
      wallets={address ? [
        smartWalletConfig(
          coinbaseWaasWallet(), 
          smartWalletOptions
        ),
      ] : []}
    >
      <div>
        {!user && !isLoggingIn && <button onClick={handleLogin}>Login</button>}
        {user && <p>User is logged in!</p>}
        {wallet && <p>Wallet is loaded</p>}
        {user && <button onClick={handleLogout}>Logout</button>}
      </div>
      {children}
    </ThirdwebProvider>
  )
};