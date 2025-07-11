import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { query, variables } = req.body as { query: string; variables?: Record<string, unknown> };
    const response = await fetch(
      "https://api.ghostlogs.xyz/gg/pub/7a444b24-49f2-4960-8e2b-18eedc34ea4b/ghostgraph",
      {
        method: "POST",
        headers: {
          "X-GHOST-KEY": env.GHOST_PROTOCOL_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching from Ghost Graph" });
  }
}
