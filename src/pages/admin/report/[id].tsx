import { ArchiveBoxIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { type Collection, type Profile,type Report, ReportStatus,  } from "@prisma/client";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import { type FC, useContext, useMemo,useState } from "react";

import AdminBreadcrumbs from "~/components/Admin/Breadcrumbs";
import Avatar from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import CensorReportContent from "~/components/Report/Censor";
import ReportImage from "~/components/Report/Image";
import ReportType from "~/components/Report/Type";
import NotificationContext from "~/context/Notification";
import withAdminProtection from "~/hoc/withAdminProtection";
import useShortenedAddress from "~/hooks/useShortenedAddress";
import { api } from "~/utils/api";

const AdminReports: NextPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [activeStatus, setActiveStatus] = useState<ReportStatus>(ReportStatus.PENDING);
  const { data: reports, isLoading, refetch } = api.report.getByContentId.useQuery({
    status: activeStatus,
    contentId: id
  });
  // this is only used to show data about the item being reported in case filters make it so that there are no reports
  const reportWithContent = api.report.getByContentId.useQuery({
    contentId: id,
    take: 1
  }).data?.[0] || null;
  const { data: collection } = api.collection.getById.useQuery(id);
  const { data: profile } = api.profile.getById.useQuery(id);
  const { mutateAsync: updateStatus } = api.report.updateStatus.useMutation();
  const { popNotification } = useContext(NotificationContext);
  const { getShortenedAddress } = useShortenedAddress();

  const handleReportStatusUpdate = async (report: Report, status: ReportStatus) => {
    try {
      await updateStatus({ 
        id: report.id,
        status: status
      });
      await refetch();
      popNotification({
        title: "Success",
        description: "Report status updated successfully",
        type: "success"
      });
    } catch (error) {
      popNotification({
        title: "Error",
        description: "Something went wrong while updating the report status",
        type: "error"
      });
    }
  }

  type ReportWithContent = Report & {
    collection: Collection | null;
    profile: Profile | null;
  };

  const reportName = useMemo(() => {
    if (collection) {
      return collection.name;
    }
    if (profile) {
      return profile.name;
    }
    return "";
  }, [collection, profile]);

  const ignoreAll = async () => {
    if (!reports?.length) return;
    try {
      await Promise.all(reports.map(report => {
        return updateStatus({
          id: report.id,
          status: ReportStatus.REJECTED
        });
      }));
      await refetch();
      popNotification({
        title: "Success",
        description: "All reports ignored successfully",
        type: "success"
      });
    } catch (e) {
      const error = e as Error;
      popNotification({
        title: "Error",
        description: "Something went wrong while ignoring all reports. " + error.message,
        type: "error"
      });
    }
  }

  const approveAll = async () => {
    if (!reports?.length) return;
    try {
      await Promise.all(reports.map(report => {
        return updateStatus({
          id: report.id,
          status: ReportStatus.APPROVED
        });
      }));
      await refetch();
      popNotification({
        title: "Success",
        description: "All reports approved successfully",
        type: "success"
      });
    } catch (e) {
      const error = e as Error;
      popNotification({
        title: "Error",
        description: "Something went wrong while approving all reports. " + error.message,
        type: "error"
      });
    }
  }

  const IgnoreModal: FC<{ report: ReportWithContent }> = ({ report }) => {
    return (
      <>
        {/* The button to open modal */}
        <div className="tooltip" data-tip="Ignore">
          <label htmlFor={`ignore-report-status-modal-${report.id}`} className="btn btn-ghost">
            <ArchiveBoxIcon className="w-5 h-5 stroke-2" />
          </label>
        </div>

        {/* Put this part before </body> tag */}
        <input type="checkbox" id={`ignore-report-status-modal-${report.id}`} className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-2xl">Ignore Report</h3>
            <div className="flex items-center gap-2">
              <p className="py-4">Are you sure you want to ignore this report?</p>
            </div>
            <div className="modal-action">
              <label htmlFor={`ignore-report-status-modal-${report.id}`} className="btn">Cancel</label>
              <button
                className="btn btn-primary"
                onClick={() => void handleReportStatusUpdate(report, ReportStatus.REJECTED)}
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const IgnoreAllModal: FC = () => {
    return (
      <>
        {/* The button to open modal */}
        <label htmlFor={`ignore-all-report-status-modal`} className="btn">
          <ArchiveBoxIcon className="w-5 h-5 stroke-2"/> Ignore All
        </label>

        {/* Put this part before </body> tag */}
        <input type="checkbox" id={`ignore-all-report-status-modal`} className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-2xl">Ignore All Reports</h3>
            <div className="flex items-center gap-2">
              <p className="py-4">Are you sure you want to ignore all reports?</p>
            </div>
            <div className="modal-action">
              <label htmlFor={`ignore-all-report-status-modal`} className="btn">Cancel</label>
              <button
                className="btn btn-primary"
                disabled={!reports?.length}
                onClick={() => void ignoreAll()}
              >
                Ignore All
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const ApproveAllModal: FC = () => {
    return (
      <>
        {/* The button to open modal */}
        <label htmlFor={`approve-all-report-status-modal`} className="btn btn-primary">
          <ShieldCheckIcon className="w-5 h-5 stroke-2" /> Approve All
        </label>

        {/* Put this part before </body> tag */}
        <input type="checkbox" id={`approve-all-report-status-modal`} className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-2xl">Approve All Reports</h3>
            <div className="flex items-center gap-2">
              <p className="py-4">Are you sure you want to approve all reports?</p>
            </div>
            <div className="modal-action">
              <label htmlFor={`approve-all-report-status-modal`} className="btn">Cancel</label>
              <button
                className="btn btn-primary"
                disabled={!reports?.length}
                onClick={() => void approveAll()}
              >
                Approve All
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const ApproveModal: FC<{ report: ReportWithContent }> = ({ report }) => {
    return (
      <>
        {/* The button to open modal */}
        <div className="tooltip" data-tip="Approve">
          <label htmlFor={`approve-report-status-modal-${report.id}`} className="btn btn-ghost">
            <ShieldCheckIcon className="w-5 h-5 stroke-2" />
          </label>
        </div>

        {/* Put this part before </body> tag */}
        <input type="checkbox" id={`approve-report-status-modal-${report.id}`} className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-2xl">Approve Report</h3>
            <div className="flex items-center gap-2">
              <p className="py-4">Are you sure you want to approve this report?</p>
            </div>
            <div className="modal-action">
              <label htmlFor={`approve-report-status-modal-${report.id}`} className="btn">Cancel</label>
              <button
                className="btn btn-primary"
                onClick={() => void handleReportStatusUpdate(report, ReportStatus.APPROVED)}
              >
                Approve
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
        currentPaths={["/admin/reports",`/admin/reports/${id}`]}
        currentPathNames={["Reports", reportName || ""]}
      />
      <div className="flex sm:flex-row flex-col-reverse gap-4 justify-between items-start">
        <div className="text-5xl font-bold mb-8 flex gap-2">
          {reportWithContent && (
            <ReportImage size={'128px'} report={reportWithContent} />
          )}
          <div className="flex flex-col gap-2">
            {reportWithContent && (
              <ReportType report={reportWithContent} />
            )}
            {reportName}
            {reportWithContent && (
              <div className="font-normal text-xl">
                {getShortenedAddress(reportWithContent.collection?.address || reportWithContent.profile?.userId || "")}
              </div>
            )}
          </div>
        </div>
        <CensorReportContent report={reportWithContent} />
      </div>
      <div className={`flex sm:flex-row flex-col gap-2 justify-between items-center`}>
        <div className="tabs tabs-boxed w-fit">
          <a 
            className={`tab ${activeStatus === ReportStatus.PENDING ? 'tab-active' : ''}`}
            onClick={() => void setActiveStatus(ReportStatus.PENDING)}
          >
            Pending
          </a> 
          <a 
            className={`tab ${activeStatus === ReportStatus.APPROVED ? 'tab-active' : ''}`}
            onClick={() => void setActiveStatus(ReportStatus.APPROVED)}
          >
            Approved
          </a> 
          <a 
            className={`tab ${activeStatus === ReportStatus.REJECTED ? 'tab-active' : ''}`}
            onClick={() => void setActiveStatus(ReportStatus.REJECTED)}
          >
            Ignored
          </a>
        </div>
        <div className="flex items-center gap-2">
          <IgnoreAllModal />
          <ApproveAllModal />
        </div>
      </div>
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
                <th>Created By</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {!reports?.length && (
                <tr>
                  <td colSpan={3} className="text-center">
                    No reports found
                  </td>
                </tr>
              )}
              {reports?.map(report => (
                <tr key={report.id}>
                  <td>
                    <IgnoreModal report={report} />
                    <ApproveModal report={report} />
                  </td>
                  <td>
                    <div className="flex items-start gap-2">
                      <div className="flex items-center space-x-3">
                        <Avatar height={32} width={32} address={report.createdById || ""} />
                      </div>
                      <div>
                        <div className="font-bold">
                          <Name address={report.createdById || ""} />
                        </div>
                        <div className="text-helper">
                          {getShortenedAddress(report.createdById || "")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {report.reason}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* foot */}
            <tfoot>
              <tr>
                <th>Action</th>
                <th>Created By</th>
                <th>Reason</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default withAdminProtection(AdminReports);