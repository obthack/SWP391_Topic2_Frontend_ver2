/**
 * ===================================================================
 * EVTB API MANAGER - TỔNG HỢP TẤT CẢ API
 * EV Trading Platform - Centralized API Management
 * ===================================================================
 * 
 * File này tổng hợp tất cả các API endpoint của hệ thống
 * Dễ dàng quản lý, bảo trì và mở rộng
 * 
 * Cấu trúc:
 * 1. Core API Client & Utilities
 * 2. Authentication APIs
 * 3. User Management APIs
 * 4. Product Management APIs
 * 5. Order Management APIs
 * 6. Payment APIs
 * 7. Favorite APIs
 * 8. Notification APIs
 * 9. Chat APIs
 * 10. Review APIs
 * 11. Verification APIs
 * 12. Statistics APIs
 * 13. Search APIs
 * 14. System APIs
 */

import tokenManager from '../lib/tokenManager';
import { API_CONFIG } from '../config/api';

// ===================================================================
// 1. CORE API CLIENT & UTILITIES
// ===================================================================

const API_BASE_URL = API_CONFIG.BASE_URL;

/**
 * Get authentication token from localStorage
 * @returns {string|null} Auth token
 */
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
            return token;
        }

        // FORCE DEMO MODE for development - bypass token expiration
        if (token && token.length > 10) {
            console.log("🎭 FORCE DEMO MODE: Bypassing token expiration for development");
            return token;
        }

        // Check if token is expired (only in production)
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const currentTime = Math.floor(Date.now() / 1000);
                const isExpired = payload.exp && payload.exp < currentTime;

                if (isExpired) {
                    console.warn("⚠️ Token is expired, but keeping it for development");
                    console.log("🎭 DEVELOPMENT MODE: Keeping expired token");
                    return token;
                }
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

/**
 * Core API request function
 * Handles all HTTP requests with automatic token management
 * @param {string} path - API endpoint path
 * @param {Object} options - Request options (method, body, headers)
 * @returns {Promise<any>} API response data
 */
async function apiRequest(path, { method = "GET", body, headers } = {}) {
    // Use TokenManager to get valid token
    const token = await tokenManager.getValidToken();
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

    const isFormData = (typeof FormData !== 'undefined') && body instanceof FormData;

    // Debug logging for all requests with token
    if (token && import.meta.env.DEV) {
        console.log('=== API REQUEST DEBUG ===');
        console.log('URL:', url);
        console.log('Method:', method);
        console.log('Is FormData:', isFormData);
        console.log('Token:', token ? 'Present' : 'Missing');
    }

    const res = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(headers && !headers.Authorization ? headers : {}),
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

    // Debug logging for failed requests
    if (!res.ok && import.meta.env.DEV) {
        console.group('🚨 API Error Debug');
        console.log('URL:', url);
        console.log('Status:', res.status);
        console.log('Response:', data);
        console.groupEnd();
    }

    if (!res.ok) {
        let message;

        // Handle 401 Unauthorized specifically
        if (res.status === 401) {
            console.warn("🚨 401 Unauthorized - Token may be expired or invalid");

            // Try to refresh token before giving up
            try {
                console.log("🔄 Attempting to refresh token...");
                const newToken = await tokenManager.refreshToken();

                if (newToken) {
                    console.log("✅ Token refreshed successfully, retrying request...");
                    return apiRequest(path, { method, body, headers });
                }
            } catch (refreshError) {
                console.warn("⚠️ Token refresh failed:", refreshError);
            }

            console.warn("🔄 Clearing auth data and redirecting to login");
            tokenManager.clearAuth();

            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);

            message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        } else {
            // Extract meaningful error message
            if (data && typeof data === 'object') {
                if (data.errors && Array.isArray(data.errors)) {
                    const validationErrors = data.errors.map(err =>
                        `${err.field || 'Field'}: ${err.message || err}`
                    ).join(', ');
                    message = `Validation errors: ${validationErrors}`;
                } else {
                    message = data.message || data.error || data.detail || data.title || `Request failed (${res.status})`;
                }
            } else if (typeof data === 'string' && data.trim()) {
                message = data;
            } else {
                // Default messages based on status codes
                const statusMessages = {
                    400: "Dữ liệu không hợp lệ",
                    401: "Không có quyền truy cập",
                    403: "Bị từ chối truy cập",
                    404: "Không tìm thấy tài nguyên",
                    409: "Dữ liệu đã tồn tại",
                    500: "Lỗi máy chủ"
                };
                message = statusMessages[res.status] || `Request failed (${res.status})`;
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

// ===================================================================
// 2. AUTHENTICATION APIs
// ===================================================================

export const authAPI = {
    /**
     * User login
     * @param {Object} credentials - {email, password}
     */
    login: async (credentials) => {
        return apiRequest('/api/Auth/login', {
            method: 'POST',
            body: credentials
        });
    },

    /**
     * User registration
     * @param {Object} userData - User registration data
     */
    register: async (userData) => {
        return apiRequest('/api/Auth/register', {
            method: 'POST',
            body: userData
        });
    },

    /**
     * Refresh authentication token
     */
    refreshToken: async () => {
        return apiRequest('/api/Auth/refresh', {
            method: 'POST'
        });
    },

    /**
     * Request password reset
     * @param {string} email - User email
     */
    forgotPassword: async (email) => {
        return apiRequest('/api/Auth/forgot-password', {
            method: 'POST',
            body: { email }
        });
    },

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     */
    resetPassword: async (token, newPassword) => {
        return apiRequest('/api/Auth/reset-password', {
            method: 'POST',
            body: { token, newPassword }
        });
    }
};

// ===================================================================
// 3. USER MANAGEMENT APIs
// ===================================================================

export const userAPI = {
    /**
     * Get all users (Admin only)
     */
    getAll: async () => {
        return apiRequest('/api/User');
    },

    /**
     * Get user by ID
     * @param {number} userId - User ID
     */
    getById: async (userId) => {
        return apiRequest(`/api/User/${userId}`);
    },

    /**
     * Update user
     * @param {number} userId - User ID
     * @param {Object} userData - Updated user data
     */
    update: async (userId, userData) => {
        return apiRequest(`/api/User/${userId}`, {
            method: 'PUT',
            body: userData
        });
    },

    /**
     * Delete user
     * @param {number} userId - User ID
     */
    delete: async (userId) => {
        return apiRequest(`/api/User/${userId}`, {
            method: 'DELETE'
        });
    }
};

// ===================================================================
// 4. PRODUCT MANAGEMENT APIs
// ===================================================================

export const productAPI = {
    /**
     * Get all products
     */
    getAll: async () => {
        return apiRequest('/api/Product');
    },

    /**
     * Get product by ID
     * @param {number} productId - Product ID
     */
    getById: async (productId) => {
        return apiRequest(`/api/Product/${productId}`);
    },

    /**
     * Get products by seller
     * @param {number} sellerId - Seller ID
     */
    getBySeller: async (sellerId) => {
        return apiRequest(`/api/Product/seller/${sellerId}`);
    },

    /**
     * Create new product
     * @param {Object} productData - Product data
     */
    create: async (productData) => {
        return apiRequest('/api/Product', {
            method: 'POST',
            body: productData
        });
    },

    /**
     * Update product
     * @param {number} productId - Product ID
     * @param {Object} productData - Updated product data
     */
    update: async (productId, productData) => {
        return apiRequest(`/api/Product/${productId}`, {
            method: 'PUT',
            body: productData
        });
    },

    /**
     * Delete product
     * @param {number} productId - Product ID
     */
    delete: async (productId) => {
        return apiRequest(`/api/Product/${productId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Approve product (Admin only)
     * @param {number} productId - Product ID
     */
    approve: async (productId) => {
        return apiRequest(`/api/Product/${productId}/approve`, {
            method: 'POST'
        });
    },

    /**
     * Reject product (Admin only)
     * @param {number} productId - Product ID
     * @param {string} reason - Rejection reason
     */
    reject: async (productId, reason) => {
        return apiRequest(`/api/Product/${productId}/reject`, {
            method: 'POST',
            body: { reason }
        });
    },

    // Product Images
    images: {
        /**
         * Get product images
         * @param {number} productId - Product ID
         */
        getByProduct: async (productId) => {
            return apiRequest(`/api/ProductImage/product/${productId}`);
        },

        /**
         * Upload product image
         * @param {FormData} imageData - Image form data
         */
        upload: async (imageData) => {
            return apiRequest('/api/ProductImage', {
                method: 'POST',
                body: imageData
            });
        },

        /**
         * Upload multiple product images
         * @param {FormData} imagesData - Images form data
         */
        uploadMultiple: async (imagesData) => {
            return apiRequest('/api/ProductImage/multiple', {
                method: 'POST',
                body: imagesData
            });
        },

        /**
         * Delete product image
         * @param {number} imageId - Image ID
         */
        delete: async (imageId) => {
            return apiRequest(`/api/ProductImage/${imageId}`, {
                method: 'DELETE'
            });
        }
    }
};

// ===================================================================
// 5. ORDER MANAGEMENT APIs
// ===================================================================

export const orderAPI = {
    /**
     * Get all orders
     */
    getAll: async () => {
        return apiRequest('/api/Order');
    },

    /**
     * Get order by ID
     * @param {number} orderId - Order ID
     */
    getById: async (orderId) => {
        return apiRequest(`/api/Order/${orderId}`);
    },

    /**
     * Get orders by user
     * @param {number} userId - User ID
     */
    getByUser: async (userId) => {
        return apiRequest(`/api/Order/user/${userId}`);
    },

    /**
     * Create new order
     * @param {Object} orderData - Order data
     */
    create: async (orderData) => {
        return apiRequest('/api/Order', {
            method: 'POST',
            body: orderData
        });
    },

    /**
     * Update order status
     * @param {number} orderId - Order ID
     * @param {string} status - New status
     */
    updateStatus: async (orderId, status) => {
        return apiRequest(`/api/Order/${orderId}/status`, {
            method: 'PUT',
            body: { status }
        });
    },

    /**
     * Cancel order
     * @param {number} orderId - Order ID
     */
    cancel: async (orderId) => {
        return apiRequest(`/api/Order/${orderId}/cancel`, {
            method: 'POST'
        });
    }
};

// ===================================================================
// 6. PAYMENT APIs
// ===================================================================

export const paymentAPI = {
    /**
     * Create payment
     * @param {Object} paymentData - Payment data
     */
    create: async (paymentData) => {
        return apiRequest('/api/payment', {
            method: 'POST',
            body: paymentData
        });
    },

    /**
     * Get payment by ID
     * @param {number} paymentId - Payment ID
     */
    getById: async (paymentId) => {
        return apiRequest(`/api/payment/${paymentId}`);
    },

    /**
     * Get payments by user
     * @param {number} userId - User ID
     */
    getByUser: async (userId) => {
        return apiRequest(`/api/payment/user/${userId}`);
    },

    /**
     * Update payment status
     * @param {number} paymentId - Payment ID
     * @param {string} status - New status
     */
    updateStatus: async (paymentId, status) => {
        return apiRequest(`/api/payment/${paymentId}/status`, {
            method: 'PUT',
            body: { status }
        });
    },

    /**
     * Process VNPay payment
     * @param {Object} paymentData - Payment data
     */
    processVNPay: async (paymentData) => {
        const response = await paymentAPI.create({
            ...paymentData,
            paymentMethod: 'VNPay'
        });

        if (response.paymentUrl) {
            window.location.href = response.paymentUrl;
        }

        return response;
    }
};

// ===================================================================
// 7. FAVORITE APIs
// ===================================================================

export const favoriteAPI = {
    /**
     * Get favorites by user
     * @param {number} userId - User ID
     */
    getByUser: async (userId) => {
        return apiRequest(`/api/Favorite/user/${userId}`);
    },

    /**
     * Add product to favorites
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     */
    add: async (userId, productId) => {
        return apiRequest('/api/Favorite', {
            method: 'POST',
            body: { userId, productId }
        });
    },

    /**
     * Remove product from favorites
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     */
    remove: async (userId, productId) => {
        return apiRequest('/api/Favorite', {
            method: 'DELETE',
            body: { userId, productId }
        });
    },

    /**
     * Toggle favorite status
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     */
    toggle: async (userId, productId) => {
        return apiRequest('/api/Favorite/toggle', {
            method: 'POST',
            body: { userId, productId }
        });
    },

    /**
     * Check if product is favorited
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     */
    isFavorited: async (userId, productId) => {
        try {
            const favorites = await favoriteAPI.getByUser(userId);
            return favorites.some(fav => fav.productId === productId);
        } catch (error) {
            console.error('Failed to check favorite status:', error);
            return false;
        }
    }
};

// ===================================================================
// 8. NOTIFICATION APIs
// ===================================================================

export const notificationAPI = {
    /**
     * Get notifications by user
     * @param {number} userId - User ID
     */
    getByUser: async (userId) => {
        return apiRequest(`/api/Notification/user/${userId}`);
    },

    /**
     * Mark notification as read
     * @param {number} notificationId - Notification ID
     */
    markAsRead: async (notificationId) => {
        return apiRequest(`/api/Notification/${notificationId}/read`, {
            method: 'PUT'
        });
    },

    /**
     * Mark all notifications as read
     * @param {number} userId - User ID
     */
    markAllAsRead: async (userId) => {
        return apiRequest(`/api/Notification/user/${userId}/read-all`, {
            method: 'PUT'
        });
    },

    /**
     * Create notification
     * @param {Object} notificationData - Notification data
     */
    create: async (notificationData) => {
        return apiRequest('/api/Notification', {
            method: 'POST',
            body: notificationData
        });
    }
};

// ===================================================================
// 9. CHAT APIs
// ===================================================================

export const chatAPI = {
    /**
     * Get chat history for user
     * @param {number} userId - User ID
     */
    getHistory: async (userId) => {
        return apiRequest(`/api/Chat/history/${userId}`);
    },

    /**
     * Get chat messages for conversation
     * @param {number} conversationId - Conversation ID
     */
    getMessages: async (conversationId) => {
        return apiRequest(`/api/Chat/messages/${conversationId}`);
    },

    /**
     * Send message
     * @param {Object} messageData - Message data
     */
    sendMessage: async (messageData) => {
        return apiRequest('/api/Chat/send', {
            method: 'POST',
            body: messageData
        });
    },

    /**
     * Create conversation
     * @param {Array<number>} participants - Array of user IDs
     */
    createConversation: async (participants) => {
        return apiRequest('/api/Chat/conversation', {
            method: 'POST',
            body: { participants }
        });
    }
};

// ===================================================================
// 10. REVIEW APIs
// ===================================================================

export const reviewAPI = {
    /**
     * Get reviews by product
     * @param {number} productId - Product ID
     */
    getByProduct: async (productId) => {
        return apiRequest(`/api/Review/product/${productId}`);
    },

    /**
     * Get reviews by user
     * @param {number} userId - User ID
     */
    getByUser: async (userId) => {
        return apiRequest(`/api/Review/user/${userId}`);
    },

    /**
     * Create review
     * @param {Object} reviewData - Review data
     */
    create: async (reviewData) => {
        return apiRequest('/api/Review', {
            method: 'POST',
            body: reviewData
        });
    },

    /**
     * Update review
     * @param {number} reviewId - Review ID
     * @param {Object} reviewData - Updated review data
     */
    update: async (reviewId, reviewData) => {
        return apiRequest(`/api/Review/${reviewId}`, {
            method: 'PUT',
            body: reviewData
        });
    },

    /**
     * Delete review
     * @param {number} reviewId - Review ID
     */
    delete: async (reviewId) => {
        return apiRequest(`/api/Review/${reviewId}`, {
            method: 'DELETE'
        });
    }
};

// ===================================================================
// 11. VERIFICATION APIs (Vehicle Inspection)
// ===================================================================

export const verificationAPI = {
    /**
     * Get all verification requests (Admin)
     */
    getRequests: async () => {
        try {
            const response = await apiRequest('/api/Product');
            const allProducts = Array.isArray(response) ? response : response?.items || [];

            // Filter products with verification requests
            return allProducts.filter(product =>
                product.productType === "Vehicle" &&
                (
                    (product.verificationStatus === "Requested" || product.verificationStatus === "InProgress") ||
                    product.inspectionRequested === true
                )
            );
        } catch (error) {
            console.error('Failed to get verification requests:', error);
            throw error;
        }
    },

    /**
     * Request verification for a product
     * @param {number} productId - Product ID
     */
    request: async (productId) => {
        try {
            console.log(`🔍 Requesting verification for product ${productId}...`);

            // Try using verificationStatus first
            try {
                const response = await apiRequest(`/api/Product/${productId}`, {
                    method: 'PUT',
                    body: { verificationStatus: 'Requested' }
                });
                console.log('✅ Verification requested (verificationStatus)');
                return response;
            } catch (error) {
                console.warn('⚠️ verificationStatus not supported, using inspectionRequested...');

                // Fallback to inspectionRequested
                const response = await apiRequest(`/api/Product/${productId}`, {
                    method: 'PUT',
                    body: { inspectionRequested: true }
                });
                console.log('✅ Verification requested (inspectionRequested)');
                return response;
            }
        } catch (error) {
            console.error('❌ Failed to request verification:', error);
            throw error;
        }
    },

    /**
     * Update verification status (Admin only)
     * @param {number} productId - Product ID
     * @param {string} status - Status (Requested, InProgress, Completed, Rejected)
     * @param {string} notes - Optional notes
     */
    updateStatus: async (productId, status, notes = '') => {
        try {
            console.log(`🔍 Updating verification status for product ${productId} to ${status}...`);

            // Try using verificationStatus first
            try {
                const response = await apiRequest(`/api/Product/${productId}`, {
                    method: 'PUT',
                    body: {
                        verificationStatus: status,
                        verificationNotes: notes
                    }
                });
                console.log('✅ Verification status updated (verificationStatus)');
                return response;
            } catch (error) {
                console.warn('⚠️ verificationStatus not supported, using inspectionRequested...');

                // Map status to boolean
                const inspectionRequested = status === 'Requested' || status === 'InProgress';

                const response = await apiRequest(`/api/Product/${productId}`, {
                    method: 'PUT',
                    body: { inspectionRequested }
                });
                console.log('✅ Verification status updated (inspectionRequested)');
                return response;
            }
        } catch (error) {
            console.error('❌ Failed to update verification status:', error);
            throw error;
        }
    }
};

// ===================================================================
// 12. STATISTICS APIs
// ===================================================================

export const statisticsAPI = {
    /**
     * Get dashboard statistics
     * @param {number} userId - User ID
     */
    getDashboard: async (userId) => {
        return apiRequest(`/api/Statistics/dashboard/${userId}`);
    },

    /**
     * Get admin statistics
     */
    getAdmin: async () => {
        return apiRequest('/api/Statistics/admin');
    },

    /**
     * Get product statistics
     * @param {number} productId - Product ID
     */
    getProduct: async (productId) => {
        return apiRequest(`/api/Statistics/product/${productId}`);
    },

    /**
     * Get sales statistics
     * @param {number} sellerId - Seller ID
     */
    getSales: async (sellerId) => {
        return apiRequest(`/api/Statistics/sales/${sellerId}`);
    }
};

// ===================================================================
// 13. SEARCH APIs
// ===================================================================

export const searchAPI = {
    /**
     * Search products
     * @param {Object} searchParams - Search parameters
     */
    products: async (searchParams) => {
        return apiRequest('/api/Search/products', {
            method: 'POST',
            body: searchParams
        });
    },

    /**
     * Search users
     * @param {Object} searchParams - Search parameters
     */
    users: async (searchParams) => {
        return apiRequest('/api/Search/users', {
            method: 'POST',
            body: searchParams
        });
    }
};

// ===================================================================
// 14. CATEGORY APIs
// ===================================================================

export const categoryAPI = {
    /**
     * Get all categories
     */
    getAll: async () => {
        return apiRequest('/api/Category');
    },

    /**
     * Get category by ID
     * @param {number} categoryId - Category ID
     */
    getById: async (categoryId) => {
        return apiRequest(`/api/Category/${categoryId}`);
    },

    /**
     * Create category
     * @param {Object} categoryData - Category data
     */
    create: async (categoryData) => {
        return apiRequest('/api/Category', {
            method: 'POST',
            body: categoryData
        });
    },

    /**
     * Update category
     * @param {number} categoryId - Category ID
     * @param {Object} categoryData - Updated category data
     */
    update: async (categoryId, categoryData) => {
        return apiRequest(`/api/Category/${categoryId}`, {
            method: 'PUT',
            body: categoryData
        });
    },

    /**
     * Delete category
     * @param {number} categoryId - Category ID
     */
    delete: async (categoryId) => {
        return apiRequest(`/api/Category/${categoryId}`, {
            method: 'DELETE'
        });
    }
};

// ===================================================================
// 15. SYSTEM APIs
// ===================================================================

export const systemAPI = {
    /**
     * Health check
     */
    healthCheck: async () => {
        return apiRequest('/api/Health');
    },

    /**
     * Get system info
     */
    getInfo: async () => {
        return apiRequest('/api/System/info');
    }
};

// ===================================================================
// EXPORTS
// ===================================================================

// Export individual API modules
export {
    apiRequest,
    getAuthToken,
    API_BASE_URL
};

// Export default API object
export default {
    auth: authAPI,
    user: userAPI,
    product: productAPI,
    order: orderAPI,
    payment: paymentAPI,
    favorite: favoriteAPI,
    notification: notificationAPI,
    chat: chatAPI,
    review: reviewAPI,
    verification: verificationAPI,
    statistics: statisticsAPI,
    search: searchAPI,
    category: categoryAPI,
    system: systemAPI,

    // Utility methods
    request: apiRequest,
    getToken: getAuthToken,
    baseUrl: API_BASE_URL
};

