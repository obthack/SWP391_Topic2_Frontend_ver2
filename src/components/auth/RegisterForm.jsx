import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff, Car, Zap, Shield, Star, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      const session = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone
      );
      const rawId = session?.user?.roleId ?? session?.profile?.roleId ?? session?.user?.role;
      const rid = typeof rawId === 'string' ? Number(rawId) : rawId;
      const roleName = (session?.user?.roleName || session?.profile?.role || '').toString().toLowerCase();
      const isAdmin = rid === 1 || roleName === 'admin';
      navigate(isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      console.error("Register form error:", err);
      
      // Handle specific error cases
      let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
      
      if (err.status === 400) {
        if (err.data && typeof err.data === 'object') {
          // Try to extract meaningful error message
          errorMessage = err.data.message || err.data.error || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
        } else if (err.message && err.message.includes('400')) {
          errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
        }
      } else if (err.status === 409) {
        errorMessage = "Email này đã được sử dụng. Vui lòng chọn email khác.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Electric car silhouettes - more variety */}
        <div className="absolute top-16 right-16 w-40 h-20 opacity-15">
          <svg viewBox="0 0 200 100" className="w-full h-full text-cyan-400">
            <path d="M15 65 L40 45 L170 45 L190 65 L190 85 L170 85 L150 65 L110 65 L90 85 L70 85 L50 65 L15 65 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="30" cy="85" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="170" cy="85" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="80" y="50" width="40" height="15" fill="currentColor" opacity="0.2"/>
            <rect x="85" y="35" width="30" height="10" fill="currentColor" opacity="0.1"/>
          </svg>
        </div>
        
        <div className="absolute top-32 left-12 w-36 h-18 opacity-20">
          <svg viewBox="0 0 200 100" className="w-full h-full text-emerald-400">
            <path d="M25 62 L50 42 L180 42 L200 62 L200 82 L180 82 L160 62 L120 62 L100 82 L80 82 L60 62 L25 62 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="40" cy="82" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="160" cy="82" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="90" y="47" width="20" height="15" fill="currentColor" opacity="0.2"/>
            <rect x="95" y="32" width="10" height="10" fill="currentColor" opacity="0.1"/>
          </svg>
        </div>

        <div className="absolute bottom-40 left-20 w-44 h-22 opacity-10">
          <svg viewBox="0 0 200 100" className="w-full h-full text-blue-400">
            <path d="M20 60 L55 40 L185 40 L205 60 L205 80 L185 80 L165 60 L125 60 L105 80 L85 80 L65 60 L20 60 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="45" cy="80" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="165" cy="80" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="95" y="45" width="10" height="15" fill="currentColor" opacity="0.2"/>
            <rect x="100" y="30" width="20" height="10" fill="currentColor" opacity="0.1"/>
          </svg>
        </div>

        {/* Tech elements */}
        <div className="absolute top-1/4 left-1/4 w-6 h-6 border-2 border-cyan-400 border-dashed opacity-30 animate-spin" style={{animationDuration: '15s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 border border-emerald-400 opacity-40 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-blue-400 opacity-20 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/4 left-1/2 w-5 h-5 border border-indigo-400 opacity-25 animate-bounce" style={{animationDelay: '1s'}}></div>
        
        {/* Circuit patterns */}
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 1000 1000" className="w-full h-full">
            <defs>
              <pattern id="circuit2" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M0 40 L80 40 M40 0 L40 80 M20 20 L60 60 M60 20 L20 60" stroke="currentColor" strokeWidth="1" fill="none"/>
                <circle cx="40" cy="40" r="3" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit2)" className="text-cyan-400"/>
          </svg>
        </div>

        {/* Floating particles */}
        <div className="absolute top-24 right-1/4 w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/5 w-1 h-1 bg-emerald-400 rounded-full opacity-80 animate-ping" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/4 right-1/5 w-3 h-3 bg-blue-400 rounded-full opacity-40 animate-bounce" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute bottom-24 left-1/4 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-70 animate-pulse" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute top-1/3 right-1/5 w-2 h-2 bg-purple-400 rounded-full opacity-50 animate-ping" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Glassmorphism Register Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-105 transition-all duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">EV Market</h2>
              <p className="text-blue-100">Tạo tài khoản mới</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl flex items-center text-red-200">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-blue-100 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-blue-100 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="0123456789"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-100 mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-emerald-500 bg-white/10 border-white/20 rounded focus:ring-emerald-500 focus:ring-offset-0"
                  required
                />
                <label htmlFor="terms" className="text-sm text-blue-100">
                  Tôi đồng ý với{" "}
                  <Link to="/terms" className="text-emerald-300 hover:text-white transition-colors">
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link to="/privacy" className="text-emerald-300 hover:text-white transition-colors">
                    Chính sách bảo mật
                  </Link>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-blue-200">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="font-medium text-white hover:text-emerald-300 transition-colors"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Benefits Cards */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <Car className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Hàng nghìn xe điện</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Giá cạnh tranh</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Giao dịch an toàn</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Hỗ trợ 24/7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};