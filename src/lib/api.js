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

  const isFormData = (typeof FormData !== 'undefined') && body instanceof FormData;
  
  // Debug logging for approve/reject requests
  if (path.includes('/Product/') && (method === 'PUT' || method === 'PATCH' || method === 'POST')) {
    console.log('=== API REQUEST DEBUG ===');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Body:', body);
    console.log('Is FormData:', isFormData);
    console.log('Token:', token ? 'Present' : 'Missing');
  }
  
  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = (data && typeof data !== 'string' ? data.message : null) || (typeof data === 'string' ? data : null) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// AI Price Prediction API
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || "/ai";

export async function predictVehiclePrice(vehicleData) {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/predict-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling AI price prediction:', error);
    throw error;
  }
}

export { API_BASE_URL, AI_API_BASE_URL };
