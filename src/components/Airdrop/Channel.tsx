import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { AIRDROP, HOTDOG_TOKEN } from "../../constants/addresses";
import { claimERC20, isClaimed } from "thirdweb/extensions/airdrop";
import { DEFAULT_CHAIN } from "~/constants/chains";
import { getContract } from "thirdweb";
import { client } from "~/providers/Thirdweb";
import Connect from "../utils/Connect";
import { toast } from "react-toastify";
import { useCallback, useEffect, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export const AirdropChannel = () => {
  const account = useActiveAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [userHasClaimed, setUserHasClaimed] = useState(false);

  const checkIfClaimed = useCallback(async () => {
    if (!account) return false;

    const hasClaimed = await isClaimed({
      contract: getContract({
        address: AIRDROP[DEFAULT_CHAIN.id] as `0x${string}`,
        chain: DEFAULT_CHAIN,
        client,
      }),
      receiver: account?.address as `0x${string}`,
      token: HOTDOG_TOKEN[DEFAULT_CHAIN.id] as `0x${string}`,
      tokenId: BigInt(0),
    });

    setUserHasClaimed(hasClaimed);
  }, [account]);

  useEffect(() => {
    checkIfClaimed();
  }, []);

  if (!account) {
    return (
      <Connect />
    );
  }

  return (
    <div>
      <TransactionButton
        transaction={() => {
          return claimERC20({
            contract: getContract({
              address: AIRDROP[DEFAULT_CHAIN.id] as `0x${string}`,
              chain: DEFAULT_CHAIN,
              client,
            }),
            tokenAddress: HOTDOG_TOKEN[DEFAULT_CHAIN.id] as `0x${string}`,
            recipient: account.address,
          })
        }}
        onError={(error) => {
          setIsClaiming(false);
          toast.dismiss();
          toast.error(`Error claiming airdrop: ${error.message}`);
        }}
        onTransactionSent={() => {
          setIsClaiming(true);
          toast.loading("Airdrop claim transaction sent");
        }}
        onTransactionConfirmed={() => {
          setIsClaiming(false);
          toast.dismiss();
          toast.success("Airdrop claimed!");
          setUserHasClaimed(true);
        }}
      >
        {isClaiming ? (
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="w-4 h-4 stroke-2 animate-spin" />
            Claiming...
          </div>
        ) : (
          userHasClaimed ? "Claimed" : "Claim Airdrop"
        )}
      </TransactionButton>
    </div>
  )
};