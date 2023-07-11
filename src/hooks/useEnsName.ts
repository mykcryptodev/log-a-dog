import { useSigner } from "@thirdweb-dev/react";
import { useEffect, useState } from "react";

const useEnsName = (address: string) => {
  const signer = useSigner();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<string | null | undefined>(null);

  useEffect(() => {
    const fetchEnsName = async () => {
      try {
        const name = await signer?.provider?.lookupAddress(address || "");
        setData(name);
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchEnsName();
  }, [address, signer]);

  return { isLoading, error, data };
}

export default useEnsName;