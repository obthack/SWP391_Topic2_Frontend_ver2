/**
 * App Component - Root component của ứng dụng
 * Quản lý routing và authentication state
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';

// Import các page components (sẽ tạo sau)
// import MarketplacePage from './components/Marketplace/MarketplacePage';
// import MemberDashboard from './components/Dashboard/MemberDashboard';
// import AdminDashboard from './components/Dashboard/AdminDashboard';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Đang tải...</p>
    </div>
  </div>
);

// Placeholder component cho các trang chưa implement
const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-600">{description}</p>
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <p className="text-blue-800 font-medium">🚧 Trang này đang được phát triển</p>
        <p className="text-blue-600 text-sm mt-2">Các tính năng sẽ được bổ sung trong phiên bản tiếp theo</p>
      </div>
    </div>
  </div>
);

// Main app content component
const AppContent: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState('marketplace');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Show auth forms if not logged in
  if (!user) {
    return authMode === 'login' ? (
      <LoginForm onToggleMode={() => setAuthMode('register')} />
    ) : (
      <RegisterForm onToggleMode={() => setAuthMode('login')} />
    );
  }

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'marketplace':
        return (
          <PlaceholderPage 
            title="Thị trường xe điện" 
            description="Khám phá hàng nghìn xe điện chất lượng cao"
          />
        );
      case 'batteries':
        return (
          <PlaceholderPage 
            title="Pin Lithium" 
            description="Pin thay thế chất lượng cao, đảm bảo an toàn"
          />
        );
      case 'favorites':
        return (
          <PlaceholderPage 
            title="Tin yêu thích" 
            description="Danh sách các tin đăng bạn đã lưu"
          />
        );
      case 'my-listings':
        return (
          <PlaceholderPage 
            title="Tin đăng của tôi" 
            description="Quản lý các tin đăng bán xe và pin của bạn"
          />
        );
      case 'create-listing':
        return (
          <PlaceholderPage 
            title="Đăng tin bán" 
            description="Tạo tin đăng bán xe điện hoặc pin"
          />
        );
      case 'profile':
        return (
          <PlaceholderPage 
            title="Hồ sơ cá nhân" 
            description="Quản lý thông tin tài khoản của bạn"
          />
        );
      case 'admin-dashboard':
        return (
          <PlaceholderPage 
            title="Bảng điều khiển Admin" 
            description="Quản lý và giám sát hoạt động nền tảng"
          />
        );
      case 'admin-users':
        return (
          <PlaceholderPage 
            title="Quản lý người dùng" 
            description="Phê duyệt và quản lý tài khoản người dùng"
          />
        );
      case 'admin-listings':
        return (
          <PlaceholderPage 
            title="Quản lý tin đăng" 
            description="Kiểm duyệt và quản lý tin đăng"
          />
        );
      default:
        return (
          <PlaceholderPage 
            title="Trang không tìm thấy" 
            description="Trang bạn đang tìm kiếm không tồn tại"
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      <main>
        {renderPageContent()}
      </main>
    </div>
  );
};

// Root App component with providers
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;