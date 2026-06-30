export const getFarcasterSdk = async () => {
  const { sdk } = await import("@farcaster/frame-sdk");
  return sdk;
};

type OpenMiniAppAction = (options: { url: string }) => Promise<void>;

export const openMiniApp = async (url: string) => {
  const sdk = await getFarcasterSdk();
  const actions = sdk.actions as typeof sdk.actions & {
    openMiniApp?: OpenMiniAppAction;
  };

  if (actions.openMiniApp) {
    await actions.openMiniApp({ url });
    return;
  }

  window.open(url, "_blank");
};
