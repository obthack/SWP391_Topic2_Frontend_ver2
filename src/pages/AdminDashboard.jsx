import { useState, useEffect } from "react";
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate } from "../utils/formatters";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingListings: 0,
    totalTransactions: 0,
    totalRevenue: 0,
  });
  const [pendingListings, setPendingListings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [users, listings, transactions] = await Promise.all([
        apiRequest("/api/User"),
        apiRequest("/api/Product"),
        apiRequest("/api/Order"),
      ]);

      const pending = listings?.filter((l) => l.status === "pending") || [];
      const revenue =
        transactions
          ?.filter((t) => t.status === "completed")
          .reduce(
            (sum, t) => sum + parseFloat(t.totalAmount || t.amount || 0),
            0
          ) || 0;

      setStats({
        totalUsers: users?.length || 0,
        totalListings: listings?.length || 0,
        pendingListings: pending.length,
        totalTransactions: transactions?.length || 0,
        totalRevenue: revenue,
      });

      setPendingListings(pending.slice(0, 5));
      setRecentTransactions(transactions?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId) => {
    try {
      await apiRequest(`/api/Product/${listingId}`, {
        method: "PUT",
        body: { status: "approved" },
      });
      loadAdminData();
    } catch (error) {
      console.error("Error approving listing:", error);
    }
  };

  const handleReject = async (listingId) => {
    try {
      await apiRequest(`/api/Product/${listingId}`, {
        method: "PUT",
        body: { status: "rejected" },
      });
      loadAdminData();
    } catch (error) {
      console.error("Error rejecting listing:", error);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Tổng quan và quản lý hệ thống</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Người dùng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tổng tin đăng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalListings}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Chờ duyệt</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.pendingListings}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Giao dịch</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.totalTransactions}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Doanh thu</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Tin đăng chờ duyệt
            </h2>
            {pendingListings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">Không có tin đăng nào chờ duyệt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={
                          listing.images?.[0] ||
                          "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=100"
                        }
                        alt={listing.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {listing.brand} {listing.model} - {listing.year}
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          {formatPrice(listing.price)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Đăng lúc: {formatDate(listing.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <button
                        onClick={() => handleApprove(listing.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(listing.id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Giao dịch gần đây
            </h2>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Giao dịch #{transaction.id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {transaction.status === "completed" && "Hoàn thành"}
                        {transaction.status === "pending" && "Đang xử lý"}
                        {transaction.status === "cancelled" && "Đã hủy"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        Số tiền:{" "}
                        {formatPrice(
                          transaction.totalAmount || transaction.amount || 0
                        )}
                      </p>
                      <p>Trạng thái: {transaction.status}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(
                          transaction.createdAt ||
                            transaction.created_at ||
                            transaction.createdDate
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
