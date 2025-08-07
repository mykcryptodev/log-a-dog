import { useMemo, useEffect } from "react";
import { CommentsEmbed } from "@ecp.eth/sdk/embed";
import type { Account } from "thirdweb/wallets";

interface EthCommentsProps {
  account?: Account | null;
}

export function EthComments({ account }: EthCommentsProps = {}) {
  const uri = useMemo(
    () => {
      if (typeof window !== 'undefined') {
        return new URL(window.location.pathname, "https://logadog.xyz");
      }
      return new URL("https://logadog.xyz");
    },
    []
  );

  // Send wallet info to iframe when component mounts and account is available
  useEffect(() => {
    if (account?.address) {
      const timer = setTimeout(() => {
        const iframe = document.querySelector('iframe[src*="ecp.eth"], iframe[src*="ethcomments"]');
        if (iframe && 'contentWindow' in iframe) {
          const iframeElement = iframe as HTMLIFrameElement;
          iframeElement.contentWindow?.postMessage({
            type: 'walletConnected',
            address: account.address,
          }, '*');
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [account]);

  return (
    <div className="w-full">
      {account?.address && (
        <div className="mb-2 text-xs text-success flex items-center gap-1">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Connected as {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </div>
      )}
      <CommentsEmbed uri={uri} theme={{ mode: "light" }} />
    </div>
  );
}

export default EthComments;
