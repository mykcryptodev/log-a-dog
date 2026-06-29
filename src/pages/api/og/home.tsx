import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

// Farcaster mini-app embeds require a 3:2 image. The static OG asset is 2:1,
// so this route crops it to 1200x800 for share cards.
export default function handler(req: NextRequest) {
  const base = new URL(req.url).origin;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "800px",
          display: "flex",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${base}/images/og-image.png`}
          alt="Log a Dog"
          style={{
            objectFit: "cover",
            width: "1200px",
            height: "800px",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 800,
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=86400",
      },
    },
  );
}
