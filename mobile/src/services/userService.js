import { api } from "./api";

// NEVER return fake/demo citizens, and never fake a "success" for a write
// (create/update/delete) that never actually reached the database - an
// admin acting on a fabricated success would believe a real taxpayer record
// changed when nothing was saved.

export async function listCitizens(params) {
  const { data } = await api.get("/users", { params });
  return data.data;
}

export async function getCitizen(id) {
  const { data } = await api.get(`/users/${id}`);
  return data.data;
}

export async function createCitizen(payload) {
  const { data } = await api.post("/users", payload);
  return data.data;
}

export async function updateCitizen(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload);
  return data.data;
}

export async function deleteCitizen(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

export async function bulkDeleteCitizens(ids) {
  const { data } = await api.post("/users/bulk-delete", { ids });
  return data.data;
}
