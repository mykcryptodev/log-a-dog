import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { AIRDROP, HOTDOG_TOKEN } from "../../constants/addresses";
import { isClaimed, claimERC20 } from "thirdweb/extensions/airdrop";
import { DEFAULT_CHAIN } from "~/constants/chains";
import { getContract } from "thirdweb";
import { client } from "~/providers/Thirdweb";
import Connect from "../utils/Connect";
import { toast } from "react-toastify";
import { useCallback, useEffect, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { isAddressEligible, getAmountForAddress, debugOfficialMerkleTree } from "../../helpers/merkleProofs";
import { AIRDROP_CSV_DATA } from "../../../airdrop/airdrop";

export const AirdropChannel = () => {
  const account = useActiveAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [userHasClaimed, setUserHasClaimed] = useState(false);
  const [userAmount, setUserAmount] = useState<number>(0);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

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

  // Check user eligibility and amount
  const checkUserEligibility = useCallback(async () => {
    if (!account?.address) {
      setUserAmount(0);
      return;
    }

    setIsCheckingEligibility(true);
    try {
      console.log("🔍 Checking eligibility for address:", account.address);
      
      // Debug the merkle tree (optional)
      await debugOfficialMerkleTree(AIRDROP_CSV_DATA);
      
      // Check if user is eligible
      const isEligible = isAddressEligible(AIRDROP_CSV_DATA, account.address);
      const amount = getAmountForAddress(AIRDROP_CSV_DATA, account.address);
      
      setUserAmount(isEligible ? amount : 0);
      
      if (isEligible) {
        console.log("✅ User is eligible for", amount, "tokens");
      } else {
        console.log("❌ User is not eligible for airdrop");
      }
    } catch (error) {
      console.error("❌ Error checking eligibility:", error);
      setUserAmount(0);
    } finally {
      setIsCheckingEligibility(false);
    }
  }, [account?.address]);

  useEffect(() => {
    checkIfClaimed().catch((error) => {
      console.error("Error checking if claimed:", error);
    });
    checkUserEligibility().catch((error) => {
      console.error("Error checking user eligibility:", error);
    });
  }, [checkIfClaimed, checkUserEligibility]);

  if (!account) {
    return (
      <Connect />
    );
  }

  if (isCheckingEligibility) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <ArrowPathIcon className="w-4 h-4 animate-spin" />
        Checking eligibility...
      </div>
    );
  }

  // If user is not eligible, don't show the button
  if (userAmount === 0) {
    return (
      <div className="text-gray-500">
        Address not eligible for airdrop ({account.address})
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-sm text-center text-gray-600">
        Eligible for: {userAmount} $HOTDOG tokens
      </div>
      <TransactionButton
        transaction={() => {
          const contract = getContract({
            address: AIRDROP[DEFAULT_CHAIN.id] as `0x${string}`,
            chain: DEFAULT_CHAIN,
            client,
          });

          console.log("📤 Claiming with thirdweb's official claimERC20:", {
            recipient: account.address,
            tokenAddress: HOTDOG_TOKEN[DEFAULT_CHAIN.id],
            amount: userAmount,
          });

          // Use thirdweb's official claimERC20 function
          // This automatically fetches proofs from the contract metadata
          return claimERC20({
            contract,
            recipient: account.address,
            tokenAddress: HOTDOG_TOKEN[DEFAULT_CHAIN.id] as `0x${string}`,
          });
        }}
        onError={(error) => {
          setIsClaiming(false);
          toast.dismiss();
          toast.error(`Error claiming airdrop: ${error.message}`);
          console.error("❌ Transaction error:", error);
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