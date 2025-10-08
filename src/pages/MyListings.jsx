import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, Eye, Plus, Search, Filter } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { formatPrice, formatDate } from "../utils/formatters";
import { useToast } from "../contexts/ToastContext";
import "../styles/mylistings.css";

export const MyListings = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user) {
      loadListings();
    }
  }, [user]);

  const getListingId = (l) =>
    l?.id ?? l?.productId ?? l?.Id ?? l?.listingId ?? l?.product_id ?? null;
  const norm = (val) => String(val || "").toLowerCase();
  const getStatus = (l) => {
    const raw = norm(l?.status ?? l?.Status ?? l?.state);
    if (raw.includes("pending") || raw.includes("chờ")) return "pending";
    if (raw.includes("approve") || raw.includes("duyệt")) return "approved";
    if (raw.includes("reject") || raw.includes("từ chối")) return "rejected";
    if (raw.includes("sold") || raw.includes("đã bán")) return "sold";
    return raw || "pending";
  };

  const loadListings = async () => {
    try {
      const data = await apiRequest(
        `/api/Product/seller/${
          user?.id || user?.accountId || user?.userId || 1
        }`
      );
      console.log("Loaded listings data:", data);
      const items = Array.isArray(data) ? data : data?.items || [];

      // Debug: log the first item to see its structure
      if (items.length > 0) {
        console.log("First listing item structure:", items[0]);
        console.log("Available keys in first item:", Object.keys(items[0]));
      }
      const filtered = items
        .filter((l) => {
          const s = norm(l?.status || l?.Status || "");
          return s !== "deleted" && s !== "inactive";
        })
        .map(async (l) => {
          // Skip the problematic endpoint for now and check product object directly
          let images = [];

          console.log(
            `Checking images for product: ${l.id || l.productId || l.Id}`
          );

          // Check if images are stored directly in the product object first
          if (l.images && Array.isArray(l.images)) {
            images = l.images;
            console.log(
              `Using images from product object for ${l.id}:`,
              images
            );
          } else {
            // Check other possible image fields
            const possibleImageFields = [
              "image",
              "photo",
              "thumbnail",
              "picture",
              "img",
              "Image",
              "Photo",
              "Thumbnail",
              "Picture",
              "Img",
              "primaryImage",
              "mainImage",
              "coverImage",
            ];

            for (const field of possibleImageFields) {
              if (l[field]) {
                if (Array.isArray(l[field])) {
                  images = l[field];
                } else if (typeof l[field] === "string") {
                  images = [l[field]];
                }
                console.log(
                  `Found images in field '${field}' for product ${l.id}:`,
                  images
                );
                break;
              }
            }
          }

          // Only try the API endpoint if no images found in product object
          if (images.length === 0) {
            try {
              console.log(
                `Trying API endpoint for product: ${
                  l.id || l.productId || l.Id
                }`
              );
              const imagesData = await apiRequest(
                `/api/ProductImage/product/${l.id || l.productId || l.Id}`
              );
              console.log(`Images data for product ${l.id}:`, imagesData);

              const imagesArray = Array.isArray(imagesData)
                ? imagesData
                : imagesData?.items || [];

              images = imagesArray.map(
                (img) =>
                  img.imageData ||
                  img.imageUrl ||
                  img.url ||
                  img.ImageData ||
                  img.ImageUrl ||
                  img.Url
              );

              console.log(`Processed images for product ${l.id}:`, images);
            } catch (error) {
              console.log(
                `Error loading images from ProductImage endpoint for product ${l.id}:`,
                error
              );
            }
          }

          return {
            ...l,
            status: getStatus(l),
            images: images,
          };
        });

      // Wait for all image loading to complete
      const listingsWithImages = await Promise.all(filtered);
      setListings(listingsWithImages);
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

      try {
        await apiRequest(`/api/Product/${listingId}`, {
          method: "PUT",
          body: { status: "deleted" },
        });
      } catch {
        await apiRequest(`/api/Product/${listingId}`, { method: "DELETE" });
      }
      setListings((prev) => prev.filter((l) => getListingId(l) !== listingId));
      show({
        title: "Đã chuyển vào thùng rác",
        description: "Bạn có thể khôi phục trong Thùng rác",
        type: "success",
      });
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
    const s = status ? status : "pending";
    const statusConfig = {
      pending: {
        className: "mylistings-status-badge mylistings-status-pending",
        label: "Chờ duyệt",
      },
      approved: {
        className: "mylistings-status-badge mylistings-status-approved",
        label: "Đã duyệt",
      },
      rejected: { 
        className: "mylistings-status-badge mylistings-status-rejected", 
        label: "Từ chối" 
      },
      sold: { 
        className: "mylistings-status-badge mylistings-status-sold", 
        label: "Đã bán" 
      },
    };
    const config = statusConfig[s] || statusConfig.pending;
    return (
      <span className={config.className}>
        {config.label}
      </span>
    );
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      (listing.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.model || "").toLowerCase().includes(searchTerm.toLowerCase());
    const s = getStatus(listing);
    const matchesStatus = statusFilter === "all" || s === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="mylistings-loading">
        <div className="mylistings-loading-content">
          <div className="mylistings-spinner"></div>
          <p className="mylistings-loading-text">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mylistings-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mylistings-header">
          <div className="mylistings-header-content">
            <div className="mylistings-title-section">
              <h1 className="mylistings-title">
                Quản lý tin đăng
              </h1>
              <p className="mylistings-subtitle">
                Quản lý và theo dõi các bài đăng của bạn
              </p>
            </div>
            <div className="mylistings-actions">
              <Link
                to="/trash"
                className="mylistings-trash-button"
              >
                Thùng rác
              </Link>
              <Link
                to="/create-listing"
                className="mylistings-create-button"
              >
                <Plus className="mylistings-create-icon" />
                Đăng tin mới
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mylistings-filters">
          <div className="mylistings-filters-grid">
            <div className="mylistings-search-container">
              <Search className="mylistings-search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề, hãng xe, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mylistings-search-input"
              />
            </div>
            <div className="mylistings-filter-container">
              <Filter className="mylistings-filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mylistings-filter-select"
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
          <div className="mylistings-empty-state">
            <div className="mylistings-empty-icon-container">
              <Eye className="mylistings-empty-icon" />
            </div>
            <h3 className="mylistings-empty-title">
              {listings.length === 0
                ? "Chưa có tin đăng nào"
                : "Không tìm thấy tin đăng phù hợp"}
            </h3>
            <p className="mylistings-empty-description">
              {listings.length === 0
                ? "Hãy tạo bài đăng đầu tiên của bạn"
                : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"}
            </p>
            {listings.length === 0 && (
              <Link
                to="/create-listing"
                className="mylistings-empty-button"
              >
                <Plus className="mylistings-empty-button-icon" />
                Tạo tin đăng đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="mylistings-grid">
            {filteredListings.map((listing) => {
              const idVal = getListingId(listing);
              console.log("Listing object:", listing);
              console.log("Listing ID:", idVal, "Type:", typeof idVal);
              return (
                <div
                  key={idVal}
                  className="mylistings-card"
                >
                  <div className="mylistings-image-container">
                    <img
                      src={
                        listing.images && listing.images.length > 0
                          ? listing.images[0]
                          : "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=400"
                      }
                      alt={listing.title}
                      className="mylistings-image"
                      onError={(e) => {
                        console.log(
                          `Image failed to load for listing ${
                            listing.id || listing.title
                          }:`,
                          e.target.src
                        );
                        e.target.src =
                          "https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=400";
                      }}
                      onLoad={(e) => {
                        console.log(
                          `Image loaded successfully for listing ${
                            listing.id || listing.title
                          }:`,
                          e.target.src
                        );
                      }}
                    />
                    <div className="mylistings-status-badge-container">
                      {getStatusBadge(getStatus(listing))}
                    </div>
                  </div>

                  <div className="mylistings-card-content">
                    <h3 className="mylistings-card-title">
                      {listing.title}
                    </h3>
                    <p className="mylistings-card-subtitle">
                      {listing.licensePlate || listing.license_plate || ""}
                    </p>
                    <p className="mylistings-card-price">
                      {formatPrice(listing.price)}
                    </p>

                    <div className="mylistings-card-meta">
                      <span className="mylistings-card-views">
                        <Eye className="mylistings-card-views-icon" />
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

                    <div className="mylistings-card-actions">
                      <Link
                        to={`/listing/${getListingId(listing)}/edit`}
                        className="mylistings-edit-button"
                      >
                        <Edit className="mylistings-edit-icon" />
                        Chỉnh sửa
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          // Try different ID field names
                          const listingId = getListingId(listing);
                          console.log("Trying to delete with ID:", listingId);
                          handleDelete(listingId);
                        }}
                        className="mylistings-delete-button"
                      >
                        <Trash2 className="mylistings-delete-icon" />
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
          <div className="mylistings-stats">
            <h3 className="mylistings-stats-title">
              Thống kê
            </h3>
            <div className="mylistings-stats-grid">
              <div className="mylistings-stat-item">
                <p className="mylistings-stat-value">
                  {listings.length}
                </p>
                <p className="mylistings-stat-label">Tổng tin đăng</p>
              </div>
              <div className="mylistings-stat-item">
                <p className="mylistings-stat-value mylistings-stat-value-green">
                  {listings.filter((l) => getStatus(l) === "approved").length}
                </p>
                <p className="mylistings-stat-label">Đã duyệt</p>
              </div>
              <div className="mylistings-stat-item">
                <p className="mylistings-stat-value mylistings-stat-value-yellow">
                  {listings.filter((l) => getStatus(l) === "pending").length}
                </p>
                <p className="mylistings-stat-label">Chờ duyệt</p>
              </div>
              <div className="mylistings-stat-item">
                <p className="mylistings-stat-value mylistings-stat-value-gray">
                  {listings.filter((l) => getStatus(l) === "sold").length}
                </p>
                <p className="mylistings-stat-label">Đã bán</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
