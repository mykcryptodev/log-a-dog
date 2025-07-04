// @ts-nocheck
import { type User } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";

import verifySignature from "~/helpers/verifySignature";
import { db } from "~/server/db";

type EthereumProviderConfig = {
  createUser: (credentials: { address: string }) => Promise<User>;
}
export const EthereumProvider = ({ createUser }: EthereumProviderConfig): NextAuthOptions["providers"][number] => ({
  id: "ethereum",
  name: "Ethereum",
  type: "credentials",
  credentials: {
    message: { label: "Message", type: "text" },
    signature: { label: "Signature", type: "text" },
    address: { label: "Address", type: "text" },
  },
  async authorize(credentials) {
    console.log('Authorize called with credentials:', credentials);
    if (!credentials?.message || !credentials?.signature || !credentials?.address) {
      console.log('Missing credentials');
      return null;
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

    try {
      const isValid = await verifySignature(
        credentials.message,
        credentials.signature,
        credentials.address,
      );

      if (isValid) {
        console.log('Signature is valid');
        
        const walletAddress = credentials.address.toLowerCase(); // Capture address to avoid undefined issues
        
        // if the credentials.message includes "Link User:", we can extract the user id
        const linkUserRegex = /Link User: ([a-zA-Z0-9]+)/;
        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        const linkUserMatch = credentials.message.match(linkUserRegex);;
        const linkUser = linkUserMatch ? linkUserMatch[1] : undefined;
        // user is linking their ethereum address to an existing account
        if (linkUser) {
          return linkAddressToExistingUser({
            existingUserId: linkUser,
            withRetry
          });
        }

        // Use retry logic for database connection issues
        let user = await withRetry(
          () => db.user.findFirst({
            where: { address: walletAddress },
          }),
          'find user by address'
        );

        if (!user) {
          console.log('Creating new user');
          user = await createUser({ address: walletAddress });
        }

        console.log('Returning user:', user);
        return {
          id: user.id,
          address: walletAddress,
        }
      }

      console.error("Signature verification failed")
      return null
    } catch (error) {
      console.error("Error in authorize:", error)
      return null
    }

    async function linkAddressToExistingUser({ existingUserId, withRetry }: { 
      existingUserId: string;
      withRetry: <T>(operation: () => Promise<T>, context: string) => Promise<T>;
    }) {
      if (!credentials?.address) return null;
      
      const walletAddress = credentials.address.toLowerCase(); // Capture address to avoid undefined issues

      // check if the user who is trying to link (the ethereum wallet that signed)
      // has already linked an ethereum address
      const ethereumWalletUser = await withRetry(
        () => db.user.findFirst({
          where: {
            address: walletAddress,
          },
        }),
        'find ethereum wallet user'
      );
      // if the user has already linked an ethereum address to another user,
      // we should remove the link before linking to the new user
      // 
      // this can happen if the user signs in as a guest and connects their wallet
      // then the come back later and try to connect their ethereum wallet to another
      // guest account. We should remove the link to the first guest account. 
      
      // delete the existing link
      if (ethereumWalletUser) {
        await withRetry(
          () => db.user.update({
            where: {
              id: ethereumWalletUser.id,
            },
            data: {
              address: null,
            },
          }),
          'update ethereum wallet user'
        );
        // delete the associated ethereum account
        await withRetry(
          () => db.account.deleteMany({
            where: {
              userId: ethereumWalletUser.id,
              type: "ethereum",
            },
          }),
          'delete ethereum accounts'
        );
      }

      const existingLinkedUser = await withRetry(
        () => db.user.findUnique({
          where: {
            id: existingUserId,
          },
        }),
        'find existing linked user'
      );
      if (existingLinkedUser?.address) {
        console.error("User already has an ethereum address linked")
        return null;
      }
      const user = await withRetry(
        () => db.user.update({
          where: {
            id: existingUserId,
          },
          data: {
            address: walletAddress,
          },
        }),
        'update user with address'
      );
      await withRetry(
        () => db.account.create({
          data: {
            userId: user.id,
            type: "ethereum",
            provider: "ethereum",
            providerAccountId: walletAddress,
          },
        }),
        'create ethereum account'
      );

      return {
        id: user.id,
        address: walletAddress,
      }
    }
  },
});