import { type FC, type ReactNode,useEffect, useState } from "react"
import { useRouter } from "next/router";
import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { ToastProvider } from "~/providers/Toast";
interface LayoutProps {
  children: ReactNode
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setUserPrefersDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  // Prevent hydration mismatch by not applying dark mode styles until mounted
  const fromYellow = mounted && userPrefersDarkMode ? "from-yellow-300" : "from-yellow-100";
  const toYellow = mounted && userPrefersDarkMode ? "to-yellow-800" : "to-yellow-00";
  const fromPink = mounted && userPrefersDarkMode ? "from-pink-300" : "from-pink-100";
  const toPink = mounted && userPrefersDarkMode ? "to-pink-800" : "to-pink-500";
  const viaPink = mounted && userPrefersDarkMode ? "via-pink-300" : "via-pink-200";
  const darkModeOpacity = mounted && userPrefersDarkMode ? 'opacity-30' : '';

  return (
    <div className="block">
      <div className={`absolute bg-gradient-to-t ${fromYellow} ${toYellow} rounded-full blur-3xl -top-[75%] -left-[45%] w-full h-full -z-10 ${darkModeOpacity}`} ></div>
      <div className={`fixed bg-gradient-to-br ${fromYellow} ${viaPink} ${toPink} rounded-full blur-3xl -bottom-0 -right-[90%] w-full h-full -z-10 ${darkModeOpacity}`}></div>
      <div className={`fixed bg-gradient-to-br ${fromYellow} ${viaPink} ${toPink} rounded-full blur-3xl -bottom-0 -left-[55%] w-1/2 h-full -z-10 ${darkModeOpacity}`}></div>
      <div className={`fixed bg-gradient-to-tl ${fromYellow} ${viaPink} ${toYellow} rounded-full blur-3xl -bottom-0 -left-[25%] w-1/2 h-full -z-10 ${darkModeOpacity}`}></div>
      <div className={`fixed bg-gradient-to-bl ${fromPink} ${toPink} rounded-full -top-[-85%] blur-3xl -left-[35%] w-full h-full -z-10 ${darkModeOpacity}`}></div>
      <div className="overflow-x-hidden max-w-7xl mx-auto min-h-screen">
        <div className="w-full justify-between items-center flex mr-4">
          <div className="flex items-center gap-2">
            {router.pathname !== '/' && (
              <Link href="/" className="btn btn-ghost text-neutral ml-4 pt-6">
                🌭  Log a Dog
              </Link>
            )}
          </div>
        </div>
        <ToastProvider />
        {children}
        <BottomNav />
      </div>
    </div>
  )
}