import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Gauge,
  Battery,
  Car,
  Shield,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Truck,
  CreditCard,
  MessageSquare,
  Users,
  Package,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice } from "../utils/formatters";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { toggleFavorite, isProductFavorited } from "../lib/favoriteApi";

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show: showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [showSellerContact, setShowSellerContact] = useState(false);

  useEffect(() => {
    console.log("ProductDetail - ID from params:", id);
    if (id && id !== "undefined") {
      loadProduct();
    } else {
      console.error("Invalid product ID:", id);
      setLoading(false);
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);

      // Load product details
      const productData = await apiRequest(`/api/Product/${id}`);
      setProduct(productData);

      // Load seller information
      const sellerId =
        productData.sellerId || productData.seller_id || productData.seller?.id;
      if (sellerId) {
        try {
          const sellerData = await apiRequest(`/api/User/${sellerId}`);
          setSeller(sellerData);
          console.log("Loaded seller data:", sellerData);
        } catch (sellerError) {
          console.warn("Could not load seller data:", sellerError);
          // Set fallback seller data
          setSeller({
            fullName: productData.sellerName || "Người bán",
            email: productData.sellerEmail || "",
            phone: productData.sellerPhone || "",
            avatar: null,
          });
        }
      }

      // Load product images
      try {
        const imagesData = await apiRequest(`/api/ProductImage/product/${id}`);
        const productImages = Array.isArray(imagesData)
          ? imagesData
          : imagesData?.items || [];
        setImages(
          productImages.map((img) => img.imageData || img.imageUrl || img.url)
        );
      } catch (imageError) {
        console.log("No images found for product");
        setImages([]);
      }

      // Check if product is favorited by current user
      if (user) {
        try {
          const favoriteData = await isProductFavorited(
            user.id || user.userId || user.accountId,
            id
          );
          if (favoriteData) {
            setIsFavorite(true);
            setFavoriteId(favoriteData.favoriteId);
          }
        } catch (favoriteError) {
          console.warn("Could not check favorite status:", favoriteError);
        }
      }
    } catch (error) {
      console.error("Error loading product:", error);
      showToast({
        title: "❌ Lỗi tải sản phẩm",
        description: "Không thể tải thông tin sản phẩm. Vui lòng thử lại.",
        type: "error",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleImageNavigation = (direction) => {
    if (direction === "prev") {
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để thêm vào yêu thích",
        type: "warning",
      });
      return;
    }

    try {
      const result = await toggleFavorite(
        user.id || user.userId || user.accountId,
        id
      );

      setIsFavorite(result.isFavorited);
      setFavoriteId(result.favoriteId || null);

      showToast({
        title: result.isFavorited ? "❤️ Đã thêm vào yêu thích" : "💔 Đã xóa khỏi yêu thích",
        description: result.isFavorited ? "Sản phẩm đã được thêm vào danh sách yêu thích" : "Sản phẩm đã được xóa khỏi danh sách yêu thích",
        type: "success",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast({
        title: "❌ Lỗi cập nhật yêu thích",
        description: "Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.",
        type: "error",
      });
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để liên hệ người bán",
        type: "warning",
      });
      return;
    }
    setShowContactModal(true);
  };

  const handleContactFormSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      showToast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng điền đầy đủ họ tên và số điện thoại",
        type: "warning",
      });
      return;
    }
    setShowSellerContact(true);
    showToast({
      title: "✅ Gửi thông tin thành công",
      description: "Thông tin liên hệ đã được gửi cho người bán",
      type: "success",
    });
  };

  const handleContactFormChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      showToast({
        title: "⚠️ Cần đăng nhập",
        description: "Vui lòng đăng nhập để mua hàng",
        type: "warning",
      });
      return;
    }
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product || id === "undefined" || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-4">ID sản phẩm không hợp lệ: {id}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const currentImage =
    images[currentImageIndex] ||
    "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=800";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Chi tiết sản phẩm
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite
                    ? "bg-red-50 text-red-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-xl shadow-sm overflow-hidden">
              <img
                src={currentImage}
                alt={product.title}
                className="w-full h-96 object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation("prev")}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation("next")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.title}
                  </h1>
                  <p className="text-gray-600">
                    {product.licensePlate ||
                      product.license_plate ||
                      "Biển số: N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPrice(product.price)}
                  </p>
                  <p className="text-sm text-gray-500">Giá niêm yết</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                {product.status === "approved" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Đã duyệt
                  </span>
                )}
                {product.status === "sold" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Đã bán
                  </span>
                )}
                {product.is_auction && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Đấu giá
                  </span>
                )}
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {product.year && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Năm sản xuất: {product.year}</span>
                  </div>
                )}
                {product.mileage && (
                  <div className="flex items-center text-gray-600">
                    <Gauge className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Km đã đi: {product.mileage.toLocaleString()}</span>
                  </div>
                )}
                {product.battery_capacity && (
                  <div className="flex items-center text-gray-600">
                    <Battery className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Pin: {product.battery_capacity} kWh</span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex items-center text-gray-600">
                    <Car className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Hãng: {product.brand}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  disabled={product.status === "sold"}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Mua ngay
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleContactSeller}
                    className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Liên hệ người bán
                  </button>
                  <button className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin người bán
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {seller?.avatar ? (
                    <img
                      src={seller.avatar}
                      alt="Seller Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-semibold">
                      {seller?.fullName?.charAt(0) ||
                        product.sellerName?.charAt(0) ||
                        "N"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {seller?.fullName || product.sellerName || "Người bán"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {product.location || "Hà Nội"}
                  </p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      4.8 (120 đánh giá)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/seller/${product.sellerId || product.seller_id || 1}`
                      )
                    }
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Xem profile
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/seller/${
                          product.sellerId || product.seller_id || 1
                        }/products`
                      )
                    }
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Sản phẩm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Mô tả sản phẩm
              </h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description ||
                    "Không có mô tả chi tiết cho sản phẩm này."}
                </p>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông số kỹ thuật
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.brand && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Hãng xe</span>
                    <span className="font-medium">{product.brand}</span>
                  </div>
                )}
                {product.model && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Mẫu xe</span>
                    <span className="font-medium">{product.model}</span>
                  </div>
                )}
                {product.year && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Năm sản xuất</span>
                    <span className="font-medium">{product.year}</span>
                  </div>
                )}
                {product.mileage && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Số km đã đi</span>
                    <span className="font-medium">
                      {product.mileage.toLocaleString()} km
                    </span>
                  </div>
                )}
                {product.battery_capacity && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Dung lượng pin</span>
                    <span className="font-medium">
                      {product.battery_capacity} kWh
                    </span>
                  </div>
                )}
                {product.color && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Màu sắc</span>
                    <span className="font-medium">{product.color}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Safety & Trust */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                An toàn & Tin cậy
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">
                    Sản phẩm đã được kiểm duyệt
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">
                    Thông tin chính xác
                  </span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm text-gray-700">
                    Giao hàng tận nơi
                  </span>
                </div>
              </div>
            </div>

            {/* Similar Products */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sản phẩm tương tự
              </h3>
              <p className="text-gray-600 text-sm">
                Khám phá thêm các sản phẩm khác cùng danh mục
              </p>
              <Link
                to="/"
                className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Liên hệ người bán
            </h3>

            {!showSellerContact ? (
              <form onSubmit={handleContactFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ tên của bạn"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tin nhắn
                  </label>
                  <textarea
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tin nhắn cho người bán"
                  />
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Gửi thông tin
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">
                      Thông tin đã được gửi thành công!
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Thông tin liên hệ người bán:
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-gray-700">
                        {seller?.phone ||
                          product.sellerPhone ||
                          product.contactPhone ||
                          "Chưa cập nhật"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-gray-700">
                        {seller?.email ||
                          product.sellerEmail ||
                          product.contactEmail ||
                          "Chưa cập nhật"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">
                        Người bán:{" "}
                        {seller?.fullName || product.sellerName || "Người bán"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowContactModal(false);
                      setShowSellerContact(false);
                      setContactForm({ name: "", phone: "", message: "" });
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận mua hàng
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {product.title}
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </p>
              </div>
              <div className="space-y-2">
                <button className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <CreditCard className="h-5 w-5 inline mr-2" />
                  Thanh toán bằng thẻ
                </button>
                <button className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <Truck className="h-5 w-5 inline mr-2" />
                  Thanh toán khi nhận hàng
                </button>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  showToast({
                    title: "✅ Tạo đơn hàng thành công",
                    description: "Đơn hàng đã được tạo và gửi đến người bán",
                    type: "success",
                  });
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
