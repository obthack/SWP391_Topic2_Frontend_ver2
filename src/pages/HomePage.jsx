<<<<<<< HEAD
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Zap, Shield, TrendingUp, CheckCircle } from "lucide-react";
import { apiRequest } from "../lib/api";
import { ProductCard } from "../components/molecules/ProductCard";
=======
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Zap, Shield, TrendingUp, CheckCircle } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { ProductCard } from '../components/molecules/ProductCard';
import '../styles/homepage.css';
>>>>>>> giang

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [productType, setProductType] = useState("");
  const [location, setLocation] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState("");

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
<<<<<<< HEAD
      let approvedProducts = [];

      try {
        // Try to get approved products directly
        const data = await apiRequest("/api/Product?status=approved&take=8");
        const list = Array.isArray(data) ? data : data?.items || [];
        approvedProducts = list.filter((x) => {
          const status = String(x.status || x.Status).toLowerCase();
          return status === "approved" || status === "active";
        });
      } catch (e1) {
        console.log("Direct approved query failed, trying all products:", e1);
        // Fallback: get all products and filter
        const data2 = await apiRequest("/api/Product");
        const list2 = Array.isArray(data2) ? data2 : data2?.items || [];
        approvedProducts = list2
          .filter((x) => {
            const status = String(x.status || x.Status).toLowerCase();
            return status === "approved" || status === "active";
          })
          .slice(0, 8);
      }

      // Load images for each approved product
      const productsWithImages = await Promise.all(
        approvedProducts.map(async (product) => {
          try {
            const imagesData = await apiRequest(
              `/api/ProductImage/product/${
                product.id || product.productId || product.Id
              }`
            );
            const images = Array.isArray(imagesData)
              ? imagesData
              : imagesData?.items || [];
            return {
              ...product,
              images: images.map(
                (img) => img.imageData || img.imageUrl || img.url
              ),
            };
          } catch {
            return { ...product, images: [] };
          }
        })
      );

      // Sort products to show approved ones first
      const sortedProducts = productsWithImages.sort((a, b) => {
        const aStatus = String(a.status || a.Status || "").toLowerCase();
        const bStatus = String(b.status || b.Status || "").toLowerCase();

        // If both are approved, maintain original order
        if (aStatus === "approved" && bStatus === "approved") {
          return 0;
        }
        // If only a is approved, it should come first
        if (aStatus === "approved" && bStatus !== "approved") {
          return -1;
        }
        // If only b is approved, it should come first
        if (bStatus === "approved" && aStatus !== "approved") {
          return 1;
        }
        // For other cases, maintain original order
        return 0;
      });

      console.log("Loaded approved products for homepage:", sortedProducts);
      setFeaturedProducts(sortedProducts);
    } catch (err) {
      console.error("Error loading featured products:", err);
      setFeaturedProducts([]);
      setFeaturedError(err.message || String(err));
      try {
        // Expose a helpful debug object for the developer console (non-sensitive)
=======
      // try to get approved products first
      const data = await apiRequest('/api/Product?status=approved&take=8');
      const list = Array.isArray(data) ? data : (data?.items || []);
      setFeaturedProducts(list.filter((x)=> String(x.status||x.Status).toLowerCase()==='approved'));
    } catch (e1) {
      // fallback if first request fails
      console.log('first request failed, trying fallback...');
      try {
        const data2 = await apiRequest('/api/Product');
        const list2 = Array.isArray(data2) ? data2 : (data2?.items || []);
        setFeaturedProducts(list2.filter((x)=> String(x.status||x.Status).toLowerCase()==='approved').slice(0,8));
      } catch (e2) {
        console.error('both requests failed:', e2);
        setFeaturedProducts([]);
        setFeaturedError(e2.message || String(e2));
        // debug stuff for me
>>>>>>> giang
        window.__EVTB_LAST_ERROR = window.__EVTB_LAST_ERROR || {};
        window.__EVTB_LAST_ERROR.loadFeaturedProducts = {
          message: e2.message || String(e2),
          stack: e2.stack || null,
        };
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: implement search functionality
    console.log('search clicked:', { searchQuery, productType, location });
  };

  return (
    <div className="min-h-screen">
<<<<<<< HEAD
      <section
        className="text-white py-20 relative overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(15, 23, 42, 0.7) 0%, 
              rgba(30, 58, 138, 0.6) 25%, 
              rgba(30, 64, 175, 0.5) 50%, 
              rgba(15, 23, 42, 0.7) 100%
            ),
            url('/ev-charging-hero.jpg')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
=======
      <section className="text-white py-20 relative overflow-hidden hero-bg">
>>>>>>> giang
        {/* Electric charging effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Charging energy effects */}
          <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-blue-400 bg-opacity-30 rounded-full animate-pulse"></div>
<<<<<<< HEAD
          <div
            className="absolute top-1/2 right-1/3 w-12 h-12 bg-cyan-400 bg-opacity-25 rounded-full animate-bounce"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-1/3 left-1/3 w-14 h-14 bg-blue-300 bg-opacity-20 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-10 h-10 bg-white bg-opacity-30 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s" }}
          ></div>

          {/* Electric spark effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/5 w-2 h-8 bg-yellow-400 rounded-full animate-pulse opacity-80"></div>
            <div
              className="absolute top-1/3 right-1/4 w-2 h-6 bg-yellow-300 rounded-full animate-pulse opacity-70"
              style={{ animationDelay: "0.3s" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/6 w-2 h-10 bg-yellow-400 rounded-full animate-pulse opacity-60"
              style={{ animationDelay: "0.6s" }}
            ></div>
            <div
              className="absolute bottom-1/3 right-1/5 w-2 h-7 bg-yellow-300 rounded-full animate-pulse opacity-75"
              style={{ animationDelay: "0.9s" }}
            ></div>
=======
          <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-cyan-400 bg-opacity-25 rounded-full animate-bounce energy-effect-1"></div>
          <div className="absolute bottom-1/3 left-1/3 w-14 h-14 bg-blue-300 bg-opacity-20 rounded-full animate-pulse energy-effect-2"></div>
          <div className="absolute bottom-1/4 right-1/4 w-10 h-10 bg-white bg-opacity-30 rounded-full animate-bounce energy-effect-3"></div>
          
          {/* Electric spark effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/5 w-2 h-8 bg-yellow-400 rounded-full animate-pulse opacity-80"></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-6 bg-yellow-300 rounded-full animate-pulse opacity-70 spark-effect-1"></div>
            <div className="absolute top-1/2 left-1/6 w-2 h-10 bg-yellow-400 rounded-full animate-pulse opacity-60 spark-effect-2"></div>
            <div className="absolute bottom-1/3 right-1/5 w-2 h-7 bg-yellow-300 rounded-full animate-pulse opacity-75 spark-effect-3"></div>
>>>>>>> giang
          </div>

          {/* Charging cable glow effect */}
          <div className="absolute top-1/2 right-1/4 w-1 h-32 bg-blue-400 bg-opacity-40 rounded-full animate-pulse transform rotate-12"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            {/* Electric car charging icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
<<<<<<< HEAD
                <div className="w-28 h-28 bg-white bg-opacity-15 rounded-full flex items-center justify-center backdrop-blur-sm border border-white border-opacity-30 shadow-2xl">
                  <svg
                    className="w-16 h-16 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
=======
                <div className="hero-icon-container">
                  <svg className="hero-icon" fill="currentColor" viewBox="0 0 24 24">
>>>>>>> giang
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
<<<<<<< HEAD
                <div className="absolute -top-1 -right-1 w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                {/* Energy sparks */}
                <div
                  className="absolute -top-3 -left-3 w-4 h-4 bg-yellow-400 rounded-full animate-bounce opacity-80"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="absolute -bottom-2 -right-3 w-3 h-3 bg-yellow-300 rounded-full animate-bounce opacity-70"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
=======
                <div className="charging-cable-effect">
                  <svg className="charging-cable-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                {/* Energy sparks */}
                <div className="energy-spark-1"></div>
                <div className="energy-spark-2"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent leading-relaxed">
>>>>>>> giang
              Nền tảng giao dịch xe điện & pin số 1 Việt Nam
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Mua bán xe điện an toàn, minh bạch với giá tốt nhất thị trường
            </p>
          </div>

<<<<<<< HEAD
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6">
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
=======
          <div className="search-form-container">
            <form onSubmit={handleSearch} className="search-form">
>>>>>>> giang
              <div className="md:col-span-1">
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="search-input"
                >
                  <option value="">Tất cả</option>
                  <option value="vehicle">Xe điện</option>
                  <option value="battery">Pin</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hãng xe, mẫu xe..."
                  className="search-input"
                />
              </div>

              <div className="md:col-span-1">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Địa điểm (VD: HN)"
                  className="search-input"
                />
              </div>

              <div className="md:col-span-1">
                <button
                  type="submit"
                  className="search-button"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Tìm kiếm
                </button>
              </div>
            </form>
          </div>

<<<<<<< HEAD
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Zap className="h-12 w-12 mb-3" />
              <h3 className="text-xl font-semibold mb-2">
                1000+ xe đã giao dịch
              </h3>
              <p className="text-blue-100">Hàng nghìn giao dịch thành công</p>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="h-12 w-12 mb-3" />
              <h3 className="text-xl font-semibold mb-2">
                Kiểm định chính hãng
              </h3>
              <p className="text-blue-100">Đảm bảo chất lượng từng sản phẩm</p>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="h-12 w-12 mb-3" />
              <h3 className="text-xl font-semibold mb-2">
                Giá minh bạch, cộng khai
              </h3>
              <p className="text-blue-100">Hỗ trợ AI gợi ý giá tốt nhất</p>
=======
          <div className="mt-12 features-grid">
            <div className="feature-item">
              <Zap className="feature-icon" />
              <h3 className="feature-title">1000+ xe đã giao dịch</h3>
              <p className="feature-description">Hàng nghìn giao dịch thành công</p>
            </div>
            <div className="feature-item">
              <Shield className="feature-icon" />
              <h3 className="feature-title">Kiểm định chính hãng</h3>
              <p className="feature-description">Đảm bảo chất lượng từng sản phẩm</p>
            </div>
            <div className="feature-item">
              <TrendingUp className="feature-icon" />
              <h3 className="feature-title">Giá minh bạch, cộng khai</h3>
              <p className="feature-description">Hỗ trợ AI gợi ý giá tốt nhất</p>
>>>>>>> giang
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Xe điện nổi bật
              </h2>
              <p className="text-gray-600 mt-2">
                Những chiếc xe được kiểm duyệt và giá cạnh tranh nhất
              </p>
            </div>
            <Link
              to="/vehicles"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Xem tất cả
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
          </div>

          {loading ? (
            <div className="products-grid">
              {[...Array(4)].map((_, i) => (
<<<<<<< HEAD
                <div
                  key={i}
                  className="bg-white rounded-xl h-80 animate-pulse"
                ></div>
=======
                <div key={i} className="skeleton-card"></div>
>>>>>>> giang
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Không có sản phẩm nào</p>
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
<<<<<<< HEAD
              <h3 className="text-lg font-semibold mb-2">
                Kiểm duyệt kỹ lưỡng
              </h3>
              <p className="text-gray-600">
                Mỗi tin đăng đều được admin kiểm tra và phê duyệt
              </p>
=======
              <h3 className="benefit-title">Kiểm duyệt kỹ lưỡng</h3>
              <p className="benefit-description">Mỗi tin đăng đều được admin kiểm tra và phê duyệt</p>
>>>>>>> giang
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <Shield className="benefit-icon" />
              </div>
<<<<<<< HEAD
              <h3 className="text-lg font-semibold mb-2">Thanh toán an toàn</h3>
              <p className="text-gray-600">
                Hỗ trợ nhiều phương thức thanh toán bảo mật
              </p>
=======
              <h3 className="benefit-title">Thanh toán an toàn</h3>
              <p className="benefit-description">Hỗ trợ nhiều phương thức thanh toán bảo mật</p>
>>>>>>> giang
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <TrendingUp className="benefit-icon" />
              </div>
<<<<<<< HEAD
              <h3 className="text-lg font-semibold mb-2">AI gợi ý giá</h3>
              <p className="text-gray-600">
                Công nghệ AI giúp định giá chính xác nhất
              </p>
=======
              <h3 className="benefit-title">AI gợi ý giá</h3>
              <p className="benefit-description">Công nghệ AI giúp định giá chính xác nhất</p>
>>>>>>> giang
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-container">
                <Zap className="benefit-icon" />
              </div>
<<<<<<< HEAD
              <h3 className="text-lg font-semibold mb-2">Hỗ trợ 24/7</h3>
              <p className="text-gray-600">
                Đội ngũ hỗ trợ sẵn sàng giải ��áp mọi thắc mắc
              </p>
=======
              <h3 className="benefit-title">Hỗ trợ 24/7</h3>
              <p className="benefit-description">Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc</p>
>>>>>>> giang
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
