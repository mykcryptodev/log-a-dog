import { BellIcon, BellSlashIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useCallback, useContext, useMemo, useState, type FC } from "react";
import { toast } from "react-toastify";
import { FarcasterContext } from "~/providers/Farcaster";
import { api } from "~/utils/api";

type Props = {
  className?: string;
}
export const NotificationsSettings: FC<Props> = ({ className }) => {
  const { data: sessionData } = useSession();
  const { mutateAsync: toggleNotifications } = api.user.toggleNotifications.useMutation();
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const hasAddedMiniApp = useMemo(() => {
    return farcaster?.context?.client?.added ?? false;
  }, [farcaster?.context?.client?.added]);

  const handleToggle = useCallback(async (checked: boolean) => {
    setNotificationsEnabled(checked);
    if (!hasAddedMiniApp && checked) {
      try {
        await farcaster?.addMiniApp();
      } catch (error) {
        toast.error(`Failed to add mini app: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    try {
      // save the fact that the user has turned on notifications
      await toggleNotifications({ enabled: checked });
      toast(checked ? "🔔 Notifications on!" : "🔕 Notifications off!");
    } catch (error) {
      toast.error(`Failed to toggle notifications: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [hasAddedMiniApp, farcaster, toggleNotifications]);

  if (!isMiniApp || !sessionData?.user?.address) return null;

  return (
    <label className="swap">
      <input 
        type="checkbox" 
        checked={notificationsEnabled}
        onChange={(e) => handleToggle(e.target.checked)}
      />
      <div className="swap-on">
        <BellIcon className={`w-4 h-4 ${className}`} />
      </div>
      <div className="swap-off">
        <BellSlashIcon className={`w-4 h-4 ${className}`} />
      </div>
    </label>
  );
};