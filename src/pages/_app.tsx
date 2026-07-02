import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { useRouter } from "next/router";
import { MotionConfig, motion } from "motion/react";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ThirdwebProviderWithActiveChain } from "~/providers/Thirdweb";
import { Layout } from "~/components/utils/Layout";
import '@farcaster/auth-kit/styles.css';
import { FarcasterProvider } from "~/providers/Farcaster";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  return (
    <SessionProvider session={session}>
      <ThirdwebProviderWithActiveChain>
        <FarcasterProvider>
          {/* reducedMotion="user" makes every motion component fall back to
              opacity-only when the OS requests reduced motion. See REDESIGN §7. */}
          <MotionConfig reducedMotion="user">
            <div className="font-sans">
              <Layout>
                {/* Subtle page transition: each route settles in with a short
                    fade + rise. Keyed by route (not asPath) so param-only
                    changes on the same page don't re-run it, and no exit
                    animation so navigation never feels delayed. */}
                <motion.div
                  key={router.route}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <Component {...pageProps} />
                </motion.div>
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
