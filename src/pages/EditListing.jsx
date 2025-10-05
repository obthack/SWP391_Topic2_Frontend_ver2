import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";

export const EditListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
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

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const data = await apiRequest(`/api/Product/${id}`);
      const mapped = {
        title: data.title ?? data.Title ?? "",
        description: data.description ?? data.Description ?? "",
        brand: data.brand ?? data.Brand ?? "",
        model: data.model ?? data.Model ?? "",
        year: data.year ?? data.productionYear ?? data.manufactureYear ?? data.ManufactureYear ?? "",
        price: data.price ?? data.Price ?? "",
        mileage: data.mileage ?? data.Mileage ?? "",
        color: data.color ?? data.Color ?? "",
        fuelType: data.fuelType ?? data.FuelType ?? "",
        transmission: data.transmission ?? data.Transmission ?? "",
        condition: data.condition ?? data.Condition ?? "excellent",
        location: data.location ?? data.city ?? data.City ?? data.address ?? "",
        contactPhone: data.contactPhone ?? data.phone ?? data.phoneNumber ?? data.PhoneNumber ?? "",
        contactEmail: data.contactEmail ?? data.email ?? data.Email ?? user?.email ?? "",
        productType: data.productType ?? data.product_type ?? data.Type ?? "vehicle",
      };
      setFormData(mapped);
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
    const newImages = files.slice(0, 5 - images.length);
    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const imageUrls = []; // For now, we'll skip image upload

      const productData = {
        title: formData.title,
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
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
        sellerId: user?.id || user?.accountId || user?.userId || 1,
        images: imageUrls,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };

      console.log("Updating product data:", productData);

      await apiRequest(`/api/Product/${id}`, {
        method: "PUT",
        body: productData,
      });

      navigate("/my-listings?success=listing_updated");
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
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa tin đăng</h1>
          <p className="text-gray-600 mt-2">Cập nhật thông tin bài đăng của bạn</p>
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
