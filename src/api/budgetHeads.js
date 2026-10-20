import { apiRequest } from "../apiClient";

export const listBudgetHeads = (token) =>
  apiRequest("/api/v1/budget_heads", { method: "GET", token });

export const createBudgetHead = (token, budgetHead) =>
  apiRequest("/api/v1/budget_heads", { method: "POST", token, body: { budget_head: budgetHead } });

export const updateBudgetHead = (token, id, budgetHead) =>
  apiRequest(`/api/v1/budget_heads/${id}`, { method: "PATCH", token, body: { budget_head: budgetHead } });

export const reviewBudgetHead = (token, id) =>
  apiRequest(`/api/v1/budget_heads/${id}/review`, { method: "PATCH", token });

export const requestBudgetHeadChanges = (token, id, note) =>
  apiRequest(`/api/v1/budget_heads/${id}/request_changes`, { method: "PATCH", token, body: { note } });

export const approveBudgetHead = (token, id) =>
  apiRequest(`/api/v1/budget_heads/${id}/approve`, { method: "PATCH", token });

export const requestNewBudgetHead = (token, note) =>
  apiRequest("/api/v1/budget_heads/request_new", { method: "POST", token, body: { note } });
