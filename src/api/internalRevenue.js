import { apiRequest } from "../apiClient";

export const listInternalRevenueCells = (token, period) =>
  apiRequest(`/api/v1/internal_revenue_cells?period=${encodeURIComponent(period)}`, {
    method: "GET",
    token,
  });

export const saveInternalRevenueCells = (token, period, cells, replace = false) =>
  apiRequest("/api/v1/internal_revenue_cells/bulk_upsert", {
    method: "POST",
    token,
    body: { period, cells, replace },
  });
