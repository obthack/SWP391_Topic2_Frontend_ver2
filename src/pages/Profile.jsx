import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';

export const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(()=>{
    setForm({
      fullName: user?.fullName || user?.name || profile?.full_name || profile?.fullName || '',
      email: user?.email || profile?.email || '',
      phone: user?.phone || profile?.phone || '',
    });
    setAvatarUrl(user?.avatarUrl || profile?.avatarUrl || '');
  }, [user, profile]);

  const onChange = (e)=> setForm({ ...form, [e.target.name]: e.target.value });

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
      const payload = { fullName: form.fullName, email: form.email, phone: form.phone, avatarUrl };
      const updated = await updateProfile(payload);
      setMessage('Cập nhật thành công');
    } catch (e) {
      setError(e.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Hồ sơ cá nhân</h1>
        <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {message && <div className="p-3 rounded bg-green-50 text-green-700">{message}</div>}
          {error && <div className="p-3 rounded bg-red-50 text-red-700">{error}</div>}

          <div className="flex items-center space-x-4">
            <img src={avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(form.fullName || (user?.email||''))} alt="avatar" className="h-16 w-16 rounded-full object-cover bg-gray-100" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
              <input type="file" accept="image/*" onChange={(e)=> e.target.files && uploadAvatar(e.target.files[0])} disabled={uploading} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
              <input name="fullName" value={form.fullName} onChange={onChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" name="email" value={form.email} onChange={onChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              <input name="phone" value={form.phone} onChange={onChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
