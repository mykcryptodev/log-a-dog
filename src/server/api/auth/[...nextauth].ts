import {
  authSession,
  ThirdwebAuthProvider,
} from "@thirdweb-dev/auth/next-auth";
import NextAuth, { type NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    // Add the thirdweb auth provider to the providers configuration
    ThirdwebAuthProvider({
      domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "",
    }),
    // other providers...
  ],
  callbacks: {
    // Add the authSession callback to the callbacks configuration
    session: authSession,
  },
};

export default NextAuth(authOptions);