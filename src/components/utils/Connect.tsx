import { useState, useEffect, type FC, useCallback, useMemo } from "react";
import { base, baseSepolia } from "thirdweb/chains";
import { ConnectButton, smartWalletConfig, useActiveAccount, useConnect, useIsAutoConnecting } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { coinbaseWaasConfig } from "~/wallet/CoinbaseWaasConfig";
import { coinbaseWaaS } from "~/wallet/CoinbaseWaas";
import { type Account, smartWallet, type SmartWalletOptions } from "thirdweb/wallets";
import { api } from "~/utils/api";
import { type VerifyLoginPayloadParams, signLoginPayload, type LoginPayload } from "thirdweb/auth";
import { AutoConnect } from "thirdweb/react";
import { env } from "~/env";

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
  const isAutoConnecting = useIsAutoConnecting();
  console.log({ isAutoConnecting });

  return (
    <>
      {/* <AutoConnect
        client={client}
        wallets={[
          coinbaseWaasConfig(),
        ]}
        appMetadata={{
          name: "Log a Dog",
          url: "https://logadog.xyz",
        }}
      /> */}
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
    </>
  )
};

export default Connect;