import { apiRequest } from "../apiClient";

export const fetchProfile = (token) =>
  apiRequest("/api/v1/profile", { method: "GET", token });

export const updateProfile = (token, user) =>
  apiRequest("/api/v1/profile", { method: "PATCH", token, body: { user } });

export const changePassword = (token, payload) =>
  apiRequest("/api/v1/profile/password", { method: "PATCH", token, body: payload });
