import { type FC, useEffect } from "react";
import { api } from "~/utils/api";
import { toast } from "react-toastify";3

type Props = {
  queueId: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onResolved?: (success: boolean) => void;
}

export const TransactionStatus: FC<Props> = ({ queueId, loadingMessage, successMessage, errorMessage, onResolved }) => {
  const { data, dataUpdatedAt } = api.engine.getTransactionStatus.useQuery(
    { queueId },
    {
      refetchInterval: (data) => {
        // If we have data and it's a final state, stop polling
        if (data?.result.status === "mined" || 
            data?.result.status === "errored" || 
            data?.result.status === "cancelled") {
          return false;
        }
        // Otherwise poll every 2 seconds
        return 2000;
      },
    }
  );

  useEffect(() => {
    if (!data) return;
    const status = data.result.status;
    const errorMessage = data.result.errorMessage;

    switch (status) {
      case "queued":
      case "sent":
        toast.loading(loadingMessage ?? "Transaction is pending...", {
          toastId: `${queueId}-pending`,
          autoClose: false,
        });
        break;
      case "mined":
        toast.dismiss(`${queueId}-pending`);
        toast.success(successMessage ?? "Transaction completed successfully!", {
          toastId: `${queueId}-mined`,
        });
        onResolved?.(true);
        break;
      case "errored":
        toast.dismiss(`${queueId}-pending`);
        toast.error(errorMessage ?? "Transaction failed: Unknown error", {
          toastId: `${queueId}-errored`,
        });
        onResolved?.(false);
        break;
      case "cancelled":
        toast.dismiss(`${queueId}-pending`);
        toast.warning(errorMessage ?? "Transaction was cancelled", {
          toastId: `${queueId}-cancelled`,
        });
        onResolved?.(false);
        break;
    }
  }, [dataUpdatedAt, data, queueId, loadingMessage, successMessage, errorMessage, onResolved]);

  return null; // We don't need to render anything since we're using toasts
};
