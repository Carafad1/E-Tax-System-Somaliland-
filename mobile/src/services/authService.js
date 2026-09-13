import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "./api";

const ACTIVE_USER_SESSION_KEY = "etax_active_user_session";

// Caches only the REAL user object returned by the backend after a
// successful login/register/fetchMe, purely so screens that read the
// current user's own fields (e.g. building a receipt PDF while briefly
// offline) have something real to show. It is never a substitute for real
// authentication and never holds an invented user - a failed API call
// always propagates as a real error instead of falling back to a fake or
// stale session.
export async function setActiveUser(user) {
  if (!user) return;
  try {
    await AsyncStorage.setItem(ACTIVE_USER_SESSION_KEY, JSON.stringify(user));
  } catch (_err) {
    // Non-fatal: this cache is a convenience, not a requirement.
  }
}

export async function getActiveUser() {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

export async function updateLocalUser(updatedUser) {
  if (!updatedUser) return;
  const current = await getActiveUser();
  await setActiveUser({ ...current, ...updatedUser });
}

export async function register(payload) {
  const { data } = await api.post("/register", payload);
  if (data?.data?.user) {
    await setActiveUser(data.data.user);
  }
  return data.data;
}

export async function login(identifier, password) {
  const { data } = await api.post("/login", { identifier, password });
  if (data?.data?.user) {
    await setActiveUser(data.data.user);
  }
  return data.data;
}

export async function adminLogin(username, password) {
  const { data } = await api.post("/admin/login", { username, password });
  return data.data;
}

export async function logout() {
  try {
    await AsyncStorage.removeItem(ACTIVE_USER_SESSION_KEY);
  } catch (_err) {
    // Non-fatal
  }
  try {
    const { data } = await api.post("/logout");
    return data;
  } catch (_err) {
    return { success: true };
  }
}

export async function fetchMe() {
  const { data } = await api.get("/me");
  if (data?.data?.user) {
    await setActiveUser(data.data.user);
  }
  return data.data;
}

export async function sendOtp(phone) {
  const { data } = await api.post("/otp/send", { phone });
  return data.data;
}

export async function verifyOtp(phone, otp) {
  const { data } = await api.post("/otp/verify", { phone, otp });
  return data.data;
}
