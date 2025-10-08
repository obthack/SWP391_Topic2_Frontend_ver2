import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, Eye, EyeOff, Car, Zap, Shield, Star } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../lib/api";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (err) => {
    if (!err) return "Đã xảy ra lỗi không xác định.";
    // Network error (no response)
    if (err.status === 0 || err.message === "Failed to fetch") {
      return "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng hoặc API.";
    }
    // Backend provided message
    const backendMsg = err?.data?.message || err?.message;
    if (err.status === 401) {
      return backendMsg || "Email hoặc mật khẩu không đúng.";
    }
    if (err.status === 400) {
      return backendMsg || "Thông tin đăng nhập không hợp lệ.";
    }
    if (err.status >= 500) {
      return backendMsg || "Máy chủ gặp sự cố. Vui lòng thử lại sau.";
    }
    return backendMsg || "Đăng nhập thất bại. Vui lòng thử lại.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await signIn(email, password);

      // Debug logging
      console.log("=== LOGIN DEBUG ===");
      console.log("Full session data:", session);
      console.log("User object:", session?.user);
      console.log("Profile object:", session?.profile);

      const rawId =
        session?.user?.roleId ??
        session?.profile?.roleId ??
        session?.user?.role;
      const rid = typeof rawId === "string" ? Number(rawId) : rawId;
      const roleName = (session?.user?.roleName || session?.profile?.role || "")
        .toString()
        .toLowerCase();
      const isAdmin = rid === 1 || roleName === "admin";

      console.log("Raw roleId:", rawId);
      console.log("Processed roleId:", rid);
      console.log("Role name:", roleName);
      console.log("Is admin:", isAdmin);
      console.log("Will navigate to:", isAdmin ? "/admin" : "/dashboard");
      console.log("==================");

      navigate(isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Electric car silhouettes */}
        <div className="absolute top-20 left-10 w-32 h-16 opacity-20">
          <svg viewBox="0 0 200 100" className="w-full h-full text-blue-400">
            <path d="M20 60 L50 40 L180 40 L200 60 L200 80 L180 80 L160 60 L120 60 L100 80 L80 80 L60 60 L20 60 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="40" cy="80" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="160" cy="80" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="80" y="45" width="40" height="15" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>
        
        <div className="absolute top-40 right-20 w-40 h-20 opacity-15">
          <svg viewBox="0 0 200 100" className="w-full h-full text-cyan-400">
            <path d="M20 65 L45 45 L175 45 L195 65 L195 85 L175 85 L155 65 L115 65 L95 85 L75 85 L55 65 L20 65 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="35" cy="85" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="165" cy="85" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="85" y="50" width="30" height="15" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>

        <div className="absolute bottom-32 left-20 w-36 h-18 opacity-10">
          <svg viewBox="0 0 200 100" className="w-full h-full text-emerald-400">
            <path d="M25 62 L55 42 L185 42 L205 62 L205 82 L185 82 L165 62 L125 62 L105 82 L85 82 L65 62 L25 62 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="45" cy="82" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="165" cy="82" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="90" y="47" width="20" height="15" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>

        {/* Tech elements */}
        <div className="absolute top-1/4 right-1/4 w-8 h-8 border-2 border-blue-400 border-dashed opacity-30 animate-spin" style={{animationDuration: '10s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 border border-cyan-400 opacity-40 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-emerald-400 opacity-20 rounded-full animate-ping"></div>
        
        {/* Circuit patterns */}
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 1000 1000" className="w-full h-full">
            <defs>
              <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0 50 L100 50 M50 0 L50 100 M25 25 L75 75 M75 25 L25 75" stroke="currentColor" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" className="text-blue-400"/>
          </svg>
        </div>

        {/* Floating particles */}
        <div className="absolute top-20 right-1/3 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-cyan-400 rounded-full opacity-80 animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-emerald-400 rounded-full opacity-40 animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-70 animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Glassmorphism Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-105 transition-all duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">EV Market</h2>
              <p className="text-blue-100">Chào mừng bạn trở lại!</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl flex items-center text-red-200">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="username@gmail.com"
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Password"
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-blue-100">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-300 hover:text-white transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-blue-200">hoặc tiếp tục với</span>
                </div>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => window.location.href = `${API_BASE_URL}/api/Auth/google`}
                className="flex items-center justify-center px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm">Google</span>
              </button>
              
              <button
                onClick={() => window.location.href = `${API_BASE_URL}/api/Auth/facebook`}
                className="flex items-center justify-center px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm">Facebook</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-blue-200">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="font-medium text-white hover:text-blue-300 transition-colors"
                >
                  Đăng ký miễn phí
                </Link>
              </p>
            </div>
          </div>

          {/* Features Cards */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <Car className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Xe điện chất lượng</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Giao dịch nhanh</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Bảo mật tuyệt đối</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};