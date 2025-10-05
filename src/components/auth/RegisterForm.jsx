import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Phone, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;
    setLoading(true);

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone
      );
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-gradient-to-br from-green-600 via-blue-600 to-purple-700"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23059669;stop-opacity:0.9" /><stop offset="50%" style="stop-color:%232563eb;stop-opacity:0.8" /><stop offset="100%" style="stop-color:%237c3aed;stop-opacity:0.9" /></linearGradient></defs><rect width="1000" height="1000" fill="url(%23grad2)"/><g fill="white" opacity="0.15"><circle cx="150" cy="150" r="80"/><circle cx="850" cy="200" r="60"/><circle cx="200" cy="800" r="100"/><circle cx="750" cy="750" r="70"/><circle cx="500" cy="400" r="40"/></g></svg>')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-12 h-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4">Tham gia cộng đồng EV!</h1>
              <p className="text-xl text-blue-100 mb-8">
                Bắt đầu hành trình xe điện của bạn ngay hôm nay
              </p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
              <h3 className="text-lg font-semibold mb-4">
                Trở thành thành viên của EV Market
              </h3>
              <div className="space-y-3 text-sm text-blue-100">
                <div className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Đăng tin nhanh chóng, dễ dàng</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🔋</span>
                  <span>Tiếp cận hàng ngàn người mua xe điện</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>💎</span>
                  <span>Giá cả minh bạch, cạnh tranh</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🤝</span>
                  <span>Giao dịch an toàn, bảo mật tuyệt đối</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{
          background: `
            linear-gradient(45deg, 
              rgba(16, 185, 129, 0.1) 0%, 
              rgba(59, 130, 246, 0.1) 25%, 
              rgba(139, 92, 246, 0.1) 50%, 
              rgba(236, 72, 153, 0.1) 75%, 
              rgba(251, 146, 60, 0.1) 100%
            ),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23ecfdf5;stop-opacity:0.9" /><stop offset="100%" style="stop-color:%23f0f9ff;stop-opacity:0.8" /></linearGradient></defs><rect width="100%" height="100%" fill="url(%23lg1)"/><g fill="%2310b981" opacity="0.12"><polygon points="100,50 150,100 100,150 50,100" /><polygon points="900,150 950,200 900,250 850,200" /><polygon points="200,850 250,900 200,950 150,900" /><polygon points="800,750 850,800 800,850 750,800" /></g><g fill="%233b82f6" opacity="0.1"><circle cx="300" cy="200" r="35" /><circle cx="700" cy="400" r="25" /><circle cx="500" cy="700" r="40" /><circle cx="150" cy="600" r="30" /></g></svg>')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-md w-full relative z-10">
          <div
            className="bg-white bg-opacity-95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white border-opacity-70 p-8 transform hover:scale-105 transition-all duration-300 hover:shadow-3xl"
            style={{
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)",
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Đăng ký</h2>
              <p className="mt-2 text-gray-600">Tạo tài khoản mới ngay hôm nay</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { id: "fullName", label: "Họ và tên", icon: <User />, type: "text", placeholder: "Nguyễn Văn A" },
                { id: "email", label: "Email", icon: <Mail />, type: "email", placeholder: "you@email.com" },
                { id: "phone", label: "Số điện thoại", icon: <Phone />, type: "text", placeholder: "0123456789" },
                { id: "password", label: "Mật khẩu", icon: <Lock />, type: "password", placeholder: "••••••••" },
                { id: "confirmPassword", label: "Xác nhận mật khẩu", icon: <Lock />, type: "password", placeholder: "••••••••" },
              ].map(({ id, label, icon, type, placeholder }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {icon}
                    </span>
                    <input
                      id={id}
                      name={id}
                      type={type}
                      value={formData[id]}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 focus:scale-105"
                      placeholder={placeholder}
                      required
                    />
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
