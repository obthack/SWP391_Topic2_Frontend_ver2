
-- Script SQL để cập nhật workflow Status cho Products
-- Chạy script này trong SQL Server Management Studio

-- 1. Kiểm tra cấu trúc hiện tại của bảng Products
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Products'
ORDER BY ORDINAL_POSITION;

-- 2. Kiểm tra các giá trị Status hiện tại
SELECT Status, COUNT(*) as Count
FROM Products 
GROUP BY Status
ORDER BY Status;

-- 3. Cập nhật workflow Status:
-- Active -> Pending (sau khi đặt cọc thành công) - Ẩn khỏi trang chủ
-- Pending -> Sold (sau khi seller xác nhận) - Hoàn tất giao dịch

-- 4. Cập nhật sản phẩm có payment thành công thành 'Pending' (thay vì 'Sold')
-- (Dựa trên dữ liệu từ hình ảnh Payments: PaymentId 31 cho ProductId 20, PaymentId 32 cho ProductId 19)
UPDATE Products 
SET Status = 'Pending'
WHERE ProductId IN (19, 20);

-- 5. Kiểm tra kết quả sau khi cập nhật
SELECT 
    ProductId,
    Title,
    Status,
    VerificationStatus,
    Price,
    SellerId,
    CreatedDate
FROM Products 
WHERE ProductId IN (19, 20);

-- 6. Kiểm tra tổng quan tất cả sản phẩm
SELECT 
    Status,
    COUNT(*) as Count
FROM Products 
GROUP BY Status
ORDER BY Status;

-- 7. Hiển thị tất cả sản phẩm với Status mới
SELECT 
    ProductId,
    Title,
    Status,
    VerificationStatus,
    Price,
    SellerId,
    CreatedDate
FROM Products 
ORDER BY ProductId;
