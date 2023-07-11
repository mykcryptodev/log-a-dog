import {type  NextPage } from "next";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import SignInButton from "~/components/utils/SignIn";

const withSignedInProtection = (Component: NextPage) => {
  const WithSignedInProtection: NextPage = (props) => {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // remove loading screen after 1 second
    useEffect(() => {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }, []);

    if (isLoading) return (
      <div className="grid place-content-center h-full min-h-screen w-full min-w-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
    
    if (!session || !session.user) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full min-h-screen max-w-sm mx-auto">
          <div className="text-2xl font-bold mb-4">You must be signed in to view this page.</div>
          {session?.user ? (
            <button 
              className="btn btn-primary"
              onClick={() => void signOut()}
            >
              Sign Out
            </button>
          ) : <SignInButton /> }
        </div>
      )
    }

    return <Component {...props} />;
  };
  return WithSignedInProtection;
};

export default withSignedInProtection;