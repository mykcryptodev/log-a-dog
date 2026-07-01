import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { MotionConfig } from "motion/react";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ThirdwebProviderWithActiveChain } from "~/providers/Thirdweb";
import { Layout } from "~/components/utils/Layout";
import '@farcaster/auth-kit/styles.css';
import { FarcasterProvider } from "~/providers/Farcaster";
import { Seo } from "~/components/utils/Seo";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      {/* Site-wide default share metadata. Every tag carries a stable key so
          per-page <Seo>/<Head> overrides deduplicate cleanly. */}
      <Seo />
      <ThirdwebProviderWithActiveChain>
        <FarcasterProvider>
          {/* reducedMotion="user" makes every motion component fall back to
              opacity-only when the OS requests reduced motion. See REDESIGN §7. */}
          <MotionConfig reducedMotion="user">
            <div className="font-sans">
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
