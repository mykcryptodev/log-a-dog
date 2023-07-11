import { type Address } from "@thirdweb-dev/sdk";

const useShortenedAddress = (addr?: string) => {
  
  const getShortenedAddress = (addr: string | Address | undefined, preChar?: number) => {
    if (!addr) return '';
    return 'user' + addr.slice(0, preChar || 6);//  + '...' + addr.slice(addr.length - (postChar || 4), addr.length);
  }

  const shortenedAddress = !addr ? "" : getShortenedAddress(addr);

  return { getShortenedAddress, shortenedAddress };
}

export default useShortenedAddress;