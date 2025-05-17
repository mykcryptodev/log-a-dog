import { createThirdwebClient } from "thirdweb";
import { env } from "~/env";

export const client = createThirdwebClient({
  secretKey: env.THIRDWEB_SECRET_KEY,
});