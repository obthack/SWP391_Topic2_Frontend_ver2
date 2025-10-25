-- Script SQL để sửa trực tiếp sản phẩm ID 20 thành "Sold"
-- Chạy script này trong SQL Server Management Studio

-- 1. Kiểm tra trạng thái hiện tại của sản phẩm ID 20
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId,
    CreatedAt,
    UpdatedAt
FROM Products 
WHERE ProductId = 20;

-- 2. Cập nhật sản phẩm ID 20 thành "Sold"
UPDATE Products 
SET Status = 'Sold', 
    UpdatedAt = GETUTCDATE()
WHERE ProductId = 20;

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
WHERE ProductId = 20;

-- 4. Kiểm tra tổng quan tất cả sản phẩm
SELECT 
    Status,
    COUNT(*) as Count
FROM Products 
GROUP BY Status
ORDER BY Status;

