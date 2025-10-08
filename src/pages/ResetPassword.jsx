import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import '../styles/resetpassword.css';

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
    <div className="resetpassword-container">
      <div className="resetpassword-card">
        <h1 className="resetpassword-title">Đặt lại mật khẩu</h1>
        <p className="resetpassword-description">Nhập mật khẩu mới của bạn.</p>
        {message && <div className="resetpassword-message">{message}</div>}
        {error && <div className="resetpassword-error">{error}</div>}
        <form onSubmit={handleSubmit} className="resetpassword-form">
          <div className="resetpassword-field">
            <label className="resetpassword-label">Token</label>
            <input 
              value={token} 
              onChange={(e)=>setToken(e.target.value)} 
              className="resetpassword-input" 
              placeholder="Token từ email" 
            />
          </div>
          <div className="resetpassword-field">
            <label className="resetpassword-label">Mật khẩu mới</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              className="resetpassword-input" 
              required 
            />
          </div>
          <div className="resetpassword-field">
            <label className="resetpassword-label">Xác nhận mật khẩu</label>
            <input 
              type="password" 
              value={confirm} 
              onChange={(e)=>setConfirm(e.target.value)} 
              className="resetpassword-input" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="resetpassword-button"
          >
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};
