import { apiRequest } from "../apiClient";

export const listPayrollStaffs = (token) =>
  apiRequest("/api/v1/payroll_staffs", { method: "GET", token });

export const createPayrollStaff = (token, payrollStaff) =>
  apiRequest("/api/v1/payroll_staffs", { method: "POST", token, body: { payroll_staff: payrollStaff } });

export const updatePayrollStaff = (token, id, payrollStaff) =>
  apiRequest(`/api/v1/payroll_staffs/${id}`, { method: "PATCH", token, body: { payroll_staff: payrollStaff } });

export const deletePayrollStaff = (token, id) =>
  apiRequest(`/api/v1/payroll_staffs/${id}`, { method: "DELETE", token });
