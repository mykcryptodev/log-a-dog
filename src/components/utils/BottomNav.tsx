import { type FC } from "react"
import { CurrencyDollarIcon, NewspaperIcon } from "@heroicons/react/24/outline"
import { ProfileButton } from "../Profile/Button"
import { useRouter } from "next/router"


export const BottomNav: FC = () => {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="btm-nav z-50">
      <button 
        onClick={() => void router.push('/')}
        className={isActive('/') ? 'active' : ''}
      >
        <NewspaperIcon className="h-5 w-5" />
        Feed
      </button>
      <button 
        onClick={() => void router.push('/earn')}
        className={isActive('/earn') ? 'active' : ''}
      >
        <CurrencyDollarIcon className="h-5 w-5" />
        Earn
      </button>
      <button>
        <ProfileButton />
      </button>
    </div>
  )
}