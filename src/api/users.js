import { apiRequest } from "../apiClient";

export const listUsers = (token) =>
  apiRequest("/api/v1/users", { method: "GET", token });

export const createUser = (token, user) =>
  apiRequest("/api/v1/users", { method: "POST", token, body: { user } });

export const updateUser = (token, id, user) =>
  apiRequest(`/api/v1/users/${id}`, { method: "PUT", token, body: { user } });

export const deleteUser = (token, id) =>
  apiRequest(`/api/v1/users/${id}`, { method: "DELETE", token });
