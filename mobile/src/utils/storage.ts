import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "log-a-dog.session";

export async function saveSession(sessionJson: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, sessionJson);
}

export async function loadSession(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
