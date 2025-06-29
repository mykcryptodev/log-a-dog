import type { FC } from "react";

export type AttestationPeriod = {
  status: number;
  isValid: boolean;
};

interface Props {
  attestationPeriod?: AttestationPeriod;
}

const AttestationStatusBadge: FC<Props> = ({ attestationPeriod }) => {
  let label = "pending";
  let color = "neutral";

  if (attestationPeriod?.status === 1) {
    if (attestationPeriod.isValid) {
      label = "valid";
      color = "primary";
    } else {
      label = "invalid";
      color = "secondary";
    }
  }

  return <span className={`badge badge-${color} text-xs capitalize`}>{label}</span>;
};

export default AttestationStatusBadge;
