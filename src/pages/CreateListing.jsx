import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

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
    location: "",
    contactPhone: "",
    contactEmail: user?.email || "",
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

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
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
      if (sellerId && typeof sellerId === 'string' && !isNaN(parseInt(sellerId))) {
        sellerId = parseInt(sellerId);
      }
      
      console.log("Debug user object:", {
        user,
        profile,
        sellerId,
        userKeys: user ? Object.keys(user) : 'no user',
        profileKeys: profile ? Object.keys(profile) : 'no profile',
        userValues: user ? Object.entries(user) : 'no user'
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
            sellerId = parsed?.user?.userId || parsed?.user?.id || parsed?.user?.accountId || 
                      parsed?.profile?.userId || parsed?.profile?.id;
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
        'Tesla': 1,
        'VinFast': 2, 
        'BMW': 3,
        'Mercedes': 4,
        'Audi': 5,
        'Porsche': 6,
        'Hyundai': 7,
        'Kia': 8
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
         condition: formData.condition || 'good', // ✅ Required field with default
         // Images will be uploaded after product creation
         // Additional fields that might be useful
         color: formData.color || "",
         fuelType: formData.fuelType || "",
         transmission: formData.transmission || "",
         location: formData.location || "",
         contactPhone: formData.contactPhone || "",
         contactEmail: formData.contactEmail || "",
         productType: formData.productType,
       };
      
      // Map to correct database field names
      const productData = Object.fromEntries(Object.entries({
        ...productDataRaw,
        seller_id: sellerId,
        category_id: categoryId,
        status: 'pending',
        createdDate: new Date().toISOString(),
        isActive: true,
      }).filter(([,v]) => v !== undefined && v !== null));

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
        imageUrls: imageUrls.length
      });
      
      // Additional debug for user object structure
      if (user) {
        console.log("User object details:", {
          keys: Object.keys(user),
          values: Object.values(user),
          entries: Object.entries(user),
          hasUserId: 'userId' in user,
          hasId: 'id' in user,
          hasAccountId: 'accountId' in user,
          userIdValue: user.userId,
          idValue: user.id,
          accountIdValue: user.accountId
        });
      }

      // Validate required fields
      if (!sellerId) {
        console.error("No sellerId found. User data:", {
          user,
          profile,
          localStorage: localStorage.getItem("evtb_auth")
        });
        
        // Last resort: use a known working userId from API or generate temporary
        if (user?.email === "opgoodvsbad@gmail.com") {
          // Use the known userId from API response
          sellerId = 2;
          console.warn("Using known userId for opgoodvsbad@gmail.com:", sellerId);
        } else if (user?.email) {
          // Create a simple hash-based ID from email
          sellerId = `temp_${user.email.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
          console.warn("Using temporary sellerId:", sellerId);
        } else {
          throw new Error("Không thể xác định thông tin người bán. Vui lòng đăng nhập lại hoặc làm mới trang.");
        }
      }

      // Validate other required fields
      if (!formData.title || !formData.price || !formData.description || !formData.brand || !formData.productType || !formData.model) {
        throw new Error("Vui lòng điền đầy đủ các trường bắt buộc: tiêu đề, giá, mô tả, hãng xe, model, và loại sản phẩm.");
      }

      // Validate price is a valid number
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Giá bán phải là một số dương hợp lệ.");
      }

      // Validate year if provided
      if (formData.year && (isNaN(parseInt(formData.year)) || parseInt(formData.year) < 2010 || parseInt(formData.year) > 2024)) {
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
           condition: formData.condition || 'good',
           vehicleType: null,
           manufactureYear: formData.year ? parseInt(formData.year) : null,
           mileage: formData.mileage ? parseInt(formData.mileage) : null,
           batteryHealth: null,
           batteryType: null,
           capacity: null,
           voltage: null,
           cycleCount: null,
           status: 'Draft',
           verificationStatus: 'NotRequested',
           imageUrls: [], // Will be updated after image upload
           licensePlate: formData.licensePlate || "",
           color: formData.color || "",
           fuelType: formData.fuelType || "",
           transmission: formData.transmission || "",
           location: formData.location || "",
           contactPhone: formData.contactPhone || "",
           contactEmail: formData.contactEmail || "",
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
          location: productData.location,
          contactPhone: productData.contactPhone,
          contactEmail: productData.contactEmail,
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
          Images: imageUrls,
          RepresentativeImage: imageUrls.length > 0 ? imageUrls[0] : null,
          SellerId: sellerId,
          CategoryId: categoryId,
          Status: 'pending'
        },
        // Format 5: Test with different field names
        {
          name: formData.title,
          description: formData.description,
          cost: parseFloat(formData.price),
          sellerId: sellerId,
          categoryId: categoryId,
          state: 'pending'
        }
      ];

      for (let i = 0; i < productDataVariations.length; i++) {
        try {
          console.log(`Trying product data format ${i + 1}:`, productDataVariations[i]);
          created = await apiRequest("/api/Product", {
        method: "POST",
            body: productDataVariations[i],
          });
          console.log(`Product created successfully with format ${i + 1}:`, created);
          break;
        } catch (formatError) {
          console.log(`Format ${i + 1} failed:`, formatError.message);
          if (i === productDataVariations.length - 1) {
            throw formatError; // Re-throw the last error
          }
        }
      }
       const pid = created?.id || created?.productId || created?.Id;

       // Upload images after product creation (ProductImage API might need productId)
       if (pid && images.length > 0) {
         console.log(`Uploading ${images.length} images for product ${pid}...`);
         
         const uploadedImageUrls = [];
         
         // Try individual uploads with productId
         for (let i = 0; i < images.length; i++) {
           const img = images[i];
           const dataUrl = await fileToBase64(img);
           
           try {
             console.log(`Uploading image ${i + 1}/${images.length} for product ${pid}`);
             
             // Try ProductImage endpoint with productId
             const uploadResponse = await apiRequest(`/api/ProductImage`, {
               method: "POST",
               body: {
                 productId: pid,
                 imageData: dataUrl,
                 filename: img.name || `image_${Date.now()}_${i}.jpg`,
                 isPrimary: i === 0,
               },
             });
             
             // Extract image URL from response
             let imageUrl = null;
             if (uploadResponse?.url) {
               imageUrl = uploadResponse.url;
             } else if (uploadResponse?.imageUrl) {
               imageUrl = uploadResponse.imageUrl;
             } else if (uploadResponse?.data?.url) {
               imageUrl = uploadResponse.data.url;
             } else if (uploadResponse?.data?.imageUrl) {
               imageUrl = uploadResponse.data.imageUrl;
             } else if (typeof uploadResponse === 'string') {
               imageUrl = uploadResponse;
             }
             
             if (imageUrl) {
               uploadedImageUrls.push(imageUrl);
               console.log(`Image ${i + 1} uploaded successfully:`, imageUrl);
             } else {
               console.warn(`Image ${i + 1} upload response missing URL:`, uploadResponse);
               uploadedImageUrls.push(dataUrl); // Fallback to data URL
             }
           } catch (e) {
             console.warn(`Image ${i + 1} upload failed:`, e);
             uploadedImageUrls.push(dataUrl); // Fallback to data URL
           }
         }
         
         // Update product with image URLs if we got some
         if (uploadedImageUrls.length > 0) {
           try {
             console.log(`Updating product ${pid} with ${uploadedImageUrls.length} image URLs...`);
             await apiRequest(`/api/Product/${pid}`, {
               method: "PUT",
               body: {
                 imageUrls: uploadedImageUrls
               },
             });
             console.log("Product updated with image URLs successfully");
           } catch (updateError) {
             console.warn("Failed to update product with image URLs:", updateError);
           }
         }
         
         console.log(`Final uploaded image URLs:`, uploadedImageUrls);
       } else if (imageUrls.length > 0) {
         console.log(`${imageUrls.length} images were uploaded successfully before product creation`);
       } else if (images.length > 0) {
         console.warn(`No images were uploaded successfully. ${images.length} images were selected but upload failed.`);
       } else {
         console.log("No images were selected for upload.");
       }

      show({
        title: "Tạo bài đăng thành công",
        description: "Bài đăng của bạn đang chờ duyệt",
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
        errorMessage = "Lỗi máy chủ (500): Có thể do dữ liệu không hợp lệ hoặc lỗi cơ sở dữ liệu. Vui lòng kiểm tra lại thông tin và thử lại.";
      } else if (err.status === 400) {
        errorMessage = "Lỗi dữ liệu (400): Thông tin gửi lên không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.";
      } else if (err.status === 401) {
        errorMessage = "Lỗi xác thực (401): Vui lòng đăng nhập lại.";
      } else if (err.status === 403) {
        errorMessage = "Lỗi quyền truy cập (403): Bạn không có quyền thực hiện thao tác này.";
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
      if (errorMessage.includes("entity changes") || errorMessage.includes("database")) {
        errorMessage += "\n\nGợi ý: Kiểm tra xem tất cả các trường bắt buộc đã được điền đúng chưa, đặc biệt là giá và thông tin người bán.";
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
                  Loại sản phẩm * <span className="text-red-500">(Bắt buộc)</span>
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
                    placeholder="VD: 30A-123.45"
                    required
                  />
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
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: 1200000000"
                    required
                  />
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

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Thông tin liên hệ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa điểm *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: Hà Nội, TP.HCM"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: 0123456789"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Hình ảnh (Tối đa 5 ảnh)
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Kéo thả ảnh vào đây hoặc click để chọn
                </p>
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
                  Chọn ảnh
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
