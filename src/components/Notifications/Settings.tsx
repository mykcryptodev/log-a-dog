import { BellIcon, BellSlashIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useCallback, useContext, useMemo, useState, useEffect, type FC } from "react";
import { toast } from "react-toastify";
import { FarcasterContext } from "~/providers/Farcaster";
import { api } from "~/utils/api";
import { sdk } from "@farcaster/frame-sdk";

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
      // Close modal after successful notification toggle
      (document.getElementById('add_mini_app_modal') as HTMLDialogElement)?.close();
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
      void refetchNotificationState();
    },
  });

  const hasAddedMiniApp = useMemo(() => {
    return farcaster?.context?.client?.added ?? false;
  }, [farcaster?.context?.client?.added]);

  // Derive current step from mini app status instead of using useEffect
  const effectiveCurrentStep = hasAddedMiniApp ? 2 : 1;

  const handleToggle = useCallback(async (checked: boolean) => {
    if (!userAddress || isSessionLoading) {
      toast.error("Please sign in to manage notifications");
      return;
    }
    
    if (!hasAddedMiniApp && checked) {
      try {
        await sdk.actions.addFrame();
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
  }, [hasAddedMiniApp, toggleNotifications, userAddress, isSessionLoading]);

  const handleAddMiniApp = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
      // Step will automatically update when hasAddedMiniApp changes
    } catch (error) {
      toast.error(`Failed to add mini app: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    try {
      await toggleNotifications({ enabled: true });
    } catch (error) {
      console.error('Enable notifications error:', error);
    }
  }, [toggleNotifications]);

  const handleShowModal = useCallback(() => {
    // Step is automatically derived from hasAddedMiniApp
    (document.getElementById('add_mini_app_modal') as HTMLDialogElement)?.showModal();
  }, []);

  if (!isMiniApp || !userAddress) return null;

  // Use server state directly, with loading fallback
  const isEnabled = notificationState ?? false;
  const isDisabled = isLoading || isSessionLoading;

  if (!hasAddedMiniApp || !isEnabled) {
    return (
      <>
        <div className="flex items-center gap-2" onClick={handleShowModal}>
          <BellIcon className={`w-4 h-4 ${className} ${isDisabled ? 'opacity-50' : ''}`} />
        </div>

        <dialog id="add_mini_app_modal" className="modal modal-bottom sm:modal-middle">
          <div className="modal-box relative bg-base-200 bg-opacity-60 backdrop-blur-lg shadow">
            <button 
              className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4"
              onClick={()=>(document.getElementById('add_mini_app_modal') as HTMLDialogElement)?.close()}
            >
              &times;
            </button>
            
            <h3 className="font-bold text-2xl mb-4">Get Notified</h3>
            
            {/* Stepper */}
            <ul className="steps steps-horizontal w-full mb-6">
                      <li className={`step ${effectiveCurrentStep >= 1 ? 'step-primary' : ''}`}>
          Add Mini App
        </li>
        <li className={`step ${effectiveCurrentStep >= 2 ? 'step-primary' : ''}`}>
          Enable Notifications
        </li>
            </ul>

            {/* Step 1: Add Mini App */}
            {effectiveCurrentStep === 1 && (
              <div className="space-y-4">
                <p className="text-base-content/80">
                  First, add the Log a Dog Mini App to your Farcaster client to enable notifications.
                </p>
                <div className="flex gap-2 justify-end">
                  <button 
                    className="btn btn-ghost"
                    onClick={()=>(document.getElementById('add_mini_app_modal') as HTMLDialogElement)?.close()}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleAddMiniApp}
                    disabled={isDisabled}
                  >
                    Add Mini App
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Enable Notifications */}
            {effectiveCurrentStep === 2 && (
              <div className="space-y-4">
                <p className="text-base-content/80">
                  Great! Now enable notifications to get notified when new dogs are logged.
                </p>
                <p className="text-sm text-base-content/60">
                  Notifications for newly logged dogs help judges stay on top of the contest!
                </p>
                <div className="flex gap-2 justify-end">
                  <button 
                    className="btn btn-ghost"
                    onClick={()=>(document.getElementById('add_mini_app_modal') as HTMLDialogElement)?.close()}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleEnableNotifications}
                    disabled={isDisabled}
                  >
                    Enable Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        </dialog>
      </>
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