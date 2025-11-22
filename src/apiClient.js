const defaultBaseUrl = "http://localhost:3002";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultBaseUrl;

const buildHeaders = (token, extra = {}) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...extra,
});

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson ? payload.error || payload.errors || payload.message : payload;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return payload;
};

export const apiRequest = async (path, { method = "GET", body, token, headers } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
};
