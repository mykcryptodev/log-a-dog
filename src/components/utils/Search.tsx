import { type Chain } from "@thirdweb-dev/chains";
import { MediaRenderer } from "@thirdweb-dev/react";
import { motion } from 'framer-motion';
import Link from "next/link";
import { type FC,useEffect,useMemo,useState } from "react";

import Avatar from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "~/constants/chain";
import useDebounce from "~/hooks/useDebounce";
import useShortenedAddress from "~/hooks/useShortenedAddress";
import { api } from "~/utils/api";

interface Props {
  inputId: string;
}

export const Search: FC<Props> = ({ inputId }) => {
  const { getShortenedAddress } = useShortenedAddress();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [query, setQuery] = useState<string>(""); // The query string to search for
  const debouncedValue = useDebounce(query, 300); // the debounce delay (in milliseconds)
  const { data: results, isLoading } = api.search.getItems.useQuery({
    query: debouncedValue,
  });
  const hasResults = useMemo(() => {
    return results?.profiles?.length
  }, [results]);
  const [shortcutButton, setShortcutButton] = useState<string>("Ctrl");
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      if (/(Mac)/i.test(navigator.userAgent)) {
        setShortcutButton("⌘");
      }
    }
  }, []);

  const ChainIcon: FC<{ chainId: number }> = ({ chainId }) => {
    const chain = SUPPORTED_CHAINS.find(c => c.chainId == chainId) || DEFAULT_CHAIN;
    const chainWithIcon = chain as Chain & { icon: { url: string } };
  
    return (
      <MediaRenderer
        src={chainWithIcon.icon.url}
        className="rounded-lg"
        style={{ width: "18px", height: "18px", borderRadius: "8px" }}
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex w-full justify-center">
        <div className="relative w-full max-w-lg">
          <input 
            type="text"
            id={inputId}
            placeholder="Search..."
            className={`input input-lg input-bordered max-w-lg w-full ${hasResults && isInputFocused ? 'rounded-b-none' : ''}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => void setIsInputFocused(true)}
            onBlur={() => {
              // give the user a chance to click on the results
              setTimeout(() => {
                setIsInputFocused(false);
              }, 100);
            }}
          />
          {query.length < 30 && (
            <div className="lg:block hidden absolute right-4 top-4 gap-2 opacity-50">
              <kbd className="kbd">
                {shortcutButton}
              </kbd><span className="mx-2">+</span><kbd className="kbd">k</kbd>
            </div>
          )}
        </div>
      </div>
      {isLoading && query !== "" ? (
        <motion.div 
          initial={{ opacity: 0, y: -25 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.25 }} 
          className="flex justify-center relative z-10"
        >
          <div className="input-bordered shadow-xl rounded-b-lg p-4 border w-full max-w-lg absolute z-10 bg-base-100">
            <div className="flex flex-col gap-2 w-full">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2 animate-pulse">
                  <div className="h-16 w-16 bg-base-300 rounded-lg" />
                  <div className="flex w-full justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="h-6 w-36 bg-base-300 rounded-lg" />
                      <div className="h-4 w-24 bg-base-300 rounded-lg" />
                    </div>
                    <div className="h-4 w-12 bg-base-300 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
      {hasResults && isInputFocused ? (
        <div
          className="flex justify-center relative text-lg z-10"
        >
          <div className="input-bordered shadow-xl rounded-b-lg border w-full max-w-lg absolute bg-base-100 p-2 flex flex-col gap-2 max-h-56 overflow-y-scroll">
            {results?.profiles?.map((profile) => (
              <Link href={`/profile/${profile.userId}`} key={profile.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-base-200">
                <Avatar address={profile.userId} height={64} width={64} />
                <div className="flex flex-col w-full">
                  <div className="flex w-full justify-between items-center">
                    <Name className="font-bold" address={profile.userId} />
                    <div className="badge badge-secondary">Profile</div>
                  </div>
                  <span className="text-sm">{getShortenedAddress(profile.userId)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
};

export default Search;