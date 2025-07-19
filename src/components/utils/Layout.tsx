import { type FC, type ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { ToastProvider } from "~/providers/Toast";
import usePrefersDarkMode from "~/hooks/usePrefersDarkMode";
import useMounted from "~/hooks/useMounted";
interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  const mounted = useMounted();
  const userPrefersDarkMode = usePrefersDarkMode();

  // Prevent hydration mismatch by not applying dark mode styles until mounted
  const fromYellow =
    mounted && userPrefersDarkMode ? "from-yellow-300" : "from-yellow-100";
  const toYellow =
    mounted && userPrefersDarkMode ? "to-yellow-800" : "to-yellow-00";
  const fromPink =
    mounted && userPrefersDarkMode ? "from-pink-300" : "from-pink-100";
  const toPink = mounted && userPrefersDarkMode ? "to-pink-800" : "to-pink-500";
  const viaPink =
    mounted && userPrefersDarkMode ? "via-pink-300" : "via-pink-200";
  const darkModeOpacity = mounted && userPrefersDarkMode ? "opacity-30" : "";

  return (
    <div className="block">
      <div
        className={`absolute bg-gradient-to-t ${fromYellow} ${toYellow} -left-[45%] -top-[75%] -z-10 h-full w-full rounded-full blur-3xl ${darkModeOpacity}`}
      ></div>
      <div
        className={`fixed bg-gradient-to-br ${fromYellow} ${viaPink} ${toPink} -bottom-0 -right-[90%] -z-10 h-full w-full rounded-full blur-3xl ${darkModeOpacity}`}
      ></div>
      <div
        className={`fixed bg-gradient-to-br ${fromYellow} ${viaPink} ${toPink} -bottom-0 -left-[55%] -z-10 h-full w-1/2 rounded-full blur-3xl ${darkModeOpacity}`}
      ></div>
      <div
        className={`fixed bg-gradient-to-tl ${fromYellow} ${viaPink} ${toYellow} -bottom-0 -left-[25%] -z-10 h-full w-1/2 rounded-full blur-3xl ${darkModeOpacity}`}
      ></div>
      <div
        className={`fixed bg-gradient-to-bl ${fromPink} ${toPink} -left-[35%] -top-[-85%] -z-10 h-full w-full rounded-full blur-3xl ${darkModeOpacity}`}
      ></div>
      <div className="mx-auto min-h-screen max-w-7xl overflow-x-hidden pb-24">
        <div className="mr-4 flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {router.pathname !== "/" && (
              <Link href="/" className="btn btn-ghost ml-4 pt-6 text-neutral">
                🌭 Log a Dog
              </Link>
            )}
          </div>
        </div>
        <ToastProvider />
        {children}
        <BottomNav />
      </div>
    </div>
  );
};
