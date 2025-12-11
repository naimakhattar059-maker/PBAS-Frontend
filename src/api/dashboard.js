import { apiRequest } from "../apiClient";

export const fetchDashboard = (token) =>
  apiRequest("/api/v1/dashboard", { method: "GET", token });
