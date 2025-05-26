import { PrismaAdapter } from "@auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import { EthereumProvider } from "~/server/auth/ethereumProvider";

import { db } from "~/server/db";

import { neynarClient } from "~/lib/neynar";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      address?: string;
      fid?: number;
      username?: string;
      image?: string;
      name?: string;
    };
  }

  interface User {
    id: string;
    address?: string;
    fid?: number;
    username?: string;
    image?: string;
    name?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.address = user.address;
        token.fid = user.fid;
      } else if (token.address) {
        // For existing sessions, fetch the user's fid from the database
        const dbUser = await db.user.findFirst({
          where: { 
            address: (token.address as string).toLowerCase()
          },
          select: { fid: true }
        });
        if (dbUser?.fid) {
          token.fid = dbUser.fid;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.address = token.address as string;
        session.user.fid = token.fid as number;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    EthereumProvider({
      async createUser(credentials) {
        let fid;
        let username;
        let name;
        let image;
        try {
          // Fetch user's FID from Neynar using their Ethereum address
          const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
            addresses: [credentials.address],
          });

          // Extract FID from response - fixing the access pattern
          const addressKey = credentials.address.toLowerCase();
          fid = response[addressKey]?.[0]?.fid;
          username = response[addressKey]?.[0]?.username;
          name = response[addressKey]?.[0]?.display_name;
          image = response[addressKey]?.[0]?.pfp_url;
        } catch (error) {
          console.error("Error fetching FID from Neynar:", error);
        }

        const user = await db.user.upsert({
          where: {
            id: credentials.address.toLowerCase(),
            address: credentials.address.toLowerCase(),
          },
          update: {
            fid,
            username,
            image,
            name,
          },
          create: {
            address: credentials.address.toLowerCase(),
            fid,
            username,
            image,
            name,
          },
        });
        console.log({ user });
        // Create a new account for the user
        await db.account.upsert({ 
          where: {
            provider_providerAccountId: {
              provider: "ethereum",
              providerAccountId: credentials.address,
            },
          },
          update: {
            type: "ethereum",
          },
          create: {
            userId: user.id,
            type: "ethereum",
            provider: "ethereum",
            providerAccountId: credentials.address,
          },
        });
        console.log(' returning user ');
        return user;
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
