import { BellIcon, BellSlashIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useCallback, useContext, useMemo, type FC } from "react";
import { toast } from "react-toastify";
import { FarcasterContext } from "~/providers/Farcaster";
import { api } from "~/utils/api";

type Props = {
  className?: string;
}

export const NotificationsSettings: FC<Props> = ({ className }) => {
  const { data: sessionData, status: sessionStatus } = useSession();
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;
  const utils = api.useUtils();
  
  const userAddress = sessionData?.user?.address;
  const isSessionLoading = sessionStatus === "loading";
  
  // Use server state as single source of truth
  const { 
    data: notificationState, 
    refetch: refetchNotificationState,
    isLoading 
  } = api.user.getNotificationState.useQuery(
    { address: userAddress ?? "" },
    { 
      enabled: !!userAddress,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    }
  );

  const { mutateAsync: toggleNotifications } = api.user.toggleNotifications.useMutation({
    // Optimistic update for immediate UI feedback
    onMutate: async (variables) => {
      const input = { address: userAddress ?? "" };
      
      // Cancel outgoing refetches
      await utils.user.getNotificationState.cancel(input);
      
      // Snapshot the previous value
      const previousState = utils.user.getNotificationState.getData(input);
      
      // Optimistically update to the new value
      utils.user.getNotificationState.setData(input, variables.enabled);
      
      // Return context with the snapshotted value
      return { previousState, input };
    },
    onError: (err, variables, context) => {
      // Revert to previous state on error
      if (context?.previousState !== undefined && context?.input) {
        utils.user.getNotificationState.setData(context.input, context.previousState);
      }
      toast.error(`Failed to toggle notifications: ${err instanceof Error ? err.message : String(err)}`);
    },
    onSuccess: (data, variables) => {
      toast(variables.enabled ? "🔔 Notifications on!" : "🔕 Notifications off!");
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
      void refetchNotificationState();
    },
  });

  const hasAddedMiniApp = useMemo(() => {
    return farcaster?.context?.client?.added ?? false;
  }, [farcaster?.context?.client?.added]);

  const handleToggle = useCallback(async (checked: boolean) => {
    if (!userAddress || isSessionLoading) {
      toast.error("Please sign in to manage notifications");
      return;
    }
    
    if (!hasAddedMiniApp && checked) {
      try {
        await farcaster?.addMiniApp();
      } catch (error) {
        toast.error(`Failed to add mini app: ${error instanceof Error ? error.message : String(error)}`);
        return; // Don't proceed if mini app addition fails
      }
    }
    
    try {
      await toggleNotifications({ enabled: checked });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error('Toggle notifications error:', error);
    }
  }, [hasAddedMiniApp, farcaster, toggleNotifications, userAddress, isSessionLoading]);

  const handleAddMiniApp = useCallback(async () => {
    try {
      await farcaster?.addMiniApp();
    } catch (error) {
      toast.error(`Failed to add mini app: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [farcaster]);

  if (!isMiniApp || !userAddress) return null;

  // Use server state directly, with loading fallback
  const isEnabled = notificationState ?? false;
  const isDisabled = isLoading || isSessionLoading;

  if (!hasAddedMiniApp) {
    return (
      <div className="flex items-center gap-2" onClick={handleAddMiniApp}>
        <BellIcon className={`w-4 h-4 ${className} ${isDisabled ? 'opacity-50' : ''}`} />
      </div>
    );
  }

  return (
    <label className="swap">
      <input 
        type="checkbox" 
        checked={isEnabled}
        disabled={isDisabled}
        onChange={(e) => handleToggle(e.target.checked)}
      />
      <div className="swap-on">
        <BellIcon className={`w-4 h-4 ${className} ${isDisabled ? 'opacity-50' : ''}`} />
      </div>
      <div className="swap-off">
        <BellSlashIcon className={`w-4 h-4 ${className} ${isDisabled ? 'opacity-50' : ''}`} />
      </div>
    </label>
  );
};