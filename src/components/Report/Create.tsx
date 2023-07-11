import { type Profile, ReportType } from "@prisma/client";
import { MediaRenderer } from "@thirdweb-dev/react";
import { useSession } from "next-auth/react";
import { type FC, type ReactNode, useContext, useState } from "react";

import { Portal } from "~/components/utils/Portal";
import SignInButton from "~/components/utils/SignIn";
import NotificationContext from "~/context/Notification";
import { api } from "~/utils/api";

interface Props {
  profile?: Profile;
  className?: string;
  children?: ReactNode;
}

export const CreateReport: FC<Props> = ({ profile, className, children }) => {
  const { mutateAsync: createReport } = api.report.create.useMutation();
  const { popNotification } = useContext(NotificationContext);
  const { data: session } = useSession();
  const [reason, setReason] = useState<string>("");

  const reportItem = profile;

  if (!reportItem) return null;

  const mediaSrc = profile?.img || "/images/default-image.png";

  const handleCreateReport = async () => {
    if (!reason) return void popNotification({
      title: "Error",
      description: "Please provide a reason",
      type: "error",
    });
    try {
      await createReport({
        type: ReportType.PROFILE,
        contentId: reportItem.id,
        reason,
      });
      popNotification({
        title: "Reported",
        description: "Thank you for your report",
        type: "success",
      });
    } catch (e) {
      const error = e as Error;
      popNotification({
        title: "Error",
        description: error.message,
        type: "error",
      });
    } finally {
      // close the modal
      document.getElementById("create-report-modal")?.click();
    }
  }

  return (
    <>
      {/* The button to open modal */}
      <label htmlFor={`create-report-modal`} className={className || "btn btn-ghost"}>
        {children || "Report"}
      </label>

      {/* Put this part before </body> tag */}
      <Portal>
        <input type="checkbox" id={`create-report-modal`} className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-2xl">Create Report</h3>
            <div className="flex items-center gap-2">
              <MediaRenderer
                src={mediaSrc}
                className="rounded-lg"
                style={{ width: "64px", height: "64px", borderRadius: "8px" }}
              />
            </div>
            <p className="py-4">Why are you reporting this</p>
            <textarea
              className="textarea h-24 textarea-bordered w-full resize-y"
              placeholder="Your justification goes here..."
              value={reason}
              onChange={(e) => void setReason(e.target.value)}
            />
            <div className="modal-action">
              <label htmlFor={`create-report-modal`} className="btn">Cancel</label>
              {!session?.user ? (
                <SignInButton className="btn" />
              ) : (
                <button
                  className="btn btn-error"
                  onClick={() => void handleCreateReport()}
                >
                  Report
                </button>
              )}
            </div>
          </div>
        </div>
      </Portal>
    </>
  )
}

export default CreateReport;