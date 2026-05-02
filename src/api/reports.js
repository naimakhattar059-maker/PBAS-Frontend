import { apiRequest } from "../apiClient";

export const fetchReports = (token) =>
  apiRequest("/api/v1/reports", { method: "GET", token });
