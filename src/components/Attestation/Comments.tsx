import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, type FC } from "react";
import { Portal } from "~/components/utils/Portal";
import Image from "next/image";
import Link from "next/link";
import { download } from "thirdweb/storage";
import { client } from "~/providers/Thirdweb";
import { type WarpcastResponse } from "~/types/warpcast";
import { getProxiedUrl } from "~/utils/imageProxy";

type Props = {
  logId: string;
  metadataUri: string;
}
export const Comments: FC<Props> = ({ logId, metadataUri }) => {
  const [farcasterHash, setFarcasterHash] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<WarpcastResponse>();
  const [, setError] = useState<string>();

  useEffect(() => {
    const downloadJson = async () => {
      if (!metadataUri) return;
      setIsLoading(true);
      try {
        const metadataResponse = await download({
          client,
          uri: metadataUri,
        });
        const metadata = await metadataResponse.json() as {
          farcasterHash?: string;
        };
        setFarcasterHash(metadata.farcasterHash);

        // originally on backend but it was timing out
        const neynarBaseUrl = 'https://api.neynar.com/v2/farcaster/cast/conversation';
        const params = new URLSearchParams({
          identifier: `https://warpcast.com/${metadata.farcasterHash}`,
          type: 'url',
          reply_depth: '1',
          include_chronological_parent_casts: 'false',
          viewer_fid: '3',
          limit: '10',
        });
        const url = `${neynarBaseUrl}?${params.toString()}`;
  
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'api_key': 'NEYNAR_API_DOCS',
          }
        });
        const data = await response.json() as WarpcastResponse;
        setData(data);
      } catch (e) {
        console.error(e);
        const message = e instanceof Error ? e.message : JSON.stringify(e);
        setError(message);
      } finally {
        setIsLoading(false);
      }
      
    }
    void downloadJson();
  }, [metadataUri]);

  if (!farcasterHash) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <span className="w-4 h-4 bg-base-300 animate-pulse rounded-full" />
        <span className="w-4 h-4 bg-base-300 animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!data) return null;

  return (
    <>
      <label htmlFor={`${logId}-comments`} className="btn btn-ghost btn-xs font-normal flex items-center gap-1">
        <span className="font-semibold">{data?.conversation?.cast?.direct_replies.length}</span>
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
      </label>

      <Portal>
        <input type="checkbox" id={`${logId}-comments`} className="modal-toggle" />
        <div className="modal" role="dialog">
          <div className="modal-box relative">
            <label htmlFor={`${logId}-comments`} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
              <XMarkIcon className="h-4 w-4" />
            </label>
            <div className="flex w-full flex-col items-start pb-4">
              <h3 className="font-bold text-lg gap-2 flex items-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 stroke-2" />
                Comments
              </h3>
              <Link 
                href={`https://warpcast.com/${data?.conversation?.cast?.author.username}/${data?.conversation?.cast?.hash}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-xs self-end"
              >
                Join the conversation
              </Link>
            </div>
            <div className="flex flex-col">
              <div className="flex items-start gap-2">
                <Image
                  src={getProxiedUrl(data?.conversation?.cast?.author.pfp_url ?? "")}
                  alt="Profile Picture"
                  width={60}
                  height={60}
                  className="rounded-full h-8 w-8 object-cover"
                  />
                <div>
                  <h4 className="font-semibold">{data?.conversation?.cast?.author.username}</h4>
                  <p>{data?.conversation?.cast?.text}</p>
                </div>
              </div>
              <div className="divider my-2" />
              <div className="flex flex-col gap-6 max-h-96 overflow-y-auto rounded-lg p-2">
                {data?.conversation?.cast?.direct_replies.map((reply, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Image
                      src={getProxiedUrl(reply.author.pfp_url ?? "")}
                      alt="Profile Picture"
                      width={60}
                      height={60}
                      className="rounded-full h-8 w-8 object-cover"
                    />
                    <div>
                      <h4 className="font-semibold">{reply.author.display_name}</h4>
                      <p>{reply.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-action">
              <label htmlFor={`${logId}-comments`} className="btn">Close</label>
            </div>
          </div>
        </div>
      </Portal>
    </>
  )
};

export default Comments;