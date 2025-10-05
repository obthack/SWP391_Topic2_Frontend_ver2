import { useState } from 'react';
import { apiRequest } from '../lib/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await apiRequest('/api/User/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setMessage('Vui lòng kiểm tra email để nhận liên kết đặt lại mật khẩu.');
    } catch (err) {
      setError(err.message || 'Không thể gửi yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quên mật khẩu</h1>
        <p className="text-gray-600 mb-6">Nhập email để nhận liên kết đặt lại mật khẩu.</p>

        {message && <div className="mb-4 p-3 rounded bg-green-50 text-green-700">{message}</div>}
        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang gửi...' : 'Gửi liên kết'}</button>
        </form>
      </div>
    </div>
  );
};
