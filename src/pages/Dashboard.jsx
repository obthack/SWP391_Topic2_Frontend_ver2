import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  DollarSign,
  Eye,
  Heart,
  Settings,
  Plus,
  TrendingUp,
  Users,
  MessageSquare,
  Star,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Target,
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
    monthlyGrowth: 0,
  });
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [productTypeFilter, setProductTypeFilter] = useState("all"); // all, vehicle, battery

  useEffect(() => {
    if (user) {
      console.log("=== DASHBOARD USER DATA ===");
      console.log("User object:", user);
      console.log("Profile object:", profile);
      console.log("User fullName:", user?.fullName);
      console.log("User full_name:", user?.full_name);
      console.log("User phone:", user?.phone);
      console.log("===========================");
      loadDashboardData();
    }
  }, [user, profile]);

  // Additional effect to log when user data changes
  useEffect(() => {
    console.log("=== USER DATA CHANGED ===");
    console.log("User fullName changed to:", user?.fullName);
    console.log("User phone changed to:", user?.phone);
    console.log("=========================");
  }, [user?.fullName, user?.phone]);

  const loadDashboardData = async () => {
    try {
      // Load vehicles and batteries separately for the seller
      const sellerId = user?.id || user?.accountId || user?.userId || 1;
      console.log("🔍 Dashboard loading for sellerId:", sellerId);

      // Use seller-specific API (now has productType field)
      console.log("🔄 Using seller-specific API (has productType)");
      const sellerData = await apiRequest(`/api/Product/seller/${sellerId}`);
      console.log("✅ Seller API successful:", sellerData.length, "items");

      const sellerItems = Array.isArray(sellerData)
        ? sellerData
        : sellerData?.items || [];

      console.log("🔍 Seller data loaded:", sellerItems.length, "items");

      // Debug: Check if products belong to the current seller
      if (sellerItems.length > 0) {
        console.log("🔍 First item seller info:", {
          sellerId: sellerItems[0].sellerId,
          SellerId: sellerItems[0].SellerId,
          seller_id: sellerItems[0].seller_id,
          currentSellerId: sellerId,
        });
        console.log(
          "🔍 All seller IDs in data:",
          sellerItems.map(
            (item) => item.sellerId || item.SellerId || item.seller_id
          )
        );

        // Debug: Check all products for classification fields
        console.log("🔍 All products classification fields:");
        sellerItems.forEach((item, index) => {
          console.log(`Product ${index + 1} (ID: ${item.productId}):`, {
            title: item.title,
            productType: item.productType,
            vehicleType: item.vehicleType,
            batteryType: item.batteryType,
            licensePlate: item.licensePlate,
            capacity: item.capacity,
            voltage: item.voltage,
            cycleCount: item.cycleCount,
            allKeys: Object.keys(item),
          });
        });
      }

      // Classify products - use single pass to avoid duplicates
      const vehiclesData = [];
      const batteriesData = [];

      sellerItems.forEach((item) => {
        // PRIORITY 1: Check productType field first (most reliable)
        if (item.productType === "vehicle" || item.productType === "Vehicle") {
          console.log(
            `✅ Product ${item.productId} → VEHICLE (productType field)`
          );
          vehiclesData.push(item);
          return;
        }

        if (item.productType === "battery" || item.productType === "Battery") {
          console.log(
            `✅ Product ${item.productId} → BATTERY (productType field)`
          );
          batteriesData.push(item);
          return;
        }

        // If no productType, default to vehicle
        console.log(
          `✅ Product ${item.productId} → VEHICLE (default - no productType)`
        );
        vehiclesData.push(item);
      });

      // Unclassified products go to vehicles by default
      const unclassifiedProducts = sellerItems.filter(
        (item) => !vehiclesData.includes(item) && !batteriesData.includes(item)
      );

      if (unclassifiedProducts.length > 0) {
        console.log(
          "🔍 Adding unclassified products to vehicles:",
          unclassifiedProducts.length
        );
        vehiclesData.push(...unclassifiedProducts);
      }

      console.log("🚗 Vehicles classified:", vehiclesData.length);
      console.log("🔋 Batteries classified:", batteriesData.length);

      console.log("🔍 Final vehicles:", vehiclesData.length);
      console.log("🔍 Final batteries:", batteriesData.length);

      // Data is already separated by API endpoints
      // No need for complex classification logic

      // Debug: Show classification details
      if (vehiclesData.length > 0) {
        console.log(
          "🚗 Vehicle products:",
          vehiclesData.map((item) => ({
            id: item.productId || item.id,
            title: item.title,
            brand: item.brand,
            classification: "vehicle",
          }))
        );
      }

      if (batteriesData.length > 0) {
        console.log(
          "🔋 Battery products:",
          batteriesData.map((item) => ({
            id: item.productId || item.id,
            title: item.title,
            brand: item.brand,
            classification: "battery",
          }))
        );
      }

      // Keep original productType from database, only add if missing
      const vehicles = vehiclesData.map((x) => ({
        ...x,
        productType: x.productType || "vehicle", // Keep original productType from DB
      }));
      const batteries = batteriesData.map((x) => ({
        ...x,
        productType: x.productType || "battery", // Keep original productType from DB
      }));

      console.log("🔍 Vehicles processed:", vehicles.length);
      console.log("🔍 Batteries processed:", batteries.length);

      // Combine all data
      const data = [...vehicles, ...batteries];

      console.log("🔍 Combined data:", data.length, "items");
      const norm = (v) => String(v || "").toLowerCase();
      const mapStatus = (l) => {
        const raw = norm(l?.status || l?.Status);
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
        return raw || "pending";
      };
      const items = Array.isArray(data) ? data : data?.items || [];
      const filtered = items.filter((l) => {
        const s = norm(l?.status || l?.Status || "");
        return s !== "deleted" && s !== "inactive";
      });

      // Load images for each listing with delay to prevent DbContext conflicts
      const normalized = await Promise.all(
        filtered.map(async (l, index) => {
          try {
            // Add delay between API calls to prevent DbContext conflicts
            if (index > 0) {
              await new Promise((resolve) => setTimeout(resolve, 100 * index));
            }

            const productId = l.id || l.productId || l.Id;
            console.log(`🖼️ Loading images for product ${productId}...`);

            const imagesData = await apiRequest(
              `/api/ProductImage/product/${productId}`
            );
            const images = Array.isArray(imagesData)
              ? imagesData
              : imagesData?.items || [];

            console.log(
              `✅ Images loaded for product ${productId}:`,
              images.length
            );
            return {
              ...l,
              status: mapStatus(l),
              images: images.map(
                (img) => img.imageData || img.imageUrl || img.url
              ),
            };
          } catch (error) {
            console.warn(
              `⚠️ Failed to load images for product ${
                l.id || l.productId || l.Id
              }:`,
              error.message
            );

            // Use fallback placeholder images based on product type
            const isVehicle =
              l.productType === "vehicle" ||
              (l.title && l.title.toLowerCase().includes("xe")) ||
              (l.brand &&
                ["toyota", "honda", "ford", "bmw", "mercedes"].some((b) =>
                  l.brand.toLowerCase().includes(b)
                ));

            const fallbackImages = isVehicle
              ? [
                  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop&auto=format",
                  "https://images.unsplash.com/photo-1549317336-206569e8475c?w=400&h=300&fit=crop&auto=format",
                ]
              : [
                  "https://images.unsplash.com/photo-1609592807902-4a3a4a4a4a4a?w=400&h=300&fit=crop&auto=format",
                  "https://images.unsplash.com/photo-1609592807902-4a3a4a4a4a4b?w=400&h=300&fit=crop&auto=format",
                ];

            return {
              ...l,
              status: mapStatus(l),
              images: fallbackImages,
              imageError: true, // Flag to indicate fallback images
            };
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
        recentActivity: normalized.filter((l) => {
          const createdDate = new Date(
            l.createdDate || l.created_date || Date.now()
          );
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdDate > weekAgo;
        }).length,
        monthlyGrowth: Math.floor(Math.random() * 20) + 5, // Simulated growth
      });

      // Sort listings to show newest first (by createdDate or createdAt)
      const sortedListings = normalized.sort((a, b) => {
        const dateA = new Date(
          a.createdDate || a.createdAt || a.created_date || 0
        );
        const dateB = new Date(
          b.createdDate || b.createdAt || b.created_date || 0
        );
        return dateB - dateA; // Newest first
      });

      setMyListings(sortedListings);

      // Generate recent activity data
      const activities = normalized.slice(0, 5).map((listing) => ({
        id: getListingId(listing),
        type: "listing_view",
        title: listing.title,
        description: `Tin đăng "${listing.title}" có ${
          listing.viewsCount || 0
        } lượt xem`,
        time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        status: listing.status,
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
                    user?.full_name ||
                    user?.name ||
                    profile?.fullName ||
                    profile?.full_name ||
                    profile?.name ||
                    user?.email?.split("@")[0] ||
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
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Tổng tin đăng
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalListings}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    +{stats.monthlyGrowth}%
                  </span>
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
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Đang hoạt động
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.activeListings}
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    Đang hiển thị
                  </span>
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
                <p className="text-3xl font-bold text-orange-600">
                  {stats.soldListings}
                </p>
                <div className="flex items-center mt-2">
                  <Target className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">
                    {stats.conversionRate || 0}% tỷ lệ
                  </span>
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
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Lượt xem
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.totalViews}
                </p>
                <div className="flex items-center mt-2">
                  <Eye className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">
                    {stats.avgViewsPerListing} TB/tin
                  </span>
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
                <div className="flex items-center justify-between mb-4">
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
                <div className="flex space-x-2">
                  <button
                    onClick={() => setProductTypeFilter("all")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      productTypeFilter === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setProductTypeFilter("vehicle")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      productTypeFilter === "vehicle"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🚗 Xe điện
                  </button>
                  <button
                    onClick={() => setProductTypeFilter("battery")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      productTypeFilter === "battery"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🔋 Pin
                  </button>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Chưa có tin đăng nào
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Hãy bắt đầu bằng việc đăng tin đầu tiên của bạn
                    </p>
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
                    {myListings
                      .filter(
                        (listing) =>
                          productTypeFilter === "all" ||
                          (listing.productType &&
                            listing.productType.toLowerCase() ===
                              productTypeFilter.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((listing, idx) => (
                        <div
                          key={
                            getListingId(listing) ??
                            `${listing.title || "listing"}_${idx}`
                          }
                          className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                        >
                          <div className="relative">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  // Show fallback icon when image fails to load
                                  const fallback = e.target.nextElementSibling;
                                  if (fallback) {
                                    fallback.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center ${
                                listing.images && listing.images.length > 0
                                  ? "hidden"
                                  : ""
                              }`}
                            >
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
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
                              {listing.licensePlate ||
                                listing.license_plate ||
                                ""}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-medium text-blue-600">
                                {formatPrice(listing.price)}
                              </span>
                              <span className="text-sm text-gray-500">
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
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden mr-4">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-semibold text-lg">
                      {user?.fullName?.charAt(0) ||
                        user?.full_name?.charAt(0) ||
                        "U"}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Thông tin tài khoản
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Họ và tên</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.fullName ||
                      user?.full_name ||
                      user?.name ||
                      profile?.fullName ||
                      profile?.full_name ||
                      profile?.name ||
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
                    {user?.phone || profile?.phone || "Chưa cập nhật"}
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
                  <span className="text-sm text-gray-600">
                    Tỷ lệ chuyển đổi
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {stats.conversionRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Lượt xem trung bình
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {stats.avgViewsPerListing}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Tăng trưởng tháng
                  </span>
                  <span className="text-sm font-medium text-purple-600">
                    +{stats.monthlyGrowth}%
                  </span>
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
