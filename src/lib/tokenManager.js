// Token Management with Auto Refresh
class TokenManager {
  constructor() {
    this.refreshPromise = null;
    this.isRefreshing = false;
  }

  // Get current token
  getToken() {
    try {
      const authData = localStorage.getItem("evtb_auth");
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return parsed?.token || null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < currentTime;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  }

  // Check if token will expire soon (within 5 minutes)
  isTokenExpiringSoon(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60; // 5 minutes in seconds
      return payload.exp && (payload.exp - currentTime) < fiveMinutes;
    } catch (error) {
      console.error("Error checking token expiration soon:", error);
      return true;
    }
  }

  // Refresh token (if backend supports it)
  async refreshToken() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async _performRefresh() {
    try {
      console.log("🔄 Attempting to refresh token...");
      
      // Try to refresh token from backend
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.getRefreshToken()
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.token;
        
        if (newToken) {
          // Update token in localStorage
          const authData = JSON.parse(localStorage.getItem("evtb_auth") || '{}');
          authData.token = newToken;
          localStorage.setItem("evtb_auth", JSON.stringify(authData));
          
          console.log("✅ Token refreshed successfully");
          return newToken;
        }
      }
      
      throw new Error("Failed to refresh token");
    } catch (error) {
      console.warn("⚠️ Token refresh failed:", error);
      throw error;
    }
  }

  // Get refresh token
  getRefreshToken() {
    try {
      const authData = localStorage.getItem("evtb_auth");
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return parsed?.refreshToken || null;
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }

  // Clear all auth data
  clearAuth() {
    localStorage.removeItem("evtb_auth");
    console.log("🧹 Auth data cleared");
  }

  // Get valid token (refresh if needed)
  async getValidToken() {
    const token = this.getToken();
    
    if (!token) {
      console.log("❌ No token found");
      return null;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.log("⚠️ Token is expired, attempting refresh...");
      
      try {
        const newToken = await this.refreshToken();
        return newToken;
      } catch (error) {
        console.error("❌ Token refresh failed:", error);
        this.clearAuth();
        return null;
      }
    }

    // Check if token is expiring soon and refresh proactively
    if (this.isTokenExpiringSoon(token)) {
      console.log("⚠️ Token expiring soon, refreshing proactively...");
      
      try {
        const newToken = await this.refreshToken();
        return newToken;
      } catch (error) {
        console.warn("⚠️ Proactive refresh failed, using current token:", error);
        return token; // Use current token if refresh fails
      }
    }

    return token;
  }

  // Show token expiration warning
  showExpirationWarning() {
    // You can customize this to show a toast or modal
    console.warn("⚠️ Token will expire soon. Consider refreshing the page.");
    
    // Example: Show a toast notification
    if (window.showToast) {
      window.showToast({
        title: "⚠️ Phiên đăng nhập sắp hết hạn",
        description: "Vui lòng lưu công việc và đăng nhập lại để tiếp tục.",
        type: "warning",
        duration: 10000
      });
    }
  }

  // Start token monitoring
  startTokenMonitoring() {
    // Check token every minute
    setInterval(() => {
      const token = this.getToken();
      if (token && this.isTokenExpiringSoon(token)) {
        this.showExpirationWarning();
      }
    }, 60000); // Check every minute
  }
}

// Create singleton instance
const tokenManager = new TokenManager();

// Start monitoring when module loads
if (typeof window !== 'undefined') {
  tokenManager.startTokenMonitoring();
}

export default tokenManager;

