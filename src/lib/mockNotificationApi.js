// Mock Notification API for testing when backend is not available
// This simulates the notification system without requiring backend setup

const MOCK_NOTIFICATIONS = new Map(); // userId -> notifications[]
let nextNotificationId = 1;

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
 * Create notification (mock version)
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (notificationData) => {
  console.log("🔔 Mock: Creating notification:", notificationData);
  console.log("🔔 Mock: Target userId:", notificationData.userId);
  
  const notification = {
    id: nextNotificationId++,
    userId: notificationData.userId,
    notificationType: notificationData.notificationType,
    title: notificationData.title,
    content: notificationData.content,
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store in mock storage
  if (!MOCK_NOTIFICATIONS.has(notificationData.userId)) {
    MOCK_NOTIFICATIONS.set(notificationData.userId, []);
    console.log("🔔 Mock: Created new user notification array for userId:", notificationData.userId);
  }
  
  const userNotifications = MOCK_NOTIFICATIONS.get(notificationData.userId);
  userNotifications.push(notification);
  
  console.log("✅ Mock: Notification created successfully:", notification);
  console.log("🔔 Mock: Total notifications for userId", notificationData.userId, ":", userNotifications.length);
  console.log("🔔 Mock: All stored data:", Object.fromEntries(MOCK_NOTIFICATIONS));
  return notification;
};

/**
 * Get user notifications (mock version)
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} pageSize - Page size
 * @returns {Promise<Object>} Notifications with pagination
 */
export const getUserNotifications = async (userId, page = 1, pageSize = 10) => {
  console.log("🔔 Mock: Getting notifications for user:", userId);
  console.log("🔔 Mock: All stored data:", Object.fromEntries(MOCK_NOTIFICATIONS));
  
  const userNotifications = MOCK_NOTIFICATIONS.get(userId) || [];
  console.log("🔔 Mock: User notifications found:", userNotifications.length);
  
  // Sort by newest first
  const sortedNotifications = userNotifications.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedNotifications = sortedNotifications.slice(startIndex, endIndex);
  
  const result = {
    notifications: paginatedNotifications,
    totalCount: userNotifications.length,
    page,
    pageSize,
    totalPages: Math.ceil(userNotifications.length / pageSize)
  };
  
  console.log("✅ Mock: Retrieved notifications:", result);
  return result;
};

/**
 * Get unread count (mock version)
 * @param {number} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async (userId) => {
  console.log("🔔 Mock: Getting unread count for user:", userId);
  
  const userNotifications = MOCK_NOTIFICATIONS.get(userId) || [];
  const unreadCount = userNotifications.filter(n => !n.isRead).length;
  
  console.log("✅ Mock: Unread count:", unreadCount);
  return unreadCount;
};

/**
 * Mark notification as read (mock version)
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId) => {
  console.log("🔔 Mock: Marking notification as read:", notificationId);
  
  // Find notification across all users
  for (const [userId, notifications] of MOCK_NOTIFICATIONS.entries()) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      notification.updatedAt = new Date().toISOString();
      console.log("✅ Mock: Notification marked as read:", notification);
      return notification;
    }
  }
  
  throw new Error("Notification not found");
};

/**
 * Mark all notifications as read (mock version)
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
export const markAllAsRead = async (userId) => {
  console.log("🔔 Mock: Marking all notifications as read for user:", userId);
  
  const userNotifications = MOCK_NOTIFICATIONS.get(userId) || [];
  let markedCount = 0;
  
  userNotifications.forEach(notification => {
    if (!notification.isRead) {
      notification.isRead = true;
      notification.updatedAt = new Date().toISOString();
      markedCount++;
    }
  });
  
  console.log("✅ Mock: Marked", markedCount, "notifications as read");
  return markedCount;
};

/**
 * Delete notification (mock version)
 * @param {number} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteNotification = async (notificationId) => {
  console.log("🔔 Mock: Deleting notification:", notificationId);
  
  // Find and remove notification
  for (const [userId, notifications] of MOCK_NOTIFICATIONS.entries()) {
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications.splice(index, 1);
      console.log("✅ Mock: Notification deleted successfully");
      return true;
    }
  }
  
  console.log("❌ Mock: Notification not found");
  return false;
};

/**
 * Send notification for post created (mock version)
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
    console.error('Mock: Error sending post created notification:', error);
    return false;
  }
};

/**
 * Send notification for post approved (mock version)
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
    console.error('Mock: Error sending post approved notification:', error);
    return false;
  }
};

/**
 * Send notification for post rejected (mock version)
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
    console.error('Mock: Error sending post rejected notification:', error);
    return false;
  }
};

/**
 * Clear all mock data (for testing)
 */
export const clearMockData = () => {
  MOCK_NOTIFICATIONS.clear();
  nextNotificationId = 1;
  console.log("🧹 Mock: All notification data cleared");
};

/**
 * Get all mock data (for debugging)
 */
export const getMockData = () => {
  return {
    notifications: Object.fromEntries(MOCK_NOTIFICATIONS),
    nextId: nextNotificationId
  };
};

/**
 * Debug function to check if user has notifications
 */
export const debugUserNotifications = (userId) => {
  console.log("🔍 Debug: Checking notifications for userId:", userId);
  console.log("🔍 Debug: All mock data:", getMockData());
  
  const userNotifications = MOCK_NOTIFICATIONS.get(userId) || [];
  console.log("🔍 Debug: User notifications:", userNotifications);
  
  return userNotifications;
};
