import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useMemo, useState, useRef, useEffect } from "react";
import { ProfileForm } from "~/components/Profile/Form";
import { api } from "~/utils/api";
import dynamic from "next/dynamic";
import { client } from "~/providers/Thirdweb";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { useSession } from "next-auth/react";
import { DEFAULT_CHAIN } from "~/constants";
import HotdogCard from "~/components/utils/HotdogCard";

const CustomMediaRenderer = dynamic(
  () => import('~/components/utils/CustomMediaRenderer'),
  { ssr: false }
);
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { address } = context.params as { address: string };
  return {
    props: {
      address,
    },
  };
};

export const Profile: NextPage<{ address: string }> = ({ address }) => {
  const acccount = useActiveAccount();
  const { data: sessionData } = useSession();
  const { data, isLoading, refetch } = api.profile.getByAddress.useQuery({
    address,
    chainId: DEFAULT_CHAIN.id,
  }, {
    enabled: !!address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  console.log({ data });
  const [showProfileForm, setShowProfileForm] = useState<boolean>(false);
  
  // Hotdog data for this user
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const limit = 4;

  const {
    data: dogData,
    isLoading: isLoadingHotdogs,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchDogData,
  } = api.hotdog.getAllForUser.useInfiniteQuery({
      chainId: DEFAULT_CHAIN.id,
      user: address,
      limit,
    }, {
      enabled: !!address && !!DEFAULT_CHAIN.id,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  // Check if this is the user's own profile
  const isOwnProfile = useMemo(() => {
    return acccount?.address.toLowerCase() === data?.address.toLowerCase() ||
           sessionData?.user?.address?.toLowerCase() === data?.address.toLowerCase();
  }, [acccount, sessionData, data]);

  // Only use sessionData for display if this is the user's own profile AND sessionData has the info
  const displayUsername = (isOwnProfile && sessionData?.user?.username) ? sessionData.user.username : data?.username;
  const displayImage = (isOwnProfile && sessionData?.user?.image) ? sessionData.user.image : data?.imgUrl;
  const hasNoAvatar = !displayImage || displayImage === '';

  useEffect(() => {
    if (isOwnProfile && hasNoAvatar && !isLoading) {
      setShowProfileForm(true);
    }
  }, [isOwnProfile, hasNoAvatar, isLoading]);

  useEffect(() => {
    const loadMoreTarget = loadMoreRef.current;
    if (!loadMoreTarget) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(loadMoreTarget);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const loadedHotdogs = useMemo(() => {
    return dogData?.pages.flatMap((page) =>
      page.hotdogs.map((hotdog, index) => ({
        hotdog,
        validAttestations: page.validAttestations[index],
        invalidAttestations: page.invalidAttestations[index],
      }))
    ) ?? [];
  }, [dogData?.pages]);

  const totalHotdogs = dogData?.pages[0]?.totalCount ?? 0;

  const handleRefetchDogData = () => {
    void refetchDogData();
  };

  const renderHotdogSkeletons = () => (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
      {Array.from({ length: limit }).map((_, index) => (
        <div className="card pop-card bg-base-100 p-4" key={index}>
          <div className="flex gap-2 items-center">
            <div className="h-10 w-10 bg-base-300 animate-pulse rounded-full" />
            <div className="h-4 w-20 bg-base-300 animate-pulse rounded-lg" />
          </div>
          <div className="card-body p-4">
            <div className="mx-auto w-56 h-56 bg-base-300 animate-pulse rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderHotdogList = () => {
    if (isLoadingHotdogs) {
      return renderHotdogSkeletons();
    }

    if (loadedHotdogs.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-base-content/70">No hotdog logs found for this user.</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {loadedHotdogs.map(({ hotdog, validAttestations, invalidAttestations }, index) => (
            <HotdogCard
              key={`${hotdog.logId}-${index}`}
              hotdog={hotdog}
              validAttestations={validAttestations?.toString() ?? "0"}
              invalidAttestations={invalidAttestations?.toString() ?? "0"}
              userAttested={false}
              userAttestation={false}
              chainId={DEFAULT_CHAIN.id}
              onRefetch={handleRefetchDogData}
              linkToDetail={true}
              showAiJudgement={false}
              disabled={false}
            />
          ))}
        </div>

        <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <span className="loading loading-spinner loading-sm" />
              <span>Loading more dogs...</span>
            </div>
          ) : !hasNextPage ? (
            <p className="text-sm text-base-content/60">You&apos;ve reached the end of this profile.</p>
          ) : null}
        </div>
      </>
    );
  };

  if (isLoading) return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">
            <div className="loading loading-spinner mr-2" />
            Loading...
          </h1>
        </div>
      </div>
    </main>
  )

  if (!data) return null;
  return (
    <main className="flex flex-col items-center px-4 pt-6">
      <div className="flex w-full max-w-xl flex-col gap-6">
        {/* Stat hero */}
        <div className="pop-card flex flex-col items-center gap-3 rounded-3xl bg-base-200 p-6 text-center">
          <span className="pop-frame inline-flex overflow-hidden rounded-full">
            <CustomMediaRenderer
              src={displayImage ?? ''}
              alt={displayUsername ?? ''}
              className="rounded-full"
              width={"88px"}
              height={"88px"}
              client={client}
            />
          </span>
          <h1 className="font-display text-3xl tracking-wide">{displayUsername ?? `${address.slice(0, 6)}...${address.slice(-4)}`}</h1>
          <div className="flex items-center gap-2">
            <span className="font-display text-4xl tabular-nums leading-none">
              {totalHotdogs}
            </span>
            <span className="text-lg">🌭 logged this season</span>
          </div>
          {isOwnProfile && (
            <button
              className="pop-btn rounded-lg bg-base-100 px-3 py-1 font-display text-xs"
              onClick={() => setShowProfileForm(!showProfileForm)}
            >
              {showProfileForm ? 'Cancel' : hasNoAvatar ? 'Add Avatar' : 'Edit Profile'}
            </button>
          )}
        </div>

        {showProfileForm && (
          <ProfileForm
            onProfileSaved={() => {
              void refetch();
              setShowProfileForm(false);
            }}
            existingImgUrl={displayImage}
            existingUsername={displayUsername}
          />
        )}
        {isOwnProfile && (
          <div className="flex justify-center">
            <ConnectButton client={client} />
          </div>
        )}
        {/* User's Hotdog Submissions */}
          <div className="w-full">
            {renderHotdogList()}
          </div>
        </div>
    </main>
  );
};

export default Profile;
