import { Link } from 'react-router-dom';
import { Zap, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EV Market</span>
            </Link>
            <p className="text-sm mb-4">
              Nền tảng giao dịch xe điện & pin số 1 Việt Nam. Mua bán xe điện an toàn, minh bạch với
              giá tốt nhất thị trường.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Về chúng tôi</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-blue-400 transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-blue-400 transition-colors">
                  Cách thức hoạt động
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-blue-400 transition-colors">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="hover:text-blue-400 transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-400 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-blue-400 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-blue-400 transition-colors">
                  Trung tâm hỗ trợ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2024 EV Market. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
