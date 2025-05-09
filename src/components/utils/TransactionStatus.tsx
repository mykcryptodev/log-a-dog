import { type FC, useEffect, useState } from "react";
import { api } from "~/utils/api";
import { toast } from "react-toastify";

type LoadingMessage = {
  message: string;
  duration?: number;
}

type Props = {
  queueId: string;
  loadingMessages?: LoadingMessage[];
  successMessage?: string;
  errorMessage?: string;
  onResolved?: (success: boolean) => void;
}

export const TransactionStatus: FC<Props> = ({ 
  queueId, 
  loadingMessages = [{ message: "Transaction is pending...", duration: 1500 }], 
  successMessage, 
  errorMessage, 
  onResolved 
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
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

  // Handle message cycling
  useEffect(() => {
    if (!data) return;
    const status = data.result.status;
    
    if (status === "queued" || status === "sent") {
      const currentMessage = loadingMessages[currentMessageIndex];
      if (!currentMessage) return;

      // If this is the first message, create the toast
      if (currentMessageIndex === 0) {
        toast.loading(currentMessage.message, {
          toastId: `${queueId}-pending`,
          autoClose: false,
        });
      } else {
        // Otherwise update the existing toast
        toast.update(`${queueId}-pending`, {
          render: currentMessage.message,
          isLoading: true,
        });
      }

      // Set up message cycling
      const timer = setTimeout(() => {
        setCurrentMessageIndex((prev) => {
          // If we're at the last message, stay there
          if (prev === loadingMessages.length - 1) return prev;
          // Otherwise move to the next message
          return prev + 1;
        });
      }, currentMessage.duration ?? 2000);

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, data, loadingMessages, queueId]);

  // Handle status changes
  useEffect(() => {
    if (!data) return;
    const status = data.result.status;
    const errorMessage = data.result.errorMessage;

    switch (status) {
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
  }, [dataUpdatedAt, data, queueId, successMessage, errorMessage, onResolved]);

  return null; // We don't need to render anything since we're using toasts
};
