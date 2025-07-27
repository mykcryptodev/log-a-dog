import { CheckBadgeIcon, ExclamationTriangleIcon, XMarkIcon, FlagIcon } from "@heroicons/react/24/outline";
import { type FC, useMemo, useState } from "react";

export const Badge: FC<{ 
  address: string; 
  isKnownSpammer?: boolean | null; 
  isReportedForSpam?: boolean | null; 
  fid?: number | null; 
  className?: string;
}> = ({ address, isKnownSpammer, isReportedForSpam, fid, className }) => {
  const spammerModalId = useMemo(() => `spammer-badge-${address.toLowerCase()}-${Math.random().toString(36).substring(2, 15)}`, [address]);
  const verifiedModalId = useMemo(() => `verified-badge-${address.toLowerCase()}-${Math.random().toString(36).substring(2, 15)}`, [address]);
  
  const [isReporting, setIsReporting] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleReport = async () => {
    setIsReporting(true);
    setReportStatus('idle');

    try {
      const response = await fetch('/api/report-spam-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          reason: 'Reported from verified user badge'
        }),
      });

      if (response.ok) {
        setReportStatus('success');
        // Close modal after a brief delay to show success
        setTimeout(() => {
          (document.getElementById(verifiedModalId) as HTMLDialogElement)?.close();
          setReportStatus('idle');
        }, 1500);
      } else {
        setReportStatus('error');
      }
    } catch (error) {
      console.error('Error reporting user:', error);
      setReportStatus('error');
    } finally {
      setIsReporting(false);
    }
  };

  if (isKnownSpammer) {
    return (
      <>
        <button 
          onClick={() => (document.getElementById(spammerModalId) as HTMLDialogElement)?.showModal()}
          className={`cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center justify-center ${className}`}
        >
          <ExclamationTriangleIcon className="w-4 h-4 text-error" />
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
                <ExclamationTriangleIcon className="w-6 h-6 stroke-2 text-error" />
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

  if (isReportedForSpam) {
    return (
      <>
        <button 
          onClick={() => (document.getElementById(verifiedModalId) as HTMLDialogElement)?.showModal()}
          className={`cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center justify-center ${className}`}
        >
          <FlagIcon className="w-4 h-4 stroke-2 text-warning" />
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
                <FlagIcon className="w-6 h-6 text-warning" />
                Reported for spam
              </h3>
              <div className="py-4 space-y-2">
                <p>This user is under investigation for submitting spam.</p>
                <p className="text-sm text-base-content/70">
                  Community members can report users for uploading duplicates, stock photos, ai generated content, or other spam.
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
              <h4 className="flex items-center gap-2">
                Not acting in good faith?
              </h4>
              <p className="text-sm text-base-content/70">
                If you believe this user is not acting in good faith, please report them to the community.
              </p>
              <div className="modal-action flex justify-between">
                <button 
                  onClick={handleReport}
                  disabled={isReporting}
                  className={`btn ${reportStatus === 'success' ? 'btn-success' : reportStatus === 'error' ? 'btn-error' : ''}`}
                >
                  {isReporting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Reporting...
                    </>
                  ) : reportStatus === 'success' ? (
                    <>
                      <CheckBadgeIcon className="w-4 h-4" />
                      Reported!
                    </>
                  ) : reportStatus === 'error' ? (
                    <>
                      <XMarkIcon className="w-4 h-4" />
                      Error
                    </>
                  ) : (
                    <>
                      <FlagIcon className="w-4 h-4" />
                      Report
                    </>
                  )}
                </button>
                <button 
                  onClick={() => (document.getElementById(verifiedModalId) as HTMLDialogElement)?.close()}
                  className="btn"
                  disabled={isReporting}
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