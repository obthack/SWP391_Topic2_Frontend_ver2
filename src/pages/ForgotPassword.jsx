import { useState } from 'react';
import { apiRequest } from '../lib/api';
import '../styles/forgotpassword.css';

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
    <div className="forgotpassword-container">
      <div className="forgotpassword-card">
        <h1 className="forgotpassword-title">Quên mật khẩu</h1>
        <p className="forgotpassword-description">Nhập email để nhận liên kết đặt lại mật khẩu.</p>

        {message && <div className="forgotpassword-message">{message}</div>}
        {error && <div className="forgotpassword-error">{error}</div>}

        <form onSubmit={handleSubmit} className="forgotpassword-form">
          <div className="forgotpassword-field">
            <label htmlFor="email" className="forgotpassword-label">Email</label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              required 
              className="forgotpassword-input" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="forgotpassword-button"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết'}
          </button>
        </form>
      </div>
    </div>
  );
};
