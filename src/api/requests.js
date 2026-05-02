import { apiRequest } from "../apiClient";

export const listRequests = (token, status) =>
  apiRequest(`/api/v1/requests${status ? `?status=${encodeURIComponent(status)}` : ""}`, {
    method: "GET",
    token,
  });

export const createRequest = (token, request) =>
  apiRequest("/api/v1/requests", { method: "POST", token, body: { request } });

export const updateRequest = (token, id, request) =>
  apiRequest(`/api/v1/requests/${id}`, { method: "PATCH", token, body: { request } });

export const deleteRequest = (token, id) =>
  apiRequest(`/api/v1/requests/${id}`, { method: "DELETE", token });

export const submitRequest = (token, id) =>
  apiRequest(`/api/v1/requests/${id}/submit`, { method: "PATCH", token });

export const verifyRequest = (token, id, note) =>
  apiRequest(`/api/v1/requests/${id}/verify`, { method: "PATCH", token, body: { note } });

export const approveRequest = (token, id, note) =>
  apiRequest(`/api/v1/requests/${id}/approve`, { method: "PATCH", token, body: { note } });

export const rejectRequest = (token, id, note) =>
  apiRequest(`/api/v1/requests/${id}/reject`, { method: "PATCH", token, body: { note } });
