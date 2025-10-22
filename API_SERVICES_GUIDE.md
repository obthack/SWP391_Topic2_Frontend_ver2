# 🔌 API Services Guide - EV Trading Platform

## Tổng quan

Tất cả API calls đã được tổng hợp vào các service riêng biệt để dễ quản lý và sử dụng.

## 📁 **Cấu trúc Services:**

```
src/services/
├── index.js                 # Export tất cả services
├── apiService.js           # Core API service
├── authService.js          # Authentication
├── productService.js       # Product management
├── orderService.js         # Order management
├── paymentService.js       # Payment processing
├── favoriteService.js      # Favorites management
├── notificationService.js  # Notifications
└── chatService.js          # Chat functionality
```

## 🚀 **Cách sử dụng:**

### 1. **Import Services**

```javascript
// Import tất cả services
import {
  authService,
  productService,
  orderService,
  paymentService,
  favoriteService,
  notificationService,
  chatService,
} from "../services";

// Hoặc import riêng lẻ
import { authService } from "../services/authService";
import { productService } from "../services/productService";
```

### 2. **Authentication Service**

```javascript
// Login
const loginResult = await authService.login({
  email: "user@example.com",
  password: "password",
});

// Register
const registerResult = await authService.register({
  email: "user@example.com",
  password: "password",
  fullName: "John Doe",
});

// Get current user
const currentUser = authService.getCurrentUser();

// Check authentication
const isAuthenticated = authService.isAuthenticated();

// Logout
authService.logout();
```

### 3. **Product Service**

```javascript
// Get all products
const products = await productService.getAllProducts();

// Get product by ID
const product = await productService.getProductById(1);

// Create product
const newProduct = await productService.createProduct({
  title: "Tesla Model 3",
  price: 1000000000,
  description: "Electric car",
});

// Update product
const updatedProduct = await productService.updateProduct(1, {
  title: "Updated Title",
});

// Delete product
await productService.deleteProduct(1);

// Upload product images
const imageResult = await productService.uploadMultipleProductImages(formData);
```

### 4. **Order Service**

```javascript
// Get all orders
const orders = await orderService.getAllOrders();

// Get orders by user
const userOrders = await orderService.getOrdersByUser(userId);

// Create order
const newOrder = await orderService.createOrder({
  productId: 1,
  buyerId: 2,
  quantity: 1,
  totalAmount: 1000000000,
});

// Update order status
await orderService.updateOrderStatus(orderId, "confirmed");

// Cancel order
await orderService.cancelOrder(orderId);
```

### 5. **Payment Service**

```javascript
// Create payment
const payment = await paymentService.createPayment({
  orderId: 1,
  amount: 1000000000,
  paymentType: "Deposit",
});

// Process VNPay payment
await paymentService.processVNPayPayment({
  orderId: 1,
  amount: 1000000000,
});

// Handle payment callback
const callbackResult = await paymentService.handlePaymentCallback(callbackData);
```

### 6. **Favorite Service**

```javascript
// Get user favorites
const favorites = await favoriteService.getFavoritesByUser(userId);

// Add to favorites
await favoriteService.addToFavorites(userId, productId);

// Remove from favorites
await favoriteService.removeFromFavorites(userId, productId);

// Toggle favorite
await favoriteService.toggleFavorite(userId, productId);

// Check if favorited
const isFavorited = await favoriteService.isProductFavorited(userId, productId);
```

### 7. **Notification Service**

```javascript
// Get user notifications
const notifications = await notificationService.getNotificationsByUser(userId);

// Mark as read
await notificationService.markNotificationAsRead(notificationId);

// Mark all as read
await notificationService.markAllNotificationsAsRead(userId);

// Send notification
await notificationService.sendNotificationToUser(
  userId,
  "Title",
  "Message",
  "info"
);

// Send product approval notification
await notificationService.sendProductApprovalNotification(
  userId,
  "Product Title",
  true
);
```

### 8. **Chat Service**

```javascript
// Get chat history
const chatHistory = await chatService.getChatHistory(userId);

// Get conversation messages
const messages = await chatService.getChatMessages(conversationId);

// Send message
await chatService.sendMessage({
  conversationId: 1,
  senderId: 2,
  message: "Hello!",
  messageType: "text",
});

// Start conversation with seller
const conversation = await chatService.startConversationWithSeller(
  buyerId,
  sellerId,
  productId
);
```

## 🔧 **Migration từ API cũ:**

### Trước (API cũ):

```javascript
import { apiRequest } from "../lib/api";

// Cũ
const products = await apiRequest("/api/Product");
const product = await apiRequest(`/api/Product/${id}`);
```

### Sau (Service mới):

```javascript
import { productService } from "../services";

// Mới
const products = await productService.getAllProducts();
const product = await productService.getProductById(id);
```

## 📋 **Benefits:**

### 1. **Centralized Management**

- Tất cả API calls ở một nơi
- Dễ dàng thay đổi endpoint
- Consistent error handling

### 2. **Type Safety**

- Clear method signatures
- Predictable return types
- Better IDE support

### 3. **Error Handling**

- Consistent error handling
- Automatic logging
- User-friendly error messages

### 4. **Caching & Optimization**

- Built-in caching
- Request deduplication
- Performance monitoring

## 🎯 **Best Practices:**

### 1. **Always use try-catch**

```javascript
try {
  const products = await productService.getAllProducts();
  // Handle success
} catch (error) {
  // Handle error
  console.error("Failed to load products:", error);
}
```

### 2. **Check authentication**

```javascript
if (!authService.isAuthenticated()) {
  // Redirect to login
  return;
}

const products = await productService.getAllProducts();
```

### 3. **Handle loading states**

```javascript
const [loading, setLoading] = useState(false);

const loadProducts = async () => {
  setLoading(true);
  try {
    const products = await productService.getAllProducts();
    setProducts(products);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

## 🚨 **Error Handling:**

Tất cả services đều có error handling built-in:

- Automatic logging
- User-friendly error messages
- Consistent error format

## 📊 **Performance:**

- **Caching**: Automatic response caching
- **Deduplication**: Prevent duplicate requests
- **Batch requests**: Multiple API calls in one request
- **Optimization**: Smart data loading

---

**Kết quả: Code sạch hơn, dễ maintain hơn, và performance tốt hơn! 🚀**
