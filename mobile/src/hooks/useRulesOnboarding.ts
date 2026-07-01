import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";

const RULES_SEEN_KEY = "log-a-dog.hasSeenRules";

export function useRulesOnboarding() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem(RULES_SEEN_KEY);
        if (!seen) {
          await AsyncStorage.setItem(RULES_SEEN_KEY, "1");
          router.push("/rules");
        }
      } catch {
        // ignore storage errors
      }
    })();
  }, [router]);
}
