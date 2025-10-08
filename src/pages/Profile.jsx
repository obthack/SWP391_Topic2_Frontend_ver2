import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Edit3, Save, X } from 'lucide-react';

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
    }
  }, [user, profile]);

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
      
      // Update localStorage
      const authData = localStorage.getItem("evtb_auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        localStorage.setItem("evtb_auth", JSON.stringify({
          ...parsed,
          user: { ...parsed.user, ...payload }
        }));
      }
      
      setMessage('Cập nhật thành công');
      show({ title: 'Cập nhật hồ sơ', description: 'Thông tin đã được lưu', type: 'success' });
    } catch (e) {
      setError(e.message || 'Không thể cập nhật');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                        {form.fullName ? form.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <Edit3 className="h-3 w-3" />
                    </label>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{form.fullName || 'Chưa có tên'}</h2>
                  <p className="text-sm text-gray-500">{form.email}</p>
                  {uploading && <p className="text-sm text-blue-600">Đang tải ảnh...</p>}
                </div>
              </div>

              {message && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <X className="h-4 w-4 mr-2 inline" />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};