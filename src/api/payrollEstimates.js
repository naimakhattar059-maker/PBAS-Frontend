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
