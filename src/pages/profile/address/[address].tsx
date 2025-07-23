import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useMemo, useState, useRef, useEffect } from "react";
import { ProfileForm } from "~/components/Profile/Form";
import { api } from "~/utils/api";
import dynamic from "next/dynamic";
import { client } from "~/providers/Thirdweb";
import { CreateAttestation } from "~/components/Attestation/Create";
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
  const [start, setStart] = useState<number>(0);
  const [isPaginating, setIsPaginating] = useState(false);
  const paginationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const limit = 4;

  const { data: dogData, isLoading: isLoadingHotdogs, refetch: refetchDogData } = api.hotdog.getAllForUser.useQuery({
    chainId: DEFAULT_CHAIN.id,
    user: address,
    limit,
    start,
  }, {
    enabled: !!address && !!DEFAULT_CHAIN.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    onSettled: () => setIsPaginating(false),
  });

  // Check if this is the user's own profile
  const isOwnProfile = useMemo(() => {
    return acccount?.address.toLowerCase() === data?.address.toLowerCase() ||
           sessionData?.user?.address?.toLowerCase() === data?.address.toLowerCase();
  }, [acccount, sessionData, data]);

  // Only use sessionData for display if this is the user's own profile AND sessionData has the info
  const displayUsername = (isOwnProfile && sessionData?.user?.username) ? sessionData.user.username : data?.username;
  const displayImage = (isOwnProfile && sessionData?.user?.image) ? sessionData.user.image : data?.imgUrl;

  // Mobile-safe scroll function for pagination
  const scrollToTop = () => {
    // Clear any pending scroll timeout
    if (paginationTimeoutRef.current) {
      clearTimeout(paginationTimeoutRef.current);
    }
    
    // Use a longer delay on mobile and requestAnimationFrame for smoother scrolling
    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 300 : 100;
    
    paginationTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        // Scroll to top of the user list
        window.scrollTo({ 
          top: 0, 
          behavior: isMobile ? "auto" : "smooth" 
        });
      });
    }, delay);
  };

  // Handle pagination with loading state
  const handlePagination = (direction: 'prev' | 'next') => {
    if (isPaginating) return; // Prevent rapid pagination clicks
    
    setIsPaginating(true);
    
    if (direction === 'prev') {
      setStart((prev) => Math.max(0, prev - limit));
    } else {
      setStart((prev) => prev + limit);
    }
    
    scrollToTop();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (paginationTimeoutRef.current) {
        clearTimeout(paginationTimeoutRef.current);
      }
    };
  }, []);

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
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <CustomMediaRenderer
                src={displayImage ?? ''}
                alt={displayUsername ?? ''}
                className="rounded-full"
                width={"48px"}
                height={"48px"}
                client={client}
              />
              <h1 className="text-2xl font-bold">{displayUsername}</h1>
            </div>
            <button className={`btn btn-ghost btn-xs ${isOwnProfile ? '' : 'hidden'}`} onClick={() => setShowProfileForm(!showProfileForm)}>
              {showProfileForm ? 'Cancel Edit' : 'Edit Profile'}
            </button>
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
          {!acccount && (
            <div className="mb-4">
              <ConnectButton client={client} />
            </div>
          )}
          {isOwnProfile && (
            <CreateAttestation />
          )}
          {/* User's Hotdog Submissions */}
          <div className="w-full">
            {/* Show pagination loading overlay */}
            {isPaginating && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-base-100 p-4 rounded-lg shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="loading loading-spinner loading-sm"></div>
                    <span>Loading page...</span>
                  </div>
                </div>
              </div>
            )}
            
            {isLoadingHotdogs && !isPaginating ? (
              // Loading skeleton
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                {Array.from({ length: limit }).map((_, index) => (
                  <div className="card p-4 bg-base-200 bg-opacity-50" key={index}>
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
            ) : dogData?.hotdogs && dogData.hotdogs.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                  {dogData.hotdogs.map((hotdog, index) => {
                    const validAttestations = dogData?.validAttestations[index];
                    const invalidAttestations = dogData?.invalidAttestations[index];

                    return (
                      <HotdogCard
                        key={`${hotdog.logId}-${index}`}
                        hotdog={hotdog}
                        validAttestations={validAttestations?.toString() ?? "0"}
                        invalidAttestations={invalidAttestations?.toString() ?? "0"}
                        userAttested={false} // Profile page typically doesn't show user's own attestations
                        userAttestation={false}
                        chainId={DEFAULT_CHAIN.id}
                        onRefetch={() => void refetchDogData()}
                        linkToDetail={true}
                        showAiJudgement={false}
                        disabled={false}
                      />
                    );
                  })}
                </div>
                
                {/* Pagination */}
                <div className="join md:col-span-2 place-content-center mt-4">
                  <button
                    className="join-item btn"
                    onClick={() => handlePagination('prev')}
                    disabled={start === 0 || isPaginating}
                  >
                    {isPaginating ? <span className="loading loading-spinner loading-xs"></span> : "«"}
                  </button>
                  <button className="join-item btn" disabled>
                    Page {(Math.floor(start / limit) + 1)} of {dogData?.totalPages?.toString() ?? '...'}
                  </button>
                  <button
                    className="join-item btn"
                    onClick={() => handlePagination('next')}
                    disabled={!dogData?.hasNextPage || isPaginating}
                  >
                    {isPaginating ? <span className="loading loading-spinner loading-xs"></span> : "»"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-base-content/70">No hotdog logs found for this user.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;