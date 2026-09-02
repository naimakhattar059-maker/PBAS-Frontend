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

export const listInternalRevenueRecords = (token, period) =>
  apiRequest(`/api/v1/internal_revenue_records?period=${encodeURIComponent(period)}`, {
    method: "GET",
    token,
  });

export const createInternalRevenueRecord = (token, record) =>
  apiRequest("/api/v1/internal_revenue_records", {
    method: "POST",
    token,
    body: { internal_revenue_record: record },
  });
