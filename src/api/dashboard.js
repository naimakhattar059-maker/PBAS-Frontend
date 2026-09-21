import { apiRequest } from "../apiClient";

export const fetchDashboard = (token, year) => {
  const query = year ? `?year=${encodeURIComponent(year)}` : "";
  return apiRequest(`/api/v1/dashboard${query}`, { method: "GET", token });
};
