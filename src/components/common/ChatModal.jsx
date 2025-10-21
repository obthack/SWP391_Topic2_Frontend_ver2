import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, MessageCircle, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "../../lib/api";

export const ChatModal = ({ 
  isOpen, 
  onClose, 
  seller, 
  product, 
  onSendMessage 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      // Ensure we have valid IDs
      const sellerId = parseInt(seller?.id || seller?.userId || seller?.accountId || seller?.userId);
      const currentUserId = parseInt(user?.id || user?.userId || user?.accountId);
      
      console.log("Seller object:", seller);
      console.log("User object:", user);
      
      if (!sellerId || !currentUserId) {
        throw new Error(`Không thể xác định thông tin người dùng. SellerId: ${sellerId}, CurrentUserId: ${currentUserId}`);
      }

      console.log("Starting chat with sellerId:", sellerId, "currentUserId:", currentUserId);

      // First, start a chat with the seller
      let chatResponse;
      try {
        chatResponse = await apiRequest(`/api/Chat/start-chat/${sellerId}`, {
          method: "POST",
        });
        console.log("Chat response:", chatResponse);
      } catch (chatError) {
        console.warn("Failed to start chat, trying alternative method:", chatError);
        // Try creating chat directly
        chatResponse = await apiRequest("/api/Chat", {
          method: "POST",
          body: {
            user1Id: currentUserId,
            user2Id: sellerId
          }
        });
        console.log("Alternative chat response:", chatResponse);
      }

      if (chatResponse && chatResponse.chatId) {
        // Send the initial message
        const messageResponse = await apiRequest("/api/Message", {
          method: "POST",
          body: {
            chatId: parseInt(chatResponse.chatId),
            senderId: currentUserId,
            content: message.trim()
          }
        });

        console.log("Message response:", messageResponse);

        if (messageResponse) {
          setMessage("");
          
          // Close modal and redirect to chat page
          onClose();
          navigate(`/chat/${chatResponse.chatId}`);
        }
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        seller: seller,
        user: user
      });
      
      let errorMessage = "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.";
      
      if (error.message && error.message.includes("validation")) {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
      } else if (error.message && error.message.includes("Unauthorized")) {
        errorMessage = "Bạn cần đăng nhập để gửi tin nhắn.";
      }
      
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Liên hệ người bán</h3>
                <p className="text-green-100 text-sm">
                  {seller?.fullName || "Người bán"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              {product?.productType?.toLowerCase() === "battery" ? "🔋" : "🚗"}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 line-clamp-1">
                {product?.title}
              </h4>
              <p className="text-sm text-gray-600">
                {product?.productType?.toLowerCase() === "battery" 
                  ? "Pin điện" 
                  : "Xe điện"}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="p-4 h-64 overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {/* Welcome message */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Xin chào! Tôi quan tâm đến sản phẩm này. Bạn có thể cho tôi biết thêm thông tin không?
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tin nhắn mẫu - Bạn có thể thay đổi nội dung
                  </p>
                </div>
              </div>
            </div>

            {/* Placeholder for future messages */}
            <div className="text-center text-gray-400 text-sm py-4">
              Cuộc trò chuyện sẽ bắt đầu sau khi bạn gửi tin nhắn
            </div>
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tin nhắn sẽ được gửi đến người bán và tạo cuộc trò chuyện mới
          </p>
        </form>
      </div>
    </div>
  );
};
