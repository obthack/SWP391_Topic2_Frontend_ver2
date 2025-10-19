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
import { rejectProduct, approveProduct } from "../lib/productApi";
import { RejectProductModal } from "../components/admin/RejectProductModal";

export const AdminDashboard = () => {
  const { show: showToast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, vehicles, batteries
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    totalRevenue: 0,
    vehicleListings: 0,
    batteryListings: 0,
    activeListings: 0,
    // EV Market specific stats
    totalOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    todaysRevenue: 0,
    thisYearRevenue: 0,
    thisMonthRevenue: 0,
    averageOrderValue: 0,
    completionRate: 0,
    totalVehicles: 0,
    totalBatteries: 0,
    soldVehicles: 0,
    soldBatteries: 0,
  });

  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [skipImageLoading, setSkipImageLoading] = useState(false); // Add flag to skip image loading if causing issues

  // Reject modal state
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    product: null,
  });

  const getId = (x) => x?.id || x?.productId || x?.Id || x?.listingId;

  // Add refresh function
  const refreshData = async () => {
    setLoading(true);
    // Clear cache to force fresh data load
    localStorage.removeItem('admin_cached_products');
    localStorage.removeItem('admin_cached_users');
    localStorage.removeItem('admin_cached_orders');
    localStorage.removeItem('admin_cached_processed_listings');
    localStorage.removeItem('admin_cached_timestamp');
    
    await loadAdminData();
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    filterListings();
  }, [allListings, searchTerm, statusFilter, productTypeFilter, dateFilter, activeTab]);

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
        // Try to get cached users data
        const cachedUsers = localStorage.getItem('admin_cached_users');
        if (cachedUsers) {
          try {
            users = JSON.parse(cachedUsers);
            console.log("📦 Using cached users:", users.length);
          } catch (e) {
            console.warn("Failed to parse cached users");
          }
        }
      }

      try {
        // Load all products from unified API (has productType field)
        const allProducts = await apiRequest("/api/Product");
        listings = Array.isArray(allProducts)
          ? allProducts
          : allProducts?.items || [];
        console.log("✅ Products loaded:", listings);
        
        // Cache the products data
        localStorage.setItem('admin_cached_products', JSON.stringify(listings));
        localStorage.setItem('admin_cached_timestamp', Date.now().toString());
      } catch (error) {
        console.warn("⚠️ Failed to load products:", error.message);
        // Try to get cached products data
        const cachedProducts = localStorage.getItem('admin_cached_products');
        const cachedTimestamp = localStorage.getItem('admin_cached_timestamp');
        
        if (cachedProducts && cachedTimestamp) {
          const cacheAge = Date.now() - parseInt(cachedTimestamp);
          // Use cache if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            try {
              listings = JSON.parse(cachedProducts);
              console.log("📦 Using cached products:", listings.length);
            } catch (e) {
              console.warn("Failed to parse cached products");
            }
          }
        }
      }

      try {
        transactions = await apiRequest("/api/Order");
        console.log("✅ Orders loaded:", transactions);
      } catch (error) {
        console.warn("⚠️ Failed to load orders:", error.message);
        // Try to get cached orders data
        const cachedOrders = localStorage.getItem('admin_cached_orders');
        if (cachedOrders) {
          try {
            transactions = JSON.parse(cachedOrders);
            console.log("📦 Using cached orders:", transactions.length);
          } catch (e) {
            console.warn("Failed to parse cached orders");
          }
        }
      }

      console.log("Admin loaded data:", { 
        users: users.length, 
        listings: listings.length, 
        transactions: transactions.length,
        usersSample: users.slice(0, 2),
        listingsSample: listings.slice(0, 2)
      });

      const norm = (v) => String(v || "").toLowerCase();

      // Process listings with better field mapping - Load images in parallel with reduced delay
      const processedListings = [];
      
      // Process listings in smaller batches to avoid DbContext conflicts
      const batchSize = 2; // Reduced from 5 to 2 to avoid DbContext conflicts
      for (let i = 0; i < listings.length; i += batchSize) {
        const batch = listings.slice(i, i + batchSize);
        
        // Process batch sequentially to avoid DbContext conflicts
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          
          // Add delay between each item to avoid DbContext conflicts
          if (i > 0 || j > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          const norm = (v) => String(v || "").toLowerCase();
          // Get seller info from users array if sellerId exists
          const sellerId = item.sellerId || item.userId || item.ownerId || item.createdBy;
          let sellerInfo = {
            name: item.sellerName || item.ownerName || item.userName || "Không rõ",
            phone: item.sellerPhone || item.ownerPhone || item.contactPhone || "N/A",
            email: item.sellerEmail || item.ownerEmail || item.contactEmail || "N/A"
          };

          // Try to find seller info from users array
          if (sellerId && users.length > 0) {
            const seller = users.find(u => 
              u.userId === sellerId || 
              u.id === sellerId || 
              u.UserId === sellerId
            );
            if (seller) {
              console.log(`Found seller for product ${getId(item)}:`, seller);
              sellerInfo = {
                name: seller.fullName || seller.full_name || seller.name || sellerInfo.name,
                phone: seller.phone || sellerInfo.phone,
                email: seller.email || sellerInfo.email
              };
            } else {
              console.log(`No seller found for product ${getId(item)} with sellerId: ${sellerId}`);
            }
          } else {
            console.log(`No sellerId or users for product ${getId(item)}:`, { sellerId, usersLength: users.length });
          }

          const mapped = {
            id: getId(item),
            title: item.title || item.name || item.productName || "Không có tiêu đề",
            brand: item.brand || item.brandName || "Không rõ",
            model: item.model || item.modelName || "Không rõ",
            year: item.year || item.modelYear || item.manufacturingYear || "N/A",
            price: parseFloat(item.price || item.listPrice || item.sellingPrice || 0),
            status: (() => {
              const rawStatus = norm(item.status || item.verificationStatus || item.approvalStatus || "pending");
              // Map backend statuses to frontend statuses
              if (rawStatus === "draft" || rawStatus === "re-submit") return "pending";
              if (rawStatus === "active" || rawStatus === "approved") return "approved";
              if (rawStatus === "rejected") return "rejected";
              return rawStatus;
            })(),
            productType: norm(item.productType || item.type || item.category || "vehicle"),
            licensePlate: item.licensePlate || item.plateNumber || item.registrationNumber || "N/A",
            mileage: item.mileage || item.odometer || item.distance || "N/A",
            fuelType: item.fuelType || item.energyType || item.powerSource || "N/A",
            transmission: item.transmission || item.gearbox || "N/A",
            color: item.color || item.paintColor || "N/A",
            condition: item.condition || item.vehicleCondition || "N/A",
            description: item.description || item.details || item.content || "Không có mô tả",
            location: item.location || item.address || item.city || "Không rõ",
            sellerId: sellerId,
            sellerName: sellerInfo.name,
            sellerPhone: sellerInfo.phone,
            sellerEmail: sellerInfo.email,
            createdDate: item.createdDate || item.createdAt || item.created_date || item.dateCreated || new Date().toISOString(),
            updatedDate: item.updatedDate || item.updatedAt || item.updated_date || item.dateUpdated,
            images: item.images || item.imageUrls || item.photos || [],
            imageUrl: item.imageUrl || item.mainImage || item.primaryImage,
            rejectionReason: item.rejectionReason || item.rejectReason || item.reason || null,
            verificationStatus: (() => {
              const rawStatus = norm(item.verificationStatus || item.status || "pending");
              // Map backend verification statuses to frontend statuses
              if (rawStatus === "draft" || rawStatus === "re-submit" || rawStatus === "notrequested") return "pending";
              if (rawStatus === "active" || rawStatus === "approved" || rawStatus === "verified") return "approved";
              if (rawStatus === "rejected") return "rejected";
              return rawStatus;
            })(),
          };

          // Try to load images from ProductImage API with timeout (skip if flag is set)
          if (!skipImageLoading) {
            try {
              const imagePromise = apiRequest(`/api/ProductImage/product/${mapped.id}`);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Image load timeout')), 5000) // Increased timeout to 5 seconds
              );
              
              const imagesData = await Promise.race([imagePromise, timeoutPromise]);
              console.log(`Images for product ${mapped.id}:`, imagesData);
              
              if (Array.isArray(imagesData) && imagesData.length > 0) {
                mapped.images = imagesData.map(img => img.imageUrl || img.url || img.imageData).filter(Boolean);
              } else if (imagesData && imagesData.imageData) {
                mapped.images = [imagesData.imageData];
              } else if (imagesData && typeof imagesData === 'object') {
                // Handle single object response
                if (imagesData.imageUrl || imagesData.url) {
                  mapped.images = [imagesData.imageUrl || imagesData.url];
                } else if (imagesData.items && Array.isArray(imagesData.items)) {
                  mapped.images = imagesData.items.map(img => img.imageUrl || img.url || img.imageData).filter(Boolean);
                }
              }
              
              // Fallback: check if product has images in other fields
              if (mapped.images.length === 0) {
                const fallbackImages = [];
                if (item.imageUrl) fallbackImages.push(item.imageUrl);
                if (item.imageUrls && Array.isArray(item.imageUrls)) fallbackImages.push(...item.imageUrls);
                if (item.images && Array.isArray(item.images)) fallbackImages.push(...item.images);
                if (item.photos && Array.isArray(item.photos)) fallbackImages.push(...item.photos);
                if (item.pictures && Array.isArray(item.pictures)) fallbackImages.push(...item.pictures);
                
                mapped.images = fallbackImages.filter(Boolean);
                if (mapped.images.length > 0) {
                  console.log(`Using fallback images for product ${mapped.id}:`, mapped.images);
                }
              }
              
              console.log(`Final images for product ${mapped.id}:`, mapped.images);
            } catch (error) {
              console.warn(`Failed to load images for product ${mapped.id}:`, error.message);
              
              // If DbContext error, set flag to skip image loading for future items
              if (error.message.includes('DbContext') || error.message.includes('second operation')) {
                console.warn('DbContext error detected, skipping image loading for remaining items');
                setSkipImageLoading(true);
              }
              
              // Set empty images array and try fallback
              mapped.images = [];
              
              // Try fallback images from product data
              const fallbackImages = [];
              if (item.imageUrl) fallbackImages.push(item.imageUrl);
              if (item.imageUrls && Array.isArray(item.imageUrls)) fallbackImages.push(...item.imageUrls);
              if (item.images && Array.isArray(item.images)) fallbackImages.push(...item.images);
              if (item.photos && Array.isArray(item.photos)) fallbackImages.push(...item.photos);
              if (item.pictures && Array.isArray(item.pictures)) fallbackImages.push(...item.pictures);
              
              mapped.images = fallbackImages.filter(Boolean);
              if (mapped.images.length > 0) {
                console.log(`Using fallback images for product ${mapped.id} after error:`, mapped.images);
              }
            }
          } else {
            console.log(`Skipping image loading for product ${mapped.id} due to previous DbContext error`);
            // Use fallback images only
            const fallbackImages = [];
            if (item.imageUrl) fallbackImages.push(item.imageUrl);
            if (item.imageUrls && Array.isArray(item.imageUrls)) fallbackImages.push(...item.imageUrls);
            if (item.images && Array.isArray(item.images)) fallbackImages.push(...item.images);
            if (item.photos && Array.isArray(item.photos)) fallbackImages.push(...item.photos);
            if (item.pictures && Array.isArray(item.pictures)) fallbackImages.push(...item.pictures);
            
            mapped.images = fallbackImages.filter(Boolean);
          }

          processedListings.push(mapped);
        }
      }

      // Filter out deleted products
      const nonDeletedListings = processedListings.filter(
        (l) => l.status !== "deleted"
      );

      console.log("Processed listings:", {
        total: processedListings.length,
        nonDeleted: nonDeletedListings.length,
        sample: processedListings.slice(0, 2)
      });

      // Sort listings to show newest first
      const sortedListings = nonDeletedListings.sort((a, b) => {
        const dateA = new Date(a.createdDate || 0);
        const dateB = new Date(b.createdDate || 0);
        return dateB - dateA;
      });

      console.log("Final sorted listings:", {
        total: sortedListings.length,
        sample: sortedListings.slice(0, 2)
      });

      // Calculate stats
      const vehicleListings = sortedListings.filter(l => 
        l.productType?.toLowerCase().includes("vehicle") || 
        l.productType?.toLowerCase().includes("xe")
      );
      const batteryListings = sortedListings.filter(l => 
        l.productType?.toLowerCase().includes("battery") || 
        l.productType?.toLowerCase().includes("pin")
      );

      const pendingListings = sortedListings.filter(l => l.status === "pending");
      const approvedListings = sortedListings.filter(l => l.status === "approved");
      const rejectedListings = sortedListings.filter(l => l.status === "rejected");

      // Calculate revenue from approved products (since no payment system yet)
      const approvedProducts = sortedListings.filter(l => l.status === "approved");
      const totalRevenue = approvedProducts.reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);
      
      // Calculate orders stats from transactions (if any)
      const completedOrders = transactions.filter(t => t.orderStatus === "Completed" || t.orderStatus === "Paid").length;
      const activeOrders = transactions.filter(t => t.orderStatus === "Pending" || t.orderStatus === "Active").length;
      
      // Calculate revenue by date from approved products
      const todaysRevenue = approvedProducts
        .filter(p => {
          const productDate = new Date(p.createdDate || 0);
          const today = new Date();
          return productDate.toDateString() === today.toDateString();
        })
        .reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);

      const thisYearRevenue = approvedProducts
        .filter(p => {
          const productDate = new Date(p.createdDate || 0);
          const currentYear = new Date().getFullYear();
          return productDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);

      const thisMonthRevenue = approvedProducts
        .filter(p => {
          const productDate = new Date(p.createdDate || 0);
          const currentDate = new Date();
          return productDate.getMonth() === currentDate.getMonth() && 
                 productDate.getFullYear() === currentDate.getFullYear();
        })
        .reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);

      const averageOrderValue = approvedProducts.length > 0 ? totalRevenue / approvedProducts.length : 0;
      const completionRate = transactions.length > 0 ? (completedOrders / transactions.length) * 100 : 0;

      setStats({
        totalUsers: users.length,
        totalListings: sortedListings.length,
        pendingListings: pendingListings.length,
        approvedListings: approvedListings.length,
        rejectedListings: rejectedListings.length,
        totalRevenue,
        vehicleListings: vehicleListings.length,
        batteryListings: batteryListings.length,
        activeListings: approvedListings.length,
        totalOrders: transactions.length,
        completedOrders,
        activeOrders,
        todaysRevenue,
        thisYearRevenue,
        thisMonthRevenue,
        averageOrderValue,
        completionRate,
        totalVehicles: vehicleListings.length,
        totalBatteries: batteryListings.length,
        soldVehicles: vehicleListings.filter(v => v.status === "approved").length,
        soldBatteries: batteryListings.filter(b => b.status === "approved").length,
      });

      setAllListings(sortedListings);
      
      // Cache the processed data for future use
      localStorage.setItem('admin_cached_processed_listings', JSON.stringify(sortedListings));
      localStorage.setItem('admin_cached_users', JSON.stringify(users));
      localStorage.setItem('admin_cached_orders', JSON.stringify(transactions));
      
    } catch (error) {
      console.error("Error loading admin data:", error);
      
      // Try to get cached processed data first
      const cachedProcessed = localStorage.getItem('admin_cached_processed_listings');
      if (cachedProcessed) {
        try {
          const cachedListings = JSON.parse(cachedProcessed);
          console.log("📦 Using cached processed listings:", cachedListings.length);
          setAllListings(cachedListings);
          
          // Calculate stats from cached data
          const vehicleListings = cachedListings.filter(l => 
            l.productType?.toLowerCase().includes("vehicle") || 
            l.productType?.toLowerCase().includes("xe")
          );
          const batteryListings = cachedListings.filter(l => 
            l.productType?.toLowerCase().includes("battery") || 
            l.productType?.toLowerCase().includes("pin")
          );
          const pendingListings = cachedListings.filter(l => l.status === "pending");
          const approvedListings = cachedListings.filter(l => l.status === "approved");
          const rejectedListings = cachedListings.filter(l => l.status === "rejected");
          const totalRevenue = approvedListings.reduce((sum, p) => sum + (parseFloat(p.price || 0)), 0);
          
          setStats({
            totalUsers: 0, // Will be updated when users load successfully
            totalListings: cachedListings.length,
            pendingListings: pendingListings.length,
            approvedListings: approvedListings.length,
            rejectedListings: rejectedListings.length,
            totalRevenue,
            vehicleListings: vehicleListings.length,
            batteryListings: batteryListings.length,
            activeListings: approvedListings.length,
            totalOrders: 0, // Will be updated when orders load successfully
            completedOrders: 0,
            activeOrders: 0,
            todaysRevenue: 0,
            thisYearRevenue: 0,
            thisMonthRevenue: 0,
            averageOrderValue: approvedListings.length > 0 ? totalRevenue / approvedListings.length : 0,
            completionRate: 0,
            totalVehicles: vehicleListings.length,
            totalBatteries: batteryListings.length,
            soldVehicles: vehicleListings.filter(v => v.status === "approved").length,
            soldBatteries: batteryListings.filter(b => b.status === "approved").length,
          });
          
          // Show warning toast
          showToast({
            title: "Cảnh báo",
            description: "Đang sử dụng dữ liệu đã lưu trữ. Một số thông tin có thể không cập nhật.",
            type: "warning",
          });
          
        } catch (e) {
          console.error("Failed to parse cached processed listings:", e);
          // Fall through to fallback
        }
      }
      
      // If no cached processed data, try to load products directly as fallback
      if (!cachedProcessed) {
        try {
          console.log("Trying fallback: loading products directly...");
          const fallbackProducts = await apiRequest("/api/Product");
          const fallbackListings = Array.isArray(fallbackProducts) 
            ? fallbackProducts 
            : fallbackProducts?.items || [];
          
          console.log("Fallback products loaded:", fallbackListings.length);
          
          if (fallbackListings.length > 0) {
            // Simple mapping for fallback
            const simpleMapped = fallbackListings.map(item => ({
              id: getId(item),
              title: item.title || item.name || "Không có tiêu đề",
              brand: item.brand || "Không rõ",
              model: item.model || "Không rõ",
              price: parseFloat(item.price || 0),
              status: item.status || "pending",
              productType: item.productType || "vehicle",
              sellerId: item.sellerId || item.userId || item.ownerId || item.createdBy || "N/A",
              sellerName: item.sellerName || item.ownerName || item.userName || "Không rõ",
              createdDate: item.createdDate || new Date().toISOString(),
              images: item.images || [],
            }));
            
            setAllListings(simpleMapped);
            console.log("Fallback listings set:", simpleMapped.length);
            
            // Cache fallback data
            localStorage.setItem('admin_cached_processed_listings', JSON.stringify(simpleMapped));
          } else {
            setAllListings([]);
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          setAllListings([]);
        }
      }
      
      // Only reset stats if we have no data at all
      if (!cachedProcessed && allListings.length === 0) {
        setStats({
          totalUsers: 0,
          totalListings: 0,
          pendingListings: 0,
          approvedListings: 0,
          rejectedListings: 0,
          totalRevenue: 0,
          vehicleListings: 0,
          batteryListings: 0,
          activeListings: 0,
          totalOrders: 0,
          completedOrders: 0,
          activeOrders: 0,
          todaysRevenue: 0,
          thisYearRevenue: 0,
          thisMonthRevenue: 0,
          averageOrderValue: 0,
          completionRate: 0,
          totalVehicles: 0,
          totalBatteries: 0,
          soldVehicles: 0,
          soldBatteries: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = allListings;

    console.log("Filtering listings:", {
      allListings: allListings.length,
      activeTab,
      searchTerm,
      statusFilter,
      productTypeFilter,
      dateFilter
    });

    // Filter by active tab (vehicle/battery management)
    if (activeTab === "vehicles") {
      filtered = filtered.filter((l) => 
        l.productType?.toLowerCase().includes("vehicle") || 
        l.productType?.toLowerCase().includes("xe")
      );
    } else if (activeTab === "batteries") {
      filtered = filtered.filter((l) => 
        l.productType?.toLowerCase().includes("battery") || 
        l.productType?.toLowerCase().includes("pin")
      );
    }

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
      filtered = filtered.filter((l) => {
        const matches = l.productType?.toLowerCase() === productTypeFilter.toLowerCase();
        return matches;
      });
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

        switch (dateFilter) {
          case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
          case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
          case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((l) => {
        const listingDate = new Date(l.createdDate || 0);
        return listingDate >= filterDate;
      });
    }

    console.log("Final filtered listings:", {
      count: filtered.length,
      sample: filtered.slice(0, 2)
    });

    setFilteredListings(filtered);
  };

  const handleApprove = async (productId) => {
    // Show confirmation dialog
    if (!window.confirm("Bạn có chắc chắn muốn duyệt sản phẩm này?")) {
      return;
    }

    // Add to processing set
    setProcessingIds(prev => new Set(prev).add(productId));

    try {
      await approveProduct(productId);

      // Update local state
      setAllListings((prev) =>
        prev.map((item) =>
          getId(item) === productId
            ? { ...item, status: "approved", verificationStatus: "approved" }
            : item
        )
      );

      // Send notification
      const product = allListings.find((item) => getId(item) === productId);
      const sellerId = product?.sellerId || product?.userId;
      if (sellerId) {
        await notifyPostApproved(sellerId, product?.title || product?.name);
      }

      showToast({
        title: "Duyệt thành công",
        description: `Sản phẩm "${product?.title || product?.name}" đã được duyệt và thông báo đã được gửi`,
        type: "success",
      });
    } catch (error) {
      console.error("Error approving product:", error);
      showToast({
        title: "Lỗi",
        description: "Không thể duyệt sản phẩm",
        type: "error",
      });
    } finally {
      // Remove from processing set
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleReject = async (productId, rejectionReason) => {
    // Validate productId
    if (!productId || productId === 'undefined') {
      console.error("Invalid product ID:", productId);
      showToast({
        title: "Lỗi",
        description: "ID sản phẩm không hợp lệ",
        type: "error",
      });
      return;
    }

    try {
      await rejectProduct(productId, rejectionReason);

      // Update local state
      setAllListings((prev) =>
        prev.map((item) =>
          getId(item) === productId
            ? {
                ...item,
                status: "rejected",
                verificationStatus: "rejected",
                rejectionReason,
              }
            : item
        )
      );

      // Send notification
      const product = allListings.find((item) => getId(item) === productId);
      const sellerId = product?.sellerId || product?.userId;
      if (sellerId) {
        await notifyPostRejected(sellerId, product?.title || product?.name);
      }

      showToast({
        title: "Từ chối thành công",
        description: `Sản phẩm đã bị từ chối và thông báo đã được gửi`,
        type: "success",
      });
    } catch (error) {
      console.error("Error rejecting product:", error);
      throw error;
    }
  };

  const openRejectModal = (product) => {
    setRejectModal({
      isOpen: true,
      product,
    });
  };

  const closeRejectModal = () => {
    setRejectModal({
      isOpen: false,
      product: null,
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Đang chờ duyệt" },
      approved: { color: "bg-green-100 text-green-800", text: "Đã duyệt" },
      rejected: { color: "bg-red-100 text-red-800", text: "Bị từ chối" },
      active: { color: "bg-blue-100 text-blue-800", text: "Hoạt động" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getProductTypeBadge = (productType) => {
    const isVehicle = productType?.toLowerCase().includes("vehicle") || 
                     productType?.toLowerCase().includes("xe");
    const isBattery = productType?.toLowerCase().includes("battery") || 
                     productType?.toLowerCase().includes("pin");

    if (isVehicle) {
    return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          Xe điện
        </span>
      );
    } else if (isBattery) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
          Pin
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        {productType || "Không rõ"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-10">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EV Market</h1>
              <p className="text-sm text-gray-500">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">A</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Admin User</h3>
              <p className="text-sm text-gray-500">Super Administrator</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">95% uptime</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <div className="space-y-2">
            <div 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "dashboard" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </div>
            <div 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "vehicles" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("vehicles")}
            >
              <Car className="h-5 w-5" />
              <span>Vehicle Management</span>
            </div>
            <div 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "batteries" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("batteries")}
            >
              <Shield className="h-5 w-5" />
              <span>Battery Management</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </div>
          </div>
        </nav>

        {/* Tips Section */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">💡</span>
              </div>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Tips</p>
                <p className="text-xs text-yellow-700">Quick responses can help improve customer satisfaction.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {activeTab === "dashboard" && "Administration Dashboard"}
                {activeTab === "vehicles" && "Vehicle Management"}
                {activeTab === "batteries" && "Battery Management"}
              </h1>
              <p className="text-gray-600">
                {activeTab === "dashboard" && "EV Market system overview • Realtime update"}
                {activeTab === "vehicles" && "Manage all vehicle listings and approvals"}
                {activeTab === "batteries" && "Manage all battery listings and approvals"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                <span>Làm mới</span>
              </button>
              
              {skipImageLoading && (
                <button
                  onClick={() => {
                    setSkipImageLoading(false);
                    refreshData();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  <span>Bật tải hình ảnh</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - Only show on dashboard */}
        {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">TOTAL VALUE</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.totalRevenue)}
                </p>
                  <p className="text-xs text-gray-600 mt-1">Approved Products</p>
              </div>
                <div className="bg-gray-100 p-4 rounded-xl">
                  <DollarSign className="h-8 w-8 text-gray-600" />
              </div>
            </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">This Year: {formatPrice(stats.thisYearRevenue)}</p>
                <p className="text-xs text-gray-500">This Month: {formatPrice(stats.thisMonthRevenue)}</p>
              </div>
          </div>

            {/* Today's Revenue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">TODAY'S VALUE</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.todaysRevenue)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Approved Today</p>
              </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Average/Month: {formatPrice(stats.thisYearRevenue / 12)}</p>
                <p className="text-xs text-gray-500">Products Approved: {stats.approvedListings}</p>
              </div>
          </div>

            {/* Total Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">TOTAL ORDERS</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalOrders}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">All Time</p>
              </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Completed: {stats.completedOrders}</p>
                <p className="text-xs text-gray-500">Active: {stats.activeOrders}</p>
              </div>
          </div>

            {/* Average Value/Product */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">AVERAGE VALUE/PRODUCT</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.averageOrderValue)}
                </p>
                  <p className="text-xs text-gray-600 mt-1">Per Product</p>
              </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Highest: {formatPrice(stats.averageOrderValue * 1.5)}</p>
                <p className="text-xs text-gray-500">Lowest: {formatPrice(stats.averageOrderValue * 0.5)}</p>
          </div>
        </div>
          </div>
        )}

        {/* Additional Stats Row - Only show on dashboard */}
        {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Completed Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">COMPLETED ORDERS</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.completedOrders}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{stats.completionRate.toFixed(1)}% Completion Rate</p>
              </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Active Orders: {stats.activeOrders}</p>
                <p className="text-xs text-gray-500">Total Value: {formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>

            {/* This Month */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">THIS MONTH</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatPrice(stats.thisMonthRevenue)}
                </p>
                  <p className="text-xs text-gray-600 mt-1">Month {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
              </div>
                <div className="bg-purple-100 p-4 rounded-xl">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Average/Day: {formatPrice(stats.thisMonthRevenue / new Date().getDate())}</p>
                <p className="text-xs text-gray-500">Total Orders: {stats.totalOrders}</p>
            </div>
          </div>

            {/* Vehicle vs Battery Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-medium">VEHICLES & BATTERIES</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.totalVehicles + stats.totalBatteries}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Total Products</p>
              </div>
                <div className="bg-orange-100 p-4 rounded-xl">
                  <Car className="h-8 w-8 text-orange-600" />
            </div>
          </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-500">Vehicles: {stats.totalVehicles}</p>
                <p className="text-xs text-gray-500">Batteries: {stats.totalBatteries}</p>
        </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, thương hiệu, model, biển số..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái ({allListings.length})</option>
                <option value="pending">Đang chờ duyệt ({allListings.filter(l => l.status === "pending").length})</option>
                <option value="approved">Đã duyệt ({allListings.filter(l => l.status === "approved").length})</option>
                <option value="rejected">Bị từ chối ({allListings.filter(l => l.status === "rejected").length})</option>
              </select>
              <select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả loại</option>
                <option value="vehicle">Xe điện</option>
                <option value="battery">Pin</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="year">Năm nay</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === "dashboard" && `Danh sách sản phẩm (${filteredListings.length})`}
              {activeTab === "vehicles" && `Danh sách xe (${filteredListings.length})`}
              {activeTab === "batteries" && `Danh sách pin (${filteredListings.length})`}
              </h2>
              </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={listing.images[0]}
                              alt={listing.title}
                              onError={(e) => {
                                console.log("Image failed to load:", listing.images[0]);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center ${listing.images && listing.images.length > 0 ? 'hidden' : ''}`}
                            style={{ display: listing.images && listing.images.length > 0 ? 'none' : 'flex' }}
                          >
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {listing.brand} {listing.model}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {listing.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getProductTypeBadge(listing.productType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(listing.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{listing.sellerName || "Không rõ"}</div>
                      <div className="text-xs text-gray-500">ID: {listing.sellerId || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(listing.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(listing.createdDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setExpandedDetails(listing.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {(listing.status === "pending" || listing.status === "Đang chờ duyệt" || listing.status === "Re-submit" || listing.status === "Draft") && (
                          <>
                            {console.log(`🔍 Product ${listing.id} debug:`, {
                              status: listing.status,
                              verificationStatus: listing.verificationStatus,
                              shouldShowButtons: listing.status === "pending" || listing.status === "Đang chờ duyệt" || listing.status === "Re-submit" || listing.status === "Draft",
                              statusType: typeof listing.status,
                              statusValue: JSON.stringify(listing.status)
                            })}
                            <button
                              onClick={() => handleApprove(listing.id)}
                              disabled={processingIds.has(listing.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              title="Duyệt sản phẩm"
                            >
                              {processingIds.has(listing.id) ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={() => openRejectModal(listing)}
                              disabled={processingIds.has(listing.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              title="Từ chối sản phẩm"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </div>

        {/* Product Detail Modal */}
        {expandedDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {(() => {
                const product = allListings.find(p => getId(p) === expandedDetails);
                if (!product) return null;

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
                          <p className="text-sm text-gray-600">Chi tiết sản phẩm</p>
      </div>
                      </div>
                <button
                        onClick={() => setExpandedDetails(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                        <XCircle className="h-6 w-6 text-gray-500" />
                </button>
            </div>

                    {/* Content */}
            <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Images */}
                <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h4>
                          {product.images && product.images.length > 0 ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                                  src={product.images[currentImageIndex]}
                                  alt={product.title}
                                  className="w-full h-64 object-cover rounded-lg"
                                />
                              </div>
                              {product.images.length > 1 && (
                                <div className="flex space-x-2 overflow-x-auto">
                                  {product.images.map((img, index) => (
                            <button
                                      key={index}
                                      onClick={() => setCurrentImageIndex(index)}
                                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                                        index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                                      }`}
                                    >
                                      <img
                                        src={img}
                                        alt={`${product.title} ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                            </button>
                                  ))}
                          </div>
                        )}
                    </div>
                  ) : (
                            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                        {/* Details */}
                  <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h4>
                          <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                                <p className="text-sm text-gray-500">Loại sản phẩm</p>
                                <p className="font-medium">{getProductTypeBadge(product.productType)}</p>
                      </div>
                      <div>
                                <p className="text-sm text-gray-500">Trạng thái</p>
                                <p className="font-medium">{getStatusBadge(product.status)}</p>
                      </div>
                        </div>

                            <div className="grid grid-cols-2 gap-4">
                        <div>
                                <p className="text-sm text-gray-500">Thương hiệu</p>
                                <p className="font-medium">{product.brand}</p>
                        </div>
                      <div>
                                <p className="text-sm text-gray-500">Model</p>
                                <p className="font-medium">{product.model}</p>
                      </div>
                    </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Năm sản xuất</p>
                                <p className="font-medium">{product.year}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Giá</p>
                                <p className="font-medium text-green-600">{formatPrice(product.price)}</p>
                              </div>
                              </div>

                            {product.productType?.toLowerCase().includes("vehicle") && (
                              <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                    <p className="text-sm text-gray-500">Biển số</p>
                                    <p className="font-medium">{product.licensePlate}</p>
                              </div>
                              <div>
                                    <p className="text-sm text-gray-500">Số km</p>
                                    <p className="font-medium">{product.mileage}</p>
                              </div>
                              </div>
                                <div className="grid grid-cols-2 gap-4">
                              <div>
                                    <p className="text-sm text-gray-500">Tình trạng</p>
                                    <p className="font-medium">{product.condition}</p>
                              </div>
                              <div>
                                    <p className="text-sm text-gray-500">Màu sắc</p>
                                    <p className="font-medium">{product.color}</p>
                              </div>
                              </div>
                              </>
                            )}

                            <div>
                              <p className="text-sm text-gray-500">Mô tả</p>
                              <p className="font-medium text-gray-700">{product.description}</p>
                        </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Người bán</p>
                                <p className="font-medium">{product.sellerName}</p>
                              </div>
                              {product.sellerPhone && product.sellerPhone !== "N/A" && (
                                <div>
                                  <p className="text-sm text-gray-500">Số điện thoại</p>
                                  <p className="font-medium">{product.sellerPhone}</p>
                                </div>
                              )}
                              {product.sellerEmail && product.sellerEmail !== "N/A" && (
                                <div>
                                  <p className="text-sm text-gray-500">Email</p>
                                  <p className="font-medium">{product.sellerEmail}</p>
                                </div>
                              )}
                            </div>

                            {product.rejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800 font-medium">Lý do từ chối:</p>
                                <p className="text-sm text-red-700 mt-1">{product.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

                      {/* Actions */}
                      <div className="mt-6 flex items-center justify-end space-x-3">
                      <button
                          onClick={() => setExpandedDetails(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                          Đóng
                      </button>
                        {(product.status === "pending" || product.status === "Re-submit" || product.status === "Draft") && (
                          <>
                      <button
                              onClick={() => {
                                setExpandedDetails(false);
                                handleApprove(product.id);
                              }}
                              disabled={processingIds.has(product.id)}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {processingIds.has(product.id) ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              <span>Duyệt</span>
                      </button>
                            <button
                              onClick={() => {
                                setExpandedDetails(false);
                                openRejectModal(product);
                              }}
                              disabled={processingIds.has(product.id)}
                              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                  </>
                );
              })()}
          </div>
        </div>
      )}

        {/* Reject Modal */}
      <RejectProductModal
        isOpen={rejectModal.isOpen}
        onClose={closeRejectModal}
        product={rejectModal.product}
        onReject={handleReject}
      />
      </div>
    </div>
  );
};