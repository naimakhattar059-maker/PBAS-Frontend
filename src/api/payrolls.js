import { apiRequest } from "../apiClient";

export const listPayrollRuns = (token) =>
  apiRequest("/api/v1/payrolls", { method: "GET", token });

export const createPayrollRun = (token, payrollRun) =>
  apiRequest("/api/v1/payrolls", { method: "POST", token, body: { payroll_run: payrollRun } });

export const updatePayrollRun = (token, id, payrollRun) =>
  apiRequest(`/api/v1/payrolls/${id}`, { method: "PATCH", token, body: { payroll_run: payrollRun } });

export const deletePayrollRun = (token, id) =>
  apiRequest(`/api/v1/payrolls/${id}`, { method: "DELETE", token });

export const generatePayrollRun = (token, id) =>
  apiRequest(`/api/v1/payrolls/${id}/generate`, { method: "PATCH", token });

export const approvePayrollRun = (token, id, note) =>
  apiRequest(`/api/v1/payrolls/${id}/approve`, { method: "PATCH", token, body: { note } });

export const rejectPayrollRun = (token, id, note) =>
  apiRequest(`/api/v1/payrolls/${id}/reject`, { method: "PATCH", token, body: { note } });
