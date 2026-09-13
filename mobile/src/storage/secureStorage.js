import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "etax_auth_token";
const ROLE_KEY = "etax_auth_role";

export async function saveSession(token, role) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(ROLE_KEY, role);
}

export async function getSession() {
  const [token, role] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(ROLE_KEY),
  ]);
  return { token, role };
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(ROLE_KEY);
}
