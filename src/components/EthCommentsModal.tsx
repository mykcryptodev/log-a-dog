import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo } from "react";
import { Portal } from "~/components/utils/Portal";
import CustomComments from "~/components/CustomComments";
import useMounted from "~/hooks/useMounted";
import type { Account } from "thirdweb/wallets";
import { DEFAULT_CHAIN } from "~/constants";

interface EthCommentsModalProps {
  logId: string;
  account?: Account | null;
}

export const EthCommentsModal: React.FC<EthCommentsModalProps> = ({ logId, account }) => {
  const [commentCount, setCommentCount] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mounted = useMounted();
  
  const targetUri = useMemo(
    () => {
      if (typeof window !== 'undefined') {
        return `https://logadog.xyz${window.location.pathname}`;
      }
      return `https://logadog.xyz/dog/${logId}`;
    },
    [logId]
  );

  // Fetch comment count using our GraphQL API
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const params = new URLSearchParams({
          targetUri,
          limit: "1", // We just need the totalCount
        });

        const response = await fetch(`/api/comments?${params.toString()}`);
        if (response.ok) {
          const result = await response.json() as {
            pagination: { totalCount: number };
          };
          setCommentCount(result.pagination.totalCount);
        }
      } catch (error) {
        console.error("Error fetching comment count:", error);
      }
    };

    if (mounted) {
      void fetchCommentCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchCommentCount, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted, targetUri]);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        <span className="w-4 h-4 bg-base-300 animate-pulse rounded-full" />
        <span className="w-4 h-4 bg-base-300 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={handleModalToggle}
        className="btn btn-circle btn-ghost relative hover:bg-base-200 transition-colors group"
        aria-label="Open comments"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
        {commentCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center font-bold bg-opacity-50">
            {commentCount > 99 ? '99+' : commentCount}
          </span>
        )}
      </button>

      <Portal>
        {isModalOpen && (
          <div className="modal modal-open" role="dialog">
            <div 
              className="modal-backdrop" 
              onClick={handleModalToggle}
            />
            <div className="modal-box relative max-w-3xl h-[80vh] flex flex-col">
              <button 
                className="btn btn-ghost btn-circle btn-sm absolute top-4 right-4 z-10"
                onClick={handleModalToggle}
                aria-label="Close comments"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            
              <div className="flex w-full flex-col items-start pb-4">
                <h3 className="font-bold text-lg gap-2 flex items-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 stroke-2" />
                  Comments
                </h3>
                <p className="text-sm text-base-content/70 mt-1">
                  Join the conversation about this dog
                </p>
                {account?.address && (
                  <div className="mt-2 text-xs text-success flex items-center gap-1">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    Connected as {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </div>
                )}
              </div>
            
              <div className="flex-1 overflow-y-auto px-2">
                <CustomComments 
                  targetUri={targetUri}
                  logId={logId}
                />
              </div>
            </div>
          </div>
        )}
      </Portal>
    </>
  );
};

export default EthCommentsModal;
