import { createThirdwebClient, Engine } from "thirdweb";
import { env } from "~/env";

export const client = createThirdwebClient({
  secretKey: env.THIRDWEB_SECRET_KEY,
});

export const serverWallet = Engine.serverWallet({
  client,
  address: env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS,
  vaultAccessToken: env.THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN,
});