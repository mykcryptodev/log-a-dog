import { type FC } from "react";
import Script from 'next/script';

export const Changelog: FC = () => {
  return (
    <>
      <Script id="headway-script" strategy="lazyOnload">
        {`
          var HW_config = {
            selector: "#headway",
            account:  "7kvjKx"
          };
        `}
      </Script>
      <Script id="headway-script-load" async src="https://cdn.headwayapp.co/widget.js" />
      <div id="headway" className="-ml-6" />
    </>
  );
};

export default Changelog;