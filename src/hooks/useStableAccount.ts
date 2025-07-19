import { useActiveAccount } from "thirdweb/react";
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

export default useStableAccount;