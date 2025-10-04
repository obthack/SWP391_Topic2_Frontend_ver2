import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, DollarSign, Eye, Heart, Settings, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { ProductCard } from "../components/common/ProductCard";
import { formatPrice } from "../utils/formatters";

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalViews: 0,
  });
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Get user's listings from backend API
      const listings = await apiRequest(
        `/api/Product/seller/${
          user?.id || user?.accountId || user?.userId || 1
        }`
      );

      const total = listings?.length || 0;
      const active =
        listings?.filter((l) => l.status === "approved").length || 0;
      const sold = listings?.filter((l) => l.status === "sold").length || 0;
      const views =
        listings?.reduce(
          (sum, l) => sum + (l.viewsCount || l.views_count || 0),
          0
        ) || 0;

      setStats({
        totalListings: total,
        activeListings: active,
        soldListings: sold,
        totalViews: views,
      });

      setMyListings(listings || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chào mừng, {profile?.full_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý tin đăng và theo dõi hoạt động của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tổng tin đăng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalListings}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Đang hoạt động</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.activeListings}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Đã bán</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.soldListings}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Lượt xem</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.totalViews}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Tin đăng của bạn
                </h2>
                <div className="flex space-x-3">
                  <Link
                    to="/my-listings"
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Xem tất cả
                  </Link>
                  <Link
                    to="/create-listing"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Đăng tin mới
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-32 bg-gray-100 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : myListings.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Bạn chưa có tin đăng nào</p>
                  <Link
                    to="/create-listing"
                    className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Đăng tin đầu tiên
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myListings.slice(0, 5).map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={
                          listing.images?.[0] ||
                          "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=200"
                        }
                        alt={listing.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {listing.brand} {listing.model}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm font-medium text-blue-600">
                            {formatPrice(listing.price)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              listing.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : listing.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : listing.status === "sold"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {listing.status === "approved" && "Đã duyệt"}
                            {listing.status === "pending" && "Chờ duyệt"}
                            {listing.status === "sold" && "Đã bán"}
                            {listing.status === "rejected" && "Từ chối"}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {listing.views_count || 0}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/listing/${listing.id}/edit`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Settings className="h-5 w-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin tài khoản
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Họ và tên</label>
                  <p className="font-medium text-gray-900">
                    {profile?.full_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Số điện thoại</label>
                  <p className="font-medium text-gray-900">
                    {profile?.phone || "Chưa cập nhật"}
                  </p>
                </div>
                <Link
                  to="/settings"
                  className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cập nhật thông tin
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Nâng cấp tài khoản</h3>
              <p className="text-sm text-blue-100 mb-4">
                Đăng tin không giới hạn và được ưu tiên hiển thị
              </p>
              <button className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
