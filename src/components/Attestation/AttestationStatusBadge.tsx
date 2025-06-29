import type { FC } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

export type AttestationPeriod = {
  status: number;
  isValid: boolean;
};

interface Props {
  attestationPeriod?: AttestationPeriod;
}

const AttestationStatusBadge: FC<Props> = ({ attestationPeriod }) => {
  let label = "pending";
  let icon = null as JSX.Element | null;

  if (attestationPeriod?.status === 1) {
    if (attestationPeriod.isValid) {
      label = "valid";
      icon = <CheckIcon className="w-3 h-3" />;
    } else {
      label = "invalid";
      icon = <XMarkIcon className="w-3 h-3" />;
    }
  }

  return (
    <span className="badge badge-neutral text-xs capitalize flex items-center gap-1">
      {icon}
      {label}
    </span>
  );
};

export default AttestationStatusBadge;
