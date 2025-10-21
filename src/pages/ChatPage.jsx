import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Send, 
  MessageCircle, 
  User, 
  Phone, 
  Mail,
  Calendar,
  Clock,
  MoreVertical,
  Search,
  Filter
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiRequest } from "../lib/api";

export const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show: showToast } = useToast();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [product, setProduct] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    } else {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async () => {
    try {
      setLoading(true);
      
      console.log(`Loading chat for conversationId: ${conversationId}`);

      // Fetch chat details from API
      const chatResponse = await apiRequest(`/api/Chat/${conversationId}`);
      
      if (chatResponse) {
        // Determine chat partner (the other user in the chat)
        const currentUserId = user?.id || user?.userId || user?.accountId;
        const partner = chatResponse.user1Id == currentUserId ? chatResponse.user2 : chatResponse.user1;
        
        setOtherUser({
          id: partner?.userId,
          name: partner?.fullName || "Người lạ",
          avatar: partner?.avatar || "https://via.placeholder.com/150"
        });

        // Load messages for this chat
        const messagesResponse = await apiRequest(`/api/Message/chat/${conversationId}`);
        
        if (messagesResponse && Array.isArray(messagesResponse)) {
          const formattedMessages = messagesResponse.map(msg => ({
            id: msg.messageId,
            senderId: msg.senderId,
            content: msg.content,
            timestamp: new Date(msg.createdDate).toISOString(),
            isRead: msg.isRead
          }));
          
          setMessages(formattedMessages);
        } else {
          setMessages([]);
        }

        // Set conversation data
        setConversation({
          id: conversationId,
          participants: [
            { id: currentUserId, name: user?.fullName || "Bạn" },
            { id: partner?.userId, name: partner?.fullName || "Người lạ" }
          ],
          lastMessage: messagesResponse && messagesResponse.length > 0 ? {
            content: messagesResponse[messagesResponse.length - 1].content,
            timestamp: messagesResponse[messagesResponse.length - 1].createdDate,
            senderId: messagesResponse[messagesResponse.length - 1].senderId
          } : null
        });

        // Mark all messages as read when entering the chat
        try {
          await apiRequest(`/api/Message/chat/${conversationId}/read-all`, {
            method: "PUT"
          });
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      }
      
    } catch (error) {
      console.error("Error loading conversation:", error);
      showToast({
        title: "❌ Lỗi tải cuộc trò chuyện",
        description: "Không thể tải cuộc trò chuyện. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Send message via API
      const messageResponse = await apiRequest("/api/Message", {
        method: "POST",
        body: {
          chatId: parseInt(conversationId),
          senderId: user?.id || user?.userId || user?.accountId,
          content: newMessage.trim()
        }
      });

      if (messageResponse) {
        // Add message to local state
        const message = {
          id: messageResponse.messageId,
          content: messageResponse.content,
          senderId: messageResponse.senderId,
          timestamp: new Date(messageResponse.createdDate).toISOString(),
          isRead: messageResponse.isRead
        };

        setMessages(prev => [...prev, message]);
        setNewMessage("");
        
        // Auto-focus input after sending
        inputRef.current?.focus();
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      showToast({
        title: "❌ Lỗi gửi tin nhắn",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString("vi-VN", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } else {
      return date.toLocaleDateString("vi-VN", { 
        day: "2-digit", 
        month: "2-digit" 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Cuộc trò chuyện không tồn tại
          </h2>
          <p className="text-gray-600 mb-4">
            Cuộc trò chuyện này có thể đã bị xóa hoặc không tồn tại.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {otherUser?.name || "Người dùng"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {product?.title || "Sản phẩm"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Messages */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`text-xs ${
                              isOwnMessage ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </span>
                          {isOwnMessage && (
                            <span className="text-xs text-blue-100 ml-2">
                              {message.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Product Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Sản phẩm</h3>
              
              {product && (
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 line-clamp-2">
                      {product.title}
                    </h4>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {product.price?.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>
              )}

              {/* User Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {otherUser?.name || "Người dùng"}
                      </p>
                      <p className="text-xs text-gray-500">Người bán</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Phone className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">0123 456 789</p>
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">seller@example.com</p>
                      <p className="text-xs text-gray-500">Email</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
