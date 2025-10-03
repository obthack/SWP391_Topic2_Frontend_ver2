import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Zap, Shield, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductCard } from '../components/common/ProductCard';

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [productType, setProductType] = useState('');
  const [location, setLocation] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Nền tảng giao dịch xe điện & pin số 1 Việt Nam
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Mua bán xe điện an toàn, minh bạch với giá tốt nhất thị trường
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="md:col-span-1">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Địa điểm (VD: HN)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="md:col-span-1">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Tìm kiếm
                </button>
              </div>
            </form>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Zap className="h-12 w-12 mb-3" />
              <h3 className="text-xl font-semibold mb-2">1000+ xe đã giao dịch</h3>
              <p className="text-blue-100">Hàng nghìn giao dịch thành công</p>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="h-12 w-12 mb-3" />
              <h3 className="text-xl font-semibold mb-2">Kiểm định chính hãng</h3>
              <p className="text-blue-100">Đảm bảo chất lượng từng sản phẩm</p>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="h-12 w-12 mb-3" />
              <h3 className="text-xl font-semibold mb-2">Giá minh bạch, cộng khai</h3>
              <p className="text-blue-100">Hỗ trợ AI gợi ý giá tốt nhất</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Xe điện nổi bật</h2>
              <p className="text-gray-600 mt-2">Những chiếc xe được kiểm duyệt và giá cạnh tranh nhất</p>
            </div>
            <Link
              to="/vehicles"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Xem tất cả
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tại sao chọn EV Market?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nền tảng uy tín, minh bạch và an toàn cho mọi giao dịch xe điện
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Kiểm duyệt kỹ lưỡng</h3>
              <p className="text-gray-600">Mỗi tin đăng đều được admin kiểm tra và phê duyệt</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Thanh toán an toàn</h3>
              <p className="text-gray-600">Hỗ trợ nhiều phương thức thanh toán bảo mật</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI gợi ý giá</h3>
              <p className="text-gray-600">Công nghệ AI giúp định giá chính xác nhất</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hỗ trợ 24/7</h3>
              <p className="text-gray-600">Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
