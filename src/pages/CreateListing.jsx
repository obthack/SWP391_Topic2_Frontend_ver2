import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Sparkles, TrendingUp, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest, predictVehiclePrice } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import { notifyPostCreated } from "../lib/notificationApi";

export const CreateListing = () => {
  const { user, profile } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);

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
    transmission: "",
    condition: "excellent",
    productType: "vehicle",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.slice(0, 5 - images.length); // Max 5 images
    setImages([...images, ...newImages]);
  };

  const handleDocumentImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.slice(0, 3 - documentImages.length); // Max 3 document images
    setDocumentImages([...documentImages, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };


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
      // We'll upload images after creating the product to get productId

      // Get user's profile ID for seller_id reference
      // Based on API response, the user object has 'userId' field, not 'id'
      let sellerId = user?.userId || user?.id || user?.accountId;

      // If sellerId is a number, keep it as number (backend might expect integer)
      // If it's a string UUID, keep it as string
      if (
        sellerId &&
        typeof sellerId === "string" &&
        !isNaN(parseInt(sellerId))
      ) {
        sellerId = parseInt(sellerId);
      }

      console.log("Debug user object:", {
        user,
        profile,
        sellerId,
        userKeys: user ? Object.keys(user) : "no user",
        profileKeys: profile ? Object.keys(profile) : "no profile",
        userValues: user ? Object.entries(user) : "no user",
      });

      // If still no sellerId, try to get from profile object directly
      if (!sellerId && profile) {
        sellerId = profile.userId || profile.id || profile.user_id;
      }

      // Last resort: try to get user ID from localStorage
      if (!sellerId) {
        try {
          const authData = localStorage.getItem("evtb_auth");
          if (authData) {
            const parsed = JSON.parse(authData);
            sellerId =
              parsed?.user?.userId ||
              parsed?.user?.id ||
              parsed?.user?.accountId ||
              parsed?.profile?.userId ||
              parsed?.profile?.id;
          }
        } catch (err) {
          console.warn("Could not parse auth data from localStorage:", err);
        }
      }

      // Get category ID based on brand
      // Since API Category doesn't exist, we'll use simple numeric IDs
      let categoryId = 1; // Default category

      // Map brands to specific category IDs (using simple integers)
      const brandToCategoryMap = {
        Tesla: 1,
        VinFast: 2,
        BMW: 3,
        Mercedes: 4,
        Audi: 5,
        Porsche: 6,
        Hyundai: 7,
        Kia: 8,
      };

      if (formData.brand && brandToCategoryMap[formData.brand]) {
        categoryId = brandToCategoryMap[formData.brand];
      }

      const productDataRaw = {
        title: formData.title,
        description: formData.description,
        product_type: formData.productType, // ✅ Required field
        brand: formData.brand,
        model: formData.model,
        licensePlate: formData.licensePlate || "",
        year: formData.year ? parseInt(formData.year) : null,
        price: formData.price ? parseFloat(formData.price) : undefined, // ✅ Required field
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        condition: formData.condition || "good", // ✅ Required field with default
        // Images will be uploaded after product creation
        // Additional fields that might be useful
        color: formData.color || "",
        fuelType: formData.fuelType || "",
        transmission: formData.transmission || "",
        productType: formData.productType,
      };

      // Map to correct database field names
      const productData = Object.fromEntries(
        Object.entries({
          ...productDataRaw,
          seller_id: sellerId,
          category_id: categoryId,
          status: "pending",
          createdDate: new Date().toISOString(),
          isActive: true,
        }).filter(([, v]) => v !== undefined && v !== null)
      );

      console.log("User object:", user);
      console.log("Profile object:", profile);
      console.log("Seller ID resolved:", sellerId);
      console.log("Category ID resolved:", categoryId);
      console.log("Sending product data:", productData);
      console.log("Product data keys:", Object.keys(productData));
      console.log("Product data values:", Object.values(productData));
      console.log("Form data summary:", {
        title: formData.title,
        licensePlate: formData.licensePlate,
        year: formData.year,
        brand: formData.brand,
        model: formData.model,
        price: formData.price,
        imageCount: images.length,
      });

      // Additional debug for user object structure
      if (user) {
        console.log("User object details:", {
          keys: Object.keys(user),
          values: Object.values(user),
          entries: Object.entries(user),
          hasUserId: "userId" in user,
          hasId: "id" in user,
          hasAccountId: "accountId" in user,
          userIdValue: user.userId,
          idValue: user.id,
          accountIdValue: user.accountId,
        });
      }

      // Validate required fields
      if (!sellerId) {
        console.error("No sellerId found. User data:", {
          user,
          profile,
          localStorage: localStorage.getItem("evtb_auth"),
        });

        // Last resort: use a known working userId from API or generate temporary
        if (user?.email === "opgoodvsbad@gmail.com") {
          // Use the known userId from API response
          sellerId = 2;
          console.warn(
            "Using known userId for opgoodvsbad@gmail.com:",
            sellerId
          );
        } else if (user?.email) {
          // Create a simple hash-based ID from email
          sellerId = `temp_${user.email.replace(
            /[^a-zA-Z0-9]/g,
            ""
          )}_${Date.now()}`;
          console.warn("Using temporary sellerId:", sellerId);
        } else {
          throw new Error(
            "Không thể xác định thông tin người bán. Vui lòng đăng nhập lại hoặc làm mới trang."
          );
        }
      }

      // Validate other required fields
      if (
        !formData.title ||
        !formData.price ||
        !formData.description ||
        !formData.brand ||
        !formData.productType ||
        !formData.model
      ) {
        throw new Error(
          "Vui lòng điền đầy đủ các trường bắt buộc: tiêu đề, giá, mô tả, hãng xe, model, và loại sản phẩm."
        );
      }

      // Validate license plate format
      if (formData.licensePlate) {
        const licensePlateRegex = /^[0-9]{2}[A-Z]-[0-9]{5}$/;
        if (!licensePlateRegex.test(formData.licensePlate)) {
          throw new Error(
            "Biển số xe không đúng định dạng. Vui lòng nhập theo định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)"
          );
        }
      }

      // Validate price is a valid number
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Giá bán phải là một số dương hợp lệ.");
      }

      // Validate year if provided
      if (
        formData.year &&
        (isNaN(parseInt(formData.year)) ||
          parseInt(formData.year) < 2010 ||
          parseInt(formData.year) > 2024)
      ) {
        throw new Error("Năm sản xuất phải là số từ 2010 đến 2024.");
      }

      // categoryId should always be set now since we have a default
      console.log("Using categoryId:", categoryId);

      // Update productData with resolved IDs
      productData.seller_id = sellerId;
      productData.category_id = categoryId;

      // Try different data formats to match backend expectations
      let created = null;
      const productDataVariations = [
        // Format 1: Backend field names (based on Swagger response)
        {
          sellerId: sellerId,
          productType: formData.productType,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          brand: formData.brand,
          model: formData.model,
          condition: formData.condition || "good",
          vehicleType: null,
          manufactureYear: formData.year ? parseInt(formData.year) : null,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          batteryHealth: null,
          batteryType: null,
          capacity: null,
          voltage: null,
          cycleCount: null,
          status: "pending",
          verificationStatus: "NotRequested",
          imageUrls: [], // Will be updated after image upload
          licensePlate: formData.licensePlate || "",
          color: formData.color || "",
          fuelType: formData.fuelType || "",
          transmission: formData.transmission || "",
        },
        // Format 2: Original format (keep as backup)
        productData,
        // Format 3: Camel case field names
        {
          title: productData.title,
          description: productData.description,
          productType: productData.product_type,
          brand: productData.brand,
          model: productData.model,
          licensePlate: productData.licensePlate,
          year: productData.year,
          price: productData.price,
          mileage: productData.mileage,
          condition: productData.condition,
          images: productData.images,
          representativeImage: productData.representativeImage,
          color: productData.color,
          fuelType: productData.fuelType,
          transmission: productData.transmission,
          sellerId: productData.seller_id,
          categoryId: productData.category_id,
          status: productData.status,
          createdDate: productData.createdDate,
          isActive: productData.isActive,
        },
        // Format 4: Minimal required fields with Pascal case
        {
          Title: formData.title,
          Brand: formData.brand,
          ProductType: formData.productType,
          Model: formData.model,
          LicensePlate: formData.licensePlate || "",
          Year: formData.year ? parseInt(formData.year) : null,
          Price: parseFloat(formData.price),
          Images: [], // Will be uploaded after product creation
          RepresentativeImage: null, // Will be set after image upload
          SellerId: sellerId,
          CategoryId: categoryId,
          Status: "pending",
        },
        // Format 5: Test with different field names
        {
          name: formData.title,
          description: formData.description,
          cost: parseFloat(formData.price),
          sellerId: sellerId,
          categoryId: categoryId,
          state: "pending",
        },
        // Format 6: Backend expected PascalCase format
        {
          SellerId: sellerId,
          ProductType: formData.productType,
          Title: formData.title,
          Description: formData.description,
          Price: price,
          Brand: formData.brand,
          Model: formData.model,
          LicensePlate: formData.licensePlate,
          Year: formData.year,
          Mileage: formData.mileage,
          Condition: formData.condition,
          Color: formData.color,
          FuelType: formData.fuelType,
          Transmission: formData.transmission,
          CategoryId: categoryId,
          Status: "pending",
          CreatedDate: new Date().toISOString(),
          IsActive: true,
        },
      ];

      for (let i = 0; i < productDataVariations.length; i++) {
        try {
          console.log(
            `Trying product data format ${i + 1}:`,
            productDataVariations[i]
          );
          created = await apiRequest("/api/Product", {
            method: "POST",
            body: productDataVariations[i],
          });
          console.log(
            `Product created successfully with format ${i + 1}:`,
            created
          );
          break;
        } catch (formatError) {
          console.log(`Format ${i + 1} failed:`, formatError.message);
          if (i === productDataVariations.length - 1) {
            throw formatError; // Re-throw the last error
          }
        }
      }
      const pid = created?.id || created?.productId || created?.Id;

      // Upload product images after product creation
      if (pid && images.length > 0) {
        console.log(
          `Uploading ${images.length} product images for product ${pid}...`
        );

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
      } else {
        console.log("No product images were selected for upload.");
      }

      // Upload document images after product creation
      if (pid && documentImages.length > 0) {
        console.log(
          `Uploading ${documentImages.length} document images for product ${pid}...`
        );

        try {
          // Try multiple upload first for documents
          const formData = new FormData();
          formData.append("productId", pid);
          formData.append("imageType", "document"); // Add type to distinguish from product images

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
              formData.append("imageType", "document"); // Add type to distinguish

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
      } else {
        console.log("No document images were selected for upload.");
      }

      // Send notification to user (optional - don't block success)
      let notificationSent = false;
      try {
        notificationSent = await notifyPostCreated(
          user.id || user.userId || user.accountId,
          formData.title
        );
        if (notificationSent) {
          console.log("✅ Notification sent successfully");
        } else {
          console.log("⚠️ Notification API not available");
        }
      } catch (notificationError) {
        console.warn(
          "⚠️ Could not send notification (API not available):",
          notificationError
        );
        // Don't throw error - notification is optional
      }

      show({
        title: "✅ Tạo bài đăng thành công",
        description: notificationSent
          ? "Bài đăng của bạn đang chờ duyệt từ admin. Bạn sẽ được thông báo khi được duyệt."
          : "Bài đăng của bạn đang chờ duyệt từ admin. (Hệ thống thông báo tạm thời không khả dụng)",
        type: "success",
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Error creating product:", err);
      console.error("Error details:", err.data);
      console.error("Error status:", err.status);
      console.error("Full error object:", JSON.stringify(err, null, 2));

      let errorMessage = "Có lỗi xảy ra khi tạo bài đăng";

      if (err.status === 500) {
        errorMessage =
          "Lỗi máy chủ (500): Backend gặp lỗi khi lưu dữ liệu. Vui lòng báo admin kiểm tra database và thử lại sau.";
      } else if (err.status === 400) {
        errorMessage =
          "Lỗi dữ liệu (400): Backend không nhận được đúng format dữ liệu. Vui lòng báo admin kiểm tra API contract.";
      } else if (err.status === 401) {
        errorMessage = "Lỗi xác thực (401): Vui lòng đăng nhập lại.";
      } else if (err.status === 403) {
        errorMessage =
          "Lỗi quyền truy cập (403): Bạn không có quyền thực hiện thao tác này.";
      }

      if (err.data) {
        if (typeof err.data === "string") {
          errorMessage = err.data;
        } else if (err.data.message) {
          errorMessage = err.data.message;
        } else if (err.data.errors) {
          const errorDetails = Object.values(err.data.errors).flat().join(", ");
          errorMessage = `Lỗi validation: ${errorDetails}`;
        } else if (err.data.title) {
          errorMessage = err.data.title;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Add more specific error handling for common issues
      if (
        errorMessage.includes("entity changes") ||
        errorMessage.includes("database")
      ) {
        errorMessage +=
          "\n\nGợi ý: Kiểm tra xem tất cả các trường bắt buộc đã được điền đúng chưa, đặc biệt là giá và thông tin người bán.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Đăng tin mới</h1>
          <p className="text-gray-600 mt-2">Tạo bài đăng xe điện của bạn</p>
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
                  Loại sản phẩm *{" "}
                  <span className="text-red-500">(Bắt buộc)</span>
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
                  <option value="accessory">Phụ kiện</option>
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
                    placeholder="Tên xe (VD: VinFast VF8)"
                    required
                  />
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hãng xe * <span className="text-red-500">(Bắt buộc)</span>
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn hãng xe</option>
                    <option value="VinFast">VinFast</option>
                    <option value="Tesla">Tesla</option>
                    <option value="BMW">BMW</option>
                    <option value="Mercedes">Mercedes</option>
                    <option value="Audi">Audi</option>
                    <option value="Porsche">Porsche</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Kia">Kia</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model * <span className="text-red-500">(Bắt buộc)</span>
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
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ví dụ: 1200000000"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleAiPricePrediction}
                      disabled={aiLoading || !formData.brand || !formData.year}
                      className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{aiLoading ? "AI..." : "AI"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nhấn AI để nhận đề xuất giá thông minh
                  </p>
                </div>
              </div>

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
                placeholder="Mô tả chi tiết về xe, tình trạng, lịch sử sử dụng..."
                required
              />
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Thông số kỹ thuật
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Màu sắc
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: Trắng, Đen, Xám"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại nhiên liệu
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn loại</option>
                  <option value="electric">Điện</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hộp số
                </label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn loại</option>
                  <option value="automatic">Tự động</option>
                  <option value="manual">Số sàn</option>
                </select>
              </div>

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
            </div>
          </div>

          {/* Product Images Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Hình ảnh sản phẩm (Tối đa 5 ảnh)
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
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
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

          {/* Document Images Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Hình ảnh giấy tờ xe (Tối đa 3 ảnh)
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
                <p className="text-gray-600 mb-4">Upload hình ảnh giấy tờ xe</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleDocumentImageUpload}
                  className="hidden"
                  id="document-upload"
                />
                <label
                  htmlFor="document-upload"
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
                        alt={`Document ${index + 1}`}
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

          {/* AI Price Suggestion */}
          {showAiSuggestion && aiPrediction && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Đề xuất giá từ AI</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiSuggestion(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Giá đề xuất</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(aiPrediction.predicted_price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Độ tin cậy: {Math.round(aiPrediction.confidence * 100)}%
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="text-sm font-medium text-gray-600 mb-2">Chi tiết dự đoán</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Random Forest: {formatPrice(aiPrediction.rf_prediction || aiPrediction.predicted_price)}</div>
                      <div>Gradient Boosting: {formatPrice(aiPrediction.gb_prediction || aiPrediction.predicted_price)}</div>
                      <div>Ensemble: {formatPrice(aiPrediction.ensemble_prediction || aiPrediction.predicted_price)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="text-sm font-medium text-gray-600 mb-2">Các yếu tố ảnh hưởng</div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {aiPrediction.factors && (
                        <>
                          <div className="flex justify-between">
                            <span>Tuổi xe:</span>
                            <span>{aiPrediction.factors.age} năm</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Số km:</span>
                            <span>{aiPrediction.factors.mileage?.toLocaleString('vi-VN')} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tình trạng:</span>
                            <span className="capitalize">{aiPrediction.factors.condition}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vị trí:</span>
                            <span>{aiPrediction.factors.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Xu hướng thị trường:</span>
                            <span className="capitalize">{aiPrediction.factors.market_trend}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Lưu ý:</p>
                        <p>Giá đề xuất chỉ mang tính chất tham khảo. Giá thực tế có thể khác tùy thuộc vào tình trạng cụ thể và thị trường địa phương.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAiSuggestion(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={applyAiPrice}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
                >
                  Áp dụng giá này
                </button>
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
              {loading ? "Đang tạo..." : "Tạo bài đăng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
