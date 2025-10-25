-- Script SQL để sửa Product ID 19 đã thanh toán thành công
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

-- 2. Cập nhật Product ID 19 thành "Pending" (vì đã có deposit payment thành công)
UPDATE Products 
SET Status = 'Pending'
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
    COUNT(*) as Count
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

