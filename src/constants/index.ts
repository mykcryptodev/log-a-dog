import { createThirdwebClient } from "thirdweb";
import { env } from "~/env";

export * from "./addresses";
export * from "./chains";

// TODO: update start time
export const CONTEST_START_TIME = "2025-04-23T12:00:00-04:00"
export const CONTEST_END_TIME = "2025-09-05T12:00:00-04:00"

export const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});