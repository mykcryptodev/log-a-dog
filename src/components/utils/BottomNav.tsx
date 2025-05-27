import { type FC } from "react"
import { CurrencyDollarIcon, NewspaperIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"

// Dynamically import ProfileButton with no SSR to prevent hydration issues
const ProfileButton = dynamic(() => import("../Profile/Button").then(mod => ({ default: mod.ProfileButton })), {
  ssr: false,
  loading: () => null
});

export const BottomNav: FC = () => {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="btm-nav z-50 text-sm">
      <button 
        onClick={() => void router.push('/')}
        className={isActive('/') ? 'active' : ''}
      >
        <NewspaperIcon className="h-6 w-6" />
        Feed
      </button>
      <button 
        onClick={() => void router.push('/earn')}
        className={isActive('/earn') ? 'active' : ''}
      >
        <CurrencyDollarIcon className="h-6 w-6" />
        Earn
      </button>
      <button>
        <ProfileButton />
      </button>
    </div>
  )
}