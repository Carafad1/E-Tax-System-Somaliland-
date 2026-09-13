import { api } from "./api";

// No hardcoded city list - IDs must always come from the real database.
// A previous hardcoded fallback list did not match the database's actual
// city IDs (e.g. its id 2 was "Burao" while the DB's id 2 is "Berbera"),
// which could silently register a taxpayer under the wrong city. If the
// API call fails, the caller must show a real error/retry - never a
// plausible-looking but potentially wrong list.
export async function listCities(activeOnly = true) {
  const { data } = await api.get("/cities", { params: { active: activeOnly } });
  return data?.data?.items || [];
}

export async function createCity(payload) {
  const { data } = await api.post("/cities", payload);
  return data.data;
}

export async function updateCity(id, payload) {
  const { data } = await api.put(`/cities/${id}`, payload);
  return data.data;
}

export async function deactivateCity(id) {
  const { data } = await api.delete(`/cities/${id}`);
  return data;
}
