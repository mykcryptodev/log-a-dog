import { type FC } from "react";
import { 
  CheckBadgeIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon 
} from "@heroicons/react/24/solid";

type Props = {
  fid?: number | null;
  isKnownSpammer?: boolean | null;
  isReportedForSpam?: boolean | null;
  size?: "sm" | "md" | "lg";
};

export const UserBadge: FC<Props> = ({ 
  fid, 
  isKnownSpammer, 
  isReportedForSpam, 
  size = "sm" 
}) => {
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const iconSize = iconSizes[size];

  // Determine badge priority: spam/reported > verified
  if (isKnownSpammer) {
    return (
      <XCircleIcon 
        className={`${iconSize} text-error`} 
        title="Known Spammer"
      />
    );
  }

  if (isReportedForSpam) {
    return (
      <ExclamationTriangleIcon 
        className={`${iconSize} text-warning`} 
        title="Reported for Spam"
      />
    );
  }

  if (fid) {
    return (
      <CheckBadgeIcon 
        className={`${iconSize} text-primary`} 
        title="Verified Farcaster User"
      />
    );
  }

  // No badge if no special status
  return null;
};

export default UserBadge;