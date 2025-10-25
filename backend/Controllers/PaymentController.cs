using EVTB_Backend.Data;
using EVTB_Backend.Models;
using EVTB_Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // /api/payment
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<PaymentController> _logger;
        private readonly IConfiguration _configuration;

        public PaymentController(EVTBContext context, ILogger<PaymentController> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }


        [HttpPost("seller-confirm")]
        [Authorize]
        public async Task<IActionResult> SellerConfirmSale()
        {
            try
            {
                // ✅ Authentication required: Chỉ user đã đăng nhập mới có thể gọi API
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized(new { message = "Không thể xác định người dùng" });

                // Parse ProductId from query string or form data
                int productId = 0;
                
                // Try to get ProductId from query string first
                if (Request.Query.ContainsKey("ProductId") && int.TryParse(Request.Query["ProductId"], out productId))
                {
                    // ProductId found in query string
                }
                // Try to get ProductId from form data
                else if (Request.HasFormContentType && Request.Form.ContainsKey("ProductId") && int.TryParse(Request.Form["ProductId"], out productId))
                {
                    // ProductId found in form data
                }
                // Try to get ProductId from request body
                else
                {
                    string requestBody;
                    using (var reader = new StreamReader(Request.Body))
                    {
                        requestBody = await reader.ReadToEndAsync();
                    }
                    
                    if (!string.IsNullOrEmpty(requestBody))
                    {
                        var requestData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody);
                        if (requestData != null && requestData.ContainsKey("ProductId") && int.TryParse(requestData["ProductId"].ToString(), out productId))
                        {
                            // ProductId found in request body
                        }
                    }
                }
                
                if (productId <= 0)
                    return BadRequest(new { message = "Invalid product ID" });

                // Get the product to verify ownership and status
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId);
                if (product == null)
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });

                // ✅ Authorization check: Chỉ owner của sản phẩm mới có thể xác nhận bán
                if (product.SellerId != userId)
                    return Forbid("Bạn chỉ có thể xác nhận bán sản phẩm của mình");

                // ✅ Status validation: Chỉ cho phép xác nhận bán sản phẩm có status "Reserved"
                if (product.Status != "Reserved")
                    return BadRequest(new { message = "Chỉ có thể xác nhận bán sản phẩm đang trong quá trình thanh toán" });

                // ✅ Logic nghiệp vụ: Cập nhật status từ "Reserved" → "Sold"
                product.Status = "Sold";
                product.UpdatedAt = DateTime.UtcNow;

                // Update the product
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Product {productId} sale confirmed by seller {userId}");

                // ✅ Error handling: Xử lý các trường hợp lỗi một cách chi tiết
                return Ok(new
                {
                    message = "Sale confirmed successfully",
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    oldStatus = "Reserved",
                    newStatus = product.Status,
                    updatedAt = product.UpdatedAt,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                // ✅ Error handling: Xử lý các trường hợp lỗi một cách chi tiết
                _logger.LogError(ex, "Error confirming sale");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xác nhận bán sản phẩm" });
            }
        }

        /// <summary>
        /// VNPay callback endpoint - Xử lý kết quả thanh toán từ VNPay
        /// </summary>
        [HttpGet("vnpay-return")]
        [AllowAnonymous] // VNPay callback không cần authentication
        public async Task<IActionResult> VNPayReturn(
            [FromQuery] string vnp_Amount,
            [FromQuery] string vnp_BankCode,
            [FromQuery] string vnp_BankTranNo,
            [FromQuery] string vnp_CardType,
            [FromQuery] string vnp_OrderInfo,
            [FromQuery] string vnp_PayDate,
            [FromQuery] string vnp_ResponseCode,
            [FromQuery] string vnp_TmnCode,
            [FromQuery] string vnp_TransactionNo,
            [FromQuery] string vnp_TransactionStatus,
            [FromQuery] string vnp_TxnRef,
            [FromQuery] string vnp_SecureHash
        )
        {
            try
            {
                _logger.LogInformation($"VNPay callback received for payment {vnp_TxnRef}");
                
                // Parse payment ID from vnp_TxnRef
                if (!int.TryParse(vnp_TxnRef, out int paymentId))
                {
                    _logger.LogError($"Invalid payment ID: {vnp_TxnRef}");
                    return BadRequest(new { message = "Invalid payment ID" });
                }

                // Get payment from database
                var payment = await _context.Payments.FirstOrDefaultAsync(p => p.PaymentId == paymentId);
                
                if (payment == null)
                {
                    _logger.LogError($"Payment {paymentId} not found");
                    return NotFound(new { message = "Payment not found" });
                }

                // Check if payment is successful (response code 00)
                bool isSuccess = vnp_ResponseCode == "00";
                
                if (isSuccess)
                {
                    // Update payment status if not already succeeded
                    if (payment.PaymentStatus != "Succeeded")
                    {
                        payment.PaymentStatus = "Succeeded";
                        payment.VNPayTransactionId = vnp_TransactionNo;
                        payment.UpdatedAt = DateTime.UtcNow;
                        
                        // If this is a deposit payment, update product status to Reserved
                        if (payment.PaymentType == "Deposit" && payment.ProductId.HasValue)
                        {
                            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == payment.ProductId.Value);
                            if (product != null && product.Status != "Reserved" && product.Status != "Sold")
                            {
                                product.Status = "Reserved";
                                product.UpdatedAt = DateTime.UtcNow;
                                _logger.LogInformation($"Product {product.ProductId} status updated to Reserved");
                            }
                        }
                        
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Payment {paymentId} marked as Succeeded");
                    }
                }
                else
                {
                    payment.PaymentStatus = "Failed";
                    payment.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    _logger.LogWarning($"Payment {paymentId} failed with response code: {vnp_ResponseCode}");
                }

                // ✅ Redirect to frontend PaymentSuccess page
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var redirectUrl = $"{frontendUrl}/payment/success?" +
                    $"vnp_ResponseCode={vnp_ResponseCode}" +
                    $"&vnp_TxnRef={vnp_TxnRef}" +
                    $"&vnp_Amount={vnp_Amount}" +
                    $"&vnp_TransactionNo={vnp_TransactionNo}" +
                    $"&vnp_ResponseMessage={Uri.EscapeDataString(isSuccess ? "Success" : "Failed")}";

                _logger.LogInformation($"Redirecting to: {redirectUrl}");
                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing VNPay callback");
                // Still redirect to frontend with error
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var errorUrl = $"{frontendUrl}/?payment_error=true&payment_id={vnp_TxnRef}";
                return Redirect(errorUrl);
            }
        }

        [HttpPost("admin-confirm")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> AdminConfirmSale([FromBody] AdminAcceptRequest request)
        {
            try
            {
                // ✅ Authentication required: Chỉ admin đã đăng nhập mới có thể gọi API
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int adminId))
                    return Unauthorized(new { message = "Invalid user authentication" });

                // ✅ Authorization check: Chỉ admin mới có thể xác nhận
                var userRole = User.FindFirst("roleId")?.Value ?? "";
                if (userRole != "1") // Assuming "1" is admin role
                    return StatusCode(403, new { message = "Only administrators can accept sales" });

                // Validate request
                if (request == null)
                    return BadRequest(new { message = "Request data is required" });

                if (request.ProductId <= 0)
                    return BadRequest(new { message = "Invalid product ID" });

                // Get the product to verify status
                var product = await _context.Products
                    .Include(p => p.Seller)
                    .FirstOrDefaultAsync(p => p.ProductId == request.ProductId);
                
                if (product == null)
                    return NotFound(new { message = "Product not found" });

                // ✅ Status validation: Chỉ cho phép admin xác nhận sản phẩm có status "Reserved"
                if (product.Status?.ToLower() != "reserved")
                    return BadRequest(new { message = $"Product must be in 'Reserved' status for admin acceptance. Current status: {product.Status}" });

                // ✅ Logic nghiệp vụ: Admin xác nhận và chuyển status từ "Reserved" → "Sold"
                product.Status = "Sold";
                product.UpdatedAt = DateTime.UtcNow;

                // Find and update related order
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.ProductId == request.ProductId && o.OrderStatus == "Deposited");

                if (order != null)
                {
                    order.OrderStatus = "Completed";
                    order.CompletedDate = DateTime.UtcNow;
                    order.UpdatedAt = DateTime.UtcNow;
                }

                // Save changes
                await _context.SaveChangesAsync();

                // ✅ Transaction logging for audit trail
                _logger.LogInformation($"Admin {adminId} accepted sale for product {request.ProductId}. Status changed from Reserved to Sold. Order {order?.OrderId} completed.");

                // ✅ Error handling: Xử lý các trường hợp lỗi một cách chi tiết
                return Ok(new
                {
                    message = "Admin accepted sale successfully",
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    sellerName = product.Seller?.FullName ?? "Unknown",
                    adminId = adminId,
                    oldStatus = "Reserved",
                    newStatus = product.Status,
                    orderId = order?.OrderId,
                    orderStatus = order?.OrderStatus,
                    completedDate = order?.CompletedDate,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                // ✅ Error handling: Xử lý các trường hợp lỗi một cách chi tiết
                _logger.LogError(ex, $"Error in AdminAcceptSale for product {request?.ProductId}");
                return StatusCode(500, new { message = "Internal server error occurred while processing admin acceptance" });
            }
        }
    }
}