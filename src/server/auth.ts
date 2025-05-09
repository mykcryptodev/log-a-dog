import { PrismaAdapter } from "@auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import { EthereumProvider } from "~/server/auth/ethereumProvider";
import { env } from "~/env";

import { db } from "~/server/db";

import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const config = new Configuration({
  apiKey: env.NEYNAR_API_KEY,
});

const neynarClient = new NeynarAPIClient(config);

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
    };
  }

  interface User {
    id: string;
    address?: string;
    fid?: number;
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
        try {
          // Fetch user's FID from Neynar using their Ethereum address
          const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
            addresses: [credentials.address],
          });

          // Extract FID from response - fixing the access pattern
          const addressKey = credentials.address.toLowerCase();
          fid = response[addressKey]?.[0]?.fid;
        } catch (error) {
          console.error("Error fetching FID from Neynar:", error);
        }

        const user = await db.user.create({
          data: {
            address: credentials.address,
            fid,
          },
        });
        console.log({ user });
        // Create a new account for the user
        await db.account.create({ 
          data: {
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
