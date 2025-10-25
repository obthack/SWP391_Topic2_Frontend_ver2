-- Script SQL để test workflow hoàn chỉnh: Active → Pending → Sold
-- Chạy script này trong SQL Server Management Studio

-- 1. Kiểm tra trạng thái hiện tại của tất cả sản phẩm
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

-- 2. Đếm số lượng sản phẩm theo từng trạng thái
SELECT 
    Status,
    COUNT(*) as Count,
    CASE 
        WHEN Status = 'Active' THEN 'Hiển thị trên HomePage'
        WHEN Status = 'Pending' THEN 'Ẩn khỏi HomePage - Đang trong quá trình thanh toán'
        WHEN Status = 'Sold' THEN 'Ẩn khỏi HomePage - Đã bán thành công'
        WHEN Status = 'Rejected' THEN 'Ẩn khỏi HomePage - Bị từ chối'
        ELSE 'Trạng thái không xác định'
    END as Description
FROM Products 
GROUP BY Status
ORDER BY Status;

-- 3. Kiểm tra sản phẩm có Payment thành công nhưng chưa được đánh dấu Pending
SELECT 
    p.ProductId,
    p.Title,
    p.Status as ProductStatus,
    p.Price,
    COUNT(pay.PaymentId) as PaymentCount,
    SUM(CASE WHEN pay.Status = 'Success' THEN 1 ELSE 0 END) as SuccessfulPayments
FROM Products p
LEFT JOIN Payments pay ON p.ProductId = pay.ProductId
GROUP BY p.ProductId, p.Title, p.Status, p.Price
HAVING COUNT(pay.PaymentId) > 0 AND p.Status = 'Active'
ORDER BY p.ProductId;

-- 4. Test workflow: Tạo sản phẩm test từ Active → Pending
-- (Chỉ chạy nếu muốn test với sản phẩm cụ thể)
/*
UPDATE Products 
SET Status = 'Pending'
WHERE ProductId = 19; -- Thay đổi ProductId phù hợp
*/

-- 5. Test workflow: Tạo sản phẩm test từ Pending → Sold
-- (Chỉ chạy nếu muốn test với sản phẩm cụ thể)
/*
UPDATE Products 
SET Status = 'Sold'
WHERE ProductId = 19; -- Thay đổi ProductId phù hợp
*/

-- 6. Kiểm tra Orders liên quan đến sản phẩm Pending
SELECT 
    o.OrderId,
    o.ProductId,
    p.Title,
    p.Status as ProductStatus,
    o.DepositStatus,
    o.FinalPaymentStatus,
    o.Status as OrderStatus,
    o.CreatedDate
FROM Orders o
JOIN Products p ON o.ProductId = p.ProductId
WHERE p.Status = 'Pending'
ORDER BY o.OrderId;

-- 7. Kiểm tra Payments liên quan đến sản phẩm Pending
SELECT 
    pay.PaymentId,
    pay.ProductId,
    p.Title,
    p.Status as ProductStatus,
    pay.PaymentType,
    pay.Status as PaymentStatus,
    pay.Amount,
    pay.PayDate
FROM Payments pay
JOIN Products p ON pay.ProductId = p.ProductId
WHERE p.Status = 'Pending'
ORDER BY pay.PaymentId;

-- 8. Tạo báo cáo tổng hợp workflow
SELECT 
    'WORKFLOW SUMMARY' as ReportType,
    'Active Products' as Status,
    COUNT(*) as Count,
    'Hiển thị trên HomePage, có thể được đặt cọc' as Description
FROM Products 
WHERE Status = 'Active'

UNION ALL

SELECT 
    'WORKFLOW SUMMARY' as ReportType,
    'Pending Products' as Status,
    COUNT(*) as Count,
    'Ẩn khỏi HomePage, đang chờ seller xác nhận' as Description
FROM Products 
WHERE Status = 'Pending'

UNION ALL

SELECT 
    'WORKFLOW SUMMARY' as ReportType,
    'Sold Products' as Status,
    COUNT(*) as Count,
    'Ẩn khỏi HomePage, giao dịch hoàn tất' as Description
FROM Products 
WHERE Status = 'Sold'

UNION ALL

SELECT 
    'WORKFLOW SUMMARY' as ReportType,
    'Rejected Products' as Status,
    COUNT(*) as Count,
    'Ẩn khỏi HomePage, bị từ chối' as Description
FROM Products 
WHERE Status = 'Rejected'

ORDER BY Status;

