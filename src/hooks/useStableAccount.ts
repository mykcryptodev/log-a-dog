import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { useMemo } from "react";

export const useStableAccount = () => {
  const account = useActiveAccount();
  
  const isConnected = !!account;
  const address = account?.address;
  
  return useMemo(() => {
    if (!isConnected) return null;
    
    return {
      address: address!,
      isConnected: true,
    };
  }, [isConnected, address]);
};

export const useStableWallet = () => {
  const wallet = useActiveWallet();
  
  const isConnected = !!wallet;
  const walletId = wallet?.id;
  
  return useMemo(() => {
    if (!isConnected || !wallet) return null;
    
    return {
      id: walletId!,
      isConnected: true,
      wallet, // Keep the full wallet reference - this might cause issues but needed for functionality
    };
  }, [isConnected, walletId, wallet]);
};

export default useStableAccount;