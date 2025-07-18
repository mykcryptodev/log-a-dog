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

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    address?: string;
    fid?: number;
    fidFetched?: boolean;
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
      } else if (token.address && !token.fid && !token.fidFetched) {
        // Only fetch FID from database once per session if it's missing from the token
        try {
          const dbUser = await db.user.findFirst({
            where: { 
              address: token.address.toLowerCase()
            },
            select: { fid: true }
          });
          if (dbUser?.fid) {
            token.fid = dbUser.fid;
          }
          // Mark that we've attempted to fetch FID to prevent repeated queries
          token.fidFetched = true;
        } catch (dbError: unknown) {
          console.error('Database query failed in JWT callback:', dbError);
          // Mark as fetched even on error to prevent retry loops
          token.fidFetched = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id!;
        session.user.address = token.address!;
        session.user.fid = token.fid!;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    EthereumProvider({
      async createUser(credentials) {
        let fid: number | undefined;
        let username: string | undefined;
        let name: string | undefined;
        let image: string | undefined;
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

        // Helper function for database operations with retries
        const withRetry = async <T>(operation: () => Promise<T>, context: string): Promise<T> => {
          let retries = 3;
          while (retries > 0) {
            try {
              return await operation();
            } catch (dbError: unknown) {
              console.error(`Database operation failed in ${context} (${4 - retries}/3):`, dbError);
              retries--;
              if (retries === 0) {
                throw dbError;
              }
              // Wait 1 second before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          throw new Error("Unexpected end of retry loop");
        };

        // First try to find existing user by address (upserts would fail if the user already exists)
        let user = await withRetry(
          () => db.user.findFirst({
            where: {
              address: credentials.address.toLowerCase(),
            },
          }),
          'findFirst user'
        );

        if (user) {
          // Update existing user
          const userId = user.id; // Capture the ID to avoid null reference issues
          user = await withRetry(
            () => db.user.update({
              where: {
                id: userId,
              },
              data: {
                fid,
                username,
                image,
                name,
              },
            }),
            'update user'
          );
        } else {
          // Create new user
          user = await withRetry(
            () => db.user.create({
              data: {
                address: credentials.address.toLowerCase(),
                fid,
                username,
                image,
                name,
              },
            }),
            'create user'
          );
        }

        // Link any existing DogEvents to this user
        try {
          const finalUserId = user.id; // Capture user ID to avoid null reference issues
          const unlinkedEvents = await withRetry(
            () => db.dogEvent.updateMany({
              where: {
                eater: credentials.address.toLowerCase(),
                userId: null,
              },
              data: {
                userId: finalUserId,
              },
            }),
            'update dog events'
          );
          
          if (unlinkedEvents.count > 0) {
            console.log(`Linked ${unlinkedEvents.count} historical DogEvents to user ${user.id}`);
          }
        } catch (error) {
          console.error('Error linking historical DogEvents:', error);
          // Don't fail auth if this fails
        }

        // Create a new account for the user
        const accountUserId = user.id; // Capture user ID to avoid null reference issues
        await withRetry(
          () => db.account.upsert({ 
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
              userId: accountUserId,
              type: "ethereum",
              provider: "ethereum",
              providerAccountId: credentials.address,
            },
          }),
          'upsert account'
        );
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

