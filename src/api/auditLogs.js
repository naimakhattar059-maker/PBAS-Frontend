import { apiRequest } from "../apiClient";

export const listAuditLogs = (token, filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return apiRequest(`/api/v1/audit_logs${query ? `?${query}` : ""}`, { method: "GET", token });
};

export const createAuditLog = (token, auditLog) =>
  apiRequest("/api/v1/audit_logs", { method: "POST", token, body: { audit_log: auditLog } });
