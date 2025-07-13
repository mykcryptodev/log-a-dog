import { sdk } from "@farcaster/frame-sdk";
import Image from "next/image";
import { useContext, type FC } from "react";
import { FarcasterContext } from "~/providers/Farcaster";

export const Share: FC<{ logId: string }> = ({ logId }) => {
  const farcaster = useContext(FarcasterContext);
  const shareUrl = `https://logadog.xyz/dog/${logId}`;
  const text = 'Check out this hotdog on Log a Dog!';

  const shareToX = () => {
    const url = `https://x.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToFarcaster = async () => {
    if (farcaster?.isMiniApp) {
      try {
        await sdk.actions.composeCast({ text, embeds: [shareUrl] });
      } catch (err) {
        console.error('Failed to compose cast', err);
      }
    } else {
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <button className="btn btn-ghost btn-xs p-1" onClick={shareToX}>
        <Image src="/images/x.svg" alt="Share to X" width={16} height={16} />
      </button>
      <button className="btn btn-ghost btn-xs p-1" onClick={() => void shareToFarcaster()}>
        <Image src="/images/farcaster.svg" alt="Share to Farcaster" width={16} height={16} />
      </button>
    </>
  );
};

export default Share;
