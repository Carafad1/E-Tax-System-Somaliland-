import { api } from "./api";

// No fake fallbacks anywhere in this file: a payment is real money moving
// against a real tax obligation, so every response here must come from the
// backend. A failed request must surface as a real error - inventing a
// "success" (or a placeholder payment) would tell a citizen they paid their
// tax when nothing was ever recorded in the database.

export async function listPayments(params) {
  const { data } = await api.get("/payments", { params });
  return data.data;
}

export async function getPayment(id) {
  const { data } = await api.get(`/payments/${id}`);
  return data.data;
}

export async function createPayment(payload) {
  const { data } = await api.post("/payments", payload);
  return data;
}

export async function updatePayment(id, payload) {
  const { data } = await api.put(`/payments/${id}`, payload);
  return data.data;
}

export async function deletePayment(id) {
  const { data } = await api.delete(`/payments/${id}`);
  return data;
}

export async function bulkDeletePayments(ids) {
  const { data } = await api.post("/payments/bulk-delete", { ids });
  return data.data;
}
