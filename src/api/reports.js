import { apiRequest } from "../apiClient";

export const fetchReports = (token, period = "monthly", date = new Date().toISOString().slice(0, 10)) =>
  apiRequest(`/api/v1/reports?period=${encodeURIComponent(period)}&date=${encodeURIComponent(date)}`, { method: "GET", token });
