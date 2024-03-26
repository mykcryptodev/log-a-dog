import { useState, useEffect, type FC } from "react";
import { base, baseSepolia } from "thirdweb/chains";
import { ConnectButton, smartWalletConfig, useConnect } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { coinbaseWaasConfig } from "~/wallet/CoinbaseWaasConfig";
import { coinbaseWaaS } from "~/wallet/CoinbaseWaas";
import { type Account, smartWallet, type SmartWalletOptions } from "thirdweb/wallets";
import { api } from "~/utils/api";
import { type VerifyLoginPayloadParams, signLoginPayload, type LoginPayload } from "thirdweb/auth";

type Props = {
  loginBtnLabel?: string;
}
export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const smartWalletOptions: SmartWalletOptions = {
    client,
    chain: baseSepolia,
    factoryAddress: SMART_WALLET_FACTORY[baseSepolia.id]!,
    gasless: true,
  }
  const { connect, isConnecting, error } = useConnect();
  const [personalAccount, setPersonalAccount] = useState<Account>();

  // persist the login locally
  const { data: loginPayload } = api.auth.receivePayload.useQuery({
    address: personalAccount?.address ?? "",
  }, {
    enabled: !!personalAccount?.address,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const [signedPayload, setSignedPayload] = useState<VerifyLoginPayloadParams>();
  const { data: authTokens } = api.auth.receiveToken.useQuery({
    payload: signedPayload,
  }, {
    enabled: !!signedPayload,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  console.log({ loginPayload, authTokens });

  useEffect(() => {
    const sign = async () => {
      if (loginPayload && personalAccount) {
        const { signature, payload } = await signLoginPayload({
          payload: loginPayload,
          account: personalAccount,
        });
        console.log({ signature, payload, account: personalAccount });
        setSignedPayload({ payload, signature });
      }
    }
    if (!personalAccount || !loginPayload) return;
    void sign();
  }, [personalAccount, loginPayload]);

  useEffect(() => {
    if (document && authTokens) {
      document.cookie = `logDogXyz=${authTokens.jwt}; Path=/; HttpOnly; Secure; SameSite=Strict`;
    }
  }, [authTokens]);

  return (
    <button
      className="btn"
      onClick={() =>
        connect(async () => {
          // instantiate wallet
          const wallet = coinbaseWaaS({
            appName: "Log a Dog",
          });
          // connect wallet
          const personalAccount = await wallet.connect();
          const userId = wallet.userId;
          console.log({ userId });
          setPersonalAccount(wallet.getAccount());

          // persist connection
          try {
            const loginPayloadRes = await fetch('/api/persist/generatePayload', {
              method: "POST",
              body: JSON.stringify({ address: personalAccount.address }),
              headers: {
                'Content-Type': 'application/json'
              },
            });
            const loginPayloadJson = await loginPayloadRes.json() as LoginPayload;
            console.log({ loginPayloadJson });
            const { signature, payload } = await signLoginPayload({
              payload: loginPayloadJson,
              account: personalAccount,
            });
            const jwtRes = await fetch('/api/persist/generateJwt', {
              method: "POST",
              body: JSON.stringify({ 
                payload: { payload, signature },
                userId,
              }),
              headers: {
                'Content-Type': 'application/json'
              },
            });
            const jwtJson = await jwtRes.json() as { jwt: string };
            console.log({ jwtJson });
            document.cookie = `logDogXyz=${jwtJson.jwt}; Path=/; HttpOnly; Secure; SameSite=Strict`;
          } catch (e) {
            console.log('not persisting');
          }
          
          // connect personal acct to smart wallet
          const aaWallet = smartWallet(smartWalletOptions);
          await aaWallet.connect({ personalAccount });

          // return the smart wallet
          return aaWallet;
        })
      }
    >
      {isConnecting && (<div className="loading loading-spinner" />)}
      Connect
    </button>
  )
  
  return (
    <ConnectButton 
      connectButton={{
        label: loginBtnLabel ?? "Login"
      }}
      connectModal={{
        title: "Login to Log a Dog",
        showThirdwebBranding: false,
        titleIcon: "https://logadog.xyz/images/logo.png",
      }} 
      client={client} 
      appMetadata={{
        name: "Log a Dog",
        url: "https://logadog.xyz",
        description: "Who can eat the most hotdogs onchain?",
        logoUrl: "https://logadog.xyz/images/logo.png"
      }}
      wallets={[
        smartWalletConfig(
          coinbaseWaasConfig(), smartWalletOptions
        ),
      ]}
      chain={baseSepolia}
    />
  );
};

export default Connect;