import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "etax_cache_";

// Only non-sensitive, publicly-readable reference data should ever be
// cached here (tax type names, city list, public announcements). Never
// cache passwords, PINs, tokens or payment credentials.
export async function setCache(key, value) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (_err) {
    // Non-fatal: caching is a convenience, not a requirement.
  }
}

export async function getCache(key) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}
