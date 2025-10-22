import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  User, 
  Clock,
  MoreVertical,
  Phone,
  Video,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const ChatHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("/api/Chat");
      
      if (response && Array.isArray(response)) {
        setChats(response);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChatPartner = (chat) => {
    const currentUserId = user?.id || user?.userId || user?.accountId;
    return chat.user1Id == currentUserId ? chat.user2 : chat.user1;
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, "HH:mm", { locale: vi });
    } else if (diffInHours < 168) { // 7 days
      return format(date, "EEEE", { locale: vi });
    } else {
      return format(date, "dd/MM/yyyy", { locale: vi });
    }
  };

  const filteredChats = chats.filter(chat => {
    const partner = getChatPartner(chat);
    const partnerName = partner?.fullName || "";
    const lastMessage = chat.lastMessage?.content || "";
    
    return partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Tin nhắn</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Phone className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Video className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="bg-white border-b px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Không tìm thấy cuộc trò chuyện" : "Chưa có cuộc trò chuyện nào"}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? "Thử tìm kiếm với từ khóa khác" 
                  : "Hãy bắt đầu trò chuyện với người bán về sản phẩm bạn quan tâm"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredChats.map((chat) => {
                const partner = getChatPartner(chat);
                const isUnread = chat.unreadCount > 0;
                
                return (
                  <Link
                    key={chat.chatId}
                    to={`/chat/${chat.chatId}`}
                    className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0 mr-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                        {partner?.avatar ? (
                          <img
                            src={partner.avatar}
                            alt={partner.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      {isUnread && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {partner?.fullName || "Người lạ"}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(chat.lastMessage?.createdDate)}
                          </span>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate flex-1">
                          {chat.lastMessage?.content || "Chưa có tin nhắn nào"}
                        </p>
                        {isUnread && (
                          <div className="ml-2 flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
