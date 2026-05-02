import { apiRequest } from "../apiClient";

export const listNotifications = (token) =>
  apiRequest("/api/v1/notifications", { method: "GET", token });

export const markNotificationRead = (token, id) =>
  apiRequest(`/api/v1/notifications/${id}`, { method: "PATCH", token });

export const markAllNotificationsRead = (token) =>
  apiRequest("/api/v1/notifications/mark_all_read", { method: "PATCH", token });
