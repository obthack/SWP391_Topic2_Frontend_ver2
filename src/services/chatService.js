// Chat Service
import apiService from './apiService';

class ChatService {
  // Get chat history for user
  async getChatHistory(userId) {
    try {
      return await apiService.getChatHistory(userId);
    } catch (error) {
      console.error(`Failed to get chat history for user ${userId}:`, error);
      throw error;
    }
  }

  // Get chat messages for conversation
  async getChatMessages(conversationId) {
    try {
      return await apiService.getChatMessages(conversationId);
    } catch (error) {
      console.error(`Failed to get messages for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  // Send message
  async sendMessage(messageData) {
    try {
      return await apiService.sendMessage(messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Create conversation
  async createConversation(participants) {
    try {
      return await apiService.createConversation(participants);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  // Start conversation with seller
  async startConversationWithSeller(buyerId, sellerId, productId) {
    try {
      const participants = [buyerId, sellerId];
      const conversation = await this.createConversation(participants);
      
      // Send initial message about the product
      if (conversation.id) {
        await this.sendMessage({
          conversationId: conversation.id,
          senderId: buyerId,
          message: `Tôi quan tâm đến sản phẩm này (ID: ${productId}). Bạn có thể cho tôi biết thêm thông tin không?`,
          messageType: 'text'
        });
      }
      
      return conversation;
    } catch (error) {
      console.error('Failed to start conversation with seller:', error);
      throw error;
    }
  }

  // Get conversation by participants
  async getConversationByParticipants(userId1, userId2) {
    try {
      const history = await this.getChatHistory(userId1);
      return history.find(conv => 
        conv.participants.includes(userId1) && 
        conv.participants.includes(userId2)
      );
    } catch (error) {
      console.error('Failed to get conversation by participants:', error);
      throw error;
    }
  }
}

export default new ChatService();
