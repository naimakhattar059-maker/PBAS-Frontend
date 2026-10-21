import { apiRequest } from "../apiClient";

export const listPayrollYearAllocations = (token) =>
  apiRequest("/api/v1/payroll_year_allocations", { method: "GET", token });
export const savePayrollYearAllocation = (token, year, amount) =>
  apiRequest("/api/v1/payroll_year_allocations", { method: "POST", token, body: { allocation: { year, amount } } });
export const archivePayrollYearAllocation = (token, id) =>
  apiRequest(`/api/v1/payroll_year_allocations/${id}/archive`, { method: "PATCH", token });
export const archivePayrollYearByYear = (token, year) =>
  apiRequest("/api/v1/payroll_year_allocations/archive_year", { method: "POST", token, body: { year } });
