import { apiRequest } from "../apiClient";

export const listExpenses = (token) => apiRequest("/api/v1/expenses", { method: "GET", token });
export const createExpense = (token, expense) =>
  apiRequest("/api/v1/expenses", { method: "POST", token, body: { expense } });
export const approveExpense = (token, id) =>
  apiRequest(`/api/v1/expenses/${id}/approve`, { method: "PATCH", token });
export const rejectExpense = (token, id) =>
  apiRequest(`/api/v1/expenses/${id}/reject`, { method: "PATCH", token });
