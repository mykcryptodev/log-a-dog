import { type User } from "@prisma/client";
import { type NextPage } from "next";
import { useContext, useState } from "react";

import AdminBreadcrumbs from "~/components/Admin/Breadcrumbs";
import Avatar from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import NotificationContext from "~/context/Notification";
import withAdminProtection from "~/hoc/withAdminProtection";
import useDebounce from "~/hooks/useDebounce";
import { api } from "~/utils/api";

const AdminUsers: NextPage = () => {
  const [query, setQuery] = useState<string>(""); // The query string to search for
  const debouncedValue = useDebounce(query, 300); // the debounce delay (in milliseconds)
  const { data: users, isLoading, refetch } = api.user.getByAddress.useQuery({
    address: debouncedValue
  });
  const { mutateAsync: updateUser } = api.user.update.useMutation();
  const { popNotification } = useContext(NotificationContext);

  const handleAdminChange = async (user: User) => {
    try {
      await updateUser({
        id: user.id,
        isAdmin: !user.isAdmin
      });
      void refetch();
      popNotification({
        title: "Success",
        description: `User admin status updated successfully.`,
        type: "success"
      });
    } catch (e) {
      console.error({ e });
      popNotification({
        title: "Error",
        description: "There was an error updating the user.",
        type: "error"
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 mx-2">
      <AdminBreadcrumbs
        currentPaths={["/admin/users"]}
        currentPathNames={["Users"]}
      />
      <div className="text-5xl font-bold mb-8">Users</div>
      <input
        type="text"
        className="input input-bordered input-lg"
        placeholder="Search by address"
        value={query}
        onChange={(e) => void setQuery(e.target.value)}
      />
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-base-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(user => (
                <tr key={user.id}>
                  <th>
                    <label>
                      <input 
                        type="checkbox" 
                        className="checkbox"
                        checked={user.isAdmin}
                        onChange={() => void handleAdminChange(user)}
                      />
                    </label>
                  </th>
                  <td className="flex items-start gap-2">
                    <div className="flex items-center space-x-3">
                      <Avatar height={32} width={32} address={user.address} />
                    </div>
                    <div>
                      <div className="font-bold">
                        <Name address={user.address} />
                      </div>
                      <div className="text-helper">
                        {user.address}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* foot */}
            <tfoot>
              <tr>
                <th>Admin</th>
                <th>Name</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default withAdminProtection(AdminUsers);