import { api } from "./api";

// Nothing here swallows a failure into an empty/zero shape.
//
// These endpoints report a citizen's own tax record and the government's
// revenue figures. Turning a failed request into "0 SLSH paid" or "no
// revenue data" states something factual about that record which the server
// never actually said - and it is what made transient network blips look
// like a dead database. Every caller (DashboardScreen, AdminReportsScreen,
// AdminDashboardScreen) already renders a real error state with a retry
// button for exactly this case, so the error is propagated to them.

export async function getStats() {
  const { data } = await api.get("/dashboard/stats");
  return data.data;
}

export async function getRevenue() {
  const { data } = await api.get("/dashboard/revenue");
  return data.data;
}

export async function getPaymentsSummary() {
  const { data } = await api.get("/dashboard/payments");
  return data.data;
}

export async function getCitiesSummary() {
  const { data } = await api.get("/dashboard/cities");
  return data.data;
}

export async function getPaymentMethodsSummary() {
  const { data } = await api.get("/dashboard/payment-methods");
  return data.data;
}

export async function getOverview() {
  const { data } = await api.get("/dashboard/overview");
  return data.data;
}

export async function getRecentTaxpayers(limit = 5) {
  const { data } = await api.get("/dashboard/recent-taxpayers", { params: { limit } });
  return data.data?.items || [];
}
