import { api } from "./api";

// Audit logs are a factual record of real actions - a failed request must
// surface as a real error, never a fabricated log entry.
export async function listAuditLogs(params) {
  const { data } = await api.get("/audit-logs", { params });
  return data.data;
}
