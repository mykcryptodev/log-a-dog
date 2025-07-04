/* eslint-disable react-hooks/exhaustive-deps */
import { type FC, useEffect, useState, useRef } from "react";
import { api } from "~/utils/api";
import { toast } from "react-toastify";

type LoadingMessage = {
  message: string;
  duration?: number;
}

type Props = {
  transactionId: string;
  loadingMessages?: LoadingMessage[];
  successMessage?: string;
  errorMessage?: string;
  onResolved?: (success: boolean) => void;
  onTransactionHash?: (transactionHash: string) => void;
}

export const TransactionStatus: FC<Props> = ({ 
  transactionId, 
  loadingMessages = [{ message: "Transaction is pending...", duration: 1500 }], 
  successMessage, 
  errorMessage, 
  onResolved,
  onTransactionHash 
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const resolvedRef = useRef(false);
  
  const { data, dataUpdatedAt } = api.engine.getTransactionStatus.useQuery(
    { transactionId },
    {
      refetchInterval: (data) => {
        // If we have data and it's a final state, stop polling
        if (data?.status === "CONFIRMED" || 
            data?.status === "FAILED") {
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
    const status = data.status;
    
    if (status === "QUEUED" || status === "SUBMITTED") {
      const currentMessage = loadingMessages[currentMessageIndex];
      if (!currentMessage) return;

      // If this is the first message, create the toast
      if (currentMessageIndex === 0) {
        toast.loading(currentMessage.message, {
          toastId: `${transactionId}-pending`,
          autoClose: false,
        });
      } else {
        // Otherwise update the existing toast
        toast.update(`${transactionId}-pending`, {
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
  }, [currentMessageIndex, data, loadingMessages, transactionId]);

  // Handle status changes
  useEffect(() => {
    if (!data || resolvedRef.current) return;
    const status = data.status;
    console.log({ data, status });

    switch (status) {
      case "CONFIRMED":
        resolvedRef.current = true;
        toast.dismiss(`${transactionId}-pending`);
        toast.success(successMessage ?? "Transaction completed successfully!", {
          toastId: `${transactionId}-mined`,
        });
        // Extract transaction hash from the data if available
        if (data && 'transactionHash' in data && typeof data.transactionHash === 'string') {
          onTransactionHash?.(data.transactionHash);
        }
        onResolved?.(true);
        break;
      case "FAILED":
        resolvedRef.current = true;
        toast.dismiss(`${transactionId}-pending`);
        toast.error(errorMessage ?? data.error ?? "Transaction failed: Unknown error", {
          toastId: `${transactionId}-errored`,
        });
        onResolved?.(false);
        break;
    }
  }, [dataUpdatedAt, data, transactionId, successMessage, errorMessage, onResolved, onTransactionHash]);

  return null; // We don't need to render anything since we're using toasts
};
