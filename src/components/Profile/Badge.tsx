import { CheckBadgeIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FC, useMemo } from "react";

export const Badge: FC<{ address: string, isKnownSpammer: boolean, fid?: number, className?: string }> = ({ address, isKnownSpammer, fid, className }) => {
  const spammerModalId = useMemo(() => `spammer-badge-${address.toLowerCase()}-${Math.random().toString(36).substring(2, 15)}`, [address]);
  const verifiedModalId = useMemo(() => `verified-badge-${address.toLowerCase()}-${Math.random().toString(36).substring(2, 15)}`, [address]);

  if (isKnownSpammer) {
    return (
      <>
        <button 
          onClick={() => (document.getElementById(spammerModalId) as HTMLDialogElement)?.showModal()}
          className={`cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center justify-center ${className}`}
        >
          <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
        </button>

          <dialog id={spammerModalId} className="modal modal-bottom sm:modal-middle">
            <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
              <button 
                onClick={() => (document.getElementById(spammerModalId) as HTMLDialogElement)?.close()}
                className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="w-6 h-6 stroke-2 text-warning" />
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
                <button 
                  onClick={() => (document.getElementById(spammerModalId) as HTMLDialogElement)?.close()}
                  className="btn"
                >
                  Close
                </button>
              </div>
            </div>
          </dialog>
      </>
    );
  }

  if (fid) {
    return (
      <>
        <button 
          onClick={() => (document.getElementById(verifiedModalId) as HTMLDialogElement)?.showModal()}
          className={`cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center justify-center ${className}`}
        >
          <CheckBadgeIcon className="w-4 h-4 stroke-2 text-primary" />
        </button>

          <dialog id={verifiedModalId} className="modal modal-bottom sm:modal-middle">
            <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
              <button 
                onClick={() => (document.getElementById(verifiedModalId) as HTMLDialogElement)?.close()}
                className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
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
                <button 
                  onClick={() => (document.getElementById(verifiedModalId) as HTMLDialogElement)?.close()}
                  className="btn"
                >
                  Close
                </button>
              </div>
            </div>
          </dialog>
      </>
    );
  }

  return null;
};