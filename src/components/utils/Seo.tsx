import Head from "next/head";

/**
 * Canonical site URL. Matches the hardcoded origin used elsewhere (the OG
 * image endpoint, the Farcaster frame metadata). Keep in sync if the domain
 * changes.
 */
export const SITE_URL = "https://logadog.xyz";

const DEFAULTS = {
  title: "Log a Dog",
  description:
    "The internet's summer hotdog-eating competition. Log a dog, get judged onchain, climb the board.",
  image: `${SITE_URL}/images/og-image.png`,
  imageWidth: 1200,
  imageHeight: 600,
  imageAlt: "Log a Dog",
};

export type SeoProps = {
  /** Page title. Used for <title>, og:title and twitter:title. */
  title?: string;
  /**
   * When true, the title is shown verbatim. When false (default), it is
   * suffixed with " — Log a Dog" for the browser tab / search results while
   * the social card title stays as the raw title.
   */
  exactTitle?: boolean;
  description?: string;
  /** Absolute image URL for the social card. */
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  /** Canonical URL for this page (defaults to the site root). */
  url?: string;
  /** Open Graph type. Defaults to "website". */
  type?: string;
};

/**
 * Single source of truth for shareable page metadata (Open Graph + Twitter).
 *
 * Every tag carries a stable `key` so that the site-wide defaults rendered in
 * `_app` are deduplicated and overridden by per-page values. Without the keys,
 * next/head would emit duplicate og:* tags and crawlers would pick the generic
 * default — which is exactly the bug this component exists to prevent.
 */
export function Seo({
  title,
  exactTitle = false,
  description = DEFAULTS.description,
  image = DEFAULTS.image,
  imageWidth = DEFAULTS.imageWidth,
  imageHeight = DEFAULTS.imageHeight,
  imageAlt,
  url = SITE_URL,
  type = "website",
}: SeoProps) {
  const cardTitle = title ?? DEFAULTS.title;
  const documentTitle = title
    ? exactTitle
      ? title
      : `${title} — Log a Dog`
    : DEFAULTS.title;
  const alt = imageAlt ?? DEFAULTS.imageAlt;

  return (
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1" key="viewport" />
      <title key="title">{documentTitle}</title>
      <meta name="description" content={description} key="description" />

      {/* Open Graph / Facebook / Farcaster */}
      <meta property="og:type" content={type} key="og:type" />
      <meta property="og:site_name" content="Log a Dog" key="og:site_name" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:title" content={cardTitle} key="og:title" />
      <meta property="og:description" content={description} key="og:description" />
      <meta property="og:image" content={image} key="og:image" />
      <meta property="og:image:width" content={String(imageWidth)} key="og:image:width" />
      <meta property="og:image:height" content={String(imageHeight)} key="og:image:height" />
      <meta property="og:image:alt" content={alt} key="og:image:alt" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta name="twitter:url" content={url} key="twitter:url" />
      <meta name="twitter:title" content={cardTitle} key="twitter:title" />
      <meta name="twitter:description" content={description} key="twitter:description" />
      <meta name="twitter:image" content={image} key="twitter:image" />
      <meta name="twitter:image:alt" content={alt} key="twitter:image:alt" />
    </Head>
  );
}

export default Seo;
