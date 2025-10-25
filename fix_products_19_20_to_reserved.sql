-- Script SQL để sửa Product ID 19 và 20 thành Reserved
-- Chạy script này trong SQL Server Management Studio

-- 1. Kiểm tra trạng thái hiện tại của Product ID 19 và 20
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId,
    CreatedAt,
    UpdatedAt
FROM Products 
WHERE ProductId IN (19, 20);

-- 2. Cập nhật Product ID 19 và 20 thành "Reserved" (đang trong quá trình thanh toán)
UPDATE Products 
SET Status = 'Reserved'
WHERE ProductId IN (19, 20);

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
WHERE ProductId IN (19, 20);

-- 4. Kiểm tra tổng quan tất cả sản phẩm
SELECT 
    Status,
    COUNT(*) as Count,
    CASE 
        WHEN Status = 'Active' THEN 'Hiển thị trên HomePage'
        WHEN Status = 'Reserved' THEN 'Ẩn khỏi HomePage - Đang trong quá trình thanh toán'
        WHEN Status = 'Sold' THEN 'Ẩn khỏi HomePage - Đã bán thành công'
        WHEN Status = 'Pending' THEN 'Chờ duyệt xe (KHÔNG phải thanh toán)'
        WHEN Status = 'Rejected' THEN 'Ẩn khỏi HomePage - Bị từ chối'
        ELSE 'Trạng thái không xác định'
    END as Description
FROM Products 
GROUP BY Status
ORDER BY Status;

-- 5. Hiển thị tất cả sản phẩm với Status mới
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId,
    CreatedAt,
    UpdatedAt
FROM Products 
ORDER BY ProductId;
