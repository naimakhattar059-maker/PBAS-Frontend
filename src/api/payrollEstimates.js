import { apiRequest } from "../apiClient";

export const listPayrollEstimates = (token, year) => {
  const query = year ? `?year=${encodeURIComponent(year)}` : "";
  return apiRequest(`/api/v1/payroll_estimates${query}`, { method: "GET", token });
};

export const createPayrollEstimate = (token, payrollEstimate) =>
  apiRequest("/api/v1/payroll_estimates", {
    method: "POST",
    token,
    body: { payroll_estimate: payrollEstimate },
  });

export const updatePayrollEstimate = (token, id, payrollEstimate) =>
  apiRequest(`/api/v1/payroll_estimates/${id}`, {
    method: "PATCH",
    token,
    body: { payroll_estimate: payrollEstimate },
  });

export const deletePayrollEstimate = (token, id) =>
  apiRequest(`/api/v1/payroll_estimates/${id}`, { method: "DELETE", token });

export const submitPayrollEstimate = (token, id) =>
  apiRequest(`/api/v1/payroll_estimates/${id}/submit`, { method: "PATCH", token });

export const approvePayrollEstimate = (token, id, note) =>
  apiRequest(`/api/v1/payroll_estimates/${id}/approve`, {
    method: "PATCH",
    token,
    body: { note },
  });

export const rejectPayrollEstimate = (token, id, note) =>
  apiRequest(`/api/v1/payroll_estimates/${id}/reject`, {
    method: "PATCH",
    token,
    body: { note },
  });
