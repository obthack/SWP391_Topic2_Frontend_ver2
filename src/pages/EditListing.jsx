import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import {
  formatVietnamesePrice,
  parsePriceValue,
} from "../utils/priceFormatter";

export const EditListing = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [documentImages, setDocumentImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingDocumentImages, setExistingDocumentImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [documentImagesToDelete, setDocumentImagesToDelete] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    licensePlate: "",
    description: "",
    brand: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    color: "",
    fuelType: "",
    condition: "excellent",
    productType: "vehicle",
    // Vehicle specific fields
    vehicleType: "",
    manufactureYear: "",
    // Battery specific fields
    batteryType: "",
    batteryHealth: "",
    capacity: "",
    voltage: "",
    bms: "",
    cellType: "",
    cycleCount: "",
    // Verification status
    verificationStatus: "NotRequested",
  });
  const [displayPrice, setDisplayPrice] = useState("");

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      console.log("🔄 Loading listing data for ID:", id);

      // First, verify the product belongs to the current user
      const sellerId = user?.id || user?.userId || user?.accountId;
      console.log("🔄 Seller ID:", sellerId);

      // Get seller products to verify ownership
      const sellerProducts = await apiRequest(
        `/api/Product/seller/${sellerId}`
      );
      console.log("🔍 Loaded seller products:", sellerProducts);

      // Check if the product exists in seller's list
      const productExists = sellerProducts.find(
        (product) =>
          product.productId === parseInt(id) ||
          product.id === parseInt(id) ||
          product.Id === parseInt(id)
      );

      if (!productExists) {
        throw new Error("Không tìm thấy sản phẩm này trong danh sách của bạn");
      }

      // Now get the FULL product details using the individual product endpoint
      console.log("🔍 Getting full product details from /api/Product/" + id);

      // Add retry logic for DbContext conflicts
      let data = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries && !data) {
        try {
          data = await apiRequest(`/api/Product/${id}`);
          console.log("🔍 Found FULL product data:", data);
          console.log("🔍 Data keys:", Object.keys(data));
          break;
        } catch (error) {
          retryCount++;
          console.log(
            `🔄 Retry attempt ${retryCount}/${maxRetries} for DbContext conflict`
          );

          if (
            error.message?.includes("DbContext") ||
            error.message?.includes("second operation")
          ) {
            if (retryCount < maxRetries) {
              // Wait a bit before retrying
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount)
              );
              continue;
            }
          }

          // If not a DbContext error or max retries reached, throw the error
          throw error;
        }
      }

      if (!data) {
        // Fallback: Use data from seller products list if individual API fails
        console.log("🔄 Fallback: Using data from seller products list");
        data = productExists;

        if (!data) {
          throw new Error("Không thể tải thông tin sản phẩm sau nhiều lần thử");
        }
      }

      // Debug: Show all available fields from API
      console.log("🔍 ALL AVAILABLE FIELDS FROM API:");
      Object.keys(data).forEach((key) => {
        console.log(`  ${key}:`, data[key], `(type: ${typeof data[key]})`);
      });

      // Debug all fields to see what data is available
      console.log("🔍 DETAILED FIELD ANALYSIS:");
      console.log("📋 Basic Info:", {
        title: data.title,
        description: data.description,
        brand: data.brand,
        model: data.model,
        price: data.price,
        condition: data.condition,
        productType: data.productType,
      });
      console.log("🚗 Vehicle Info:", {
        licensePlate: data.licensePlate,
        vehicleType: data.vehicleType,
        manufactureYear: data.manufactureYear,
        year: data.year,
        mileage: data.mileage,
        seatCount: data.seatCount,
        color: data.color,
        fuelType: data.fuelType,
      });
      console.log("🔋 Battery Info:", {
        batteryType: data.batteryType,
        batteryHealth: data.batteryHealth,
        capacity: data.capacity,
        voltage: data.voltage,
        bms: data.bms,
        cellType: data.cellType,
        cycleCount: data.cycleCount,
      });

      // Helper function to clean up "string" placeholder values and null values
      const cleanValue = (value) => {
        console.log("🧹 Cleaning value:", {
          original: value,
          type: typeof value,
        });

        if (
          value === "string" ||
          value === null ||
          value === undefined ||
          (value === 0 && typeof value === "number") ||
          value === "0"
        ) {
          console.log("🧹 Cleaned to empty string");
          return "";
        }

        // For numbers, keep them as strings for form display
        if (typeof value === "number" && value > 0) {
          console.log("🧹 Keeping number as string:", value.toString());
          return value.toString();
        }

        console.log("🧹 Keeping original value:", value);
        return value;
      };

      // More comprehensive data mapping with fallbacks
      const mapped = {
        productId: data.productId || data.id || data.Id || id,
        title: data.title ?? data.Title ?? "",
        licensePlate: cleanValue(
          data.licensePlate ?? data.license_plate ?? data.LicensePlate
        ),
        description: data.description ?? data.Description ?? "",
        brand: data.brand ?? data.Brand ?? "",
        model: data.model ?? data.Model ?? "",
        year:
          cleanValue(data.manufactureYear) || // Use manufactureYear first (from API)
          cleanValue(data.year) ||
          cleanValue(data.productionYear) ||
          cleanValue(data.Year) ||
          "",
        price: data.price ?? data.Price ?? "",
        mileage: cleanValue(data.mileage ?? data.Mileage),
        color: cleanValue(data.color ?? data.Color),
        fuelType: cleanValue(data.fuelType ?? data.FuelType),
        condition: data.condition ?? data.Condition ?? "excellent",
        productType: (
          data.productType ??
          data.product_type ??
          data.Type ??
          "vehicle"
        ).toLowerCase(),
        // Vehicle specific fields
        vehicleType: cleanValue(data.vehicleType ?? data.VehicleType),
        manufactureYear:
          cleanValue(data.manufactureYear) || // Use manufactureYear first
          cleanValue(data.year) ||
          cleanValue(data.Year) ||
          "",
        seatCount: cleanValue(data.seatCount ?? data.SeatCount),
        // Battery specific fields
        batteryType: cleanValue(data.batteryType ?? data.BatteryType),
        batteryHealth: cleanValue(data.batteryHealth ?? data.BatteryHealth),
        capacity: cleanValue(data.capacity ?? data.Capacity),
        voltage: cleanValue(data.voltage ?? data.Voltage),
        bms: cleanValue(data.bms ?? data.BMS),
        cellType: cleanValue(data.cellType ?? data.CellType),
        cycleCount: cleanValue(data.cycleCount ?? data.CycleCount),
        // Verification status
        verificationStatus: data.verificationStatus ?? data.VerificationStatus ?? "NotRequested",
      };

      console.log("🔍 Mapped form data:", mapped);

      // Debug mapped data after cleaning
      console.log("🔍 CLEANED MAPPED DATA:");
      console.log("📋 Basic Info (Cleaned):", {
        title: mapped.title,
        description: mapped.description,
        brand: mapped.brand,
        model: mapped.model,
        price: mapped.price,
        condition: mapped.condition,
        productType: mapped.productType,
      });
      console.log("🚗 Vehicle Info (Cleaned):", {
        licensePlate: mapped.licensePlate,
        vehicleType: mapped.vehicleType,
        manufactureYear: mapped.manufactureYear,
        year: mapped.year,
        mileage: mapped.mileage,
        seatCount: mapped.seatCount,
        color: mapped.color,
        fuelType: mapped.fuelType,
      });
      console.log("🔋 Battery Info (Cleaned):", {
        batteryType: mapped.batteryType,
        batteryHealth: mapped.batteryHealth,
        capacity: mapped.capacity,
        voltage: mapped.voltage,
        bms: mapped.bms,
        cellType: mapped.cellType,
        cycleCount: mapped.cycleCount,
      });

      // Show summary of what data is available vs missing
      console.log("📊 DATA AVAILABILITY SUMMARY:");
      const availableFields = Object.entries(mapped).filter(
        ([key, value]) => value && value !== ""
      );
      const missingFields = Object.entries(mapped).filter(
        ([key, value]) => !value || value === ""
      );

      console.log(
        "✅ Available fields:",
        availableFields.map(([key]) => key)
      );
      console.log(
        "❌ Missing fields:",
        missingFields.map(([key]) => key)
      );

      // Debug product type for document upload logic
      console.log("🔍 PRODUCT TYPE DEBUG:");
      console.log("  Raw productType from API:", data.productType);
      console.log("  Mapped productType:", mapped.productType);
      console.log(
        "  Should show documents:",
        mapped.productType?.toLowerCase() === "vehicle"
      );

      // Debug: Show all available fields from API
      console.log("🔍 All API fields:", {
        manufactureYear: data.manufactureYear,
        licensePlate: data.licensePlate,
        mileage: data.mileage,
        condition: data.condition,
        vehicleType: data.vehicleType,
        batteryType: data.batteryType,
        capacity: data.capacity,
        voltage: data.voltage,
        cycleCount: data.cycleCount,
      });

      setFormData(mapped);

      // Set display price for formatting
      if (mapped.price) {
        setDisplayPrice(formatVietnamesePrice(mapped.price));
      }

      // Load existing product images
      try {
        const productId = data.productId || data.id || data.Id || id;
        const imageData = await apiRequest(
          `/api/ProductImage/product/${productId}`
        );
        const productImages = (imageData || []).filter(
          (img) => !img.imageType || img.imageType !== "document"
        );
        const docImages = (imageData || []).filter(
          (img) => img.imageType === "document"
        );
        setExistingImages(productImages);
        setExistingDocumentImages(docImages);
        console.log("🔍 Loaded images:", {
          productImages: productImages.length,
          docImages: docImages.length,
        });
      } catch (imageError) {
        console.warn("Could not load existing images:", imageError);
        setExistingImages([]);
        setExistingDocumentImages([]);
      }
    } catch (error) {
      console.error("❌ Error loading listing:", error);
      console.error("❌ Error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });

      let errorMessage = "Không thể tải thông tin bài đăng";

      if (error.status === 404) {
        errorMessage =
          "Không tìm thấy bài đăng này. Có thể bài đăng đã bị xóa hoặc bạn không có quyền chỉnh sửa.";
      } else if (error.status === 403) {
        errorMessage = "Bạn không có quyền chỉnh sửa bài đăng này.";
      } else if (error.status === 500 && error.message?.includes("DbContext")) {
        errorMessage = "Lỗi hệ thống tạm thời. Vui lòng thử lại sau vài giây.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);

      // Show toast notification
      show({
        title: "Lỗi tải dữ liệu",
        description: errorMessage,
        type: "error",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "price") {
      // Format price display with spaces
      const formattedPrice = formatVietnamesePrice(value);
      setDisplayPrice(formattedPrice);

      // Store numeric value in formData
      const numericPrice = parsePriceValue(value);
      setFormData({
        ...formData,
        [name]: numericPrice,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxNewImages = 5 - existingImages.length;
    const newImages = files.slice(0, maxNewImages);
    setImages([...images, ...newImages]);
  };

  const handleDocumentImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxNewImages = 3 - existingDocumentImages.length;
    const newImages = files.slice(0, maxNewImages);
    setDocumentImages([...documentImages, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeDocumentImage = (index) => {
    setDocumentImages(documentImages.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(existingImages.filter((img) => img.id !== imageId));
    setImagesToDelete([...imagesToDelete, imageId]);
  };

  const removeExistingDocumentImage = (imageId) => {
    setExistingDocumentImages(
      existingDocumentImages.filter((img) => img.id !== imageId)
    );
    setDocumentImagesToDelete([...documentImagesToDelete, imageId]);
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        price: formData.price ? parseFloat(formData.price) : undefined,
        condition: formData.condition || undefined,
        productType: formData.productType,
        // Preserve existing status to avoid resetting to pending
        status: formData.status || "pending",
        verificationStatus: formData.verificationStatus || "pending",
        // Vehicle specific fields
        ...(formData.productType === "vehicle" && {
          vehicleType: formData.vehicleType || undefined,
          manufactureYear: formData.manufactureYear
            ? parseInt(formData.manufactureYear)
            : undefined,
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
          licensePlate: formData.licensePlate || undefined,
        }),
        // Battery specific fields
        ...(formData.productType === "battery" && {
          batteryType: formData.batteryType || undefined,
          batteryHealth: formData.batteryHealth
            ? parseFloat(formData.batteryHealth)
            : undefined,
          capacity: formData.capacity
            ? parseFloat(formData.capacity)
            : undefined,
          voltage: formData.voltage ? parseFloat(formData.voltage) : undefined,
          cycleCount: formData.cycleCount
            ? parseInt(formData.cycleCount)
            : undefined,
        }),
      };

      // Validate license plate format (only for vehicles)
      if (formData.productType === "vehicle" && formData.licensePlate) {
        const licensePlateRegex = /^[0-9]{2}[A-Z]-[0-9]{5}$/;
        if (!licensePlateRegex.test(formData.licensePlate)) {
          throw new Error(
            "Biển số xe không đúng định dạng. Vui lòng nhập theo định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)"
          );
        }
      }

      console.log("Updating product data:", productData);

      // Get the correct product ID from the loaded data
      const productId = formData.productId || id;
      const apiEndpoint = `/api/Product/${productId}`;

      const updated = await apiRequest(apiEndpoint, {
        method: "PUT",
        body: productData,
      });
      const pid = updated?.id || updated?.productId || updated?.Id || id;

      // Delete product images that user marked for deletion
      if (imagesToDelete.length > 0) {
        for (const imageId of imagesToDelete) {
          try {
            await apiRequest(`/api/ProductImage/${imageId}`, {
              method: "DELETE",
            });
            console.log(`Deleted product image ${imageId}`);
          } catch (deleteError) {
            console.warn(
              `Failed to delete product image ${imageId}:`,
              deleteError
            );
          }
        }
      }

      // Delete document images that user marked for deletion
      if (documentImagesToDelete.length > 0) {
        for (const imageId of documentImagesToDelete) {
          try {
            await apiRequest(`/api/ProductImage/${imageId}`, {
              method: "DELETE",
            });
            console.log(`Deleted document image ${imageId}`);
          } catch (deleteError) {
            console.warn(
              `Failed to delete document image ${imageId}:`,
              deleteError
            );
          }
        }
      }

      // Upload new product images if any
      if (images.length > 0) {
        try {
          // Try multiple upload first
          const formData = new FormData();
          formData.append("productId", pid);

          // Add all product images to FormData
          images.forEach((image, index) => {
            formData.append("images", image);
          });

          console.log(
            "Uploading product images with multiple endpoint:",
            images.length,
            "images"
          );
          const uploadedImages = await apiRequest(
            `/api/ProductImage/multiple`,
            {
              method: "POST",
              body: formData,
            }
          );
          console.log(
            "Multiple product images uploaded successfully:",
            uploadedImages
          );
        } catch (e) {
          console.warn(
            "Multiple product image upload failed, trying individual uploads:",
            e
          );

          // Fallback to individual uploads
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            try {
              const formData = new FormData();
              formData.append("productId", pid);
              formData.append("imageFile", img);

              console.log(
                `Uploading product image ${i + 1}/${
                  images.length
                } for product ${pid}`
              );
              await apiRequest(`/api/ProductImage`, {
                method: "POST",
                body: formData,
              });
              console.log(`Product image ${i + 1} uploaded successfully`);
            } catch (e) {
              console.warn(`Product image ${i + 1} upload failed:`, e);
            }
          }
        }
      }

      // Upload new document images if any
      if (documentImages.length > 0) {
        try {
          // Try multiple upload first for documents
          const formData = new FormData();
          formData.append("productId", pid);
          formData.append("imageType", "document");

          // Add all document images to FormData
          documentImages.forEach((image, index) => {
            formData.append("images", image);
          });

          console.log(
            "Uploading document images with multiple endpoint:",
            documentImages.length,
            "images"
          );
          const uploadedDocumentImages = await apiRequest(
            `/api/ProductImage/multiple`,
            {
              method: "POST",
              body: formData,
            }
          );
          console.log(
            "Multiple document images uploaded successfully:",
            uploadedDocumentImages
          );
        } catch (e) {
          console.warn(
            "Multiple document image upload failed, trying individual uploads:",
            e
          );

          // Fallback to individual uploads for documents
          for (let i = 0; i < documentImages.length; i++) {
            const img = documentImages[i];
            try {
              const formData = new FormData();
              formData.append("productId", pid);
              formData.append("imageFile", img);
              formData.append("imageType", "document");

              console.log(
                `Uploading document image ${i + 1}/${
                  documentImages.length
                } for product ${pid}`
              );
              await apiRequest(`/api/ProductImage`, {
                method: "POST",
                body: formData,
              });
              console.log(`Document image ${i + 1} uploaded successfully`);
            } catch (e) {
              console.warn(`Document image ${i + 1} upload failed:`, e);
            }
          }
        }
      }

      show({
        title: "Cập nhật thành công",
        description: "Bài đăng đã được cập nhật",
        type: "success",
      });
      navigate("/my-listings");
    } catch (err) {
      console.error("Error updating product:", err);
      console.error("Error details:", err.data);

      let errorMessage = "Có lỗi xảy ra khi cập nhật bài đăng";

      if (err.data) {
        if (typeof err.data === "string") {
          errorMessage = err.data;
        } else if (err.data.message) {
          errorMessage = err.data.message;
        } else if (err.data.errors) {
          const errorDetails = Object.values(err.data.errors).flat().join(", ");
          errorMessage = `Lỗi validation: ${errorDetails}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while loading initial data
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Chỉnh sửa tin đăng
            </h1>
            <p className="text-gray-600 mt-2">Đang tải thông tin bài đăng...</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu bài đăng...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Chỉnh sửa tin đăng
          </h1>
          <p className="text-gray-600 mt-2">
            Cập nhật thông tin bài đăng của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Thông tin cơ bản
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại sản phẩm *
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="vehicle">Xe điện</option>
                  <option value="battery">Pin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề bài đăng *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      formData.productType === "vehicle"
                        ? "Tên xe (VD: VinFast VF8)"
                        : "Tên pin (VD: Tesla Model 3 Battery)"
                    }
                    required
                  />
                </div>

                {/* Biển số xe - chỉ hiển thị cho xe */}
                {formData.productType?.toLowerCase() === "vehicle" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biển số xe *
                    </label>
                    <input
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="VD: 30A-12345 (5 số cuối)"
                      pattern="[0-9]{2}[A-Z]-[0-9]{5}"
                      title="Định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.productType?.toLowerCase() === "vehicle"
                      ? "Hãng xe"
                      : "Hãng pin"}{" "}
                    *
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">
                      {formData.productType?.toLowerCase() === "vehicle"
                        ? "Chọn hãng xe"
                        : "Chọn hãng pin"}
                    </option>
                    {formData.productType?.toLowerCase() === "vehicle" ? (
                      <>
                        <option value="VinFast">VinFast</option>
                        <option value="Tesla">Tesla</option>
                        <option value="BMW">BMW</option>
                        <option value="Mercedes">Mercedes</option>
                        <option value="Audi">Audi</option>
                        <option value="Porsche">Porsche</option>
                        <option value="Hyundai">Hyundai</option>
                        <option value="Kia">Kia</option>
                        <option value="Nissan">Nissan</option>
                        <option value="Volkswagen">Volkswagen</option>
                        <option value="Ford">Ford</option>
                        <option value="Chevrolet">Chevrolet</option>
                        <option value="Jaguar">Jaguar</option>
                        <option value="Lexus">Lexus</option>
                        <option value="Other">Khác</option>
                      </>
                    ) : (
                      <>
                        <option value="CATL">CATL</option>
                        <option value="BYD">BYD</option>
                        <option value="LG Chem">LG Chem</option>
                        <option value="Panasonic">Panasonic</option>
                        <option value="Samsung SDI">Samsung SDI</option>
                        <option value="SK Innovation">SK Innovation</option>
                        <option value="Tesla">Tesla</option>
                        <option value="Contemporary Amperex">
                          Contemporary Amperex
                        </option>
                        <option value="EVE Energy">EVE Energy</option>
                        <option value="Saft">Saft</option>
                        <option value="A123 Systems">A123 Systems</option>
                        <option value="Other">Khác</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: VF8, Model 3, iX3"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Năm sản xuất *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="2010"
                    max="2024"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá bán (VNĐ) *
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={displayPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: 1 200 000 000"
                    required
                  />
                </div>
              </div>

              {/* Số km đã đi - chỉ hiển thị cho xe */}
              {formData.productType?.toLowerCase() === "vehicle" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số km đã đi
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: 15000"
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  formData.productType === "vehicle"
                    ? "Mô tả chi tiết về xe, tình trạng, lịch sử sử dụng..."
                    : "Mô tả chi tiết về pin, tình trạng, lịch sử sử dụng..."
                }
                required
              />
            </div>
          </div>


          {/* Vehicle Specific Fields */}
          {formData.productType?.toLowerCase() === "vehicle" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🚗 Thông số kỹ thuật xe điện
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tình trạng
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="excellent">Xuất sắc</option>
                    <option value="good">Tốt</option>
                    <option value="fair">Khá</option>
                    <option value="poor">Kém</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại xe
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn loại xe</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="crossover">Crossover</option>
                    <option value="coupe">Coupe</option>
                    <option value="convertible">Convertible</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Năm sản xuất
                  </label>
                  <input
                    type="number"
                    name="manufactureYear"
                    value={formData.manufactureYear}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 2020"
                    min="1900"
                    max="2030"
                  />
                </div>

              </div>
            </div>
          )}

          {/* Battery Specific Fields */}
          {formData.productType?.toLowerCase() === "battery" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🔋 Thông số kỹ thuật pin
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại pin
                  </label>
                  <select
                    name="batteryType"
                    value={formData.batteryType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn loại pin</option>
                    <option value="CarBattery">Pin ô tô</option>
                    <option value="MotorcycleBattery">Pin xe máy</option>
                    <option value="BikeBattery">Pin xe đạp điện</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tình trạng pin (%)
                  </label>
                  <input
                    type="number"
                    name="batteryHealth"
                    value={formData.batteryHealth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 85"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tình trạng pin từ 0-100%
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dung lượng (kWh)
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 75.5"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dung lượng pin tính bằng kWh
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điện áp (V)
                  </label>
                  <input
                    type="number"
                    name="voltage"
                    value={formData.voltage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 400"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Điện áp danh định của pin
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hệ thống quản lý pin (BMS)
                  </label>
                  <input
                    type="text"
                    name="bms"
                    value={formData.bms}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: Tesla BMS, BYD BMS"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tên hoặc loại hệ thống quản lý pin
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại cell
                  </label>
                  <input
                    type="text"
                    name="cellType"
                    value={formData.cellType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 18650, 21700, LFP, NMC"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Loại cell (ví dụ: 18650, 21700, LFP, NMC)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số chu kỳ sạc
                  </label>
                  <input
                    type="number"
                    name="cycleCount"
                    value={formData.cycleCount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 500"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Số lần sạc/xả đã thực hiện
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Existing Product Images */}
          {existingImages.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Hình ảnh sản phẩm hiện tại
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {existingImages.map((image, index) => (
                  <div key={image.id || index} className="relative group">
                    <img
                      src={image.imageUrl || image.imageData || image.url}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa ảnh này"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Nhấn vào nút X để xóa ảnh. Ảnh sẽ được xóa khi bạn lưu bài đăng.
              </p>
            </div>
          )}

          {/* Existing Document Images - Only for vehicles */}
          {formData.productType?.toLowerCase() === "vehicle" &&
            existingDocumentImages.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Hình ảnh giấy tờ hiện tại
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {existingDocumentImages.map((image, index) => (
                    <div key={image.id || index} className="relative group">
                      <img
                        src={image.imageUrl || image.imageData || image.url}
                        alt={`Document ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingDocumentImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa ảnh giấy tờ này"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                        Giấy tờ {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Nhấn vào nút X để xóa ảnh giấy tờ. Ảnh sẽ được xóa khi bạn lưu
                  bài đăng.
                </p>
              </div>
            )}

          {/* Product Image Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Thêm hình ảnh sản phẩm mới (Tối đa {5 - existingImages.length}{" "}
              ảnh)
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload hình ảnh xe của bạn</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload-edit"
                />
                <label
                  htmlFor="image-upload-edit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Chọn ảnh xe
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Document Image Upload - Only for vehicles */}
          {formData.productType?.toLowerCase() === "vehicle" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Thêm hình ảnh giấy tờ mới (Tối đa{" "}
                {3 - existingDocumentImages.length} ảnh)
              </h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Upload các giấy tờ quan trọng như:
                    Đăng ký xe, Bảo hiểm, Giấy tờ sở hữu, v.v.
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Upload hình ảnh giấy tờ xe
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleDocumentImageUpload}
                    className="hidden"
                    id="document-upload-edit"
                  />
                  <label
                    htmlFor="document-upload-edit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer"
                  >
                    Chọn ảnh giấy tờ
                  </label>
                </div>

                {documentImages.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {documentImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Document Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeDocumentImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                          Giấy tờ {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang cập nhật..." : "Cập nhật bài đăng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
