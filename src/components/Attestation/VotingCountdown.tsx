import { type FC, useEffect, useState, useCallback, useRef } from "react";
import { QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Portal } from "~/components/utils/Portal";
import { ATTESTATION_WINDOW_SECONDS } from "~/constants";

// Shared interval manager to prevent multiple intervals
class IntervalManager {
  private static instance: IntervalManager;
  private subscribers = new Map<string, () => void>();
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): IntervalManager {
    if (!IntervalManager.instance) {
      IntervalManager.instance = new IntervalManager();
    }
    return IntervalManager.instance;
  }

  subscribe(id: string, callback: () => void) {
    this.subscribers.set(id, callback);
    this.startInterval();
  }

  unsubscribe(id: string) {
    this.subscribers.delete(id);
    if (this.subscribers.size === 0) {
      this.stopInterval();
    }
  }

  private startInterval() {
    if (!this.intervalId && this.subscribers.size > 0) {
      this.intervalId = setInterval(() => {
        this.subscribers.forEach(callback => callback());
      }, 1000);
    }
  }

  private stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

interface Props {
  timestamp: string; // unix timestamp in seconds
  logId?: string;
  validAttestations?: string;
  invalidAttestations?: string;
  onResolutionComplete?: () => void;
  attestationPeriod?: {
    startTime: string;
    endTime: string;
    status: number;
    totalValidStake: string;
    totalInvalidStake: string;
    isValid: boolean;
  };
}

export const VotingCountdown: FC<Props> = ({
  timestamp,
  logId,
}) => {
  const calculateTimeLeft = useCallback(() => {
    const end = Number(timestamp) + ATTESTATION_WINDOW_SECONDS;
    const now = Math.floor(Date.now() / 1000);
    const difference = end - now;

    if (difference > 0) {
      const hours = Math.floor(difference / 3600);
      const minutes = Math.floor((difference % 3600) / 60);
      const seconds = difference % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    return "Expired";
  }, [timestamp]);

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());
  const componentId = useRef(`countdown-${logId ?? timestamp}-${Math.random()}`);

  useEffect(() => {
    const manager = IntervalManager.getInstance();
    const updateTime = () => {
      setTimeLeft(calculateTimeLeft());
    };

    // Store the ID in a variable to avoid the React hooks warning
    const id = componentId.current;
    
    // Subscribe to shared interval
    manager.subscribe(id, updateTime);

    // Cleanup on unmount
    return () => {
      manager.unsubscribe(id);
    };
  }, [calculateTimeLeft]);

  const isExpired = timeLeft === "Expired";

  if (isExpired) return null;

  return (
    <div className="flex items-center">
      <label htmlFor={`${logId ?? timestamp}-voting-info`} className="btn btn-ghost btn-circle btn-xs">
        <QuestionMarkCircleIcon className="w-3 h-3" />
      </label>
      <span className="font-mono text-xs opacity-50">
        {timeLeft}
      </span>

      {/* Voting Info Modal */}
      <Portal>
        <input type="checkbox" id={`${logId ?? timestamp}-voting-info`} className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
            <label htmlFor={`${logId ?? timestamp}-voting-info`} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
              <XMarkIcon className="w-4 h-4" />
            </label>
            <h3 className="font-bold text-lg">Hotdog vs Not Hotdog</h3>
            <p className="py-2">The countdown timer is how long you have to judge whether or not the hotdog is valid or not.</p>
            <p className="py-2">Users moderate each other by judging if an uploaded photo should count towards the contest or not. This prevents duplicates, fakes, and other spam.</p>
            <p className="py-2">To keep users honest, they stake $HOTDOG tokens. If their judgement aligns with the majority of other judgements, they earn a portion of $HOTDOG tokens from voters who judged incorrectly.</p>
            <p className="py-2">Once the timer is over, nobody can vote on this submission anymore and if the submission received more yes&apos;s than no&apos;s, it counts towards the total.</p>
            <div className="modal-action">
              <label htmlFor={`${logId ?? timestamp}-voting-info`} className="btn">Close</label>
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
};

export default VotingCountdown;
