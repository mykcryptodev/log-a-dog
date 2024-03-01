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
      <div className="absolute bg-gradient-to-t from-yellow-100 to-yellow-300 rounded-full blur-3xl -top-[75%] -left-[45%] w-full h-full -z-10" ></div>
      <div className="fixed bg-gradient-to-br from-yellow-100 via-pink-200 to-pink-500 rounded-full blur-3xl -bottom-0 -right-[90%] w-full h-full -z-10"></div>
      <div className="fixed bg-gradient-to-br from-yellow-100 via-pink-200 to-pink-500 rounded-full blur-3xl -bottom-0 -left-[55%] w-1/2 h-full -z-10"></div>
      <div className="fixed bg-gradient-to-tl from-yellow-100 via-pink-200 to-yellow-300 rounded-full blur-3xl -bottom-0 -left-[25%] w-1/2 h-full -z-10"></div>
      <div className="fixed bg-gradient-to-bl from-pink-100 to-pink-500 rounded-full -top-[-85%] blur-3xl -left-[35%] w-full h-full -z-10"></div>
      <div className="overflow-x-hidden max-w-7xl mx-auto min-h-screen">
        <ConnectButton />
        <ToastContainer />
        {children}
      </div>
    </div>
  )
}