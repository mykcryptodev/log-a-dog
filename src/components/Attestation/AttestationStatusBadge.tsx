import type { FC } from "react";
import { CheckIcon, XMarkIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { Portal } from "~/components/utils/Portal";

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
  const modalId = `attestation-status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (attestationPeriod?.status === 1) {
    if (attestationPeriod.isValid) {
      label = "valid";
      icon = <CheckIcon className="w-3 h-3" />;
    } else {
      label = "invalid";
      icon = <XMarkIcon className="w-3 h-3" />;
    }
  }

  const getStatusExplanation = () => {
    if (attestationPeriod?.status === 1) {
      if (attestationPeriod.isValid) {
        return {
          title: "Valid Submission",
          content: (
            <>
              <p className="py-2">This submission has been judged as <strong>valid</strong> by the community.</p>
              <p className="py-2">Valid submissions are photos of users eating hotdogs. Judges who voted correctly received $HOTDOG rewards from those who voted incorrectly.</p>
              <p className="py-2">This submission now counts toward the contest leaderboard.</p>
            </>
          )
        };
      } else {
        return {
          title: "Invalid Submission", 
          content: (
            <>
              <p className="py-2">This submission has been judged as <strong>invalid</strong> by the community.</p>
              <p className="py-2">Invalid submissions are typically photos that don&apos;t show someone eating a hotdog, duplicates, or other spam.</p>
              <p className="py-2 font-bold">Invalid submissions do not count towards the leaderboard.</p>
              <p className="py-2">Judges who voted correctly received $HOTDOG rewards from those who voted incorrectly.</p>
            </>
          )
        };
      }
    }
    
    return {
      title: "Pending Judgment",
      content: (
        <>
          <p className="py-2">This submission is currently in the <strong>voting window</strong> where judges can upvote or downvote it.</p>
          <p className="py-2"><strong>Upvotes</strong> are given to users who submit pictures of themselves eating a hotdog.</p>
          <p className="py-2"><strong>Downvotes</strong> are given to users who submit anything else (duplicates, non-hotdog content, spam, etc.).</p>
          <p className="py-2">Judges must stake $HOTDOG tokens to participate. Those who vote with the majority earn rewards, while those who vote incorrectly have 15% of their stake slashed.</p>
          <p className="py-2">The voting window lasts 48 hours from when the submission was posted.</p>
        </>
      )
    };
  };

  const statusInfo = getStatusExplanation();

  // Determine CSS classes based on status
  let badgeClasses = "badge text-xs capitalize flex items-center gap-1 cursor-pointer transition-colors ";
  if (attestationPeriod?.status === 1) {
    if (attestationPeriod.isValid) {
      badgeClasses += "bg-success/10 text-success hover:bg-success/20";
    } else {
      badgeClasses += "bg-error/10 text-error hover:bg-error/20";
    }
  } else {
    badgeClasses += "bg-neutral/10 text-neutral dark:text-neutral-content hover:bg-neutral/20";
  }

  return (
    <>
      <label 
        htmlFor={modalId}
        className={badgeClasses}
      >
        {icon}
        {label}
        <QuestionMarkCircleIcon className="w-3 h-3 stroke-2" />
      </label>

      <Portal>
        <input type="checkbox" id={modalId} className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
            <label htmlFor={modalId} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
              <XMarkIcon className="w-4 h-4" />
            </label>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {icon}
              {statusInfo.title}
            </h3>
            {statusInfo.content}
            <div className="modal-action">
              <label htmlFor={modalId} className="btn">Close</label>
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default AttestationStatusBadge;
