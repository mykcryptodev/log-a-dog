import { useContext, useEffect, useState, type FC } from "react";
import { darkTheme, lightTheme, BuyWidget } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { Portal } from "./Portal";
import { DEFAULT_CHAIN, HOTDOG_TOKEN, MINIMUM_STAKE } from "~/constants";
import { toTokens } from "thirdweb";
import { FarcasterContext } from "~/providers/Farcaster";

export const Buy: FC = () => {
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;
  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  useEffect(() => {
    setUserPrefersDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const handleMiniAppBuy = async () => {
    if (!farcaster?.context) return;
    return farcaster.swapToken(HOTDOG_TOKEN[DEFAULT_CHAIN.id]! as `0x${string}`, toTokens(MINIMUM_STAKE, 18));
  }

  if (isMiniApp) {
    return (
      <button className="btn btn-primary" onClick={handleMiniAppBuy}>
        Buy $HOTDOG
      </button>
    )
  }
  
  return (
    <>
      <label htmlFor="buy_modal" className="btn btn-primary">
        Buy $HOTDOG
      </label>
      <Portal>
        <input type="checkbox" id="buy_modal" className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle">
          <div className="modal-box backdrop-blur-sm bg-opacity-50 w-full p-0 m-0 flex items-center justify-center">
            <BuyWidget
              client={client}
              chain={DEFAULT_CHAIN}
              tokenAddress={HOTDOG_TOKEN[DEFAULT_CHAIN.id]! as `0x${string}`}
              amount={toTokens(MINIMUM_STAKE, 18)}
              title="Buy $HOTDOG"
              theme={userPrefersDarkMode
                ? darkTheme({
                    colors: {
                      borderColor: "transparent",
                    },
                  })
                : lightTheme({
                    colors: {
                      borderColor: "transparent",
                    },
                  })}
            />
            <div className="modal-action">
              <label htmlFor="buy_modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
};