// Farcaster embeds require absolute URLs on the canonical www host (apex 308s to www).
const APP_URL = "https://www.logadog.xyz";

export const MINIAPP_SPLASH_IMAGE_URL = `${APP_URL}/images/logo.png`;
export const MINIAPP_SPLASH_BACKGROUND_COLOR = "#faf8f7";
export const MINIAPP_HOME_IMAGE_URL = `${APP_URL}/api/og/home`;

export type MiniAppEmbedMetadata = {
  version: "1";
  imageUrl: string;
  button: {
    title: string;
    action: {
      type: "launch_miniapp" | "launch_frame";
      name: string;
      url: string;
      splashImageUrl: string;
      splashBackgroundColor: string;
    };
  };
};

export function buildMiniAppEmbedMetadata({
  imageUrl,
  launchUrl,
  buttonTitle = "🌭 Log a Dog",
  appName = "Log a Dog",
}: {
  imageUrl: string;
  launchUrl: string;
  buttonTitle?: string;
  appName?: string;
}): MiniAppEmbedMetadata {
  return {
    version: "1",
    imageUrl,
    button: {
      title: buttonTitle,
      action: {
        type: "launch_miniapp",
        name: appName,
        url: launchUrl,
        splashImageUrl: MINIAPP_SPLASH_IMAGE_URL,
        splashBackgroundColor: MINIAPP_SPLASH_BACKGROUND_COLOR,
      },
    },
  };
}

export function toFrameEmbedMetadata(
  metadata: MiniAppEmbedMetadata,
): MiniAppEmbedMetadata {
  return {
    ...metadata,
    button: {
      ...metadata.button,
      action: {
        ...metadata.button.action,
        type: "launch_frame",
      },
    },
  };
}
