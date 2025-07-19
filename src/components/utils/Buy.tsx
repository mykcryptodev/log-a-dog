import { useContext, type FC } from "react";
import { darkTheme, lightTheme, BuyWidget } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { Portal } from "./Portal";
import { DEFAULT_CHAIN, HOTDOG_TOKEN, MINIMUM_STAKE } from "~/constants";
import { toTokens } from "thirdweb";
import { FarcasterContext } from "~/providers/Farcaster";
import usePrefersDarkMode from "~/hooks/usePrefersDarkMode";

export const Buy: FC = () => {
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;
  const userPrefersDarkMode = usePrefersDarkMode();

  const handleMiniAppBuy = async () => {
    if (!farcaster?.context) return;
    return farcaster.swapToken(
      HOTDOG_TOKEN[DEFAULT_CHAIN.id]! as `0x${string}`,
      toTokens(MINIMUM_STAKE, 18),
    );
  };

  if (isMiniApp) {
    return (
      <button className="btn btn-primary" onClick={handleMiniAppBuy}>
        Buy $HOTDOG
      </button>
    );
  }

  return (
    <>
      <label htmlFor="buy_modal" className="btn btn-primary">
        Buy $HOTDOG
      </label>
      <Portal>
        <input type="checkbox" id="buy_modal" className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle">
          <div className="modal-box m-0 flex w-full items-center justify-center bg-opacity-50 p-0 backdrop-blur-sm">
            <BuyWidget
              client={client}
              chain={DEFAULT_CHAIN}
              tokenAddress={HOTDOG_TOKEN[DEFAULT_CHAIN.id]! as `0x${string}`}
              amount={toTokens(MINIMUM_STAKE, 18)}
              title="Buy $HOTDOG"
              theme={
                userPrefersDarkMode
                  ? darkTheme({
                      colors: {
                        borderColor: "transparent",
                      },
                    })
                  : lightTheme({
                      colors: {
                        borderColor: "transparent",
                      },
                    })
              }
            />
            <div className="modal-action">
              <label
                htmlFor="buy_modal"
                className="btn btn-circle btn-sm absolute right-2 top-2"
              >
                ✕
              </label>
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
};
