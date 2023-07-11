import Link from "next/link";
import { type FC } from "react";

interface Props {
  currentPaths: string[];
  currentPathNames: string[];
}

export const AdminBreadcrumbs: FC<Props> = ({
  currentPaths,
  currentPathNames
}) => {
  return (
    <div className="text-sm breadcrumbs">
      <ul>
        <li>
          <Link href="/admin">
            Admin
          </Link>  
        </li>
        {currentPaths.map((path, index) => (
          <li key={path}>
            <Link href={currentPaths[index] || ""}>
              {currentPathNames[index]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminBreadcrumbs;