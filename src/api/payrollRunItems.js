import { apiRequest } from "../apiClient";

export const updatePayrollRunItem = (token, id, payrollRunItem) =>
  apiRequest(`/api/v1/payroll_run_items/${id}`, {
    method: "PATCH",
    token,
    body: { payroll_run_item: payrollRunItem },
  });
