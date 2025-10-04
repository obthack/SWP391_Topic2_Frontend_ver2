import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, Eye, Plus, Search, Filter } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate } from "../utils/formatters";

export const MyListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user) {
      loadListings();
    }
  }, [user]);

  const loadListings = async () => {
    try {
      const data = await apiRequest(
        `/api/Product/seller/${
          user?.id || user?.accountId || user?.userId || 1
        }`
      );
      console.log("Loaded listings data:", data);
      setListings(data || []);
    } catch (error) {
      console.error("Error loading listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;

    try {
      console.log("Deleting listing with ID:", listingId);
      console.log("Type of listingId:", typeof listingId);

      if (!listingId || listingId === "undefined" || listingId === undefined) {
        alert("Không thể xóa: ID bài đăng không hợp lệ");
        return;
      }

      await apiRequest(`/api/Product/${listingId}`, {
        method: "DELETE",
      });
      console.log("Delete successful, reloading listings...");
      loadListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      console.error("Error details:", error.data);
      alert(
        "Có lỗi xảy ra khi xóa bài đăng: " + (error.message || "Unknown error")
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Chờ duyệt",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Đã duyệt",
      },
      rejected: { bg: "bg-red-100", text: "text-red-700", label: "Từ chối" },
      sold: { bg: "bg-gray-100", text: "text-gray-700", label: "Đã bán" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý tin đăng
              </h1>
              <p className="text-gray-600 mt-2">
                Quản lý và theo dõi các bài đăng của bạn
              </p>
            </div>
            <Link
              to="/create-listing"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Đăng tin mới
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề, hãng xe, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="sold">Đã bán</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {listings.length === 0
                ? "Chưa có tin đăng nào"
                : "Không tìm thấy tin đăng phù hợp"}
            </h3>
            <p className="text-gray-600 mb-6">
              {listings.length === 0
                ? "Hãy tạo bài đăng đầu tiên của bạn"
                : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"}
            </p>
            {listings.length === 0 && (
              <Link
                to="/create-listing"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Tạo tin đăng đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
              console.log("Listing object:", listing);
              console.log(
                "Listing ID:",
                listing.id,
                "Type:",
                typeof listing.id
              );
              return (
                <div
                  key={
                    listing.id ||
                    listing.productId ||
                    listing.Id ||
                    listing.listingId
                  }
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={
                        listing.images?.[0] ||
                        "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=400"
                      }
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(listing.status)}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {listing.brand} {listing.model} - {listing.year}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mb-4">
                      {formatPrice(listing.price)}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {listing.viewsCount || listing.views_count || 0} lượt
                        xem
                      </span>
                      <span>
                        {formatDate(
                          listing.createdAt ||
                            listing.created_at ||
                            listing.createdDate
                        )}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/listing/${
                          listing.id ||
                          listing.productId ||
                          listing.Id ||
                          listing.listingId
                        }/edit`}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          // Try different ID field names
                          const listingId =
                            listing.id ||
                            listing.productId ||
                            listing.Id ||
                            listing.listingId;
                          console.log("Trying to delete with ID:", listingId);
                          handleDelete(listingId);
                        }}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {listings.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thống kê
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {listings.length}
                </p>
                <p className="text-sm text-gray-600">Tổng tin đăng</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {listings.filter((l) => l.status === "approved").length}
                </p>
                <p className="text-sm text-gray-600">Đã duyệt</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {listings.filter((l) => l.status === "pending").length}
                </p>
                <p className="text-sm text-gray-600">Chờ duyệt</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {listings.filter((l) => l.status === "sold").length}
                </p>
                <p className="text-sm text-gray-600">Đã bán</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
