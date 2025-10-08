import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, DollarSign, Eye, Heart, Settings, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { ProductCard } from "../components/molecules/ProductCard";
import { formatPrice } from "../utils/formatters";
import "../styles/dashboard.css";

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
  });
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

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

      setStats({
        totalListings: total,
        activeListings: active,
        soldListings: sold,
        totalViews: views,
      });
      setMyListings(normalized);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Chào mừng,{" "}
            {user?.fullName ||
              user?.name ||
              profile?.full_name ||
              profile?.fullName ||
              profile?.name ||
              user?.email ||
              "bạn"}
            !
          </h1>
          <p className="dashboard-subtitle">
            Quản lý tin đăng và theo dõi hoạt động của bạn
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Tổng tin đăng</p>
                <p className="stat-value">
                  {stats.totalListings}
                </p>
              </div>
              <div className="stat-icon-container">
                <Package className="stat-icon" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Đang hoạt động</p>
                <p className="stat-value stat-value-green">
                  {stats.activeListings}
                </p>
              </div>
              <div className="stat-icon-container stat-icon-container-green">
                <Eye className="stat-icon stat-icon-green" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Đã bán</p>
                <p className="stat-value stat-value-orange">
                  {stats.soldListings}
                </p>
              </div>
              <div className="stat-icon-container stat-icon-container-orange">
                <DollarSign className="stat-icon stat-icon-orange" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Lượt xem</p>
                <p className="stat-value stat-value-purple">
                  {stats.totalViews}
                </p>
              </div>
              <div className="stat-icon-container stat-icon-container-purple">
                <Eye className="stat-icon stat-icon-purple" />
              </div>
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="listings-section">
            <div className="listings-card">
              <div className="listings-header">
                <h2 className="listings-title">
                  Tin đăng của bạn
                </h2>
                <div className="listings-actions">
                  <Link
                    to="/my-listings"
                    className="action-button action-button-gray"
                  >
                    <Eye className="action-button-icon" />
                    Xem tất cả
                  </Link>
                  <Link
                    to="/create-listing"
                    className="action-button action-button-blue"
                  >
                    <Plus className="action-button-icon" />
                    Đăng tin mới
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="loading-skeleton">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="skeleton-item"
                    ></div>
                  ))}
                </div>
              ) : myListings.length === 0 ? (
                <div className="empty-state">
                  <Package className="empty-icon" />
                  <p className="empty-text">Bạn chưa có tin đăng nào</p>
                  <Link
                    to="/create-listing"
                    className="empty-button"
                  >
                    <Plus className="empty-button-icon" />
                    Đăng tin đầu tiên
                  </Link>
                </div>
              ) : (
                <div className="listings-list">
                  {myListings.slice(0, 5).map((listing, idx) => (
                    <div
                      key={
                        getListingId(listing) ??
                        `${listing.title || "listing"}_${idx}`
                      }
                      className="listing-item"
                    >
                      <img
                        src={
                          listing.images && listing.images.length > 0
                            ? listing.images[0]
                            : "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=200"
                        }
                        alt={listing.title}
                        className="listing-image"
                        onError={(e) => {
                          e.target.src =
                            "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=200";
                        }}
                      />
                      <div className="listing-content">
                        <h3 className="listing-title">
                          {listing.title}
                        </h3>
                        <p className="listing-subtitle">
                          {listing.licensePlate || listing.license_plate || ""}
                        </p>
                        <div className="listing-details">
                          <span className="listing-price">
                            {formatPrice(listing.price)}
                          </span>
                          <span
                            className={`status-badge ${
                              listing.status === "approved"
                                ? "status-approved"
                                : listing.status === "pending"
                                ? "status-pending"
                                : listing.status === "sold"
                                ? "status-sold"
                                : "status-rejected"
                            }`}
                          >
                            {listing.status === "approved" && "Đã duyệt"}
                            {listing.status === "pending" && "Chờ duyệt"}
                            {listing.status === "sold" && "Đã bán"}
                            {listing.status === "rejected" && "Từ chối"}
                          </span>
                          <span className="listing-views">
                            <Eye className="listing-views-icon" />
                            {listing.views_count || 0}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/listing/${getListingId(listing) || ""}/edit`}
                        className="listing-edit"
                      >
                        <Settings className="listing-edit-icon" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sidebar">
            <div className="account-card">
              <h2 className="account-title">
                Thông tin tài khoản
              </h2>
              <div className="account-info">
                <div className="account-field">
                  <label className="account-label">Họ và tên</label>
                  <p className="account-value">
                    {profile?.full_name ||
                      profile?.fullName ||
                      user?.fullName ||
                      user?.name ||
                      "Chưa cập nhật"}
                  </p>
                </div>
                <div className="account-field">
                  <label className="account-label">Email</label>
                  <p className="account-value">
                    {user?.email || profile?.email || "Chưa cập nhật"}
                  </p>
                </div>
                <div className="account-field">
                  <label className="account-label">Số điện thoại</label>
                  <p className="account-value">
                    {profile?.phone || user?.phone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>

            <div className="upgrade-card">
              <h3 className="upgrade-title">Nâng cấp tài khoản</h3>
              <p className="upgrade-description">
                Đăng tin không giới hạn và được ưu tiên hiển thị
              </p>
              <button className="upgrade-button">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
