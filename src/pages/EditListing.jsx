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
  });
  const [displayPrice, setDisplayPrice] = useState("");

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      // Use unified API endpoint for all product types
      const data = await apiRequest(`/api/Product/${id}`);
      console.log("🔍 Loaded from unified API:", data);
      console.log("🔍 Raw API data:", data);
      console.log("🔍 Data keys:", Object.keys(data));
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
        // Vehicle specific fields
        vehicleType: data.vehicleType ?? data.VehicleType ?? "",
        manufactureYear:
          data.manufactureYear ??
          data.ManufactureYear ??
          data.year ??
          data.Year ??
          "",
        seatCount: data.seatCount ?? data.SeatCount ?? "",
        // Battery specific fields
        batteryType: data.batteryType ?? data.BatteryType ?? "",
        batteryHealth: data.batteryHealth ?? data.BatteryHealth ?? "",
        capacity: data.capacity ?? data.Capacity ?? "",
        voltage: data.voltage ?? data.Voltage ?? "",
        bms: data.bms ?? data.BMS ?? "",
        cellType: data.cellType ?? data.CellType ?? "",
        cycleCount: data.cycleCount ?? data.CycleCount ?? "",
      };
      console.log("🔍 Mapped form data:", mapped);
      setFormData(mapped);

      // Set display price for formatting
      if (mapped.price) {
        setDisplayPrice(formatVietnamesePrice(mapped.price));
      }

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

      // Use unified API endpoint for all product types
      const apiEndpoint = `/api/Product/${id}`;

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
                    <option value="">Chọn hộp số</option>
                    <option value="automatic">Tự động</option>
                    <option value="manual">Số sàn</option>
                    <option value="cvt">CVT</option>
                    <option value="semi-automatic">Bán tự động</option>
                  </select>
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
          {formData.productType === "vehicle" &&
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
          {formData.productType === "vehicle" && (
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
