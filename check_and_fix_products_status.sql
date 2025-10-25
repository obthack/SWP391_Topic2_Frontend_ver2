
-- Script SQL để kiểm tra và sửa lỗi cột Status trong bảng Products
-- Chạy script này trong SQL Server Management Studio

-- 1. Kiểm tra cấu trúc bảng Products
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Products'
ORDER BY ORDINAL_POSITION;

-- 2. Kiểm tra tất cả sản phẩm với cột Status
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId,
    CreatedAt
FROM Products 
ORDER BY ProductId;

-- 3. Kiểm tra các sản phẩm có Status = 'Sold'
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId
FROM Products 
WHERE Status = 'Sold'
ORDER BY ProductId;

-- 4. Kiểm tra các sản phẩm có Status = 'Active' hoặc NULL
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId
FROM Products 
WHERE Status = 'Active' OR Status IS NULL
ORDER BY ProductId;

-- 5. Nếu cột Status không tồn tại, thêm cột Status
-- (Chỉ chạy nếu cột Status không tồn tại)
/*
ALTER TABLE Products 
ADD Status NVARCHAR(50) DEFAULT 'Active';
*/

-- 6. Cập nhật các sản phẩm có payment thành công thành 'Sold'
-- (Dựa trên dữ liệu từ hình ảnh Payments)
UPDATE Products 
SET Status = 'Sold'
WHERE ProductId IN (19, 20);

-- 7. Kiểm tra kết quả sau khi cập nhật
SELECT 
    ProductId,
    Title,
    Status,
    Price,
    SellerId
FROM Products 
WHERE ProductId IN (19, 20);

-- 8. Kiểm tra tổng quan tất cả sản phẩm
SELECT 
    Status,
    COUNT(*) as Count
FROM Products 
GROUP BY Status
ORDER BY Status;

