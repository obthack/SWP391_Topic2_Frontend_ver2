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
import { useToast } from "../contexts/ToastContext";
import { notifyPostApproved, notifyPostRejected } from "../lib/notificationApi";

export const AdminDashboard = () => {
  const { show: showToast } = useToast();
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
  const [productTypeFilter, setProductTypeFilter] = useState("all"); // all, vehicle, battery
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState(false);

  const getId = (x) => x?.id || x?.productId || x?.Id || x?.listingId;

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    filterListings();
  }, [allListings, searchTerm, statusFilter, dateFilter, productTypeFilter]);

  const loadAdminData = async () => {
    try {
      // Load each API separately to handle individual failures
      let users = [];
      let listings = [];
      let transactions = [];

      try {
        users = await apiRequest("/api/User");
        console.log("✅ Users loaded:", users);
      } catch (error) {
        console.warn("⚠️ Failed to load users:", error.message);
      }

      try {
        // Load all products from unified API (has productType field)
        const allProducts = await apiRequest("/api/Product");
        listings = Array.isArray(allProducts)
          ? allProducts
          : allProducts?.items || [];
        console.log("✅ Products loaded:", listings);
      } catch (error) {
        console.warn("⚠️ Failed to load products:", error.message);
      }

      try {
        transactions = await apiRequest("/api/Order");
        console.log("✅ Orders loaded:", transactions);
      } catch (error) {
        console.warn("⚠️ Failed to load orders:", error.message);
      }

      console.log("Admin loaded data:", { users, listings, transactions });
      console.log("Listings type:", typeof listings);
      console.log("Listings is array:", Array.isArray(listings));
      console.log("Listings length:", listings?.length);
      console.log("Listings content:", listings);

      const norm = (v) => String(v || "").toLowerCase();
      const mapStatus = (l) => {
        const raw = norm(l?.status || l?.Status);
        console.log(`Mapping status for listing ${l.id}: raw="${raw}"`);
        if (
          raw.includes("draft") ||
          raw.includes("pending") ||
          raw.includes("chờ")
        )
          return "pending";
        if (
          raw.includes("active") ||
          raw.includes("approve") ||
          raw.includes("duyệt")
        )
          return "approved";
        if (raw.includes("reject") || raw.includes("từ chối"))
          return "rejected";
        if (raw.includes("sold") || raw.includes("đã bán")) return "sold";
        const result = raw || "pending";
        console.log(`Mapped status: "${result}"`);
        return result;
      };

      // Handle different response formats
      let listingsArray = [];
      if (Array.isArray(listings)) {
        listingsArray = listings;
      } else if (listings?.items && Array.isArray(listings.items)) {
        listingsArray = listings.items;
      } else if (listings?.data && Array.isArray(listings.data)) {
        listingsArray = listings.data;
      } else {
        console.warn("Unexpected listings format:", listings);
        listingsArray = [];
      }

      console.log("Processed listings array:", listingsArray);
      console.log("Listings array length:", listingsArray.length);

      // Process all listings with images and seller info (with delay to prevent DbContext conflicts)
      const processedListings = await Promise.all(
        listingsArray.map(async (l, index) => {
          try {
            // Add delay between API calls to prevent DbContext conflicts
            if (index > 0) {
              await new Promise((resolve) => setTimeout(resolve, 100 * index));
            }

            const imagesData = await apiRequest(
              `/api/ProductImage/product/${l.id || l.productId || l.Id}`
            );
            const images = Array.isArray(imagesData)
              ? imagesData
              : imagesData?.items || [];

            // Get seller information
            let seller = null;
            try {
              if (l.sellerId || l.seller_id || l.userId || l.user_id) {
                const sellerId =
                  l.sellerId || l.seller_id || l.userId || l.user_id;
                seller = users.find(
                  (u) => u.id === sellerId || u.userId === sellerId
                );
              }
            } catch (error) {
              console.warn(
                `Failed to get seller info for product ${l.id}:`,
                error
              );
            }

            return {
              ...l,
              status: mapStatus(l),
              images: images.map(
                (img) => img.imageData || img.imageUrl || img.url
              ),
              seller: seller,
            };
          } catch (error) {
            console.warn(`Failed to load images for product ${l.id}:`, error);
            return { ...l, status: mapStatus(l), images: [], seller: null };
          }
        })
      );

      // Sort listings to show newest first (by createdDate or createdAt)
      const sortedListings = processedListings.sort((a, b) => {
        const dateA = new Date(
          a.createdDate || a.createdAt || a.created_date || 0
        );
        const dateB = new Date(
          b.createdDate || b.createdAt || b.created_date || 0
        );
        return dateB - dateA; // Newest first
      });

      const pending = processedListings.filter((l) => l.status === "pending");
      const approved = processedListings.filter((l) => l.status === "approved");
      const rejected = processedListings.filter((l) => l.status === "rejected");

      const revenue = Array.isArray(transactions)
        ? transactions
            ?.filter((t) => t.status === "completed")
            .reduce(
              (sum, t) => sum + parseFloat(t.totalAmount || t.amount || 0),
              0
            ) || 0
        : 0;

      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalListings: processedListings.length,
        pendingListings: pending.length,
        approvedListings: approved.length,
        rejectedListings: rejected.length,
        totalRevenue: revenue,
      });

      setAllListings(sortedListings);
    } catch (error) {
      console.error("Error loading admin data:", error);
      console.error("Error details:", error.message, error.status, error.data);

      // Set empty data on error
      setStats({
        totalUsers: 0,
        totalListings: 0,
        pendingListings: 0,
        approvedListings: 0,
        rejectedListings: 0,
        totalRevenue: 0,
      });
      setAllListings([]);
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

    // Product type filter
    if (productTypeFilter !== "all") {
      filtered = filtered.filter((l) => l.productType === productTypeFilter);
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
      console.log("Approving listing with ID:", listingId);

      // Use the correct API endpoint: PUT /api/Product/approve/{id}
      await apiRequest(`/api/Product/approve/${listingId}`, {
        method: "PUT",
      });

      console.log("Product approved successfully!");

      // Send notification to the seller
      try {
        // Get listing details to find seller info
        const listing = allListings.find((l) => getId(l) === listingId);
        console.log("🔍 AdminDashboard - Listing found:", listing);
        console.log("🔍 AdminDashboard - Listing sellerId:", listing?.sellerId);
        console.log("🔍 AdminDashboard - Listing title:", listing?.title);

        if (listing && listing.sellerId) {
          console.log(
            "🔔 AdminDashboard - Sending notification to sellerId:",
            listing.sellerId
          );
          const notificationSent = await notifyPostApproved(
            listing.sellerId,
            listing.title || "Bài đăng của bạn"
          );

          if (notificationSent) {
            console.log("✅ Notification sent to seller");
          } else {
            console.log("⚠️ Notification API not available");
          }
        } else {
          console.warn("❌ Could not find listing or sellerId:", {
            listing,
            sellerId: listing?.sellerId,
          });
        }
      } catch (notificationError) {
        console.warn("Could not send notification:", notificationError);
        // Don't block the approve process
      }

      showToast({
        title: "✅ Duyệt bài đăng thành công!",
        description: "Bài đăng đã được phê duyệt và hiển thị trên trang chủ.",
        type: "success",
      });
      setShowModal(false);
      loadAdminData();
    } catch (error) {
      console.error("Error approving listing:", error);
      showToast({
        title: "❌ Lỗi khi duyệt bài đăng",
        description: error.message || "Unknown error",
        type: "error",
      });
    }
  };

  const handleReject = async (listingId) => {
    try {
      console.log("Rejecting listing with ID:", listingId);

      // Try different reject API endpoints
      const rejectEndpoints = [
        // Try dedicated reject endpoint first
        `/api/Product/reject/${listingId}`,
        // Fallback to update endpoint
        `/api/Product/${listingId}`,
      ];

      let rejected = false;
      for (const endpoint of rejectEndpoints) {
        try {
          if (endpoint.includes("/reject/")) {
            // Try PUT to reject endpoint
            await apiRequest(endpoint, {
              method: "PUT",
            });
          } else {
            // Try PUT to update status
            await apiRequest(endpoint, {
              method: "PUT",
              body: { status: "rejected" },
            });
          }
          console.log(`Product rejected successfully using ${endpoint}!`);
          rejected = true;
          break;
        } catch (endpointError) {
          console.log(
            `Reject endpoint ${endpoint} failed:`,
            endpointError.message
          );
        }
      }

      if (!rejected) {
        throw new Error("Tất cả API reject đều thất bại");
      }

      // Send notification to the seller
      try {
        // Get listing details to find seller info
        const listing = allListings.find((l) => getId(l) === listingId);
        if (listing && listing.sellerId) {
          const notificationSent = await notifyPostRejected(
            listing.sellerId,
            listing.title || "Bài đăng của bạn"
          );

          if (notificationSent) {
            console.log("✅ Rejection notification sent to seller");
          } else {
            console.log("⚠️ Notification API not available");
          }
        }
      } catch (notificationError) {
        console.warn(
          "Could not send rejection notification:",
          notificationError
        );
        // Don't block the reject process
      }

      showToast({
        title: "✅ Từ chối bài đăng thành công!",
        description:
          "Bài đăng đã được từ chối và không hiển thị trên trang chủ.",
        type: "success",
      });
      setShowModal(false);
      loadAdminData();
    } catch (error) {
      console.error("Error rejecting listing:", error);
      showToast({
        title: "❌ Lỗi khi từ chối bài đăng",
        description: error.message || "Unknown error",
        type: "error",
      });
    }
  };

  const openListingModal = (listing) => {
    console.log("Opening modal for listing:", listing);
    console.log("Listing status:", listing.status);
    console.log("Will show approve buttons:", listing.status === "pending");
    setSelectedListing(listing);
    setCurrentImageIndex(0); // Reset to first image
    setExpandedDetails(false); // Reset expanded details
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
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Quản lý và duyệt bài đăng</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Tổng tin đăng
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalListings}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.approvedListings} đã duyệt
                </p>
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
                <p className="text-gray-500 text-sm font-medium">Từ chối</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.rejectedListings}
                </p>
                <p className="text-xs text-red-600 mt-1">Không đạt yêu cầu</p>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-xl">
                <XCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Tổng người dùng
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers}
                </p>
                <p className="text-xs text-blue-600 mt-1">Đã đăng ký</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Tỷ lệ duyệt
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.totalListings > 0
                    ? Math.round(
                        (stats.approvedListings / stats.totalListings) * 100
                      )
                    : 0}
                  %
                </p>
                <p className="text-green-100 text-xs mt-1">
                  {stats.approvedListings}/{stats.totalListings} bài đăng
                </p>
              </div>
              <BarChart3 className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Hoạt động hôm nay
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.pendingListings + stats.approvedListings}
                </p>
                <p className="text-purple-100 text-xs mt-1">Tin đăng mới</p>
              </div>
              <Activity className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Cần xử lý</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.pendingListings}
                </p>
                <p className="text-orange-100 text-xs mt-1">
                  Tin đăng chờ duyệt
                </p>
              </div>
              <Clock className="h-12 w-12 text-orange-200" />
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
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="vehicle">🚗 Xe điện</option>
                <option value="battery">🔋 Pin</option>
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
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-24 h-24 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Car className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
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
                            <Users className="h-4 w-4" />
                            <span>
                              {listing.seller?.fullName ||
                                listing.seller?.full_name ||
                                listing.seller?.name ||
                                listing.seller?.email?.split("@")[0] ||
                                "Không xác định"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4" />
                            <span>
                              {listing.licensePlate ||
                                listing.license_plate ||
                                "Chưa cập nhật"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(
                                listing.createdAt ||
                                  listing.created_at ||
                                  listing.createdDate
                              ).toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
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
                  {selectedListing.images &&
                  selectedListing.images.length > 0 ? (
                    <div className="space-y-4">
                      {/* Image Slider */}
                      <div className="relative">
                        <img
                          src={selectedListing.images[currentImageIndex]}
                          alt={selectedListing.title}
                          className="w-full h-64 object-cover rounded-xl"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />

                        {/* Navigation Buttons */}
                        {selectedListing.images.length > 1 && (
                          <>
                            <button
                              onClick={() => {
                                const prevIndex =
                                  currentImageIndex === 0
                                    ? selectedListing.images.length - 1
                                    : currentImageIndex - 1;
                                setCurrentImageIndex(prevIndex);
                              }}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>

                            <button
                              onClick={() => {
                                const nextIndex =
                                  currentImageIndex ===
                                  selectedListing.images.length - 1
                                    ? 0
                                    : currentImageIndex + 1;
                                setCurrentImageIndex(nextIndex);
                              }}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                            >
                              <svg
                                className="w-5 h-5"
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
                            </button>
                          </>
                        )}

                        {/* Image Counter */}
                        {selectedListing.images.length > 1 && (
                          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} /{" "}
                            {selectedListing.images.length}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Car className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
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

                  {/* Product Info with Expandable Details */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    {/* Basic Info - Always Visible */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Thương hiệu
                        </p>
                        <p className="font-medium text-base">
                          {selectedListing.brand || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Model</p>
                        <p className="font-medium text-base">
                          {selectedListing.model || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Biển số</p>
                        <p className="font-medium text-base">
                          {selectedListing.licensePlate ||
                            selectedListing.license_plate ||
                            "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Đăng lúc</p>
                        <p className="font-medium text-base">
                          {new Date(
                            selectedListing.createdAt ||
                              selectedListing.created_at ||
                              selectedListing.createdDate
                          ).toLocaleString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setExpandedDetails(!expandedDetails)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {expandedDetails ? "Thu gọn" : "Xem thêm thông tin"}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedDetails ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Expanded Details */}
                    {expandedDetails && (
                      <div className="space-y-4 pt-4 border-t border-gray-200 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Năm sản xuất
                            </p>
                            <p className="font-medium">
                              {selectedListing.year || "Chưa cập nhật"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Số km</p>
                            <p className="font-medium">
                              {selectedListing.mileage || "Chưa cập nhật"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Tình trạng
                            </p>
                            <p className="font-medium">
                              {selectedListing.condition || "Chưa cập nhật"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Địa chỉ
                            </p>
                            <p className="font-medium">
                              {selectedListing.location || "Chưa cập nhật"}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        {selectedListing.description &&
                          selectedListing.description !== "Chưa có mô tả" && (
                            <div>
                              <p className="text-sm text-gray-500 mb-2">
                                Mô tả
                              </p>
                              <p className="text-gray-700 bg-white p-3 rounded-lg border">
                                {selectedListing.description}
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Show approve/reject buttons for all non-approved listings */}
              {selectedListing.status !== "approved" &&
                selectedListing.status !== "sold" && (
                  <div className="mt-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Hành động quản trị
                      </h4>
                      <p className="text-sm text-blue-700">
                        Trạng thái hiện tại:{" "}
                        <span className="font-medium">
                          {selectedListing.status}
                        </span>
                      </p>
                    </div>

                    <div className="flex space-x-4">
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
                  </div>
                )}

              {/* Show info for already approved/sold listings */}
              {selectedListing.status === "approved" && (
                <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-green-900">
                        Tin đăng đã được duyệt
                      </h4>
                      <p className="text-sm text-green-700">
                        Tin đăng này đã được phê duyệt và hiển thị trên trang
                        chủ
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedListing.status === "sold" && (
                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Package className="h-6 w-6 text-gray-600 mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Tin đăng đã bán
                      </h4>
                      <p className="text-sm text-gray-700">
                        Sản phẩm này đã được bán
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
