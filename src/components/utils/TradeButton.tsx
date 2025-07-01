import { useContext, useEffect, useState, type FC } from "react";
import { darkTheme, lightTheme, BuyWidget } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { FarcasterContext } from "~/providers/Farcaster";
import useActiveChain from "~/hooks/useActiveChain";
import { Portal } from "./Portal";
import { sdk } from "@farcaster/miniapp-sdk";

interface Props {
  sellToken: `0x${string}`;
  buyToken: `0x${string}`;
  sellAmount: string;
}

export const TradeButton: FC<Props> = ({ sellToken, buyToken, sellAmount }) => {
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;
  const { activeChain } = useActiveChain();
  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState(false);

  useEffect(() => {
    setUserPrefersDarkMode(
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }, []);

  const handleClick = async () => {
    if (isMiniApp) {
      try {
        await sdk.actions.swapToken({ sellToken, buyToken, sellAmount });
      } catch (err) {
        console.error('swapToken failed', err);
      }
    } else {
      const dialog = document.getElementById('trade_modal') as HTMLInputElement;
      if (dialog) dialog.checked = true;
    }
  };

  return (
    <>
      <button className="btn btn-xs" onClick={() => void handleClick()}>
        Trade
      </button>
      {!isMiniApp && (
        <Portal>
          <input type="checkbox" id="trade_modal" className="modal-toggle" />
          <div className="modal modal-bottom sm:modal-middle">
            <div className="modal-box backdrop-blur-sm bg-opacity-50 w-full p-0 m-0 flex items-center justify-center">
              <BuyWidget
                client={client}
                chain={activeChain}
                amount="100"
                tokenAddress={buyToken}
                theme={userPrefersDarkMode
                  ? darkTheme({ colors: { borderColor: 'transparent' } })
                  : lightTheme({ colors: { borderColor: 'transparent' } })}
              />
              <div className="modal-action">
                <label htmlFor="trade_modal" className="btn btn-sm btn-circle absolute right-2 top-2">
                  ✕
                </label>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default TradeButton;
