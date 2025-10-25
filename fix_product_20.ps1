# PowerShell script để sửa trực tiếp sản phẩm ID 20 trong database
# Chạy script này trong PowerShell với quyền admin

Write-Host "🔧 Đang sửa sản phẩm ID 20 thành 'Sold'..." -ForegroundColor Yellow

# Thay đổi connection string theo database của bạn
$connectionString = "Server=localhost;Database=EVTB_Database;Trusted_Connection=true;TrustServerCertificate=true;"

try {
    # Import SQL Server module
    Import-Module SqlServer -ErrorAction SilentlyContinue
    
    # Kết nối đến database
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    
    Write-Host "✅ Đã kết nối đến database" -ForegroundColor Green
    
    # Kiểm tra trạng thái hiện tại
    $checkQuery = "SELECT ProductId, Title, Status FROM Products WHERE ProductId = 20"
    $checkCommand = New-Object System.Data.SqlClient.SqlCommand($checkQuery, $connection)
    $reader = $checkCommand.ExecuteReader()
    
    if ($reader.Read()) {
        $currentStatus = $reader["Status"]
        Write-Host "📊 Trạng thái hiện tại: $currentStatus" -ForegroundColor Cyan
    }
    $reader.Close()
    
    # Cập nhật sản phẩm thành "Sold"
    $updateQuery = "UPDATE Products SET Status = 'Sold' WHERE ProductId = 20"
    $updateCommand = New-Object System.Data.SqlClient.SqlCommand($updateQuery, $connection)
    $rowsAffected = $updateCommand.ExecuteNonQuery()
    
    if ($rowsAffected -gt 0) {
        Write-Host "✅ Đã cập nhật thành công $rowsAffected sản phẩm" -ForegroundColor Green
        
        # Kiểm tra kết quả
        $verifyQuery = "SELECT ProductId, Title, Status FROM Products WHERE ProductId = 20"
        $verifyCommand = New-Object System.Data.SqlClient.SqlCommand($verifyQuery, $connection)
        $verifyReader = $verifyCommand.ExecuteReader()
        
        if ($verifyReader.Read()) {
            Write-Host "🎉 Kết quả:" -ForegroundColor Green
            Write-Host "   Product ID: $($verifyReader['ProductId'])" -ForegroundColor White
            Write-Host "   Title: $($verifyReader['Title'])" -ForegroundColor White
            Write-Host "   Status: $($verifyReader['Status'])" -ForegroundColor White
        }
        $verifyReader.Close()
        
        Write-Host "`n🚀 HOÀN THÀNH! Sản phẩm ID 20 đã được đánh dấu là 'Sold'." -ForegroundColor Green
        Write-Host "   Sản phẩm sẽ không còn hiển thị trên HomePage." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Không có sản phẩm nào được cập nhật" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔧 HƯỚNG DẪN SỬA THỦ CÔNG:" -ForegroundColor Yellow
    Write-Host "1. Mở SQL Server Management Studio" -ForegroundColor White
    Write-Host "2. Kết nối đến database" -ForegroundColor White
    Write-Host "3. Chạy lệnh SQL:" -ForegroundColor White
    Write-Host "   UPDATE Products SET Status = 'Sold' WHERE ProductId = 20;" -ForegroundColor Cyan
} finally {
    if ($connection.State -eq 'Open') {
        $connection.Close()
        Write-Host "🔌 Đã đóng kết nối database" -ForegroundColor Gray
    }
}

Write-Host "`n📋 Nhấn Enter để thoát..." -ForegroundColor Gray
Read-Host
