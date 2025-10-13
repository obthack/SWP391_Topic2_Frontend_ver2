import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

export const EditListing = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
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
    transmission: "",
    condition: "excellent",
    productType: "vehicle",
  });

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const data = await apiRequest(`/api/Product/${id}`);
      const mapped = {
        title: data.title ?? data.Title ?? "",
        licensePlate:
          data.licensePlate ?? data.license_plate ?? data.LicensePlate ?? "",
        description: data.description ?? data.Description ?? "",
        brand: data.brand ?? data.Brand ?? "",
        model: data.model ?? data.Model ?? "",
        year:
          data.year ??
          data.productionYear ??
          data.manufactureYear ??
          data.ManufactureYear ??
          "",
        price: data.price ?? data.Price ?? "",
        mileage: data.mileage ?? data.Mileage ?? "",
        color: data.color ?? data.Color ?? "",
        fuelType: data.fuelType ?? data.FuelType ?? "",
        transmission: data.transmission ?? data.Transmission ?? "",
        condition: data.condition ?? data.Condition ?? "excellent",
        productType:
          data.productType ?? data.product_type ?? data.Type ?? "vehicle",
      };
      setFormData(mapped);

      // Load existing product images
      try {
        const imageData = await apiRequest(`/api/ProductImage/product/${id}`);
        const productImages = (imageData || []).filter(
          (img) => !img.imageType || img.imageType !== "document"
        );
        const docImages = (imageData || []).filter(
          (img) => img.imageType === "document"
        );
        setExistingImages(productImages);
        setExistingDocumentImages(docImages);
      } catch (imageError) {
        console.warn("Could not load existing images:", imageError);
        setExistingImages([]);
        setExistingDocumentImages([]);
      }
    } catch (error) {
      console.error("Error loading listing:", error);
      setError("Không thể tải thông tin bài đăng");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        licensePlate: formData.licensePlate || undefined,
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        manufactureYear: formData.year ? parseInt(formData.year) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        vehicleType: formData.color || undefined, // Màu sắc có thể map với VehicleType
        condition: formData.condition || undefined,
        productType: formData.productType,
      };

      // Validate license plate format
      if (formData.licensePlate) {
        const licensePlateRegex = /^[0-9]{2}[A-Z]-[0-9]{5}$/;
        if (!licensePlateRegex.test(formData.licensePlate)) {
          throw new Error(
            "Biển số xe không đúng định dạng. Vui lòng nhập theo định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)"
          );
        }
      }

      console.log("Updating product data:", productData);

      const updated = await apiRequest(`/api/Product/${id}`, {
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
                    placeholder="Ví dụ: Xe điện VinFast VF8 mới 100%"
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
                    Hãng xe *
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

          {/* Existing Document Images */}
          {existingDocumentImages.length > 0 && (
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

          {/* Document Image Upload */}
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
                <p className="text-gray-600 mb-4">Upload hình ảnh giấy tờ xe</p>
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
