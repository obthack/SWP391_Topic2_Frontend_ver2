import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Sparkles, TrendingUp, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest, predictVehiclePrice } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

export const CreateListing = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAiPricePrediction = async () => {
    if (!formData.brand || !formData.year) {
      show({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập hãng xe và năm sản xuất để AI có thể đề xuất giá",
        type: "warning",
      });
      return;
    }

    setAiLoading(true);
    try {
      const vehicleData = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage) || 0,
        condition: formData.condition,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        location: formData.location,
      };

      const result = await predictVehiclePrice(vehicleData);
      
      if (result.success) {
        setAiPrediction(result.prediction);
        setShowAiSuggestion(true);
        
        show({
          title: "Đề xuất giá thành công",
          description: `AI đã đề xuất giá: ${formatPrice(result.prediction.predicted_price)}`,
          type: "success",
        });
      } else {
        throw new Error(result.error || "Không thể dự đoán giá");
      }
    } catch (error) {
      console.error("AI prediction error:", error);
      show({
        title: "Lỗi AI",
        description: "Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau.",
        type: "error",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiPrice = () => {
    if (aiPrediction) {
      setFormData({
        ...formData,
        price: aiPrediction.predicted_price.toString(),
      });
      setShowAiSuggestion(false);
      
      show({
        title: "Áp dụng giá AI",
        description: `Đã áp dụng giá đề xuất: ${formatPrice(aiPrediction.predicted_price)}`,
        type: "success",
      });
    }
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
      const productDataRaw = {
        title: formData.title,
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        licensePlate: formData.licensePlate || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        color: formData.color || undefined,
        fuelType: formData.fuelType || undefined,
        transmission: formData.transmission || undefined,
        condition: formData.condition || undefined,
        location: formData.location || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        productType: formData.productType,
      };
      // Remove undefined to avoid backend validation errors
      const productData = Object.fromEntries(
        Object.entries({
          ...productDataRaw,
          sellerId: user?.accountId || user?.id || user?.userId,
          accountId: user?.accountId || undefined,
          status: "Draft",
          createdDate: new Date().toISOString(),
          isActive: true,
        }).filter(([, v]) => v !== undefined)
      );

      console.log("User object:", user);
      console.log("Sending product data:", productData);

      const created = await apiRequest("/api/Product", {
        method: "POST",
        body: productData,
      });

      console.log("Product created successfully:", created);
      const pid = created?.id || created?.productId || created?.Id;

      if (pid && images.length > 0) {
        // Try multiple upload endpoint first
        try {
          const imageDataArray = [];
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const dataUrl = await fileToBase64(img);
            imageDataArray.push({
              productId: pid,
              imageData: dataUrl,
              isPrimary: i === 0,
            });
          }

          console.log(
            "Uploading images with multiple endpoint:",
            imageDataArray
          );
          await apiRequest(`/api/ProductImage/multiple`, {
            method: "POST",
            body: imageDataArray,
          });
          console.log("Multiple images uploaded successfully");
        } catch (e) {
          console.warn("Multiple upload failed, trying individual uploads:", e);

          // Fallback to individual uploads
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const dataUrl = await fileToBase64(img);
            try {
              console.log(
                `Uploading image ${i + 1}/${images.length} for product ${pid}`
              );
              await apiRequest(`/api/ProductImage`, {
                method: "POST",
                body: {
                  productId: pid,
                  imageData: dataUrl,
                  isPrimary: i === 0,
                },
              });
              console.log(`Image ${i + 1} uploaded successfully`);
            } catch (e) {
              console.warn(`Image ${i + 1} upload failed:`, e);
            }
          }
        }
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

      let errorMessage = "Có lỗi xảy ra khi tạo bài đăng";

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
