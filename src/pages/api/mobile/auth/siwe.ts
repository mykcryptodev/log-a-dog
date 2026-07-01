import type { NextApiRequest, NextApiResponse } from "next";
import { encode } from "next-auth/jwt";
import { z } from "zod";

import {
  AUTH_SESSION_MAX_AGE_SECONDS,
  findOrCreateEthereumUser,
} from "~/server/auth";
import {
  authenticateEthereumCredentials,
  type AuthenticatedEthereumUser,
} from "~/server/auth/ethereumProvider";

const mobileSiweSchema = z.object({
  address: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1),
  profile: z
    .object({
      fid: z.number().optional().nullable(),
      username: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      name: z.string().optional().nullable(),
    })
    .optional(),
});

type MobileSiweResponse =
  | {
      sessionToken: string;
      user: AuthenticatedEthereumUser;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileSiweResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = mobileSiweSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid SIWE payload" });
  }

  const authenticatedUser = await authenticateEthereumCredentials(
    parsed.data,
    findOrCreateEthereumUser,
  );

  if (!authenticatedUser) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "NEXTAUTH_SECRET is not configured" });
  }

  const profile = parsed.data.profile;
  const user = {
    ...authenticatedUser,
    fid: profile?.fid ?? authenticatedUser.fid,
    username: profile?.username ?? authenticatedUser.username,
    image: profile?.image ?? authenticatedUser.image,
    name: profile?.name ?? authenticatedUser.name,
  };

  const sessionToken = await encode({
    secret,
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    token: {
      sub: user.id,
      id: user.id,
      address: user.address,
      fid: user.fid,
      name: user.name,
      picture: user.image,
    },
  });

  return res.status(200).json({ sessionToken, user });
}
