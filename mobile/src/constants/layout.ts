import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Top quarter of the center Log FAB that overlaps content above the bar. */
export const LOG_FAB_PROTRUSION = 16;

/** Tab bar row height excluding the device home-indicator inset. */
export const TAB_BAR_HEIGHT = 68;

/** Bottom padding so scroll content clears the absolute tab bar. */
export function useBottomTabInset(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom;
}
