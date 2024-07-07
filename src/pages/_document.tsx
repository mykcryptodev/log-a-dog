import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Primary Meta Tags */}
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="title" content="Log a Dog" />
          <meta name="description" content="Track how many hotdogs you eat and compete against your friends!" />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://logadog.xyz" />
          <meta property="og:title" content="Log a Dog" />
          <meta property="og:description" content="Track how many hotdogs you eat and compete against your friends!" />
          <meta property="og:image" content="https://logadog.xyz/images/og-image.png" />

          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content="https://logadog.xyz" />
          <meta property="twitter:title" content="Log a Dog" />
          <meta property="twitter:description" content="Track how many hotdogs you eat and compete against your friends!" />
          <meta property="twitter:image" content="https://logadog.xyz/images/og-image.png" />

          {/* Additional tags here */}
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icon-512x512.png" />
          <meta name="theme-color" content="#FEFACF" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
