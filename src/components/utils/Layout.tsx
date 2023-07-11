import { useAddress } from "@thirdweb-dev/react";
import { signOut } from "next-auth/react";
import { type FC, type ReactNode,useEffect } from "react"

import Footer from "~/components/utils/Footer";
import Navigation from "~/components/utils/Navigation"
import Notification from "~/components/utils/Notification";
import NotificationContext from "~/context/Notification";
import useNotification from "~/hooks/useNotification";
import usePrevious from "~/hooks/usePrevious";

interface LayoutProps {
  children: ReactNode
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const notificationContext = useNotification();
  const notificationState = {...notificationContext};

  // sign out user and clear session if connected wallet changes
  const address = useAddress();
  const previousAddress = usePrevious(address);
  useEffect(() => {
    if (address) {
      if (previousAddress && address !== previousAddress) {
        void signOut();
      }
    } else {
      if (previousAddress) {
        void signOut();
      }
    }
  }, [previousAddress, address]);

  return (
    <div className="block">
      <div className="overflow-x-hidden max-w-7xl mx-auto min-h-screen">
        <NotificationContext.Provider value={notificationState}>
          <Notification />
          <Navigation />
          {children}
        </NotificationContext.Provider>
      </div>
      <Footer />
    </div>
  )
}