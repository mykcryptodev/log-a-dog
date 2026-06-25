import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          {/* Share metadata (title, description, Open Graph, Twitter) is owned
              by the <Seo> component: site-wide defaults live in _app and are
              overridden per page. _document only holds tags that never change
              and that pages never need to override. */}
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
