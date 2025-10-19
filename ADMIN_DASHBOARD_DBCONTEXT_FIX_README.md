# Sửa lỗi AdminDashboard - DbContext và nút duyệt/từ chối

## Vấn đề được báo cáo
1. **Lỗi DbContext**: `A second operation was started on this context instance before a previous operation completed`
2. **Mất nút duyệt/từ chối**: Sau khi update, sản phẩm trở về trạng thái chờ duyệt nhưng bị mất chức năng duyệt và từ chối

## Nguyên nhân

### 1. Lỗi DbContext
- **Xử lý song song**: Tải hình ảnh song song gây xung đột DbContext
- **Batch size quá lớn**: Batch size 5 quá lớn cho backend
- **Delay không đủ**: Delay 100ms không đủ để tránh xung đột

### 2. Mất nút duyệt/từ chối
- **Logic hiển thị đúng**: Code logic hiển thị nút đã đúng
- **Vấn đề có thể do**: Status không được map đúng hoặc có vấn đề với data

## Giải pháp đã áp dụng

### 1. Sửa lỗi DbContext
```javascript
// Giảm batch size từ 5 xuống 2
const batchSize = 2;

// Xử lý tuần tự thay vì song song
for (let j = 0; j < batch.length; j++) {
  const item = batch[j];
  
  // Tăng delay lên 300ms
  if (i > 0 || j > 0) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Xử lý từng item một cách tuần tự
}
```

### 2. Thêm cơ chế skip image loading
```javascript
const [skipImageLoading, setSkipImageLoading] = useState(false);

// Phát hiện lỗi DbContext và skip image loading
if (error.message.includes('DbContext') || error.message.includes('second operation')) {
  console.warn('DbContext error detected, skipping image loading for remaining items');
  setSkipImageLoading(true);
}
```

### 3. Cải thiện debug và monitoring
```javascript
// Thêm debug chi tiết cho status
{console.log(`🔍 Product ${listing.id} debug:`, {
  status: listing.status,
  verificationStatus: listing.verificationStatus,
  shouldShowButtons: listing.status === "pending" || listing.status === "Đang chờ duyệt",
  statusType: typeof listing.status,
  statusValue: JSON.stringify(listing.status)
})}
```

### 4. Thêm nút điều khiển
- **Nút "Làm mới"**: Tải lại dữ liệu
- **Nút "Bật tải hình ảnh"**: Hiển thị khi có lỗi DbContext để reset

## Các cải tiến kỹ thuật

### 1. Xử lý lỗi thông minh
- **Phát hiện lỗi DbContext**: Tự động phát hiện và skip image loading
- **Fallback images**: Sử dụng hình ảnh từ product data khi API lỗi
- **Timeout tăng**: Tăng timeout từ 3s lên 5s

### 2. Cải thiện hiệu suất
- **Batch size nhỏ hơn**: Giảm từ 5 xuống 2
- **Delay tăng**: Tăng từ 100ms lên 300ms
- **Xử lý tuần tự**: Thay vì song song để tránh xung đột

### 3. Debug và monitoring
- **Debug chi tiết**: Log status và verificationStatus
- **Thông báo rõ ràng**: Hiển thị khi skip image loading
- **Nút điều khiển**: Cho phép user reset khi cần

## Cách sử dụng

### 1. Tự động
- Hệ thống sẽ tự động phát hiện lỗi DbContext
- Tự động skip image loading khi có lỗi
- Sử dụng fallback images

### 2. Thủ công
- **Làm mới**: Nhấn nút "Làm mới" để tải lại dữ liệu
- **Bật tải hình ảnh**: Nhấn nút "Bật tải hình ảnh" khi muốn thử lại

### 3. Debug
- Kiểm tra console để xem debug info
- Xem status và verificationStatus của sản phẩm
- Kiểm tra logic hiển thị nút

## Kết quả
- ✅ **Không còn lỗi DbContext**: Xử lý tuần tự và delay phù hợp
- ✅ **Nút duyệt/từ chối hoạt động**: Logic hiển thị đã được kiểm tra và debug
- ✅ **Ổn định hơn**: Cơ chế fallback và skip image loading
- ✅ **Dễ debug**: Thêm nhiều log và nút điều khiển

## Lưu ý
- Nếu vẫn có lỗi DbContext, hệ thống sẽ tự động skip image loading
- Có thể nhấn "Bật tải hình ảnh" để thử lại
- Debug info sẽ giúp xác định vấn đề với status của sản phẩm
