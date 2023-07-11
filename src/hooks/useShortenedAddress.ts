import { type Address } from "@thirdweb-dev/sdk";

const useShortenedAddress = (addr?: string) => {
  
  const getShortenedAddress = (addr: string | Address | undefined, preChar?: number, postChar?: number) => {
    if (!addr) return '';
    return addr.slice(0, preChar || 4)  + '...' + addr.slice(addr.length - (postChar || 4), addr.length);
  }

  const shortenedAddress = !addr ? "" : getShortenedAddress(addr);

  return { getShortenedAddress, shortenedAddress };
}

export default useShortenedAddress;