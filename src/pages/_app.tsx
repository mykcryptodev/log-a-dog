import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import Head from "next/head";
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
      {/* Site-wide Open Graph / Twitter defaults. Keyed so any page can
          override them via next/head (e.g. per-dog OG images on /dog/[logId]). */}
      <Head>
        <meta key="ogtype" property="og:type" content="website" />
        <meta key="ogurl" property="og:url" content="https://www.logadog.xyz" />
        <meta key="ogtitle" property="og:title" content="Log a Dog" />
        <meta
          key="ogdesc"
          property="og:description"
          content="Track how many hotdogs you eat and compete against your friends!"
        />
        <meta
          key="ogimage"
          property="og:image"
          content="https://www.logadog.xyz/images/og-image.png"
        />
        <meta key="twcard" name="twitter:card" content="summary_large_image" />
        <meta key="twurl" name="twitter:url" content="https://www.logadog.xyz" />
        <meta key="twtitle" name="twitter:title" content="Log a Dog" />
        <meta
          key="twdesc"
          name="twitter:description"
          content="Track how many hotdogs you eat and compete against your friends!"
        />
        <meta
          key="twimage"
          name="twitter:image"
          content="https://www.logadog.xyz/images/og-image.png"
        />
      </Head>
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
