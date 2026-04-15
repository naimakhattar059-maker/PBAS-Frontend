import { apiRequest } from "../apiClient";

export const listBudgets = (token) =>
  apiRequest("/api/v1/budgets", { method: "GET", token });

export const createBudget = (token, budget) =>
  apiRequest("/api/v1/budgets", { method: "POST", token, body: { budget } });

export const updateBudget = (token, id, budget) =>
  apiRequest(`/api/v1/budgets/${id}`, { method: "PATCH", token, body: { budget } });

export const deleteBudget = (token, id) =>
  apiRequest(`/api/v1/budgets/${id}`, { method: "DELETE", token });
