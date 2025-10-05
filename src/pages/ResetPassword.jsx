import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = params.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(()=>{ setToken(tokenFromUrl); }, [tokenFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    setLoading(true);
    try {
      await apiRequest('/api/User/reset-password', {
        method: 'POST',
        body: { token, password },
      });
      setMessage('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.');
      setTimeout(()=> navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h1>
        <p className="text-gray-600 mb-6">Nhập mật khẩu mới của bạn.</p>
        {message && <div className="mb-4 p-3 rounded bg-green-50 text-green-700">{message}</div>}
        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
            <input value={token} onChange={(e)=>setToken(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Token từ email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
        </form>
      </div>
    </div>
  );
};
