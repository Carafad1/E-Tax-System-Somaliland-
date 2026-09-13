import { api } from "./api";

// No hardcoded tax types - IDs/amounts must always come from the real
// database, which an admin can add to, edit or reorder at any time. A
// previous hardcoded fallback list risked silently drifting out of sync
// with the real records. If the API call fails, the caller must show a
// real error/retry - never a plausible-looking but potentially wrong list.
export async function listTaxTypes(activeOnly = true) {
  const { data } = await api.get("/tax-types", { params: { active: activeOnly } });
  return data?.data?.items || [];
}

export async function createTaxType(payload) {
  const { data } = await api.post("/tax-types", payload);
  return data.data;
}

export async function updateTaxType(id, payload) {
  const { data } = await api.put(`/tax-types/${id}`, payload);
  return data.data;
}

export async function deactivateTaxType(id) {
  const { data } = await api.delete(`/tax-types/${id}`);
  return data;
}
