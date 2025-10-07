import { useState, useEffect } from "react";
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  Calendar,
  MapPin,
  Car,
  Shield,
  BarChart3,
  Activity,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate } from "../utils/formatters";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    totalRevenue: 0,
  });
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const getId = (x) => x?.id || x?.productId || x?.Id || x?.listingId;

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    filterListings();
  }, [allListings, searchTerm, statusFilter, dateFilter]);

  const loadAdminData = async () => {
    try {
      const [users, listings, transactions] = await Promise.all([
        apiRequest("/api/User"),
        apiRequest("/api/Product"),
        apiRequest("/api/Order"),
      ]);

      console.log("Admin loaded data:", { users, listings, transactions });

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

      // Process all listings with images
      const processedListings = await Promise.all(
        (listings || []).map(async (l) => {
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

      const pending = processedListings.filter((l) => l.status === "pending");
      const approved = processedListings.filter((l) => l.status === "approved");
      const rejected = processedListings.filter((l) => l.status === "rejected");

      const revenue =
        transactions
          ?.filter((t) => t.status === "completed")
          .reduce(
            (sum, t) => sum + parseFloat(t.totalAmount || t.amount || 0),
            0
          ) || 0;

      setStats({
        totalUsers: users?.length || 0,
        totalListings: processedListings.length,
        pendingListings: pending.length,
        approvedListings: approved.length,
        rejectedListings: rejected.length,
        totalRevenue: revenue,
      });

      setAllListings(processedListings);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = allListings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (l) =>
          (l.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.licensePlate || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((l) => {
        const createdDate = new Date(
          l.created_at || l.createdDate || l.createdAt
        );
        switch (dateFilter) {
          case "today":
            return createdDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createdDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return createdDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredListings(filtered);
  };

  const handleApprove = async (listingId) => {
    try {
      await apiRequest(`/api/Product/${listingId}`, {
        method: "PUT",
        body: { status: "approved" },
      });
      setShowModal(false);
      loadAdminData();
    } catch (error) {
      console.error("Error approving listing:", error);
      alert("Lỗi khi duyệt bài đăng: " + (error.message || "Unknown error"));
    }
  };

  const handleReject = async (listingId) => {
    try {
      await apiRequest(`/api/Product/${listingId}`, {
        method: "PUT",
        body: { status: "rejected" },
      });
      setShowModal(false);
      loadAdminData();
    } catch (error) {
      console.error("Error rejecting listing:", error);
      alert("Lỗi khi từ chối bài đăng: " + (error.message || "Unknown error"));
    }
  };

  const openListingModal = (listing) => {
    setSelectedListing(listing);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Chờ duyệt",
        icon: Clock,
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Đã duyệt",
        icon: CheckCircle,
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Từ chối",
        icon: XCircle,
      },
      sold: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Đã bán",
        icon: Package,
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg font-medium">
            Đang tải dữ liệu admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Control Center
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Quản lý và giám sát toàn bộ hệ thống
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-xl shadow-sm px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Hệ thống hoạt động
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Tổng người dùng
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +12% từ tháng trước
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Tổng tin đăng
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalListings}
                </p>
                <p className="text-xs text-blue-600 mt-1">+8% từ tháng trước</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Chờ duyệt</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.pendingListings}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Cần xử lý ngay</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-xl">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Doanh thu</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatPrice(stats.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +15% từ tháng trước
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Đã duyệt</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.approvedListings}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Từ chối</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.rejectedListings}
                </p>
              </div>
              <XCircle className="h-12 w-12 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Tỷ lệ duyệt</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.totalListings > 0
                    ? Math.round(
                        (stats.approvedListings / stats.totalListings) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
              <BarChart3 className="h-12 w-12 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề, thương hiệu, model, biển số..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="sold">Đã bán</option>
              </select>
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Quản lý tin đăng
              </h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {filteredListings.length} kết quả
                </span>
              </div>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy tin đăng nào
              </h3>
              <p className="text-gray-500">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div
                    key={getId(listing)}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <img
                          src={
                            listing.images && listing.images.length > 0
                              ? listing.images[0]
                              : "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=200"
                          }
                          alt={listing.title}
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src =
                              "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=200";
                          }}
                        />
                        <div className="absolute -top-2 -right-2">
                          {getStatusBadge(listing.status)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                          {listing.title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4" />
                            <span>
                              {listing.brand} {listing.model} - {listing.year}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{listing.location || "Chưa cập nhật"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(listing.created_at)}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xl font-bold text-blue-600">
                            {formatPrice(listing.price)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => openListingModal(listing)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </button>
                      {listing.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(getId(listing))}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm font-medium"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(getId(listing))}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm font-medium"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Chi tiết tin đăng
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <img
                    src={
                      selectedListing.images &&
                      selectedListing.images.length > 0
                        ? selectedListing.images[0]
                        : "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=400"
                    }
                    alt={selectedListing.title}
                    className="w-full h-64 object-cover rounded-xl"
                    onError={(e) => {
                      e.target.src =
                        "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=400";
                    }}
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedListing.title}
                    </h4>
                    <div className="flex items-center space-x-2 mb-4">
                      {getStatusBadge(selectedListing.status)}
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(selectedListing.price)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Thương hiệu</p>
                      <p className="font-medium">
                        {selectedListing.brand || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Model</p>
                      <p className="font-medium">
                        {selectedListing.model || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Năm sản xuất</p>
                      <p className="font-medium">
                        {selectedListing.year || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Biển số</p>
                      <p className="font-medium">
                        {selectedListing.licensePlate || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số km</p>
                      <p className="font-medium">
                        {selectedListing.mileage || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tình trạng</p>
                      <p className="font-medium">
                        {selectedListing.condition || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Mô tả</p>
                    <p className="text-gray-700">
                      {selectedListing.description || "Chưa có mô tả"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Địa chỉ</p>
                    <p className="text-gray-700">
                      {selectedListing.location || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Đăng lúc: {formatDate(selectedListing.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedListing.status === "pending" && (
                <div className="mt-8 flex space-x-4">
                  <button
                    onClick={() => handleApprove(getId(selectedListing))}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Duyệt tin đăng
                  </button>
                  <button
                    onClick={() => handleReject(getId(selectedListing))}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center font-medium"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Từ chối tin đăng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
