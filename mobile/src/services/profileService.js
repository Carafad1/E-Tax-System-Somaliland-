import { api } from "./api";

// No fake fallbacks: a citizen's profile, PIN and avatar are real records
// tied to their real identity - a failed request must surface as a real
// error, never a fabricated profile or a false "success".

export async function getProfile() {
  const { data } = await api.get("/profile");
  return data.data;
}

export async function updateProfile(payload) {
  const { data } = await api.put("/profile", payload);
  return data.data;
}

export async function setPaymentPin(pin, confirmPin) {
  const { data } = await api.post("/profile/payment-pin", { pin, confirm_pin: confirmPin });
  return data.data;
}

export async function uploadAvatar(fileUri, fileName, mimeType) {
  const formData = new FormData();
  formData.append("avatar", { uri: fileUri, name: fileName || "avatar.jpg", type: mimeType || "image/jpeg" });
  const { data } = await api.post("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function removeAvatar() {
  const { data } = await api.delete("/profile/avatar");
  return data.data;
}
