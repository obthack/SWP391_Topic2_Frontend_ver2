// Real Notification API using backend endpoints
import { apiRequest } from './api';

export const NOTIFICATION_TYPES = {
  POST_CREATED: "post_created",
  POST_APPROVED: "post_approved", 
  POST_REJECTED: "post_rejected",
  POST_SOLD: "post_sold",
  MESSAGE_RECEIVED: "message_received",
  SYSTEM_ANNOUNCEMENT: "system_announcement",
  TEST: "test"
};

/**
 * Create notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (notificationData) => {
  console.log("🔔 Creating notification:", notificationData);
  
  try {
    const response = await apiRequest('/api/Notification', {
      method: 'POST',
      body: notificationData
    });
    
    console.log("✅ Notification created successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
};

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} pageSize - Page size
 * @returns {Promise<Object>} Notifications with pagination
 */
export const getUserNotifications = async (userId, page = 1, pageSize = 10) => {
  console.log("🔔 Getting notifications for user:", userId);
  
  try {
    const response = await apiRequest(`/api/Notification/user/${userId}?page=${page}&pageSize=${pageSize}`);
    console.log("✅ Retrieved notifications:", response);
    return response;
  } catch (error) {
    console.error("❌ Error getting user notifications:", error);
    throw error;
  }
};

/**
 * Get unread count
 * @param {number} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async (userId) => {
  console.log("🔔 Getting unread count for user:", userId);
  
  try {
    const notifications = await apiRequest(`/api/Notification/user/${userId}`);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    console.log("✅ Unread count:", unreadCount);
    return unreadCount;
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return 0;
  }
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId) => {
  console.log("🔔 Marking notification as read:", notificationId);
  
  try {
    const response = await apiRequest(`/api/Notification/${notificationId}`, {
      method: 'PUT',
      body: { isRead: true }
    });
    
    console.log("✅ Notification marked as read:", response);
    return response;
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
export const markAllAsRead = async (userId) => {
  console.log("🔔 Marking all notifications as read for user:", userId);
  
  try {
    const notifications = await apiRequest(`/api/Notification/user/${userId}`);
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    // Mark each unread notification as read
    const promises = unreadNotifications.map(notification => 
      markAsRead(notification.id)
    );
    
    await Promise.all(promises);
    
    console.log("✅ Marked", unreadNotifications.length, "notifications as read");
    return unreadNotifications.length;
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    return 0;
  }
};

/**
 * Delete notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteNotification = async (notificationId) => {
  console.log("🔔 Deleting notification:", notificationId);
  
  try {
    await apiRequest(`/api/Notification/${notificationId}`, {
      method: 'DELETE'
    });
    
    console.log("✅ Notification deleted successfully");
    return true;
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    return false;
  }
};

/**
 * Send notification for post created
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @returns {Promise<boolean>} Success status
 */
export const notifyPostCreated = async (userId, postTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_CREATED,
      title: '📝 Bài đăng đã được tạo',
      content: `Bài đăng "${postTitle}" đã được tạo thành công và đang chờ duyệt.`
    });
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
 * @returns {Promise<boolean>} Success status
 */
export const notifyPostApproved = async (userId, postTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_APPROVED,
      title: '✅ Bài đăng đã được duyệt',
      content: `Bài đăng "${postTitle}" đã được admin duyệt và hiển thị trên trang chủ.`
    });
    return true;
  } catch (error) {
    console.error('Error sending post approved notification:', error);
    return false;
  }
};

/**
 * Send notification for post rejected
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @returns {Promise<boolean>} Success status
 */
export const notifyPostRejected = async (userId, postTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_REJECTED,
      title: '❌ Bài đăng bị từ chối',
      content: `Bài đăng "${postTitle}" đã bị admin từ chối. Vui lòng kiểm tra và chỉnh sửa.`
    });
    return true;
  } catch (error) {
    console.error('Error sending post rejected notification:', error);
    return false;
  }
};