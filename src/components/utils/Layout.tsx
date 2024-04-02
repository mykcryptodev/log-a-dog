import { type FC, type ReactNode,useEffect, useState, useMemo } from "react"
import { ToastContainer } from 'react-toastify';
import { ProfileButton } from "../Profile/Button";
import { useRouter } from "next/router";
import Changelog from "~/components/utils/Changelog";
import Link from "next/link";

interface LayoutProps {
  children: ReactNode
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  useEffect(() => {
    setUserPrefersDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const fromYellow = userPrefersDarkMode ? "from-yellow-300" : "from-yellow-100";
  const toYellow = userPrefersDarkMode ? "to-yellow-800" : "to-yellow-00";
  const fromPink = userPrefersDarkMode ? "from-pink-300" : "from-pink-100";
  const toPink = userPrefersDarkMode ? "to-pink-800" : "to-pink-500";
  const viaPink = userPrefersDarkMode ? "via-pink-300" : "via-pink-200";

  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const isOnSafari = useMemo(() => {
    if (!isMounted) return false;
    const ua = navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
    return iOSSafari;
  }, [isMounted]);
  useEffect(() => {
    if (isOnSafari && !alertDismissed) {
      setShowAlert(true);
    }
  }, [alertDismissed, isOnSafari, showAlert]);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return null;

  return (
    <div className="block">
      <div className={`absolute bg-gradient-to-t ${fromYellow} ${toYellow} rounded-full blur-3xl -top-[75%] -left-[45%] w-full h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`} ></div>
      <div className={`fixed bg-gradient-to-br ${fromYellow} ${viaPink} ${toPink} rounded-full blur-3xl -bottom-0 -right-[90%] w-full h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`}></div>
      <div className={`fixed bg-gradient-to-br ${fromYellow} ${viaPink} ${toPink} rounded-full blur-3xl -bottom-0 -left-[55%] w-1/2 h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`}></div>
      <div className={`fixed bg-gradient-to-tl ${fromYellow} ${viaPink} ${toYellow} rounded-full blur-3xl -bottom-0 -left-[25%] w-1/2 h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`}></div>
      <div className={`fixed bg-gradient-to-bl ${fromPink} ${toPink} rounded-full -top-[-85%] blur-3xl -left-[35%] w-full h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`}></div>
      {showAlert && (
        <div className="alert alert-warning rounded-none w-full flex sm:hidden">
          <span className="text-center w-full text-xs">
            There is currently an issue with logging in on mobile safari. Try switching to Chrome.
          </span>
          <button onClick={() => {
            setShowAlert(false);
            setAlertDismissed(true);
          }} className="btn btn-ghost btn-xs btn-circle absolute top-1 right-1">
            &times;
          </button>
        </div>
      )}
      <div className="overflow-x-hidden max-w-7xl mx-auto min-h-screen mt-10">
        <div className="w-full justify-between items-center flex mr-4">
          <div className="flex items-center gap-2">
            {router.pathname !== '/' && (
              <Link href="/" className="btn btn-ghost text-neutral ml-4">
                🌭  Log a Dog
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ProfileButton />
            <Changelog />
          </div>
        </div>
        <ToastContainer />
        {children}
      </div>
    </div>
  )
}