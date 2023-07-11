import { type FC } from "react";

import { type ReportWithContent } from "~/types/report";

export const ReportType: FC<{ report: ReportWithContent }> = ({ report }) => {
  return (
    <>
      {report.profile && (
        <div className="badge badge-secondary">Profile</div>
      )}
    </>
  )
};

export default ReportType;