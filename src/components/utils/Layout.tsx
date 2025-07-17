import { type FC, type ReactNode, useEffect, useState, useMemo } from "react"
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
  // Memoize gradient color calculations to prevent re-computation on every render
  const gradientColors = useMemo(() => ({
    fromYellow: mounted && userPrefersDarkMode ? "from-yellow-300" : "from-yellow-100",
    toYellow: mounted && userPrefersDarkMode ? "to-yellow-800" : "to-yellow-600", // Fixed typo from "to-yellow-00"
    fromPink: mounted && userPrefersDarkMode ? "from-pink-300" : "from-pink-100",
    toPink: mounted && userPrefersDarkMode ? "to-pink-800" : "to-pink-500",
    viaPink: mounted && userPrefersDarkMode ? "via-pink-300" : "via-pink-200",
    darkModeOpacity: mounted && userPrefersDarkMode ? 'opacity-30' : ''
  }), [mounted, userPrefersDarkMode]);

  // Memoize complex className constructions
  const backgroundClassNames = useMemo(() => ({
    topGradient: `absolute bg-gradient-to-t ${gradientColors.fromYellow} ${gradientColors.toYellow} rounded-full blur-3xl -top-[75%] -left-[45%] w-full h-full -z-10 ${gradientColors.darkModeOpacity}`,
    rightGradient: `fixed bg-gradient-to-br ${gradientColors.fromYellow} ${gradientColors.viaPink} ${gradientColors.toPink} rounded-full blur-3xl -bottom-0 -right-[90%] w-full h-full -z-10 ${gradientColors.darkModeOpacity}`,
    leftGradient: `fixed bg-gradient-to-br ${gradientColors.fromYellow} ${gradientColors.viaPink} ${gradientColors.toPink} rounded-full blur-3xl -bottom-0 -left-[55%] w-1/2 h-full -z-10 ${gradientColors.darkModeOpacity}`,
    centerGradient: `fixed bg-gradient-to-tl ${gradientColors.fromYellow} ${gradientColors.viaPink} ${gradientColors.toYellow} rounded-full blur-3xl -bottom-0 -left-[25%] w-1/2 h-full -z-10 ${gradientColors.darkModeOpacity}`,
    topPinkGradient: `fixed bg-gradient-to-bl ${gradientColors.fromPink} ${gradientColors.toPink} rounded-full -top-[-85%] blur-3xl -left-[35%] w-full h-full -z-10 ${gradientColors.darkModeOpacity}`
  }), [gradientColors]);

  return (
    <div className="block">
      <div className={backgroundClassNames.topGradient} />
      <div className={backgroundClassNames.rightGradient} />
      <div className={backgroundClassNames.leftGradient} />
      <div className={backgroundClassNames.centerGradient} />
      <div className={backgroundClassNames.topPinkGradient} />
      <div className="overflow-x-hidden max-w-7xl mx-auto min-h-screen pb-24">
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