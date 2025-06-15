import { type FC } from "react"
import { CurrencyDollarIcon, NewspaperIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline"
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
    <div className="btm-nav h-20 pb-2 bg-opacity-50 backdrop-blur-lg z-50 text-sm pb">
      <button 
        onClick={() => void router.push('/')}
        className={isActive('/') ? 'border-t-2 border-primary' : ''}
      >
        <NewspaperIcon className="h-6 w-6" />
        Feed
      </button>
      <button 
        onClick={() => void router.push('/earn')}
        className={isActive('/earn') ? 'border-t-2 border-primary' : ''}
      >
        <CurrencyDollarIcon className="h-6 w-6" />
        Earn
      </button>
      <button 
        onClick={() => void router.push('/faq')}
        className={isActive('/faq') ? 'border-t-2 border-primary' : ''}
      >
        <QuestionMarkCircleIcon className="h-6 w-6" />
        FAQ
      </button>
      <button>
        <ProfileButton />
      </button>
    </div>
  )
}