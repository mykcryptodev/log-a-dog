export const getFarcasterSdk = async () => {
  const { sdk } = await import("@farcaster/frame-sdk");
  return sdk;
};
