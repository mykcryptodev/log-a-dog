import { useEffect, useState } from "react";

import { api } from "~/utils/api";

type ContentType = 'profile';

const useContentIsCensored = (contentId: string, type: ContentType) => {
  const [data, setData] = useState<boolean>(false);
  const { 
    data: profile, 
    isLoading: profileIsLoading, 
    error: profileError,
  } = api.profile.getById.useQuery(contentId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (type === 'profile') {
      if (profileIsLoading) {
        setIsLoading(true);
        return;
      }
      if (profileError) {
        setError(profileError);
        setIsLoading(false);
        return;
      }
      if (!profile) return;
      setData(profile.isCensored ? true : false);
      setIsLoading(false);
      setError(null);
    }
  }, [profileIsLoading, profile, type, profileError]);


  return {
    data,
    isLoading,
    error,
  };
};

export default useContentIsCensored;