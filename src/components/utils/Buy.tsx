import { useEffect, useState, type FC } from "react";
import { darkTheme, lightTheme, BuyWidget } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { Portal } from "./Portal";
import useActiveChain from "~/hooks/useActiveChain";
import { HOTDOG_TOKEN } from "~/constants";

export const Buy: FC = () => {
  const { activeChain } = useActiveChain();
  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  useEffect(() => {
    setUserPrefersDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);
  
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
              chain={activeChain}
              tokenAddress={HOTDOG_TOKEN[activeChain.id]! as `0x${string}`}
              amount="100"
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