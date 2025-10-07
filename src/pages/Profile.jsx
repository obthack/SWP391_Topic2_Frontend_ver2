import { useEffect, useState } from 'react';
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState({ fullName: '', email: '', phone: '' });
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState('');

  useEffect(()=>{
    const currentForm = {
      fullName: user?.fullName || user?.name || profile?.full_name || profile?.fullName || '',
      email: user?.email || profile?.email || '',
      phone: user?.phone || profile?.phone || '',
    };
    const currentAvatarUrl = user?.avatar || user?.avatarUrl || profile?.avatar || profile?.avatarUrl || '';
    
    setForm(currentForm);
    setAvatarUrl(currentAvatarUrl);
    setOriginalForm(currentForm);
    setOriginalAvatarUrl(currentAvatarUrl);
  }, [user, profile]);

  const onChange = (e)=> setForm({ ...form, [e.target.name]: e.target.value });

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadAvatar = async (file) => {
    setUploading(true);
    setError('');
    try {
      const dataUrl = await fileToBase64(file);
      setAvatarUrl(dataUrl);
      show({ title: 'Tải ảnh thành công', description: 'Ảnh sẽ được lưu khi bạn bấm Lưu thay đổi', type: 'success' });
    } catch (e) {
      setError(e.message || 'Không thể tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setMessage('');
    setError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm(originalForm);
    setAvatarUrl(originalAvatarUrl);
    setMessage('');
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = { fullName: form.fullName, email: form.email, phone: form.phone, avatar: avatarUrl };
      await updateProfile(payload);
      
      // Cập nhật originalForm và originalAvatarUrl sau khi lưu thành công
      setOriginalForm(form);
      setOriginalAvatarUrl(avatarUrl);
      setIsEditing(false);
      setMessage('Cập nhật thành công');
      show({ title: 'Cập nhật hồ sơ', description: 'Thông tin đã được lưu', type: 'success' });
    } catch (e) {
      setError(e.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Cập nhật thông tin
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {message && <div className="p-3 rounded bg-green-50 text-green-700">{message}</div>}
          {error && <div className="p-3 rounded bg-red-50 text-red-700">{error}</div>}

          <div className="flex items-center space-x-4">
            <img src={avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(form.fullName || (user?.email||''))} alt="avatar" className="h-16 w-16 rounded-full object-cover bg-gray-100" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
              {isEditing ? (
                <input type="file" accept="image/*" onChange={(e)=> e.target.files && uploadAvatar(e.target.files[0])} disabled={uploading} />
              ) : (
                <p className="text-sm text-gray-500">Ảnh đại diện hiện tại</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
              {isEditing ? (
                <input 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={onChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              ) : (
                <p className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {form.fullName || 'Chưa cập nhật'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              {isEditing ? (
                <input 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={onChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              ) : (
                <p className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {form.email || 'Chưa cập nhật'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              {isEditing ? (
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={onChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                />
              ) : (
                <p className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {form.phone || 'Chưa cập nhật'}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-3">
              <button 
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </button>
              <button 
                type="submit" 
                onClick={onSubmit}
                disabled={saving} 
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
