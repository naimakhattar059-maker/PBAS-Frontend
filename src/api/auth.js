import { apiRequest } from "../apiClient";

export const login = (payload) =>
  apiRequest("/api/v1/sessions", {
    method: "POST",
    body: { email: payload.email, password: payload.password },
  });

export const validateSession = (token) =>
  apiRequest("/api/v1/session", {
    method: "GET",
    token,
  });

export const register = ({ user, invitationToken }) =>
  apiRequest("/api/v1/registrations", {
    method: "POST",
    body: {
      user: {
        email: user.email,
        username: user.username,
        password: user.password,
        password_confirmation: user.password_confirmation,
      },
      invitation_token: invitationToken,
    },
  });

export const requestPasswordReset = (email) =>
  apiRequest("/api/v1/password", {
    method: "POST",
    body: { email },
  });

export const resetPassword = ({ token, password, password_confirmation }) =>
  apiRequest("/api/v1/password", {
    method: "PUT",
    body: { token, password, password_confirmation },
  });

export const verifyEmail = (token) =>
  apiRequest(`/api/v1/email_verifications/${token}`, { method: "GET" });

export const resendVerification = (email) =>
  apiRequest("/api/v1/email_verifications", { method: "POST", body: { email } });

export const fetchInvitation = (token) =>
  apiRequest(`/api/v1/invitations/${token}`, { method: "GET" });

export const createInvitation = ({ token, email, role }) =>
  apiRequest("/api/v1/invitations", { method: "POST", token, body: { email, role } });
