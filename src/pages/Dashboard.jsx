import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Package, DollarSign, Eye, Heart, Settings, Plus, 
  TrendingUp, Users, MessageSquare, Star, Award,
  Calendar, Clock, CheckCircle, AlertCircle, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity, Zap, Target
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { ProductCard } from "../components/molecules/ProductCard";
import { formatPrice } from "../utils/formatters";

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const getListingId = (l) =>
    l?.id ??
    l?.productId ??
    l?.Id ??
    l?.listingId ??
    l?.product_id ??
    l?.listingId ??
    null;
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalViews: 0,
    conversionRate: 0,
    avgViewsPerListing: 0,
    recentActivity: 0,
    monthlyGrowth: 0
  });
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, profile]);

  const loadDashboardData = async () => {
    try {
      const data = await apiRequest(
        `/api/Product/seller/${
          user?.id || user?.accountId || user?.userId || 1
        }`
      );
      const norm = (v) => String(v || "").toLowerCase();
      const mapStatus = (l) => {
        const raw = norm(l?.status || l?.Status);
        if (raw.includes("pending") || raw.includes("chờ")) return "pending";
        if (raw.includes("approve") || raw.includes("duyệt")) return "approved";
        if (raw.includes("reject") || raw.includes("từ chối"))
          return "rejected";
        if (raw.includes("sold") || raw.includes("đã bán")) return "sold";
        return raw || "pending";
      };
      const items = Array.isArray(data) ? data : data?.items || [];
      const filtered = items.filter((l) => {
        const s = norm(l?.status || l?.Status || "");
        return s !== "deleted" && s !== "inactive";
      });

      // Load images for each listing
      const normalized = await Promise.all(
        filtered.map(async (l) => {
          try {
            const imagesData = await apiRequest(
              `/api/ProductImage/product/${l.id || l.productId || l.Id}`
            );
            const images = Array.isArray(imagesData)
              ? imagesData
              : imagesData?.items || [];
            return {
              ...l,
              status: mapStatus(l),
              images: images.map(
                (img) => img.imageData || img.imageUrl || img.url
              ),
            };
          } catch {
            return { ...l, status: mapStatus(l), images: [] };
          }
        })
      );

      const total = normalized.length;
      const active = normalized.filter((l) => l.status === "approved").length;
      const sold = normalized.filter((l) => l.status === "sold").length;
      const views = normalized.reduce(
        (sum, l) => sum + (l.viewsCount || l.views_count || 0),
        0
      );

      const conversionRate = total > 0 ? Math.round((sold / total) * 100) : 0;
      const avgViewsPerListing = total > 0 ? Math.round(views / total) : 0;
      
      setStats({
        totalListings: total,
        activeListings: active,
        soldListings: sold,
        totalViews: views,
        conversionRate,
        avgViewsPerListing,
        recentActivity: normalized.filter(l => {
          const createdDate = new Date(l.createdDate || l.created_date || Date.now());
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdDate > weekAgo;
        }).length,
        monthlyGrowth: Math.floor(Math.random() * 20) + 5 // Simulated growth
      });
      setMyListings(normalized);
      
      // Generate recent activity data
      const activities = normalized.slice(0, 5).map(listing => ({
        id: getListingId(listing),
        type: 'listing_view',
        title: listing.title,
        description: `Tin đăng "${listing.title}" có ${listing.viewsCount || 0} lượt xem`,
        time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        status: listing.status
      }));
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-4xl font-bold text-white mb-2">
                Chào mừng,{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  {user?.fullName ||
                    user?.name ||
                    profile?.full_name ||
                    profile?.fullName ||
                    profile?.name ||
                    user?.email ||
                    "bạn"}
                </span>
                !
              </h1>
              <p className="text-blue-100 text-lg">
                Quản lý tin đăng và theo dõi hoạt động của bạn
              </p>
            </div>
            
            <div className="flex space-x-4">
              <Link
                to="/create-listing"
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full hover:bg-white/30 transition-all duration-200 flex items-center space-x-2 border border-white/20"
              >
                <Plus className="h-5 w-5" />
                <span>Đăng tin mới</span>
              </Link>
              <Link
                to="/my-listings"
                className="bg-white text-blue-600 px-6 py-3 rounded-full hover:bg-blue-50 transition-all duration-200 flex items-center space-x-2"
              >
                <Eye className="h-5 w-5" />
                <span>Xem tất cả</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Listings */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tổng tin đăng</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalListings}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{stats.monthlyGrowth}%</span>
                </div>
              </div>
              <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Listings */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Đang hoạt động</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeListings}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">Đang hiển thị</span>
                </div>
              </div>
              <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Sold Listings */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Đã bán</p>
                <p className="text-3xl font-bold text-orange-600">{stats.soldListings}</p>
                <div className="flex items-center mt-2">
                  <Target className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">{stats.conversionRate}% tỷ lệ</span>
                </div>
              </div>
              <div className="p-4 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Total Views */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Lượt xem</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalViews}</p>
                <div className="flex items-center mt-2">
                  <Eye className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">{stats.avgViewsPerListing} TB/tin</span>
                </div>
              </div>
              <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Listings Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Tin đăng gần đây
                  </h2>
                  <Link
                    to="/my-listings"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    Xem tất cả
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : myListings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có tin đăng nào</h3>
                    <p className="text-gray-500 mb-6">Hãy bắt đầu bằng việc đăng tin đầu tiên của bạn</p>
                    <Link
                      to="/create-listing"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Đăng tin đầu tiên
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myListings.slice(0, 5).map((listing, idx) => (
                      <div
                        key={getListingId(listing) ?? `${listing.title || "listing"}_${idx}`}
                        className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                      >
                        <div className="relative">
                          <img
                            src={
                              listing.images && listing.images.length > 0
                                ? listing.images[0]
                                : "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=200"
                            }
                            alt={listing.title}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=200";
                            }}
                          />
                          <span
                            className={`absolute -top-1 -right-1 px-2 py-1 text-xs font-medium rounded-full ${
                              listing.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : listing.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : listing.status === "sold"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {listing.status === "approved" && "Đã duyệt"}
                            {listing.status === "pending" && "Chờ duyệt"}
                            {listing.status === "sold" && "Đã bán"}
                            {listing.status === "rejected" && "Từ chối"}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {listing.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {listing.licensePlate || listing.license_plate || ""}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm font-medium text-blue-600">
                              {formatPrice(listing.price)}
                            </span>
                            <div className="flex items-center text-sm text-gray-500">
                              <Eye className="h-4 w-4 mr-1" />
                              {listing.views_count || 0}
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          to={`/listing/${getListingId(listing) || ""}/edit`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-gray-400 hover:text-blue-600"
                        >
                          <Settings className="h-5 w-5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Thông tin tài khoản
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Họ và tên</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profile?.full_name ||
                      profile?.fullName ||
                      user?.fullName ||
                      user?.name ||
                      "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.email || profile?.email || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Số điện thoại</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profile?.phone || user?.phone || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/profile"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Chỉnh sửa hồ sơ
                  </Link>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Hiệu suất
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tỷ lệ chuyển đổi</span>
                  <span className="text-sm font-medium text-green-600">{stats.conversionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Lượt xem trung bình</span>
                  <span className="text-sm font-medium text-blue-600">{stats.avgViewsPerListing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tăng trưởng tháng</span>
                  <span className="text-sm font-medium text-purple-600">+{stats.monthlyGrowth}%</span>
                </div>
              </div>
            </div>

            {/* Upgrade Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center mb-3">
                <Zap className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-semibold">Nâng cấp tài khoản</h3>
              </div>
              <p className="text-blue-100 mb-4 text-sm">
                Đăng tin không giới hạn và được ưu tiên hiển thị
              </p>
              <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
