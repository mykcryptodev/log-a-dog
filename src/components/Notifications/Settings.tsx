import { BellIcon, BellSlashIcon } from "@heroicons/react/24/outline";
import { signIn, useSession } from "next-auth/react";
import { FC, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FarcasterContext } from "~/providers/Farcaster";
import { api } from "~/utils/api";
import SignInWithEthereum from "../utils/SignIn";

type Props = {
  className?: string;
}
export const NotificationsSettings: FC<Props> = ({ className }) => {
  const { data: sessionData } = useSession();
  const { mutate: toggleNotifications } = api.user.toggleNotifications.useMutation();
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const hasAddedMiniApp = useMemo(() => {
    return farcaster?.context?.client?.added;
  }, [farcaster]);

  const handleToggle = useCallback(async (checked: boolean) => {
    setNotificationsEnabled(checked);
    if (!hasAddedMiniApp && checked) {
      await farcaster?.addMiniApp();
    }
    try {
      // save the fact that the user has turned on notifications
      await toggleNotifications({
        address: sessionData?.user?.address ?? "",
        enabled: checked,
      });
      toast(checked ? "🔔 Notifications on!" : "🔕 Notifications off!");
    } catch (error) {
      toast.error("Failed to toggle notifications");
    }
  }, [hasAddedMiniApp, farcaster]);

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