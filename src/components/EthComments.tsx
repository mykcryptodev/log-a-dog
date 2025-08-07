import { useMemo } from "react";
import { CommentsEmbed } from "@ecp.eth/sdk/embed";

export function EthComments() {
  const uri = useMemo(
    () => new URL(window.location.pathname, "https://logadog.xyz"),
    []
  );

  return (
    <div className="w-full">
      <CommentsEmbed uri={uri} theme={{ mode: "light" }} />
    </div>
  );
}

export default EthComments;
