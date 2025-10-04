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
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng ký</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block mb-1 font-medium">
              Họ và tên
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="pl-10 w-full border rounded-lg px-4 py-2"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="pl-10 w-full border rounded-lg px-4 py-2"
                placeholder="you@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block mb-1 font-medium">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="pl-10 w-full border rounded-lg px-4 py-2"
                placeholder="0123456789"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 font-medium">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="pl-10 w-full border rounded-lg px-4 py-2"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-1 font-medium">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-10 w-full border rounded-lg px-4 py-2"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};
