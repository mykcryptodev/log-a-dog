import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

const getSnapshot = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const getServerSnapshot = () => false;

const usePrefersDarkMode = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export default usePrefersDarkMode;
