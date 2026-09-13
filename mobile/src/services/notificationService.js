import { api } from "./api";

// Notifications are real per-user records - a failed request must surface
// as a real error, never fabricated announcements or a false "success".
export async function listNotifications() {
  const { data } = await api.get("/notifications");
  return data.data;
}

export async function markNotificationRead(id) {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
}
