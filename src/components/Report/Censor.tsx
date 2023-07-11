import { type Report } from "@prisma/client";
import { type FC, useContext,useEffect, useState } from "react";

import NotificationContext from "~/context/Notification";
import { api } from "~/utils/api";

interface Props {
  report: Report | null;
}
export const CensorReportContent: FC<Props> = ({ report }) => {
  const { popNotification } = useContext(NotificationContext);
  const [isCensored, setIsCensored] = useState<boolean>(false);
  const { data: profile, refetch: refetchProfile } = api.profile.getById.useQuery(report?.contentId || "");
  const toggleProfileCensorship = api.profile.censor.useMutation({});

  useEffect(() => {
    if (profile) {
      setIsCensored(profile.isCensored ? true : false);
    }
  }, [profile]);

  const toggleIsCensored = async (isCensored: boolean) => {
    try {
      if (profile) {
        await toggleProfileCensorship.mutateAsync({
          id: profile.id,
          isCensored
        });
        void refetchProfile();
      }
      popNotification({
        title: "Success",
        description: "Successfully updated censorship status",
        type: "success"
      });
    } catch (e) {
      const error = e as Error;
      popNotification({
        title: "Error",
        description: error.message,
        type: "error"
      });
    }
  };

  return (
    <div className="flex items-center gap-2 sm:w-fit w-full sm:justify-normal justify-center p-8 bg-base-200 rounded-lg border-2">
      <span className="font-bold text-xl">Censored</span>
      <input 
        type="checkbox" 
        className="toggle toggle-lg toggle-primary"
        checked={isCensored}
        onChange={() => void toggleIsCensored(!isCensored)}
      />
    </div>
  )
};

export default CensorReportContent;