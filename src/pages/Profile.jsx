import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { 
  Edit3, Save, X, User, Mail, Phone, Calendar, 
  Package, Eye, Heart, Award, Shield, 
  Settings, Camera, CheckCircle, AlertCircle,
  TrendingUp, Users, MessageSquare, Clock, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/formatters';

export const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState({ fullName: '', email: '', phone: '' });
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState('');
  const [userStats, setUserStats] = useState({
    totalListings: 0,
    activeListings: 0,
    reservedListings: 0,
    soldListings: 0,
    totalViews: 0,
    memberSince: '',
    responseRate: 95
  });
  const [userProducts, setUserProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (user || profile) {
      const currentForm = {
        fullName: user?.fullName || profile?.fullName || user?.full_name || profile?.full_name || '',
        email: user?.email || profile?.email || '',
        phone: user?.phone || profile?.phone || ''
      };
      const currentAvatarUrl = user?.avatar || profile?.avatar || user?.avatarUrl || profile?.avatarUrl || '';
      
      setForm(currentForm);
      setAvatarUrl(currentAvatarUrl);
      setOriginalForm(currentForm);
      setOriginalAvatarUrl(currentAvatarUrl);
      
      // Load user stats
      loadUserStats();
    }
  }, [user, profile]);

  useEffect(() => {
    if (activeTab === "reviews") {
      loadReviews();
    }
  }, [activeTab]);

  const loadUserStats = async () => {
    try {
      const userId = user?.id || user?.userId || user?.accountId || profile?.id || profile?.userId;
      if (userId) {
        // Check if token exists and is valid
        const authData = localStorage.getItem("evtb_auth");
        if (!authData) {
          console.log('No auth data found, skipping stats load');
          return;
        }
        
        const parsed = JSON.parse(authData);
        if (!parsed?.token) {
          console.log('No token found, skipping stats load');
          return;
        }
        
        const data = await apiRequest(`/api/Product/seller/${userId}`);
        const items = Array.isArray(data) ? data : data?.items || [];
        
        // Store all products for display
        setUserProducts(items);
        
        const totalListings = items.length;
        const activeListings = items.filter(item => {
          const status = (item.status || item.Status || '').toLowerCase();
          return status === 'approved' || status === 'active';
        }).length;
        
        const reservedListings = items.filter(item => {
          const status = (item.status || item.Status || '').toLowerCase();
          return status === 'reserved';
        }).length;
        
        const soldListings = items.filter(item => {
          const status = (item.status || item.Status || '').toLowerCase();
          return status === 'sold';
        }).length;
        
        const totalViews = items.reduce((sum, item) => 
          sum + (item.viewsCount || item.views_count || 0), 0
        );
        
        setUserStats({
          totalListings,
          activeListings,
          reservedListings,
          soldListings,
          totalViews,
          memberSince: user?.createdAt || profile?.createdAt || new Date().toISOString().split('T')[0],
          responseRate: 95
        });
      }
    } catch (error) {
      console.log('Could not load user stats:', error);
      
      // If 401 error, clear auth data and redirect to login
      if (error.status === 401) {
        console.log('Token expired, clearing auth data');
        localStorage.removeItem("evtb_auth");
        window.location.href = '/login';
      }
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const userId = user?.id || user?.userId || user?.accountId || profile?.id || profile?.userId;
      console.log('🔍 Loading reviews for userId:', userId);
      
      if (userId) {
        // Thử cả hai endpoint để đảm bảo
        try {
          const response = await apiRequest(`/api/Review/reviewee/${userId}`);
          console.log('🔍 Reviews response:', response);
          const reviewsArray = Array.isArray(response) ? response : (response.reviews || []);
          
          // ✅ Sort reviews by date (newest first)
          const sortedReviews = reviewsArray.sort((a, b) => {
            const dateA = new Date(a.createdDate || a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdDate || b.createdAt || b.created_at || 0);
            return dateB - dateA; // Descending order (newest first)
          });
          
          console.log('🔍 Sorted reviews (newest first):', sortedReviews);
          setReviews(sortedReviews);
        } catch (revieweeError) {
          console.log('🔍 Reviewee endpoint failed, trying all reviews:', revieweeError);
          // Fallback: lấy tất cả review và filter
          const allReviews = await apiRequest('/api/Review');
          console.log('🔍 All reviews:', allReviews);
          const userReviews = Array.isArray(allReviews) 
            ? allReviews.filter(review => review.revieweeId === userId)
            : [];
          
          // ✅ Sort reviews by date (newest first)
          const sortedReviews = userReviews.sort((a, b) => {
            const dateA = new Date(a.createdDate || a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdDate || b.createdAt || b.created_at || 0);
            return dateB - dateA; // Descending order (newest first)
          });
          
          setReviews(sortedReviews);
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target.result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const payload = { fullName: form.fullName, email: form.email, phone: form.phone, avatar: avatarUrl };
      await updateProfile(payload);
      
      setMessage('Cập nhật thành công');
      show({ title: 'Cập nhật hồ sơ', description: 'Thông tin đã được lưu', type: 'success' });
      
      // Update original form to match current form
      setOriginalForm(form);
      setOriginalAvatarUrl(avatarUrl);
      setIsEditing(false);
    } catch (e) {
      console.error('Profile update error:', e);
      
      let errorMessage = 'Không thể cập nhật hồ sơ';
      
      if (e.name === 'QuotaExceededError') {
        errorMessage = 'Không thể lưu thông tin. Vui lòng thử lại sau khi làm mới trang.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      show({ 
        title: 'Lỗi cập nhật', 
        description: errorMessage, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(originalForm);
    setAvatarUrl(originalAvatarUrl);
    setIsEditing(false);
    setMessage('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header Section with Gradient */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              {/* Avatar with Enhanced Design */}
              <div className="relative group">
                <div className="h-32 w-32 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white/20 backdrop-blur-sm">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {form.fullName ? form.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 bg-white text-blue-600 rounded-full p-3 cursor-pointer hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Camera className="h-5 w-5" />
                  </label>
                )}
              </div>
              
              {/* User Info */}
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">{form.fullName || 'Chưa có tên'}</h1>
                <p className="text-blue-100 mb-2 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {form.email}
                </p>
                <div className="flex items-center space-x-4 text-sm text-blue-100">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Thành viên từ {new Date(userStats.memberSince).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full hover:bg-white/30 transition-all duration-200 flex items-center space-x-2 border border-white/20"
            >
              <Edit3 className="h-5 w-5" />
              <span>{isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng tin đăng</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalListings}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{userStats.activeListings}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang thanh toán</p>
                <p className="text-2xl font-bold text-orange-600">{userStats.reservedListings}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã bán</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.soldListings}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lượt xem</p>
                <p className="text-2xl font-bold text-purple-600">{userStats.totalViews}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Product Management Section */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Sản phẩm đang bán ({userStats.activeListings})
              </button>
              <button
                onClick={() => setActiveTab("reserved")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reserved"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Đang thanh toán ({userStats.reservedListings})
              </button>
              <button
                onClick={() => setActiveTab("sold")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "sold"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Đã bán ({userStats.soldListings})
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reviews"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Đánh giá của tôi
              </button>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Thông tin cá nhân
                  </h2>
                </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {message && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <p className="text-sm text-green-700">{message}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
            )}

            {activeTab === "products" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sản phẩm đang bán ({userStats.activeListings})
                </h3>
                {userProducts.filter(item => {
                  const status = (item.status || item.Status || '').toLowerCase();
                  return status === 'approved' || status === 'active';
                }).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userProducts.filter(item => {
                      const status = (item.status || item.Status || '').toLowerCase();
                      return status === 'approved' || status === 'active';
                    }).map((product, index) => (
                      <div key={product.id || product.productId || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {product.title || product.name}
                            </h4>
                            <p className="text-lg font-bold text-blue-600 mt-1">
                              {formatPrice(product.price)}
                            </p>
                            <div className="flex items-center mt-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-sm text-green-600">Đang bán</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link
                            to={`/product/${product.id || product.productId}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Xem chi tiết →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có sản phẩm nào đang bán</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reserved" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sản phẩm đang trong quá trình thanh toán ({userStats.reservedListings})
                </h3>
                {userProducts.filter(item => {
                  const status = (item.status || item.Status || '').toLowerCase();
                  return status === 'reserved';
                }).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userProducts.filter(item => {
                      const status = (item.status || item.Status || '').toLowerCase();
                      return status === 'reserved';
                    }).map((product) => (
                      <div key={product.id || product.productId} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-orange-200 rounded-lg flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {product.title || product.name}
                            </h4>
                            <p className="text-lg font-bold text-blue-600 mt-1">
                              {formatPrice(product.price)}
                            </p>
                            <div className="flex items-center mt-2">
                              <Clock className="h-4 w-4 text-orange-600 mr-1" />
                              <span className="text-sm text-orange-600">Đang trong quá trình thanh toán</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link
                            to={`/product/${product.id || product.productId}`}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center block"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có sản phẩm nào đang trong quá trình thanh toán</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sold" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sản phẩm đã bán ({userStats.soldListings})
                </h3>
                {userProducts.filter(item => {
                  const status = (item.status || item.Status || '').toLowerCase();
                  return status === 'sold';
                }).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userProducts.filter(item => {
                      const status = (item.status || item.Status || '').toLowerCase();
                      return status === 'sold';
                    }).map((product) => (
                      <div key={product.id || product.productId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {product.title || product.name}
                            </h4>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              {formatPrice(product.price)}
                            </p>
                            <div className="flex items-center mt-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-sm text-green-600">Đã bán</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Cập nhật: {new Date(product.updatedAt || product.updated_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="text-gray-500 text-sm">
                            Sản phẩm này đã được bán và không còn hiển thị công khai
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có sản phẩm nào đã bán</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-600" />
                  Đánh giá của tôi ({reviews.length})
                </h3>
                
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải đánh giá...</span>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {/* Rating Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {(reviews.reduce((sum, review) => sum + (review.rating || review.ratingValue || 0), 0) / reviews.length).toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${
                              index < Math.round(reviews.reduce((sum, review) => sum + (review.rating || review.ratingValue || 0), 0) / reviews.length)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reviews.length} đánh giá
                      </div>
                    </div>
                      </div>
                    </div>

                    {/* Individual Reviews */}
                    {reviews.map((review, index) => (
                      <div key={review.reviewId || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {review.reviewerName || review.buyerName || review.userName || 'Người dùng'}
                              </span>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, starIndex) => (
                                  <Star
                                    key={starIndex}
                                    className={`h-4 w-4 ${
                                      starIndex < (review.rating || review.ratingValue || 0)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdDate || review.createdAt || review.created_at).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            
                            {review.content && (
                              <p className="text-gray-700 text-sm mb-2">
                                {review.content}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Package className="h-3 w-3" />
                                <span>{review.productTitle || review.productName || 'Sản phẩm'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Đơn #{review.orderId}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có đánh giá nào</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Đánh giá sẽ xuất hiện ở đây khi khách hàng đánh giá sản phẩm của bạn
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Trạng thái tài khoản
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Xác thực email</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Đã xác thực
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tỷ lệ phản hồi</span>
                  <span className="text-sm font-medium text-gray-900">{userStats.responseRate}%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Thao tác nhanh
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center">
                  <Package className="h-4 w-4 mr-3 text-gray-600" />
                  <span className="text-sm text-gray-700">Quản lý tin đăng</span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-3 text-gray-600" />
                  <span className="text-sm text-gray-700">Tin nhắn</span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center">
                  <Heart className="h-4 w-4 mr-3 text-gray-600" />
                  <span className="text-sm text-gray-700">Danh sách yêu thích</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};