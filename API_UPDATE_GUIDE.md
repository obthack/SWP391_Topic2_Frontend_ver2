# 🔄 API Update Guide - EV Trading Platform

## Tổng quan

Backend API đã được deploy lên server production với URL mới. Tất cả API calls đã được cập nhật để sử dụng URL mới.

## 🌐 **API Configuration:**

### Production URL:

```
https://ev-and-battery-trading-platform-be.onrender.com
```

### Development URL:

```
http://localhost:5044
```

## 📁 **Files đã cập nhật:**

1. **`src/lib/api.js`** - Core API helper
2. **`src/config/api.js`** - API configuration
3. **`test_api_connection.html`** - Test connection

## 🔧 **Cách hoạt động:**

### 1. **Environment Variables:**

```bash
# Trong file .env
VITE_API_BASE=https://ev-and-battery-trading-platform-be.onrender.com
```

### 2. **API Configuration:**

```javascript
// src/config/api.js
export const API_CONFIG = {
  BASE_URL:
    import.meta.env.VITE_API_BASE ||
    "https://ev-and-battery-trading-platform-be.onrender.com",
  // ... endpoints
};
```

### 3. **Automatic Fallback:**

- Nếu không có environment variable, sử dụng production URL
- Nếu có environment variable, sử dụng custom URL

## 🧪 **Test API Connection:**

### 1. **Mở test file:**

```
test_api_connection.html
```

### 2. **Test các endpoints:**

- ✅ **Health Check** - Kiểm tra API health
- ✅ **Products API** - Test products endpoint
- ✅ **Users API** - Test users endpoint
- ✅ **Auth API** - Test authentication
- ✅ **All Endpoints** - Test tất cả endpoints

### 3. **Expected Results:**

- **Products API**: `https://ev-and-battery-trading-platform-be.onrender.com/api/Product`
- **Users API**: `https://ev-and-battery-trading-platform-be.onrender.com/api/User`
- **Auth API**: `https://ev-and-battery-trading-platform-be.onrender.com/api/Auth/login`

## 📋 **API Endpoints:**

### **Products:**

- `GET /api/Product` - Get all products
- `GET /api/Product/{id}` - Get product by ID
- `POST /api/Product` - Create product
- `PUT /api/Product/{id}` - Update product
- `DELETE /api/Product/{id}` - Delete product

### **Users:**

- `GET /api/User` - Get all users
- `GET /api/User/{id}` - Get user by ID
- `PUT /api/User/{id}` - Update user
- `DELETE /api/User/{id}` - Delete user

### **Authentication:**

- `POST /api/Auth/login` - Login
- `POST /api/Auth/register` - Register
- `POST /api/Auth/refresh` - Refresh token
- `POST /api/Auth/forgot-password` - Forgot password
- `POST /api/Auth/reset-password` - Reset password

### **Product Images:**

- `GET /api/ProductImage/product/{productId}` - Get product images
- `POST /api/ProductImage` - Upload single image
- `POST /api/ProductImage/multiple` - Upload multiple images
- `DELETE /api/ProductImage/{id}` - Delete image

### **Orders:**

- `GET /api/Order` - Get all orders
- `GET /api/Order/{id}` - Get order by ID
- `POST /api/Order` - Create order
- `PUT /api/Order/{id}/status` - Update order status

### **Payments:**

- `POST /api/payment` - Create payment
- `GET /api/payment/{id}` - Get payment by ID
- `PUT /api/payment/{id}/status` - Update payment status

## 🚀 **Cách sử dụng:**

### 1. **Import services:**

```javascript
import { productService, authService, orderService } from "../services";
```

### 2. **Sử dụng services:**

```javascript
// Get all products
const products = await productService.getAllProducts();

// Login user
const loginResult = await authService.login({
  email: "user@example.com",
  password: "password",
});

// Create order
const order = await orderService.createOrder({
  productId: 1,
  buyerId: 2,
  totalAmount: 1000000000,
});
```

## 🔍 **Debugging:**

### 1. **Check API Health:**

```javascript
// Test API connection
const response = await fetch(
  "https://ev-and-battery-trading-platform-be.onrender.com/api/Health"
);
console.log("API Health:", response.ok);
```

### 2. **Check Environment:**

```javascript
console.log("API Base URL:", import.meta.env.VITE_API_BASE);
```

### 3. **Check Network Tab:**

- Mở Developer Tools
- Check Network tab
- Verify API calls đang sử dụng URL mới

## ⚠️ **Troubleshooting:**

### Vấn đề: API calls vẫn sử dụng localhost

**Giải pháp:**

- Check environment variables
- Restart dev server
- Clear browser cache

### Vấn đề: CORS errors

**Giải pháp:**

- Backend cần cấu hình CORS
- Check API response headers
- Verify allowed origins

### Vấn đề: 404 errors

**Giải pháp:**

- Check API endpoints
- Verify backend deployment
- Test với Postman/curl

## 📊 **Performance:**

### **Expected Response Times:**

- **Health Check**: < 500ms
- **Products API**: < 1000ms
- **Users API**: < 800ms
- **Auth API**: < 600ms

### **Monitoring:**

- Check response times
- Monitor error rates
- Track API usage

## 🎯 **Best Practices:**

### 1. **Always use services:**

```javascript
// ✅ Good
const products = await productService.getAllProducts();

// ❌ Bad
const products = await fetch("/api/Product");
```

### 2. **Handle errors:**

```javascript
try {
  const products = await productService.getAllProducts();
} catch (error) {
  console.error("Failed to load products:", error);
}
```

### 3. **Check authentication:**

```javascript
if (!authService.isAuthenticated()) {
  // Redirect to login
  return;
}
```

## 📋 **Checklist:**

- [ ] API base URL đã được cập nhật
- [ ] Environment variables đã được set
- [ ] Test API connection thành công
- [ ] All endpoints hoạt động
- [ ] Error handling đã được implement
- [ ] Performance monitoring đã được setup

---

**Kết quả: API đã được cập nhật để sử dụng production server! 🚀**
