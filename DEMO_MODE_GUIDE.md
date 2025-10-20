# 🎭 Demo Mode Guide - EV Trading Platform

## Tổng quan

Demo Mode được thiết kế để giúp bạn trình bày ứng dụng một cách mượt mà mà không bị gián đoạn bởi token hết hạn.

## 🚀 Cách sử dụng

### 1. Bật Demo Mode

- Mở trang CreateListing hoặc bất kỳ trang nào có DemoModeToggle
- Click vào nút "Switch to Demo Mode" ở góc phải màn hình
- Trang sẽ tự động reload để áp dụng thay đổi

### 2. Tính năng Demo Mode

- ✅ **Bỏ qua kiểm tra token hết hạn**
- ✅ **Không tự động redirect về login**
- ✅ **Hiển thị thông báo rõ ràng về trạng thái**
- ✅ **Dễ dàng chuyển đổi giữa Demo và Production**

### 3. Khi nào sử dụng Demo Mode

- 🎯 **Trình bày cho giảng viên**
- 🎯 **Demo sản phẩm cho khách hàng**
- 🎯 **Testing tính năng mà không lo token hết hạn**
- 🎯 **Phát triển và debug**

### 4. Khi nào KHÔNG sử dụng Demo Mode

- ❌ **Môi trường production thực tế**
- ❌ **Khi cần bảo mật cao**
- ❌ **Khi test tính năng authentication**

## 🔧 Cấu hình

### Environment Variables

```bash
# Trong file .env
VITE_DEMO_MODE=true
```

### LocalStorage

```javascript
// Bật demo mode
localStorage.setItem("evtb_demo_mode", "true");

// Tắt demo mode
localStorage.setItem("evtb_demo_mode", "false");
```

## 📋 Checklist trước khi trình bày

- [ ] Bật Demo Mode
- [ ] Kiểm tra tất cả tính năng hoạt động
- [ ] Chuẩn bị dữ liệu test sẵn
- [ ] Test flow đăng nhập → tạo bài đăng → upload ảnh
- [ ] Chuẩn bị backup plan nếu có lỗi

## 🎯 Tips cho buổi trình bày

1. **Bắt đầu với Demo Mode ON**

   - Giải thích cho giảng viên về tính năng này
   - Đảm bảo không bị gián đoạn bởi token hết hạn

2. **Chuẩn bị dữ liệu test**

   - Tạo sẵn tài khoản test
   - Chuẩn bị ảnh xe và ảnh giấy tờ
   - Test trước tất cả flow

3. **Backup plan**
   - Nếu có lỗi, có thể chuyển sang Production Mode
   - Chuẩn bị screenshot/video backup

## 🔍 Debug

### Kiểm tra Demo Mode

```javascript
// Trong console
console.log("Demo Mode:", localStorage.getItem("evtb_demo_mode"));
```

### Logs trong Demo Mode

```
🎭 DEMO MODE: Skipping token expiration check
🔍 Auth token check (DEMO): { demoMode: true, ... }
```

## ⚠️ Lưu ý quan trọng

1. **Demo Mode chỉ nên dùng trong môi trường development/demo**
2. **Luôn tắt Demo Mode khi deploy production**
3. **Token vẫn được gửi đến backend, chỉ bỏ qua kiểm tra expiration**
4. **Nếu backend từ chối token hết hạn, vẫn sẽ có lỗi 401**

## 🆘 Troubleshooting

### Vấn đề: Demo Mode không hoạt động

**Giải pháp:**

- Kiểm tra localStorage: `localStorage.getItem('evtb_demo_mode')`
- Reload trang sau khi bật/tắt
- Kiểm tra console logs

### Vấn đề: Vẫn bị redirect về login

**Giải pháp:**

- Đảm bảo Demo Mode đã được bật
- Kiểm tra token có tồn tại không
- Backend có thể từ chối token hết hạn

### Vấn đề: Không thể chuyển đổi mode

**Giải pháp:**

- Clear localStorage và thử lại
- Hard refresh trang (Ctrl+F5)
- Kiểm tra console errors

---

**Chúc bạn trình bày thành công! 🎉**
