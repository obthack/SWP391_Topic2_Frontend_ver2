// Simple API helper for backend integration
// Reads base URL from VITE_API_BASE_URL, defaults to http://localhost:5044

const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:5044";

function getAuthToken() {
  try {
    const raw = localStorage.getItem("evtb_auth");
    if (!raw) {
      console.log("🔍 No auth data in localStorage");
      return null;
    }
    const parsed = JSON.parse(raw);
    const token = parsed?.token || null;
    
    // DEMO MODE: Skip token expiration check for presentation
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || 
                      localStorage.getItem('evtb_demo_mode') === 'true';
    
    if (isDemoMode) {
      console.log("🎭 DEMO MODE: Skipping token expiration check");
      console.log("🔍 Auth token check (DEMO):", { 
        hasAuth: !!raw, 
        hasToken: !!token, 
        tokenLength: token?.length || 0,
        demoMode: true,
        parsedKeys: Object.keys(parsed || {}),
        parsedData: parsed
      });
      return token;
    }
    
    // Check if token is expired (only in production)
    if (token) {
      try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp && payload.exp < currentTime;
        
        if (isExpired) {
          console.warn("⚠️ Token is expired, clearing auth data");
          localStorage.removeItem("evtb_auth");
          return null;
        }
        
        console.log("🔍 Auth token check:", { 
          hasAuth: !!raw, 
          hasToken: !!token, 
          tokenLength: token?.length || 0,
          isExpired: isExpired,
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
          parsedKeys: Object.keys(parsed || {}),
          parsedData: parsed
        });
      } catch (decodeError) {
        console.warn("⚠️ Invalid token format, clearing auth data:", decodeError);
        localStorage.removeItem("evtb_auth");
        return null;
      }
    }
    
    return token;
  } catch (error) {
    console.error("🔍 Error getting auth token:", error);
    return null;
  }
}

export async function apiRequest(path, { method = "GET", body, headers } = {}) {
  const token = getAuthToken();
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const isFormData = (typeof FormData !== 'undefined') && body instanceof FormData;
  
  // Debug logging for all requests with token
  if (token) {
    console.log('=== API REQUEST DEBUG ===');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Body:', body);
    console.log('Is FormData:', isFormData);
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Token length:', token?.length || 0);
  }
  
  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Don't spread headers here to avoid overriding Authorization
      ...(headers && !headers.Authorization ? headers : {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  // Debug logging for registration requests
  if (path.includes('/User/register') && import.meta.env.DEV) {
    console.group('🔍 Registration Request Debug');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Headers:', {
      Accept: 'application/json',
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    });
    console.log('Body:', body);
    console.log('Is FormData:', isFormData);
    console.groupEnd();
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Debug logging for failed requests
  if (!res.ok && import.meta.env.DEV) {
    console.group('🚨 API Error Debug');
    console.log('URL:', url);
    console.log('Status:', res.status);
    console.log('Status Text:', res.statusText);
    console.log('Response Text:', text);
    console.log('Parsed Data:', data);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    console.groupEnd();
  }

  if (!res.ok) {
    let message;
    
    // Handle 401 Unauthorized specifically
    if (res.status === 401) {
      console.warn("🚨 401 Unauthorized - Token may be expired or invalid");
      console.warn("🔄 Clearing auth data and redirecting to login");
      
      // Clear auth data
      localStorage.removeItem("evtb_auth");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    } else {
      // Try to extract meaningful error message
      if (data && typeof data === 'object') {
        // Handle validation errors specifically
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map(err => 
            `${err.field || 'Field'}: ${err.message || err}`
          ).join(', ');
          message = `Validation errors: ${validationErrors}`;
        } else if (data.title && data.title.includes('validation')) {
          message = data.title;
        } else {
          message = data.message || data.error || data.detail || data.title || `Request failed (${res.status})`;
        }
      } else if (typeof data === 'string' && data.trim()) {
        message = data;
      } else {
        // Default messages based on status codes
        switch (res.status) {
          case 400:
            message = "Dữ liệu không hợp lệ";
            break;
          case 401:
            message = "Không có quyền truy cập";
            break;
          case 403:
            message = "Bị từ chối truy cập";
            break;
          case 404:
            message = "Không tìm thấy tài nguyên";
            break;
          case 409:
            message = "Dữ liệu đã tồn tại";
            break;
          case 500:
            message = "Lỗi máy chủ";
            break;
          default:
            message = `Request failed (${res.status})`;
        }
      }
    }
    
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    error.response = res;
    throw error;
  }

  return data;
}

export { API_BASE_URL };
