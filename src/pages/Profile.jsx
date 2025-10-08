import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Save, 
  Edit3, 
  Shield, 
  Star,
  TrendingUp,
  Package,
  Heart,
  MessageCircle,
  Settings,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';

export const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    phone: '',
    address: '',
    bio: ''
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    listings: 0,
    sold: 0,
    views: 0,
    reviews: 0,
    rating: 0
  });

  useEffect(() => {
    setForm({
      fullName: user?.fullName || user?.name || profile?.full_name || profile?.fullName || '',
      email: user?.email || profile?.email || '',
      phone: user?.phone || profile?.phone || '',
      address: profile?.address || '',
      bio: profile?.bio || ''
    });
    setAvatarUrl(user?.avatarUrl || profile?.avatarUrl || '');
    
    // Load user stats
    loadUserStats();
  }, [user, profile]);

  const loadUserStats = async () => {
    try {
      // Load user's listings and stats
      const listings = await apiRequest(`/api/Product/seller/${user?.id || user?.userId || user?.accountId}`);
      if (listings) {
        const totalListings = listings.length;
        const soldCount = listings.filter(l => l.status === 'sold').length;
        const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
        
        setStats({
          listings: totalListings,
          sold: soldCount,
          views: totalViews,
          reviews: 0, // TODO: Implement reviews system
          rating: 4.8 // TODO: Calculate from reviews
        });
      }
    } catch (err) {
      console.warn("Could not load user stats:", err);
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const uploadAvatar = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    setError('');
    try {
      const res = await apiRequest('/api/User/avatar', { method: 'POST', body: fd });
      const url = res?.url || res?.avatarUrl || res;
      setAvatarUrl(url);
      setMessage('Tải ảnh đại diện thành công');
    } catch (e) {
      setError(e.message || 'Không thể tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = { 
        fullName: form.fullName, 
        email: form.email, 
        phone: form.phone,
        address: form.address,
        bio: form.bio,
        avatarUrl 
      };
      const updated = await updateProfile(payload);
      setMessage('Cập nhật thành công');
      setIsEditing(false);
    } catch (e) {
      setError(e.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có thông tin';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: User },
    { id: 'activity', label: 'Hoạt động', icon: TrendingUp },
    { id: 'settings', label: 'Cài đặt', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="avatar" 
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(form.fullName || user?.email)
                )}
              </div>
              
              {/* Upload overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => e.target.files && uploadAvatar(e.target.files[0])} 
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {form.fullName || 'Người dùng'}
              </h1>
              <p className="text-blue-100 text-lg mb-4">
                {user?.email}
              </p>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{stats.listings}</div>
                  <div className="text-sm text-blue-100">Tin đăng</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{stats.sold}</div>
                  <div className="text-sm text-blue-100">Đã bán</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{stats.views}</div>
                  <div className="text-sm text-blue-100">Lượt xem</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span className="text-xl font-bold">{stats.rating}</span>
                  </div>
                  <div className="text-sm text-blue-100">Đánh giá</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span>{message}</span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>{isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}</span>
                  </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <User className="h-4 w-4 inline mr-2" />
                        Họ và tên
                      </label>
                      {isEditing ? (
                        <input
                          name="fullName"
                          value={form.fullName}
                          onChange={onChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          required
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {form.fullName || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={onChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          required
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {form.email || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Phone className="h-4 w-4 inline mr-2" />
                        Số điện thoại
                      </label>
                      {isEditing ? (
                        <input
                          name="phone"
                          value={form.phone}
                          onChange={onChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {form.phone || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4 inline mr-2" />
                        Địa chỉ
                      </label>
                      {isEditing ? (
                        <input
                          name="address"
                          value={form.address}
                          onChange={onChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {form.address || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <MessageCircle className="h-4 w-4 inline mr-2" />
                      Giới thiệu bản thân
                    </label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={form.bio}
                        onChange={onChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Viết vài dòng giới thiệu về bản thân..."
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 min-h-[100px]">
                        {form.bio || 'Chưa có giới thiệu'}
                      </p>
                    )}
                  </div>

                  {/* Join Date */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Ngày tham gia
                    </label>
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {formatDate(user?.created_at || user?.createdDate)}
                    </p>
                  </div>

                  {/* Save Button */}
                  {isEditing && (
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">Hoạt động gần đây</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Listings Card */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Package className="h-8 w-8 opacity-80" />
                      <span className="text-2xl font-bold">{stats.listings}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Tin đăng</h3>
                    <p className="text-blue-100 text-sm">Tổng số tin đăng của bạn</p>
                  </div>

                  {/* Views Card */}
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="h-8 w-8 opacity-80" />
                      <span className="text-2xl font-bold">{stats.views}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Lượt xem</h3>
                    <p className="text-green-100 text-sm">Tổng lượt xem tin đăng</p>
                  </div>

                  {/* Rating Card */}
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Star className="h-8 w-8 fill-current opacity-80" />
                      <span className="text-2xl font-bold">{stats.rating}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Đánh giá</h3>
                    <p className="text-yellow-100 text-sm">Điểm đánh giá trung bình</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Bạn đã tạo tin đăng mới</span>
                      <span className="text-xs text-gray-400 ml-auto">2 giờ trước</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Tin đăng của bạn đã được duyệt</span>
                      <span className="text-xs text-gray-400 ml-auto">1 ngày trước</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Bạn đã nhận được đánh giá mới</span>
                      <span className="text-xs text-gray-400 ml-auto">3 ngày trước</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">Cài đặt tài khoản</h2>
                
                <div className="space-y-6">
                  {/* Security Settings */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Shield className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Bảo mật</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Đổi mật khẩu</h4>
                          <p className="text-sm text-gray-600">Cập nhật mật khẩu để bảo mật tài khoản</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Đổi mật khẩu
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Xác thực 2 bước</h4>
                          <p className="text-sm text-gray-600">Thêm lớp bảo mật cho tài khoản</p>
                        </div>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Bật
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Email thông báo</h4>
                          <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Thông báo tin nhắn</h4>
                          <p className="text-sm text-gray-600">Nhận thông báo tin nhắn mới</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <User className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Quyền riêng tư</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Hiển thị thông tin công khai</h4>
                          <p className="text-sm text-gray-600">Cho phép người khác xem thông tin cơ bản</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};