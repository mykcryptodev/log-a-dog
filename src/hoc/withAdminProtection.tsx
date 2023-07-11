import {type  NextPage } from "next";
import { signOut, useSession } from "next-auth/react";

import SignInButton from "~/components/utils/SignIn";

const withAdminProtection = (Component: NextPage) => {
  const WithAdminProtection: NextPage = (props) => {
    const { data: session } = useSession();
    
    if (!session || !session.user || !session.user.isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full min-h-screen max-w-sm mx-auto">
          <div className="text-2xl font-bold mb-4">You must be signed in as an admin to view this page.</div>
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
  return WithAdminProtection;
};

export default withAdminProtection;