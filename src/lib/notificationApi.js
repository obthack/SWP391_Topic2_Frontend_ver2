import { apiRequest } from './api';
import * as mockApi from './mockNotificationApi';

// Toggle between real API and mock API
const USE_MOCK_API = true; // Set to false when backend is ready

/**
 * Notification types for different actions
 */
export const NOTIFICATION_TYPES = {
  POST_CREATED: 'post_created',
  POST_APPROVED: 'post_approved', 
  POST_REJECTED: 'post_rejected',
  POST_SOLD: 'post_sold',
  FAVORITE_ADDED: 'favorite_added',
  MESSAGE_RECEIVED: 'message_received',
  SYSTEM_UPDATE: 'system_update',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  ACCOUNT_VERIFIED: 'account_verified',
  PROFILE_UPDATED: 'profile_updated'
};

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @returns {Promise<Object>} Notifications with pagination
 */
export const getUserNotifications = async (userId, page = 1, limit = 20) => {
  if (USE_MOCK_API) {
    console.log('🔔 Using mock notification API');
    return await mockApi.getUserNotifications(userId, page, limit);
  }
  
  try {
    const response = await apiRequest(`/api/Notification/user/${userId}?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { notifications: [], totalCount: 0, hasMore: false };
  }
};

/**
 * Get unread notification count
 * @param {number} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async (userId) => {
  if (USE_MOCK_API) {
    console.log('🔔 Using mock notification API');
    return await mockApi.getUnreadCount(userId);
  }
  
  try {
    const response = await apiRequest(`/api/Notification/user/${userId}/unread-count`);
    return response.count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const markAsRead = async (notificationId) => {
  try {
    await apiRequest(`/api/Notification/${notificationId}/read`, {
      method: 'PUT'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Mark all notifications as read
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export const markAllAsRead = async (userId) => {
  try {
    await apiRequest(`/api/Notification/user/${userId}/mark-all-read`, {
      method: 'PUT'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

/**
 * Delete notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    await apiRequest(`/api/Notification/${notificationId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

/**
 * Create notification (for system use)
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (notificationData) => {
  if (USE_MOCK_API) {
    console.log('🔔 Using mock notification API');
    return await mockApi.createNotification(notificationData);
  }
  
  try {
    const response = await apiRequest('/api/Notification', {
      method: 'POST',
      body: notificationData
    });
    return response;
  } catch (error) {
    console.error('Error creating notification:', error);
    
    // If 403 Forbidden, it means notification API is not available
    if (error.status === 403) {
      console.warn('Notification API not available (403 Forbidden)');
      return null; // Return null instead of throwing
    }
    
    throw error;
  }
};

/**
 * Send notification for post created
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @returns {Promise<void>}
 */
export const notifyPostCreated = async (userId, postTitle) => {
  try {
    const result = await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_CREATED,
      title: '📝 Bài đăng đã được tạo',
      content: `Bài đăng "${postTitle}" đã được tạo thành công và đang chờ duyệt.`
    });
    
    if (result === null) {
      console.warn('Notification API not available - skipping notification');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending post created notification:', error);
    return false;
  }
};

/**
 * Send notification for post approved
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @returns {Promise<void>}
 */
export const notifyPostApproved = async (userId, postTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_APPROVED,
      title: '✅ Bài đăng đã được duyệt',
      content: `Bài đăng "${postTitle}" đã được duyệt và hiển thị trên trang chủ.`
    });
  } catch (error) {
    console.error('Error sending post approved notification:', error);
  }
};

/**
 * Send notification for post rejected
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @param {string} reason - Rejection reason
 * @returns {Promise<void>}
 */
export const notifyPostRejected = async (userId, postTitle, reason = 'Không đạt yêu cầu') => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_REJECTED,
      title: '❌ Bài đăng bị từ chối',
      content: `Bài đăng "${postTitle}" bị từ chối. Lý do: ${reason}`
    });
  } catch (error) {
    console.error('Error sending post rejected notification:', error);
  }
};

/**
 * Send notification for post sold
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @returns {Promise<void>}
 */
export const notifyPostSold = async (userId, postTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_SOLD,
      title: '🎉 Sản phẩm đã được bán',
      content: `Sản phẩm "${postTitle}" đã được bán thành công!`
    });
  } catch (error) {
    console.error('Error sending post sold notification:', error);
  }
};

/**
 * Send notification for favorite added
 * @param {number} userId - User ID
 * @param {string} productTitle - Product title
 * @returns {Promise<void>}
 */
export const notifyFavoriteAdded = async (userId, productTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.FAVORITE_ADDED,
      title: '❤️ Sản phẩm được yêu thích',
      content: `Sản phẩm "${productTitle}" đã được thêm vào yêu thích.`
    });
  } catch (error) {
    console.error('Error sending favorite added notification:', error);
  }
};

/**
 * Send notification for message received
 * @param {number} userId - User ID
 * @param {string} senderName - Sender name
 * @param {string} message - Message content
 * @returns {Promise<void>}
 */
export const notifyMessageReceived = async (userId, senderName, message) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.MESSAGE_RECEIVED,
      title: '💬 Tin nhắn mới',
      content: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
    });
  } catch (error) {
    console.error('Error sending message received notification:', error);
  }
};

/**
 * Send notification for payment success
 * @param {number} userId - User ID
 * @param {string} amount - Payment amount
 * @returns {Promise<void>}
 */
export const notifyPaymentSuccess = async (userId, amount) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: '💰 Thanh toán thành công',
      content: `Thanh toán ${amount} đã được xử lý thành công.`
    });
  } catch (error) {
    console.error('Error sending payment success notification:', error);
  }
};

/**
 * Send notification for account verified
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export const notifyAccountVerified = async (userId) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.ACCOUNT_VERIFIED,
      title: '✅ Tài khoản đã được xác thực',
      content: 'Tài khoản của bạn đã được xác thực thành công!'
    });
  } catch (error) {
    console.error('Error sending account verified notification:', error);
  }
};
