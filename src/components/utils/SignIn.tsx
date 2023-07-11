import { ConnectWallet, useAddress, useAuth } from "@thirdweb-dev/react";
import { signIn, useSession } from "next-auth/react";
import { type FC,useState } from "react";

import { APP_NAME } from "~/constants";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";

interface Props {
  className?: string;
}

export const SignInButton: FC<Props> = ({ className }) => {
  const address = useAddress();
  const isDarkTheme = useIsDarkTheme();
  const auth = useAuth();
  const { data: session } = useSession();
  const [signInIsLoading, setSignInIsLoading] = useState<boolean>(false);
  
  async function signInWithWallet() {
    setSignInIsLoading(true);
    let payload;
    // Prompt the user to sign a login with wallet message
    try {
      payload = await auth?.login();
    } catch (e) {
      console.error('failed login', e)
    }

    // Then send the payload to next auth as login credentials
    // using the "credentials" provider method
    try {
      await signIn("credentials", {
        payload: JSON.stringify(payload),
        redirect: false,
      });
    } catch (e) {
      console.error('failed sign in', e)
    }
    setSignInIsLoading(false);
  }

  if (!address) {
    return (
      <ConnectWallet 
        auth={{
          loginOptional: true,
        }}
        btnTitle="Login"
        theme={isDarkTheme ? 'dark' : 'light'}
        className="thirdweb-btn-lg"
        style={{ width: '100%' }}
        modalTitle={`Login to ${APP_NAME}`}
      />
    )
  }

  if (session) return null;

  return (
    <button 
      type="button"
      className={`${className || 'btn btn-lg'}`}
      onClick={() => void signInWithWallet()}
    >
      {signInIsLoading && (<span className="loading loading-dots"></span>)}
      Sign In
    </button>
  )
};

export default SignInButton;