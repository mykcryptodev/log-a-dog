import { ReportStatus } from "@prisma/client";
import { type NextPage } from "next";
import Link from "next/link";
import { type FC, useMemo,useState } from "react";

import AdminBreadcrumbs from "~/components/Admin/Breadcrumbs";
import Avatar from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import ReportImage from "~/components/Report/Image";
import ReportType from "~/components/Report/Type";
import withAdminProtection from "~/hoc/withAdminProtection";
import useReportName from "~/hooks/useReportName";
import useShortenedAddress from "~/hooks/useShortenedAddress";
import { type ReportWithContent } from "~/types/report";
import { api } from "~/utils/api";

const AdminReports: NextPage = () => {
  const [activeStatus, setActiveStatus] = useState<ReportStatus>(ReportStatus.PENDING);
  const { data: reports, isLoading } = api.report.getByStatus.useQuery({
    status: activeStatus
  });
  // make an array of reports that are unique by their contentId
  const uniqueReports = useMemo(() => {
    const uniqueReports = new Map<string, ReportWithContent>();
    reports?.forEach(report => {
      if (!uniqueReports.has(report.contentId)) {
        uniqueReports.set(report.contentId, report);
      }
    });
    return Array.from(uniqueReports.values());
  }, [reports]);
  // make a map of contentId to report counts
  const reportCounts = useMemo(() => {
    const reportCounts = new Map<string, number>();
    reports?.forEach(report => {
      if (!reportCounts.has(report.contentId)) {
        reportCounts.set(report.contentId, 1);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        reportCounts.set(report.contentId, reportCounts.get(report.contentId)! + 1);
      }
    });
    return reportCounts;
  }, [reports]);
  const { getShortenedAddress } = useShortenedAddress();

  const ReportName: FC<{ report: ReportWithContent }> = ({ report }) => {
    const reportName = useReportName(report);
    return (
      <>{reportName}</>
    )
  }

  return (
    <div className="flex flex-col gap-2 mx-2">
      <AdminBreadcrumbs
        currentPaths={["/admin/reports"]}
        currentPathNames={["Reports"]}
      />
      <div className="text-5xl font-bold mb-8">Reports</div>
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
                <th>Type</th>
                <th>Name</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {uniqueReports?.map(report => (
                <tr key={report.id}>
                  <td>
                    <ReportType report={report} />
                  </td>
                  <td>
                    <Link href={`/admin/report/${report.contentId}`} className="flex items-start gap-2">
                      <div className="flex items-center space-x-3">
                        <ReportImage size={'64px'} report={report} />
                      </div>
                      <div>
                        <div className="font-bold">
                          <ReportName report={report} />
                        </div>
                        <div className="text-helper">
                          {getShortenedAddress(report.collection?.address || report.profile?.id || "")}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
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
                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                      {reportCounts.get(report.contentId)! > 1 && (
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        <div className="tooltip cursor-pointer" data-tip={`${reportCounts.get(report.contentId)! - 1} other${reportCounts.get(report.contentId)! - 1 > 1 ? 's' : ''}`}>
                          <div className="badge badge-outline badge-secondary">
                            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                            +{reportCounts.get(report.contentId)! - 1}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* foot */}
            <tfoot>
              <tr>
                <th>Type</th>
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

export default withAdminProtection(AdminReports);