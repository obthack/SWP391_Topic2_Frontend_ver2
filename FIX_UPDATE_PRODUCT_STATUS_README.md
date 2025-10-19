# Sửa lỗi mất nút duyệt/từ chối sau khi cập nhật sản phẩm

## Vấn đề
Sau khi cập nhật bài đăng, xe từ trạng thái "đã duyệt" chuyển về "chờ duyệt" nhưng không hiển thị nút duyệt/từ chối trong AdminDashboard.

## Nguyên nhân

### 1. Backend tự động reset status
Trong ProductController, method `UpdateProduct` có logic:
```csharp
// ✅ Reset trạng thái về "Draft" để admin duyệt lại
existingProduct.Status = "Re-submit";
existingProduct.VerificationStatus = "NotRequested";
```

Backend **cố ý** reset status về "Re-submit" để admin phải duyệt lại sản phẩm sau khi cập nhật.

### 2. Frontend không nhận diện status mới
AdminDashboard chỉ kiểm tra status là "pending" hoặc "Đang chờ duyệt":
```javascript
{(listing.status === "pending" || listing.status === "Đang chờ duyệt") && (
  // Hiển thị nút duyệt/từ chối
)}
```

Nhưng backend đang trả về status "Re-submit", không được nhận diện.

## Giải pháp đã áp dụng

### 1. Cập nhật logic hiển thị nút
```javascript
// Trước
{(listing.status === "pending" || listing.status === "Đang chờ duyệt") && (

// Sau  
{(listing.status === "pending" || listing.status === "Đang chờ duyệt" || listing.status === "Re-submit" || listing.status === "Draft") && (
```

### 2. Cập nhật logic mapping status
```javascript
status: (() => {
  const rawStatus = norm(item.status || item.verificationStatus || item.approvalStatus || "pending");
  // Map backend statuses to frontend statuses
  if (rawStatus === "draft" || rawStatus === "re-submit") return "pending";
  if (rawStatus === "active" || rawStatus === "approved") return "approved";
  if (rawStatus === "rejected") return "rejected";
  return rawStatus;
})(),
```

### 3. Cập nhật verificationStatus mapping
```javascript
verificationStatus: (() => {
  const rawStatus = norm(item.verificationStatus || item.status || "pending");
  // Map backend verification statuses to frontend statuses
  if (rawStatus === "draft" || rawStatus === "re-submit" || rawStatus === "notrequested") return "pending";
  if (rawStatus === "active" || rawStatus === "approved" || rawStatus === "verified") return "approved";
  if (rawStatus === "rejected") return "rejected";
  return rawStatus;
})(),
```

### 4. Cập nhật modal chi tiết sản phẩm
```javascript
// Trước
{product.status === "pending" && (

// Sau
{(product.status === "pending" || product.status === "Re-submit" || product.status === "Draft") && (
```

### 5. Cải thiện debug logging
```javascript
{console.log(`🔍 Product ${listing.id} debug:`, {
  status: listing.status,
  verificationStatus: listing.verificationStatus,
  shouldShowButtons: listing.status === "pending" || listing.status === "Đang chờ duyệt" || listing.status === "Re-submit" || listing.status === "Draft",
  statusType: typeof listing.status,
  statusValue: JSON.stringify(listing.status)
})}
```

## Mapping Status Backend ↔ Frontend

| Backend Status | Frontend Status | Hiển thị nút |
|----------------|-----------------|--------------|
| `Draft` | `pending` | ✅ |
| `Re-submit` | `pending` | ✅ |
| `Active` | `approved` | ❌ |
| `Approved` | `approved` | ❌ |
| `Rejected` | `rejected` | ❌ |

## Kết quả
- ✅ **Nút duyệt/từ chối hiển thị**: Nhận diện được status "Re-submit" và "Draft"
- ✅ **Logic đúng**: Backend vẫn reset status để admin duyệt lại (đúng business logic)
- ✅ **Mapping chính xác**: Frontend map đúng các status từ backend
- ✅ **Debug tốt**: Log chi tiết để kiểm tra status

## Lưu ý
- **Backend logic đúng**: Việc reset status về "Re-submit" là đúng để admin duyệt lại
- **Frontend đã sửa**: Nhận diện được tất cả status cần duyệt
- **Business logic**: Sản phẩm cập nhật cần được admin duyệt lại để đảm bảo chất lượng

## Cách hoạt động
1. **User cập nhật sản phẩm** → Backend set status = "Re-submit"
2. **AdminDashboard load** → Frontend map "Re-submit" → "pending"
3. **Hiển thị nút** → Logic nhận diện "pending" → Hiển thị nút duyệt/từ chối
4. **Admin duyệt** → Status chuyển về "Active"/"Approved"
5. **Không hiển thị nút** → Logic nhận diện "approved" → Ẩn nút
