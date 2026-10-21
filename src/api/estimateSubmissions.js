import { apiRequest } from "../apiClient";

export const listEstimateSubmissions = (token) =>
  apiRequest("/api/v1/estimate_submissions", { method: "GET", token });
export const submitEstimateSubmission = (token, year, snapshot) =>
  apiRequest("/api/v1/estimate_submissions", { method: "POST", token, body: { year, snapshot } });
export const reviewEstimateSubmission = (token, id) =>
  apiRequest(`/api/v1/estimate_submissions/${id}/review`, { method: "PATCH", token });
export const approveEstimateSubmission = (token, id) =>
  apiRequest(`/api/v1/estimate_submissions/${id}/approve`, { method: "PATCH", token });
export const rejectEstimateSubmission = (token, id) =>
  apiRequest(`/api/v1/estimate_submissions/${id}/reject`, { method: "PATCH", token });
