import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "../../lib/api";

export const ChatBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Refresh unread count every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const response = await apiRequest("/api/Message/unread-count");
      if (response !== undefined) {
        setUnreadCount(response);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  return (
    <Link
      to="/chats"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
      title="Tin nhắn"
    >
      <MessageCircle className="h-5 w-5 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};
