import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Zap, Shield, TrendingUp, CheckCircle } from "lucide-react";
import { apiRequest } from "../lib/api";
import { ProductCard } from "../components/molecules/ProductCard";
import { searchProductsByLicensePlate, searchProducts } from "../lib/productApi";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { toggleFavorite, isProductFavorited } from "../lib/favoriteApi";
import { handleVerificationPaymentSuccess } from "../lib/verificationNotificationService";
import "../styles/homepage.css";

export const HomePage = () => {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [productType, setProductType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all"); // all, vehicle, battery
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for search
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4); // 4 products per page

  // Cache for seller names to prevent them from disappearing
  // Load from localStorage on mount
  const [sellerCache, setSellerCache] = useState(() => {
    try {
      const cached = localStorage.getItem('sellerNameCache');
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.warn('Failed to load seller cache from localStorage:', error);
      return {};
    }
  });

  // Extract stable user ID to prevent unnecessary reloads
  const userId = user?.id || user?.userId || user?.accountId;

  // Persist seller cache to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('sellerNameCache', JSON.stringify(sellerCache));
    } catch (error) {
      console.warn('Failed to save seller cache to localStorage:', error);
    }
  }, [sellerCache]);

  useEffect(() => {
    loadFeaturedProducts();
    if (userId) {
      loadFavorites();
    }
    
    // Check for payment success parameters
    checkPaymentSuccess();
  }, [userId]); // Only reload when userId changes, not when user object reference changes

  const checkPaymentSuccess = async () => {
    const urlParams = new URLSearchParams(location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const paymentError = urlParams.get('payment_error');
    const paymentId = urlParams.get('payment_id');
    const amount = urlParams.get('amount');
    const transactionNo = urlParams.get('transaction_no');
    const paymentType = urlParams.get('payment_type'); // ✅ Get payment type from URL

    if (paymentSuccess === 'true' && paymentId) {
      const formattedAmount = amount ? (parseInt(amount) / 100).toLocaleString('vi-VN') : 'N/A';
      
      // ✅ Determine payment type (from URL or API)
      let finalPaymentType = paymentType || 'Deposit';
      
      // Check if this is a verification payment and notify admin
      try {
        const payment = await apiRequest(`/api/Payment/${paymentId}`);
        console.log('🔍 Payment details:', payment);
        
        if (payment) {
          finalPaymentType = payment.PaymentType || payment.paymentType || finalPaymentType;
          
          if (finalPaymentType === 'Verification' && payment.ProductId) {
            console.log('🔔 This is a verification payment, notifying admin...');
            
            // Notify admin about successful verification payment
            const notificationSent = await handleVerificationPaymentSuccess(
              paymentId,
              payment.ProductId,
              payment.UserId, // Seller ID
              payment.Amount
            );
            
            if (notificationSent) {
              console.log('✅ Admin notification sent for verification payment');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking payment type or notifying admin:', error);
        // Don't show error to user, just log it
      }
      
      // ✅ Show specific notification based on payment type
      if (finalPaymentType === 'Verification') {
        showToast({
          type: 'success',
          title: '✅ Thanh toán kiểm định thành công!',
          message: `Yêu cầu kiểm định đã được thanh toán (${formattedAmount} VND). Admin sẽ xác nhận trong thời gian sớm nhất.`,
          duration: 10000
        });
      } else {
        showToast({
          type: 'success',
          title: '🎉 Thanh toán đặt cọc thành công!',
          message: `Bạn đã đặt cọc thành công (${formattedAmount} VND). Vui lòng liên hệ người bán để hoàn tất giao dịch.`,
          duration: 10000
        });
      }

      // Clear URL parameters after showing notification
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (paymentError === 'true' && paymentId) {
      showToast({
        type: 'error',
        title: '❌ Lỗi thanh toán',
        message: `Có lỗi xảy ra khi xử lý giao dịch ${paymentId}. Vui lòng liên hệ hỗ trợ.`,
        duration: 8000
      });

      // Clear URL parameters after showing notification
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      console.log("🔄 Loading featured products for homepage...");
      let approvedProducts = [];

      // Use the main Product API endpoint
      const data = await apiRequest("/api/Product");
      const allProducts = Array.isArray(data) ? data : data?.items || [];

      console.log("📦 Total products from API:", allProducts.length);
      console.log("📦 Sample product:", allProducts[0]);
      console.log("📦 All products status check:", allProducts.map(p => ({
        id: p.productId || p.id || p.ProductId,
        status: p.status || p.Status,
        title: p.title || p.Title
      })));
      
      // Debug: Check specific products that should be approved
      const approvedProductsDebug = allProducts.filter(p => {
        const status = String(p.status || p.Status || "").toLowerCase();
        return status === "approved" || status === "active" || status === "verified";
      });
      console.log("✅ Products that should be approved:", approvedProductsDebug.length);
      console.log("✅ Approved products details:", approvedProductsDebug.map(p => ({
        id: p.productId || p.id || p.ProductId,
        status: p.status || p.Status,
        title: p.title || p.Title
      })));
      
      console.log("🔍 Starting product filtering...");

      // Filter approved products and classify by type
      approvedProducts = allProducts
        .filter((x) => {
          const status = String(x.status || x.Status || "").toLowerCase().trim();
          const isApproved = status === "approved" || status === "active" || status === "verified";
          const isNotSold = status !== "sold";
          const isNotRejected = status !== "rejected";
          const isNotReserved = status !== "reserved"; // Filter out reserved products
          const shouldShow = isApproved && isNotSold && isNotRejected && isNotReserved;
          console.log(
            `Product ${x.productId || x.id || x.ProductId}: status="${status}", isApproved=${isApproved}, isNotSold=${isNotSold}, isNotRejected=${isNotRejected}, isNotReserved=${isNotReserved}, shouldShow=${shouldShow}`
          );
          return shouldShow;
        })
        .map((x) => {
          // Determine product type based on available fields
          let productType = "vehicle"; // default

          if (x.productType) {
            productType = x.productType.toLowerCase();
          } else if (x.licensePlate || x.license_plate || x.mileage || x.year) {
            productType = "vehicle";
          } else if (x.capacity || x.voltage || x.cycleCount || x.cycle_count) {
            productType = "battery";
          }

          console.log(`Product ${x.id}: classified as ${productType}`);
          return { ...x, productType };
        })
        // .slice(0, 8); // Tạm thời bỏ giới hạn để test

      console.log("✅ Filtered approved products:", approvedProducts.length);
      console.log("🎯 Final approved products details:", approvedProducts.map(p => ({
        id: p.id || p.productId || p.Id,
        title: p.title || p.Title,
        status: p.status || p.Status,
        productType: p.productType
      })));

      // ✅ OPTIMIZED: Load images and seller info without delays
      const productsWithImages = await Promise.all(
        approvedProducts.map(async (product, index) => {
          // ✅ DECLARE sellerName OUTSIDE try block so it's accessible in catch block
          let sellerName = null;
          
          try {
            // ✅ NO MORE DELAYS - Process all products in parallel
            
            // ✅ Get seller info - try COMPREHENSIVE approaches
            sellerName = product.sellerName || 
                           product.seller?.fullName || 
                           product.seller?.name ||
                           product.seller?.userName ||
                           product.sellerFullName ||
                           product.seller_name ||
                           product.ownerName ||
                           product.userName;
            
            // Debug: Log product data to see what fields are available
            if (index < 5) { // Only log first 5 products to avoid spam
              console.log(`🔍 Product ${product.id || product.productId} data:`, {
                sellerName: product.sellerName,
                seller: product.seller,
                sellerId: product.sellerId,
                seller_id: product.seller_id,
                SellerId: product.SellerId,
                userId: product.userId,
                user_id: product.user_id,
                UserId: product.UserId,
                createdBy: product.createdBy,
                created_by: product.created_by,
                CreatedBy: product.CreatedBy,
                allKeys: Object.keys(product)
              });
            }
            
            // If no seller name but has sellerId, try to load from API or cache
            // Try MANY possible field names for seller ID
            const possibleSellerIdFields = [
              'sellerId', 'seller_id', 'SellerId', 'SellerID', 
              'userId', 'user_id', 'UserId', 'UserID',
              'createdBy', 'created_by', 'CreatedBy', 'CreatedByUserId',
              'ownerId', 'owner_id', 'OwnerId'
            ];
            
            let sellerId = null;
            for (const field of possibleSellerIdFields) {
              if (product[field]) {
                sellerId = product[field];
                console.log(`✅ Found sellerId in field "${field}": ${sellerId}`);
                break;
              }
            }
            
            if (!sellerName && sellerId) {
              // ✅ CHECK CACHE FIRST before making API call
              if (sellerCache[sellerId]) {
                sellerName = sellerCache[sellerId];
                console.log(`📦 Loaded seller from cache for product ${product.id}:`, sellerName);
              } else {
                // Only call API if not in cache
                try {
                  const sellerPromise = apiRequest(`/api/User/${sellerId}`);
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 8000) // Increased timeout to 8 seconds
                  );
                  const sellerData = await Promise.race([sellerPromise, timeoutPromise]);
                  sellerName = sellerData?.fullName || 
                             sellerData?.full_name || 
                             sellerData?.name || 
                             sellerData?.userName || 
                             sellerData?.user_name ||
                             sellerData?.UserName;
                  
                  // ✅ SAVE TO CACHE for future use
                  if (sellerName) {
                    setSellerCache(prev => ({
                      ...prev,
                      [sellerId]: sellerName
                    }));
                    console.log(`✅ Loaded seller from API and cached for product ${product.id}:`, sellerName);
                  }
                } catch (sellerError) {
                  console.warn(`❌ Could not load seller from API for product ${product.id} (sellerId: ${sellerId}):`, sellerError.message);
                }
              }
            }
            
            // Final fallback
            if (!sellerName) {
              sellerName = "Người bán";
              console.warn(`⚠️ No seller name found for product ${product.id}, using fallback. Product data:`, product);
            }

            // ✅ Try to load images from API (with timeout to prevent hanging)
            let imagesData = null;
            try {
              const imagePromise = apiRequest(
                `/api/ProductImage/product/${product.id || product.productId || product.Id}`
              );
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              );
              imagesData = await Promise.race([imagePromise, timeoutPromise]);
            } catch (imageError) {
              console.warn(`Could not load images for product ${product.id}:`, imageError.message);
              imagesData = null;
            }
            
            // ✅ Reduced logging for better performance
            
            // Handle different response formats
            let images = [];
            if (imagesData) {
              if (Array.isArray(imagesData)) {
                images = imagesData;
              } else if (imagesData?.items && Array.isArray(imagesData.items)) {
                images = imagesData.items;
              } else if (typeof imagesData === 'object') {
                images = [imagesData];
              }
            }

            // Map images - only use real product images
            const mappedImages = images.map(
              (img) => img.imageData || img.imageUrl || img.url
            ).filter(Boolean);

            // If no images found from ProductImage API, try to get from product fields
            let finalImages = mappedImages;
            if (finalImages.length === 0) {
              // Try to get images from product fields
              const possibleImageFields = [
                'imageData', 'imageUrls', 'imageUrl', 'images', 'photos', 'pictures',
                'ImageData', 'ImageUrls', 'ImageUrl', 'Images', 'Photos', 'Pictures'
              ];
              
              for (const field of possibleImageFields) {
                if (product[field]) {
                  if (Array.isArray(product[field])) {
                    finalImages = product[field].filter(Boolean);
                  } else if (typeof product[field] === 'string' && product[field].trim()) {
                    finalImages = [product[field]];
                  }
                  if (finalImages.length > 0) break;
                }
              }
            }

            return {
              ...product,
              images: finalImages, // Only real images, no placeholder
              sellerName: sellerName, // Add seller name
            };
          } catch (error) {
            console.warn(
              `Failed to load images for product ${
                product.id || product.productId
              }:`,
              error
            );
            console.warn(`Error details:`, {
              message: error.message,
              status: error.status,
              data: error.data,
              productId: product.id || product.productId || product.Id
            });
            // Return product with no images if API fails
            // ✅ Still need to include sellerName even if image loading fails
            // Use the computed sellerName from above, with fallback
            return {
              ...product,
              images: [], // No placeholder, only real images
              sellerName: sellerName || "Người bán", // Include seller name in error case too
            };
          }
        })
      );

      // Sort products by approval date (newest approved first)
      const sortedProducts = productsWithImages.sort((a, b) => {
        // Get approval date or created date
        const aDate = new Date(
          a.approvedDate || a.createdDate || a.created_date || 0
        );
        const bDate = new Date(
          b.approvedDate || b.createdDate || b.created_date || 0
        );

        // Sort by date descending (newest first)
        return bDate - aDate;
      });

      console.log("Loaded approved products for homepage:", sortedProducts);
      setFeaturedProducts(sortedProducts);
      setAllProducts(sortedProducts); // Store all products for search
    } catch (err) {
      console.error("❌ Error loading featured products:", err);
      console.error("❌ Error details:", {
        message: err.message,
        status: err.status,
        data: err.data,
        stack: err.stack,
      });

      setFeaturedProducts([]);
      setFeaturedError(err.message || String(err));

      try {
        // Expose a helpful debug object for the developer console (non-sensitive)
        window.__EVTB_LAST_ERROR = window.__EVTB_LAST_ERROR || {};
        window.__EVTB_LAST_ERROR.loadFeaturedProducts = {
          message: err.message || String(err),
          status: err.status,
          data: err.data,
          stack: err.stack || null,
          timestamp: new Date().toISOString(),
        };
      } catch (debugErr) {
        console.warn("Could not set debug error object:", debugErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const userId = user.id || user.userId || user.accountId;
      const favoritesData = await apiRequest(`/api/Favorite/user/${userId}`);
      const favoriteIds = Array.isArray(favoritesData)
        ? favoritesData.map((fav) => fav.productId)
        : [];
      setFavorites(new Set(favoriteIds));
    } catch (error) {
      console.warn("Could not load favorites:", error);
    }
  };

  const handleToggleFavorite = async (productId) => {
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để thêm vào yêu thích",
        type: "warning",
      });
      return;
    }

    // Debug user ID
    const userId = user.id || user.userId || user.accountId;
    console.log("🔍 FAVORITE DEBUG:");
    console.log("  User object:", user);
    console.log("  Extracted userId:", userId);
    console.log("  Product ID:", productId);

    try {
      const result = await toggleFavorite(userId, productId);

      // Only update UI if we got a valid result
      if (result && typeof result.isFavorited === "boolean") {
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          if (result.isFavorited) {
            newFavorites.add(productId);
          } else {
            newFavorites.delete(productId);
          }
          return newFavorites;
        });

        showToast({
          title: result.isFavorited
            ? "❤️ Đã thêm vào yêu thích"
            : "💔 Đã xóa khỏi yêu thích",
          description: result.isFavorited
            ? "Sản phẩm đã được thêm vào danh sách yêu thích"
            : "Sản phẩm đã được xóa khỏi danh sách yêu thích",
          type: "success",
        });
      } else {
        // If API is not available, show warning but don't crash
        showToast({
          title: "⚠️ Tính năng yêu thích tạm thời không khả dụng",
          description:
            "Backend chưa hỗ trợ tính năng yêu thích. Vui lòng thử lại sau.",
          type: "warning",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast({
        title: "⚠️ Tính năng yêu thích tạm thời không khả dụng",
        description:
          "Backend chưa hỗ trợ tính năng yêu thích. Vui lòng thử lại sau.",
        type: "warning",
      });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      showToast({
        type: "warning",
        title: "⚠️ Vui lòng nhập từ khóa tìm kiếm",
        message: "Bạn cần nhập hãng xe, mẫu xe hoặc biển số để tìm kiếm",
        duration: 3000
      });
      return;
    }
    
    try {
        console.log("🔍 Searching with query:", { searchQuery, productType });
      
      let results = [];
      let searchType = "";
      
      if (productType === "license-plate") {
        // Tìm kiếm chỉ theo biển số
        try {
          results = await searchProductsByLicensePlate(searchQuery.trim());
          searchType = "biển số";
        } catch (error) {
          console.log("🔍 License plate API failed, searching in local data...");
          // Fallback to local search if API fails
          results = searchProducts(searchQuery.trim(), allProducts);
          searchType = "biển số (tìm kiếm cục bộ)";
        }
      } else {
        // Tìm kiếm tổng quát theo hãng xe, mẫu xe hoặc biển số trong dữ liệu cục bộ
        results = searchProducts(searchQuery.trim(), allProducts);
        searchType = "hãng xe, mẫu xe hoặc biển số";
      }
      
      // Lọc theo loại sản phẩm nếu được chọn
      if (productType && productType !== "license-plate" && productType !== "") {
        results = results.filter(product => {
          const productTypeLower = (product.productType || product.ProductType || "").toLowerCase();
          return productTypeLower === productType;
        });
      }
      
      
      console.log("🔍 Final results before display:", results);
      console.log("🔍 Results length:", results.length);
      console.log("🔍 Results array:", results);
      
        if (results && results.length > 0) {
          // Hiển thị kết quả tìm kiếm
          console.log("✅ Setting featured products to:", results);
          setFeaturedProducts(results);
          setIsSearchMode(true);
          setCurrentPage(1); // Reset to first page when searching
        
        const searchDescription = productType === "license-plate" 
          ? `biển số "${searchQuery}"`
          : `${searchType} "${searchQuery}"`;
          
        console.log("✅ Showing success toast for", results.length, "products");
        showToast({
          type: "success",
          title: "✅ Tìm thấy kết quả",
          message: `Tìm thấy ${results.length} xe với ${searchDescription}`,
          duration: 4000
        });
      } else {
        console.log("❌ No results found, clearing featured products");
        setFeaturedProducts([]);
        setIsSearchMode(true);
        
        const searchDescription = productType === "license-plate" 
          ? `biển số "${searchQuery}"`
          : `${searchType} "${searchQuery}"`;
          
        console.log("❌ Showing no results toast");
        showToast({
          type: "info",
          title: "🔍 Không tìm thấy kết quả",
          message: `Không có xe nào với ${searchDescription}`,
          duration: 4000
        });
      }
    } catch (error) {
      console.error("❌ Search error:", error);
      showToast({
        type: "error",
        title: "❌ Lỗi tìm kiếm",
        message: error.message || "Có lỗi xảy ra khi tìm kiếm",
        duration: 5000
      });
    }
  };

  const showAllProductsAgain = async () => {
    setIsSearchMode(false);
    setProductType("");
    setSearchQuery("");
    setCurrentPage(1); // Reset to first page
    // Use stored allProducts instead of reloading
    setFeaturedProducts(allProducts);
    showToast({
      type: "success",
      title: "🔄 Đã tải lại",
      message: "Hiển thị tất cả sản phẩm",
      duration: 3000
    });
  };

  return (
    <div className="min-h-screen">
      <section className="text-white py-20 relative overflow-hidden hero-bg">
        {/* Electric charging effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Charging energy effects */}
          <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-blue-400 bg-opacity-30 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-cyan-400 bg-opacity-25 rounded-full animate-bounce energy-effect-1"></div>
          <div className="absolute bottom-1/3 left-1/3 w-14 h-14 bg-blue-300 bg-opacity-20 rounded-full animate-pulse energy-effect-2"></div>
          <div className="absolute bottom-1/4 right-1/4 w-10 h-10 bg-white bg-opacity-30 rounded-full animate-bounce energy-effect-3"></div>

          {/* Electric spark effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/5 w-2 h-8 bg-yellow-400 rounded-full animate-pulse opacity-80"></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-6 bg-yellow-300 rounded-full animate-pulse opacity-70 spark-effect-1"></div>
            <div className="absolute top-1/2 left-1/6 w-2 h-10 bg-yellow-400 rounded-full animate-pulse opacity-60 spark-effect-2"></div>
            <div className="absolute bottom-1/3 right-1/5 w-2 h-7 bg-yellow-300 rounded-full animate-pulse opacity-75 spark-effect-3"></div>
          </div>

          {/* Charging cable glow effect */}
          <div className="absolute top-1/2 right-1/4 w-1 h-32 bg-blue-400 bg-opacity-40 rounded-full animate-pulse transform rotate-12"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            {/* Electric car charging icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="hero-icon-container">
                  <svg
                    className="hero-icon"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {/* Electric car body */}
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                    {/* Charging port */}
                    <rect
                      x="16"
                      y="8"
                      width="3"
                      height="4"
                      rx="1"
                      fill="#3b82f6"
                    />
                  </svg>
                </div>
                {/* Charging cable effect */}
                <div className="charging-cable-effect">
                  <svg
                    className="charging-cable-icon"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                {/* Energy sparks */}
                <div className="energy-spark-1"></div>
                <div className="energy-spark-2"></div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent leading-relaxed">
              Nền tảng giao dịch xe điện & pin số 1 Việt Nam
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Mua bán xe điện an toàn, minh bạch với giá tốt nhất thị trường
            </p>
          </div>

          <div className="search-form-container">
            <form onSubmit={handleSearch} className="search-form">
              <div className="md:col-span-1">
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="search-input"
                >
                  <option value="">Tất cả</option>
                  <option value="vehicle">Xe điện</option>
                  <option value="battery">Pin</option>
                  <option value="license-plate">Biển số</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    productType === "license-plate" 
                      ? "Nhập biển số xe (VD: 30A-12345)" 
                      : "Hãng xe, mẫu xe, biển số..."
                  }
                  className="search-input"
                />
              </div>

              <div className="md:col-span-1">
                <button type="submit" className="search-button">
                  <Search className="h-5 w-5 mr-2" />
                  Tìm kiếm
                </button>
              </div>
            </form>
          </div>

          <div className="mt-12 features-grid">
            <div className="feature-item">
              <Zap className="feature-icon" />
              <h3 className="feature-title">1000+ xe đã giao dịch</h3>
              <p className="feature-description">
                Hàng nghìn giao dịch thành công
              </p>
            </div>
            <div className="feature-item">
              <Shield className="feature-icon" />
              <h3 className="feature-title">Kiểm định chính hãng</h3>
              <p className="feature-description">
                Đảm bảo chất lượng từng sản phẩm
              </p>
            </div>
            <div className="feature-item">
              <TrendingUp className="feature-icon" />
              <h3 className="feature-title">Giá minh bạch, cộng khai</h3>
              <p className="feature-description">
                Hỗ trợ AI gợi ý giá tốt nhất
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {isSearchMode ? "Kết quả tìm kiếm" : "Sản phẩm nổi bật"}
              </h2>
              <p className="text-gray-600 mt-2">
                {isSearchMode 
                  ? `Kết quả tìm kiếm theo ${productType === "license-plate" ? "biển số" : "từ khóa"}`
                  : "Những sản phẩm được kiểm duyệt và giá cạnh tranh nhất"
                }
              </p>
            </div>
            <div className="flex space-x-4">
              {isSearchMode ? (
                <button
                  onClick={showAllProductsAgain}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  🔄 Xem tất cả sản phẩm
                </button>
              ) : (
                <>
                  <Link
                    to="/vehicles"
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    🚗 Xe điện
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                  <Link
                    to="/batteries"
                    className="text-green-600 hover:text-green-700 font-medium flex items-center"
                  >
                    🔋 Pin
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="products-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              {console.log("🎯 Rendering products section - featuredProducts:", featuredProducts.length)}
              {console.log("🎯 Is search mode:", isSearchMode)}
              {console.log("🎯 Selected category:", selectedCategory)}
              {/* Phân loại sản phẩm */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-4 mb-6">
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Tất cả ({featuredProducts.length})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("vehicle");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCategory === "vehicle"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🚗 Xe điện (
                    {
                      featuredProducts.filter(
                        (p) => p.productType?.toLowerCase() === "vehicle"
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("battery");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCategory === "battery"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🔋 Pin (
                    {
                      featuredProducts.filter(
                        (p) => p.productType?.toLowerCase() === "battery"
                      ).length
                    }
                    )
                  </button>
                </div>
              </div>

              <div className="products-grid">
                {(() => {
                  // First filter products by category and type
                  const filteredProducts = featuredProducts.filter((product) => {
                    const matchesCategory =
                      selectedCategory === "all" ||
                      product.productType?.toLowerCase() === selectedCategory;
                    const matchesType =
                      !productType || product.productType === productType;
                    return matchesCategory && matchesType;
                  });
                  
                  // Calculate pagination
                  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
                  
                  console.log("🎯 Filtered products for display:", filteredProducts.length);
                  console.log("🎯 Current page:", currentPage);
                  console.log("🎯 Total pages:", totalPages);
                  console.log("🎯 Paginated products:", paginatedProducts.length);
                  console.log("🎯 Show all products:", showAllProducts);
                  console.log("🎯 Product type filter:", productType);
                  console.log("🎯 Sample filtered product:", paginatedProducts[0]);
                  
                  return paginatedProducts.map((product, index) => (
                    <ProductCard
                      key={
                        product.id ||
                        product.productId ||
                        product.Id ||
                        `product-${index}`
                      }
                      product={product}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.has(product.id || product.productId)}
                      user={user}
                    />
                  ));
                })()}
              </div>

              {/* Pagination */}
              {(() => {
                const filteredProducts = featuredProducts.filter((product) => {
                  const matchesCategory =
                    selectedCategory === "all" ||
                    product.productType?.toLowerCase() === selectedCategory;
                  const matchesType =
                    !productType || product.productType === productType;
                  return matchesCategory && matchesType;
                });
                
                const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
                
                if (totalPages <= 1) return null;
                
                return (
                  <div className="text-center mt-8">
                    <div className="flex justify-center items-center space-x-2">
                      {/* Previous button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        ← Trước
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      {/* Next button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Sau →
                      </button>
                    </div>
                    
                    {/* Page info */}
                    <div className="mt-4 text-sm text-gray-600">
                      Trang {currentPage} / {totalPages} - Hiển thị {Math.min(itemsPerPage, filteredProducts.length - (currentPage - 1) * itemsPerPage)} trong {filteredProducts.length} sản phẩm
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {featuredError ? "Lỗi tải sản phẩm" : "Không có sản phẩm nào"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {featuredError
                    ? "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau."
                    : "Hiện tại chưa có sản phẩm nào được phê duyệt."}
                </p>
                {featuredError && (
                  <button
                    onClick={loadFeaturedProducts}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thử lại
                  </button>
                )}
                {!featuredError && (
                  <Link
                    to="/create-listing"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Đăng tin đầu tiên
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Xe đã kiểm định Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-green-600" />
                Xe đã kiểm định
              </h2>
              <p className="text-gray-600 mt-2">
                Những chiếc xe đã được admin kiểm tra và chứng nhận chất lượng
              </p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {featuredProducts.filter(
                  (p) => p.productType?.toLowerCase() === "vehicle" && p.verificationStatus === "Verified"
                ).length} xe đã kiểm định
              </span>
            </div>
          </div>

          {loading ? (
            <div className="products-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : featuredProducts.filter(
            (p) => p.productType?.toLowerCase() === "vehicle" && p.verificationStatus === "Verified"
          ).length > 0 ? (
            <div className="products-grid">
              {featuredProducts
                .filter(
                  (p) => p.productType?.toLowerCase() === "vehicle" && p.verificationStatus === "Verified"
                )
                .slice(0, 8)
                .map((product, index) => (
                  <ProductCard
                    key={
                      product.id ||
                      product.productId ||
                      product.Id ||
                      `verified-product-${index}`
                    }
                    product={product}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.has(product.id || product.productId)}
                    user={user}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có xe kiểm định nào
                </h3>
                <p className="text-gray-500 mb-4">
                  Hiện tại chưa có xe nào được kiểm định. Hãy là người đầu tiên!
                </p>
                <Link
                  to="/create-listing"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Đăng tin xe
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn EV Market?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nền tảng uy tín, minh bạch và an toàn cho mọi giao dịch xe điện
            </p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon-container">
                <CheckCircle className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Kiểm duyệt kỹ lưỡng</h3>
              <p className="benefit-description">
                Mỗi tin đăng đều được admin kiểm tra và phê duyệt
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <Shield className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Thanh toán an toàn</h3>
              <p className="benefit-description">
                Hỗ trợ nhiều phương thức thanh toán bảo mật
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <TrendingUp className="benefit-icon" />
              </div>
              <h3 className="benefit-title">AI gợi ý giá</h3>
              <p className="benefit-description">
                Công nghệ AI giúp định giá chính xác nhất
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <Zap className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Hỗ trợ 24/7</h3>
              <p className="text-gray-600">
                Đội ngũ hỗ trợ sẵn sàng giải ��áp mọi thắc mắc
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
