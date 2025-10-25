-- Script SQL đã sửa để sửa trực tiếp sản phẩm ID 20 thành "Sold"
-- Chạy script này trong SQL Server Management Studio

-- 1. Kiểm tra cấu trúc bảng Products
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Products'
ORDER BY ORDINAL_POSITION;

-- 2. Kiểm tra trạng thái hiện tại của sản phẩm ID 20
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId,
    CreatedAt
FROM Products 
WHERE ProductId = 20;

-- 3. Cập nhật sản phẩm ID 20 thành "Sold" (chỉ cập nhật Status)
UPDATE Products 
SET Status = 'Sold'
WHERE ProductId = 20;

-- 4. Kiểm tra kết quả sau khi cập nhật
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId,
    CreatedAt
FROM Products 
WHERE ProductId = 20;

-- 5. Kiểm tra tổng quan tất cả sản phẩm
SELECT 
    Status,
    COUNT(*) as Count
FROM Products 
GROUP BY Status
ORDER BY Status;

