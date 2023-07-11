import { TrashIcon } from "@heroicons/react/24/outline";
import { type Contest } from "@prisma/client";
import { type NextPage } from "next";
import Link from "next/link";
import { type FC, useContext, useState } from "react";

import AdminBreadcrumbs from "~/components/Admin/Breadcrumbs";
import Avatar from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import NotificationContext from "~/context/Notification";
import withAdminProtection from "~/hoc/withAdminProtection";
import useDebounce from "~/hooks/useDebounce";
import useShortenedAddress from "~/hooks/useShortenedAddress";
import { api } from "~/utils/api";

const AdminCollections: NextPage = () => {
  const [query, setQuery] = useState<string>(""); // The query string to search for
  const debouncedValue = useDebounce(query, 300); // the debounce delay (in milliseconds)
  const { data: contests, isLoading, refetch } = api.contest.search.useQuery({
    query: debouncedValue
  });
  const { mutateAsync: deleteContest } = api.contest.delete.useMutation();
  const { popNotification } = useContext(NotificationContext);
  const { getShortenedAddress } = useShortenedAddress();

  const handleDeletion = async (contest: Contest) => {
    try {
      await deleteContest({
        id: contest.id
      });
      await refetch();
      popNotification({
        title: "Success",
        description: "Collection deleted successfully",
        type: "success"
      });
    } catch (error) {
      popNotification({
        title: "Error",
        description: "Something went wrong while deleting the collection",
        type: "error"
      });
    }
  }

  const DeleteModal: FC<{ contest: Contest }> = ({ contest }) => {
    return (
      <>
        {/* The button to open modal */}
        <label htmlFor={`delete-contest-modal-${contest.id}`} className="btn btn-ghost">
          <TrashIcon className="w-5 h-5 stroke-2" />
        </label>

        {/* Put this part before </body> tag */}
        <input type="checkbox" id={`delete-contest-modal-${contest.id}`} className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-2xl">Delete Collection</h3>
            <div className="flex items-center gap-2">
              <p className="py-4">Are you sure you want to delete the <span className="font-bold">{contest.name}</span> contest? Nobody can undo this action.</p>
            </div>
            <div className="modal-action">
              <label htmlFor={`delete-contest-modal-${contest.id}`} className="btn">Nevermind</label>
              <button
                className="btn btn-error"
                onClick={() => void handleDeletion(contest)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-2 mx-2">
      <AdminBreadcrumbs
        currentPaths={["/admin/contests"]}
        currentPathNames={["Contests"]}
      />
      <div className="text-5xl font-bold mb-8">Contests</div>
      <input
        type="text"
        className="input input-bordered input-lg"
        placeholder="Search by address or name"
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
                <th>Action</th>
                <th>Name</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {contests?.map(contest => (
                <tr key={contest.id}>
                  <td>
                    <DeleteModal contest={contest} />
                  </td>
                  <td>
                    <Link href={`/contest/${contest.slug}`} className="flex items-start gap-2">
                      <div className="font-bold">
                        {contest.name}
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-start gap-2">
                      <div className="flex items-center space-x-3">
                        <Avatar height={32} width={32} address={contest.createdById || ""} />
                      </div>
                      <div>
                        <div className="font-bold">
                          <Name address={contest.createdById || ""} />
                        </div>
                        <div className="text-helper">
                          {getShortenedAddress(contest.createdById || "")}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* foot */}
            <tfoot>
              <tr>
                <th>Action</th>
                <th>Name</th>
                <th>Created By</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default withAdminProtection(AdminCollections);