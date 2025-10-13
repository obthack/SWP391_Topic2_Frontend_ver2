import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getUnreadCount, markAllAsRead } from "../../lib/notificationApi";

export const NotificationBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load unread count
  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      setIsLoading(true);
      const count = await getUnreadCount(
        user.id || user.userId || user.accountId
      );
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      await markAllAsRead(user.id || user.userId || user.accountId);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <Link
        to="/notifications"
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
        title="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 rounded-full h-3 w-3 animate-pulse"></span>
        )}
      </Link>

      {unreadCount > 0 && (
        <button
          onClick={handleMarkAllAsRead}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          title="Đánh dấu tất cả đã đọc"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
