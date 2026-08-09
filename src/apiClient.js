const defaultBaseUrl = "http://localhost:3002";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultBaseUrl;

const buildHeaders = (token, extra = {}) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...extra,
});

const sensitiveKeys = ["password", "password_confirmation", "token", "authorization", "attachment_image_data"];

const redactSensitiveValues = (value) => {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValues);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveKeys.includes(key.toLowerCase()) ? "[REDACTED]" : redactSensitiveValues(nestedValue),
      ])
    );
  }

  return value;
};

const entityFromPath = (path) => {
  const parts = path.split("?")[0].split("/").filter(Boolean);
  const apiIndex = parts.indexOf("v1");
  const resource = parts[apiIndex + 1] || parts.at(-1) || "system";
  const id = parts[apiIndex + 2] && /^\d+$/.test(parts[apiIndex + 2]) ? parts[apiIndex + 2] : null;

  return {
    entity_type: resource,
    entity_id: id,
  };
};

const auditActionFromRequest = (method, path) => {
  const normalizedMethod = method.toUpperCase();
  const action = path.split("?")[0].split("/").filter(Boolean).at(-1);
  const customAction = action && !/^\d+$/.test(action) ? action : null;

  if (customAction && !["sessions", "password", "registrations", "email_verifications"].includes(customAction)) {
    return customAction;
  }

  if (normalizedMethod === "POST") return "create";
  if (normalizedMethod === "PUT" || normalizedMethod === "PATCH") return "update";
  if (normalizedMethod === "DELETE") return "delete";
  return normalizedMethod.toLowerCase();
};

const shouldWriteAuditLog = () => false;

const writeAuditLog = async ({ method, path, body, token }) => {
  if (!shouldWriteAuditLog({ method, path, token })) {
    return;
  }

  const { entity_type, entity_id } = entityFromPath(path);

  try {
    await fetch(`${API_BASE_URL}/api/v1/audit_logs`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({
        audit_log: {
          action: auditActionFromRequest(method, path),
          entity_type,
          entity_id,
          metadata: {
            method: method.toUpperCase(),
            path,
            body: redactSensitiveValues(body || {}),
            occurred_at: new Date().toISOString(),
          },
        },
      }),
    });
  } catch {
    // Audit logging must never block the user action that already succeeded.
  }
};

const parseResponse = async (response, token) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem("authState");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const message = isJson
      ? payload.error ||
        (Array.isArray(payload.errors) ? payload.errors.join(", ") : payload.errors) ||
        payload.message
      : (() => {
          const text = String(payload || "").trim();
          const looksLikeHtml =
            /^<!doctype html/i.test(text) ||
            /^<html[\s>]/i.test(text) ||
            text.includes("ActionController: Exception caught");

          if (looksLikeHtml) {
            return "Server error. Please try again.";
          }

          return text || `Request failed with status ${response.status}`;
        })();
    const error = new Error(message || `Request failed with status ${response.status}`);
    if (isJson && typeof payload === "object") {
      error.payload = payload;
    }
    throw error;
  }

  return payload;
};

export const apiRequest = async (path, { method = "GET", body, token, headers } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponse(response, token);
  await writeAuditLog({ method, path, body, token });

  return payload;
};
