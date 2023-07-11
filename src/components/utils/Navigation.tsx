import { HomeIcon, MagnifyingGlassIcon, MoonIcon, SunIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ConnectWallet, MediaRenderer, NATIVE_TOKEN_ADDRESS, useAddress, useBalance, useChain,useDisconnect  } from "@thirdweb-dev/react";
import { Token, TokenAmount } from "@uniswap/sdk";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { type FC,useEffect,useMemo } from "react";

import Avatar from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import { Portal } from "~/components/utils/Portal";
import Search from "~/components/utils/Search";
import ThemeSwitch from "~/components/utils/ThemeSwitch";
import { APP_NAME } from "~/constants";
import { DEFAULT_CHAIN } from "~/constants/chain";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

export const Navigation: FC = () => {
  const address = useAddress();
  const disconnect = useDisconnect();
  const { 
    data: nativeBalance, 
    isLoading: nativeBalanceIsLoading 
  } = useBalance(NATIVE_TOKEN_ADDRESS);
  const { data: admins } = api.user.getAdmins.useQuery();
  const isAdmin = useMemo(() => {
    return admins?.some((admin) => admin.address.toLowerCase() === address?.toLowerCase());
  }, [admins, address]);
  // unlike other parts of the app, navigation shows the chain
  // that the user is connected to regardless of the chain they
  // are viewing assets for
  const chain = useChain();
  const isDarkTheme = useIsDarkTheme();
  const natvieBalanceTokenAmount = useMemo(() => {
    return new TokenAmount(
      new Token(
        Number(chain?.chainId || DEFAULT_CHAIN.chainId),
        NATIVE_TOKEN_ADDRESS,
        chain?.nativeCurrency?.decimals || DEFAULT_CHAIN.nativeCurrency.decimals,
        chain?.nativeCurrency?.symbol || DEFAULT_CHAIN.nativeCurrency.symbol,
        chain?.nativeCurrency?.name || DEFAULT_CHAIN.nativeCurrency.name,
      ),
      nativeBalance?.value.toString() || "0"
    );
  }, [nativeBalance, chain]);

  const disconnectAndSignOut = async () => {
    await signOut();
    await disconnect();
  };

  const SearchModal: FC = () => {
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "k") {
          document.getElementById("search-modal")?.click();
          document.getElementById("modal-search-input")?.focus();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, []);
    
    return (
      <>
        <label 
          htmlFor="search-modal" 
          className="cursor-pointer"
          onClick={() => {
            document.getElementById("modal-search-input")?.focus();
          }}
        >
          <MagnifyingGlassIcon className="h-10 w-10 stroke-2" />
        </label>

        <Portal>
          <input type="checkbox" id="search-modal" className="modal-toggle" />
          <div className="modal flex items-center justify-center">
            <div className="modal-box h-96 relative bg-transparent shadow-none">
              <label htmlFor="search-modal" className="btn btn-sm btn-circle absolute right-2 top-6 z-10">
                <XMarkIcon className="h-4 w-4 stroke-2" />
              </label>
              <div className="py-4 flex flex-col items-stretch">
                <Search inputId="modal-search-input" />
              </div>
            </div>
          </div>
        </Portal>
      </>
    );
  }
  
  return (
    <header className="relative isolate z-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-2 sm:p-6 lg:px-8 py-4" aria-label="Global">
        <div className="navbar bg-base-100 rounded-lg">
          <div className="lg:flex-none flex-1">
            <Link href="/" className="btn btn-ghost normal-case text-xl">
              <span className="sm:flex hidden">
                {APP_NAME}
              </span>
              <span className="sm:hidden flex">
                <HomeIcon className="w-10 h-10 stroke-2" />
              </span>
            </Link>
          </div>
          <div className="flex-1 lg:flex hidden mx-4">
            <Search inputId="nav-search-input" />
          </div>
          <div className="flex-none gap-2 space-x-2">
            <div className="lg:hidden flex">
              <SearchModal />
            </div>
            <div className="dropdown dropdown-end hidden sm:flex">
              <ThemeSwitch />
            </div>
            <div className="dropdown dropdown-end flex items-center">
              <ConnectWallet 
                auth={{
                  loginOptional: true,
                }}
                btnTitle="Login"
                theme={isDarkTheme ? 'dark' : 'light'}
                className="thirdweb-btn-lg"
                modalTitle={`Login to ${APP_NAME}`}
                detailsBtn={() => {
                  return (
                    <button className="btn btn-lg flex items-center gap-2 normal-case pr-2 pl-4 rounded-r-none no-animation">
                      <div className="flex-1 flex-col gap-1">
                        <Name address={address || ""} shorten={true} />
                        {nativeBalanceIsLoading ? (
                          <div className="h-4 w-16 mt-1 ml-7 bg-base-300 animate-pulse rounded-lg" />
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <MediaRenderer
                              src={chain?.icon?.url || DEFAULT_CHAIN.icon?.url || ""}
                              width="14px"
                              height="14px"
                              className="rounded-full"
                            />
                            <div className="text-xs text-end">
                              {natvieBalanceTokenAmount.toSignificant(4, { groupSeparator: ','})} {nativeBalance?.symbol}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                }}
              />
              {address && (
                <div className="flex justify-center btn btn-lg py-2 pl-2 pr-4 rounded-r-lg rounded-l-none">
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="cursor-pointer">
                      <Avatar width={48} height={48} address={address || ""} />
                    </label>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-4">
                      <li>
                        <Link href={`/profile/${address || ""}`}>
                          Profile
                        </Link>
                      </li>
                      {isAdmin && (
                        <li>
                          <Link href={'/admin'}>
                            Admin
                          </Link>
                        </li>
                      )}
                      <li>
                        <a onClick={() => void disconnectAndSignOut()}>
                          Sign Out
                        </a>
                      </li>
                      <li className="sm:hidden block">
                        <div className="divider my-2" />
                      </li>
                      <li className="sm:hidden block">
                        <a className="flex w-full justify-center items-center">
                          <MoonIcon className="w-8 h-8 stroke-2" />
                          <ThemeSwitch toggle={true} />
                          <SunIcon className="w-8 h-8 stroke-2" />
                        </a>
                      </li>                        
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navigation;