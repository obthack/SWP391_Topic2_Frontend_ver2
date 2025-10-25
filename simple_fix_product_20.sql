-- Script SQL đơn giản để sửa sản phẩm ID 20 thành "Sold"
-- Chạy script này trong SQL Server Management Studio

-- 1. Kiểm tra trạng thái hiện tại
SELECT ProductId, Title, Status FROM Products WHERE ProductId = 20;

-- 2. Cập nhật sản phẩm thành "Sold" (chỉ cập nhật Status)
UPDATE Products 
SET Status = 'Sold'
WHERE ProductId = 20;

-- 3. Kiểm tra kết quả
SELECT ProductId, Title, Status FROM Products WHERE ProductId = 20;

-- 4. Kiểm tra tổng quan
SELECT Status, COUNT(*) as Count FROM Products GROUP BY Status;

