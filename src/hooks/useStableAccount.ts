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
    if (!isConnected) return null;
    
    // Return a stable object that doesn't change reference unless connection state changes
    return {
      id: walletId!,
      isConnected: true,
      // Only include essential methods to avoid reference changes
      exists: true,
    };
  }, [isConnected, walletId]);
};

export default useStableAccount;