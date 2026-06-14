import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { Anton } from "next/font/google";
import { MotionConfig } from "motion/react";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ThirdwebProviderWithActiveChain } from "~/providers/Thirdweb";
import { Layout } from "~/components/utils/Layout";
import '@farcaster/auth-kit/styles.css';
import { FarcasterProvider } from "~/providers/Farcaster";

// Chunky condensed "scoreboard" display face. Exposed as the --font-display
// CSS var consumed by tailwind's `font-display` utility.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <ThirdwebProviderWithActiveChain>
        <FarcasterProvider>
          {/* reducedMotion="user" makes every motion component fall back to
              opacity-only when the OS requests reduced motion. See REDESIGN §7. */}
          <MotionConfig reducedMotion="user">
            <div className={anton.variable}>
              <Layout>
                <Component {...pageProps} />
                <div id="portal" />
              </Layout>
            </div>
          </MotionConfig>
        </FarcasterProvider>
      </ThirdwebProviderWithActiveChain>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
