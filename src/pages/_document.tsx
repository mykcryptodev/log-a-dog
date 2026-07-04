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

          {/* Open Graph / Twitter defaults live in _app.tsx (next/head) so that
              individual pages can override them by key (e.g. per-dog OG images). */}
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
