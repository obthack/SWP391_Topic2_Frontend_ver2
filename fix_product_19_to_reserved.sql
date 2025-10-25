-- Script SQL để sửa Product ID 19 thành "Đang trong quá trình thanh toán"
-- Chạy script này trong SQL Server Management Studio

-- 1. Kiểm tra trạng thái hiện tại của Product ID 19
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId,
    CreatedAt,
    UpdatedAt
FROM Products 
WHERE ProductId = 19;

-- 2. Cập nhật Product ID 19 thành "Reserved" (đang trong quá trình thanh toán)
UPDATE Products 
SET Status = 'Reserved'
WHERE ProductId = 19;

-- 3. Kiểm tra kết quả sau khi cập nhật
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId,
    CreatedAt,
    UpdatedAt
FROM Products 
WHERE ProductId = 19;

-- 4. Kiểm tra tổng quan tất cả sản phẩm
SELECT 
    Status,
    COUNT(*) as Count,
    CASE 
        WHEN Status = 'Active' THEN 'Hiển thị trên HomePage'
        WHEN Status = 'Reserved' THEN 'Ẩn khỏi HomePage - Đang trong quá trình thanh toán'
        WHEN Status = 'Sold' THEN 'Ẩn khỏi HomePage - Đã bán thành công'
        WHEN Status = 'Rejected' THEN 'Ẩn khỏi HomePage - Bị từ chối'
        WHEN Status = 'Pending' THEN 'Ẩn khỏi HomePage - Đang chờ duyệt xe'
        ELSE 'Trạng thái không xác định'
    END as Description
FROM Products 
GROUP BY Status
ORDER BY Status;

