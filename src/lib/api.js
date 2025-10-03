// Simple API helper for backend integration
// Reads base URL from VITE_API_BASE_URL, defaults to http://localhost:5044

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5044";

function getAuthToken() {
  try {
    const raw = localStorage.getItem("evtb_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

export async function apiRequest(path, { method = "GET", body, headers } = {}) {
  const token = getAuthToken();
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.message || "Request failed";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export { API_BASE_URL };


