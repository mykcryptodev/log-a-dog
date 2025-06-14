import { FC, useEffect, useState } from "react";

interface Props {
  timestamp: string; // unix timestamp in seconds
}

const ATTESTATION_WINDOW_SECONDS = 48 * 60 * 60; // 48 hours

export const VotingCountdown: FC<Props> = ({ timestamp }) => {
  const calculateTimeLeft = () => {
    const end = Number(timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000;
    const diff = Math.max(0, end - Date.now());
    return Math.floor(diff / 1000); // seconds
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const hours = Math.floor(secondsLeft / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((secondsLeft % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(secondsLeft % 60)
    .toString()
    .padStart(2, "0");

  return (
    <span className="font-mono text-xs">
      {hours}h {minutes}m {seconds}s
    </span>
  );
};

export default VotingCountdown;
