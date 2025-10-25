-- Script để kiểm tra và cập nhật trạng thái sản phẩm sau khi thanh toán thành công
-- Chạy script này để đảm bảo các sản phẩm đã thanh toán thành công được đánh dấu là "Sold"

-- 1. Kiểm tra các payments thành công có ProductId
SELECT 
    p.PaymentId,
    p.ProductId,
    p.PaymentType,
    p.PaymentStatus,
    p.Amount,
    p.CompletedDate,
    pr.Title as ProductTitle,
    pr.Status as ProductStatus
FROM Payments p
LEFT JOIN Products pr ON p.ProductId = pr.ProductId
WHERE p.PaymentStatus = 'Success' 
    AND p.PaymentType = 'Deposit'
    AND p.ProductId IS NOT NULL
ORDER BY p.CompletedDate DESC;

-- 2. Kiểm tra các sản phẩm có status "Sold"
SELECT 
    ProductId,
    Title,
    Status,
    SellerId,
    Price,
    UpdatedAt
FROM Products 
WHERE Status = 'Sold'
ORDER BY UpdatedAt DESC;

-- 3. Cập nhật các sản phẩm đã thanh toán thành công nhưng chưa được đánh dấu là "Sold"
UPDATE Products 
SET Status = 'Sold', 
    UpdatedAt = GETUTCDATE()
WHERE ProductId IN (
    SELECT DISTINCT p.ProductId
    FROM Payments p
    WHERE p.PaymentStatus = 'Success' 
        AND p.PaymentType = 'Deposit'
        AND p.ProductId IS NOT NULL
        AND p.ProductId IN (
            SELECT ProductId 
            FROM Products 
            WHERE Status != 'Sold'
        )
);

-- 4. Kiểm tra kết quả sau khi cập nhật
SELECT 
    'After Update' as Status,
    COUNT(*) as TotalProducts,
    SUM(CASE WHEN Status = 'Sold' THEN 1 ELSE 0 END) as SoldProducts,
    SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) as ApprovedProducts,
    SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as PendingProducts
FROM Products;

-- 5. Hiển thị các sản phẩm đã bán với thông tin chi tiết
SELECT 
    p.ProductId,
    p.Title,
    p.Status,
    p.Price,
    p.UpdatedAt,
    u.FullName as SellerName,
    pay.PaymentId,
    pay.Amount as PaymentAmount,
    pay.CompletedDate as PaymentDate
FROM Products p
LEFT JOIN Users u ON p.SellerId = u.UserId
LEFT JOIN Payments pay ON p.ProductId = pay.ProductId 
    AND pay.PaymentStatus = 'Success' 
    AND pay.PaymentType = 'Deposit'
WHERE p.Status = 'Sold'
ORDER BY p.UpdatedAt DESC;

