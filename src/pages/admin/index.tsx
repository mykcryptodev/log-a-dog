import { FlagIcon, TrophyIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { type NextPage } from "next"
import Link from "next/link";

import withAdminProtection from "~/hoc/withAdminProtection";

export const Admin: NextPage = () => {
  const pages = [
    {
      name: "Users",
      path: "/admin/users",
      icon: <UserGroupIcon className="h-8 w-8 stroke-2" />
    },
    {
      name: "Contests",
      path: "/admin/contests",
      icon: <TrophyIcon className="h-8 w-8 stroke-2" />
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: <FlagIcon className="h-8 w-8 stroke-2" />
    }
  ]
  return (
    <div className="flex flex-col gap-2 mx-2">
      <div className="text-5xl font-bold my-8">Admin</div>
      {pages.map(page => (
        <Link key={page.name} href={page.path} className="p-8 flex items-center gap-4 border rounded-lg text-2xl font-bold">
          {page.icon}
          {page.name}
        </Link>
      ))}
    </div>
  )
}

export default withAdminProtection(Admin);