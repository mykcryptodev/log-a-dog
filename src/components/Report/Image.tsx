import { type Profile, type Report } from "@prisma/client";
import { MediaRenderer } from "@thirdweb-dev/react";
import { type FC } from "react";

type ReportWithContent = Report & {
  profile: Profile | null;
};

interface Props {
  report: ReportWithContent;
  size?: string;
}

const ReportImage: FC<Props> = ({ report, size }) => {
  if (!report) return null;
  const src = report.profile?.img || "/images/default-image.png";
  return (
    <MediaRenderer
      src={src}
      className="rounded-lg"
      style={{ width: size, height: size, borderRadius: "8px" }}
    />
  )
};

export default ReportImage;
