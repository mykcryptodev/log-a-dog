import { CheckBadgeIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FC, useMemo } from "react";
import { Portal } from "../utils/Portal";

export const Badge: FC<{ address: string, isKnownSpammer: boolean, fid?: number }> = ({ address, isKnownSpammer, fid }) => {
  // Create unique modal IDs to handle multiple badge instances
  const spammerModalId = useMemo(() => `spammer-badge-${address.toLowerCase()}`, []);
  const verifiedModalId = useMemo(() => `verified-badge-${address.toLowerCase()}`, []);

  if (isKnownSpammer) {
    return (
      <>
        <label 
          htmlFor={spammerModalId}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
        </label>

        <Portal>
          <input type="checkbox" id={spammerModalId} className="modal-toggle" />
          <div className="modal modal-bottom sm:modal-middle" role="dialog">
            <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
            <label htmlFor={spammerModalId} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
                <XMarkIcon className="w-4 h-4" />
              </label>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-warning" />
                Known Spammer
              </h3>
              <div className="py-4 space-y-2">
                <p>This user has been flagged as a known spammer.</p>
                <p className="text-sm text-base-content/70">
                  Spammers are users who have been identified as posting duplicate content, 
                  fake submissions, or other content that violates the platform&apos;s integrity standards.
                </p>
                <p className="text-sm text-base-content/70">
                  Please exercise caution when interacting with content from this user.
                </p>
              </div>
              <div className="modal-action">
                <label htmlFor={spammerModalId} className="btn">Close</label>
              </div>
            </div>
          </div>
        </Portal>
      </>
    );
  }

  if (fid) {
    return (
      <>
        <label 
          htmlFor={verifiedModalId}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <CheckBadgeIcon className="w-4 h-4 text-primary" />
        </label>

        <Portal>
          <input type="checkbox" id={verifiedModalId} className="modal-toggle" />
          <div className="modal modal-bottom sm:modal-middle" role="dialog">
            <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
              <label htmlFor={verifiedModalId} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
                <XMarkIcon className="w-4 h-4" />
              </label>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckBadgeIcon className="w-6 h-6 text-primary" />
                Verified User
              </h3>
              <div className="py-4 space-y-2">
                <p>This user is verified on Farcaster.</p>
                <p className="text-sm text-base-content/70">
                  Verified users have connected their Farcaster account (FID: {fid}), 
                  which helps ensure they are real people participating in the Log a Dog community.
                </p>
                <p className="text-sm text-base-content/70">
                  Verified users are generally more trustworthy and their submissions 
                  are less likely to be spam or fake content.
                </p>
              </div>
              <div className="modal-action">
                <label htmlFor={verifiedModalId} className="btn">Close</label>
              </div>
            </div>
          </div>
        </Portal>
      </>
    );
  }

  return null;
};