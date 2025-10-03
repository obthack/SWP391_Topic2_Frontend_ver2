import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
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
              <h1 className="text-4xl font-bold mb-4">Chào mừng trở lại!</h1>
              <p className="text-xl text-blue-100 mb-8">
                Tiếp tục hành trình xe điện của bạn
              </p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
              <h3 className="text-lg font-semibold mb-4">
                Tại sao chọn EV Market?
              </h3>
              <div className="space-y-3 text-sm text-blue-100">
                <div className="flex items-center space-x-2">
                  <span>🔋</span>
                  <span>Xe điện chất lượng cao</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Giao dịch nhanh chóng</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🛡️</span>
                  <span>Bảo mật tuyệt đối</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>💎</span>
                  <span>Giá cả cạnh tranh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
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
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23ecfdf5;stop-opacity:0.9" /><stop offset="100%" style="stop-color:%23f0f9ff;stop-opacity:0.8" /></linearGradient></defs><rect width="100%" height="100%" fill="url(%23lg1)"/><g fill="%2310b981" opacity="0.12"><polygon points="100,50 150,100 100,150 50,100" /><polygon points="900,150 950,200 900,250 850,200" /><polygon points="200,850 250,900 200,950 150,900" /><polygon points="800,750 850,800 800,850 750,800" /></g><g fill="%233b82f6" opacity="0.1"><circle cx="300" cy="200" r="35" /><circle cx="700" cy="400" r="25" /><circle cx="500" cy="700" r="40" /><circle cx="150" cy="600" r="30" /></g></svg>')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Animated floating elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 right-24 w-18 h-18 bg-emerald-400 bg-opacity-25 rounded-lg animate-pulse transform rotate-45"></div>
          <div
            className="absolute top-32 left-28 w-14 h-14 bg-blue-400 bg-opacity-25 rounded-full animate-bounce"
            style={{ animationDelay: "0.8s" }}
          ></div>
          <div
            className="absolute bottom-28 right-16 w-16 h-16 bg-violet-400 bg-opacity-25 rounded-lg animate-pulse transform rotate-12"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute bottom-16 left-24 w-12 h-12 bg-orange-400 bg-opacity-25 rounded-full animate-bounce"
            style={{ animationDelay: "0.3s" }}
          ></div>
        </div>
        <div className="max-w-md w-full relative z-10">
          <div
            className="bg-white bg-opacity-95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white border-opacity-70 p-8 transform hover:scale-105 transition-all duration-300 hover:shadow-3xl"
            style={{
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)",
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
              <p className="mt-2 text-gray-600">Chào mừng bạn quay trở lại!</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 focus:scale-105"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 focus:scale-105"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
