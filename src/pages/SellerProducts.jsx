import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Grid,
  List,
  Package,
  CheckCircle,
  Star,
  MapPin,
  Calendar,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice } from "../utils/formatters";
import { ProductCard } from "../components/molecules/ProductCard";

export const SellerProducts = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (id) {
      loadSellerProducts();
    }
  }, [id]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortBy]);

  const loadSellerProducts = async () => {
    try {
      setLoading(true);

      // Load seller info
      const sellerData = await apiRequest(`/api/User/${id}`);
      setSeller(sellerData);

      // Load seller products
      const productsData = await apiRequest(`/api/Product/seller/${id}`);
      const productsList = Array.isArray(productsData)
        ? productsData
        : productsData?.items || [];

      // Filter only approved products
      const approvedProducts = productsList.filter((product) => {
        const status = String(
          product.status || product.Status || ""
        ).toLowerCase();
        return status === "approved" || status === "active";
      });

      setProducts(approvedProducts);
    } catch (error) {
      console.error("Error loading seller products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered = filtered.sort(
          (a, b) =>
            new Date(b.createdDate || b.created_date) -
            new Date(a.createdDate || a.created_date)
        );
        break;
      case "oldest":
        filtered = filtered.sort(
          (a, b) =>
            new Date(a.createdDate || a.created_date) -
            new Date(b.createdDate || b.created_date)
        );
        break;
      case "price_low":
        filtered = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_high":
        filtered = filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy người bán
          </h2>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

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
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Sản phẩm của {seller.fullName || seller.name || "Người bán"}
                </h1>
                <p className="text-sm text-gray-600">
                  {products.length} sản phẩm đã được phê duyệt
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seller Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
           <div className="flex items-center space-x-4">
             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
               {seller.avatar ? (
                 <img 
                   src={seller.avatar} 
                   alt="Avatar" 
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <span className="text-blue-600 font-bold text-xl">
                   {seller.fullName?.charAt(0) || seller.name?.charAt(0) || "N"}
                 </span>
               )}
             </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {seller.fullName || seller.name || "Người bán"}
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">Hà Nội, Việt Nam</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    Tham gia:{" "}
                    {new Date(
                      seller.createdDate || seller.created_date
                    ).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Star className="h-4 w-4 mr-1 text-yellow-400" />
                  <span className="text-sm">4.8 (120 đánh giá)</span>
                </div>
              </div>
            </div>
            <Link
              to={`/seller/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem profile
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="price_low">Giá thấp → cao</option>
                <option value="price_high">Giá cao → thấp</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Sản phẩm đã duyệt ({filteredProducts.length})
            </h3>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">Tất cả đã được phê duyệt</span>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product, index) => (
                <div key={product.id || product.productId || index}>
                  {viewMode === "grid" ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                        <div className="flex items-center justify-center h-48">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {product.title}
                        </h4>
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          {formatPrice(product.price)}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Đã duyệt</span>
                          </div>
                          <Link
                            to={`/product/${product.id || product.productId}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Xem chi tiết →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {product.title}
                        </h4>
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          {formatPrice(product.price)}
                        </p>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Đã duyệt</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(
                              product.createdDate || product.created_date
                            ).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/product/${product.id || product.productId}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm
                  ? "Không tìm thấy sản phẩm"
                  : "Chưa có sản phẩm nào"}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Người bán chưa có sản phẩm nào được phê duyệt"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
