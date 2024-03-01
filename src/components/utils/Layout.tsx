import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { signOut } from "next-auth/react";
import { type FC, type ReactNode,useEffect } from "react"
import usePrevious from "~/hooks/usePrevious";
import { ToastContainer } from 'react-toastify';

interface LayoutProps {
  children: ReactNode
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  // sign out user and clear session if connected wallet changes
  const account = useActiveAccount();
  const previousAccount = usePrevious(account);
  useEffect(() => {
    if (account) {
      if (previousAccount && account !== previousAccount) {
        void signOut();
      }
    } else {
      if (previousAccount) {
        void signOut();
      }
    }
  }, [previousAccount, account]);

  return (
    <div className="block">
      <div className="absolute bg-brand-gradient-dark -top-[65%] -left-[65%] w-full h-full -z-10"></div>
      <div className="fixed bg-brand-gradient-light -bottom-0 -right-[70%] w-full h-full -z-10"></div>
      <div className="fixed bg-brand-gradient-dark -top-[-65%] -left-[35%] w-full h-full -z-10"></div>
      <div className="overflow-x-hidden max-w-7xl mx-auto min-h-screen">
        <ConnectButton />
        <ToastContainer />
        {children}
      </div>
    </div>
  )
}