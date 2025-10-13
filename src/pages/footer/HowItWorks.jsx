import { motion } from "framer-motion";
import { UserCheck, FilePlus, Handshake, ShieldCheck, Search, MessageCircle, CreditCard, Truck } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: <UserCheck className="text-blue-600" size={32} />,
      title: "Đăng ký & xác minh tài khoản",
      desc: "Tạo tài khoản và xác minh danh tính để đảm bảo giao dịch an toàn và minh bạch.",
      details: [
        "Đăng ký với email và số điện thoại",
        "Xác minh OTP qua SMS",
        "Cập nhật thông tin cá nhân",
        "Tải lên giấy tờ tùy thân để xác minh"
      ]
    },
    {
      icon: <FilePlus className="text-green-600" size={32} />,
      title: "Đăng tin bán xe hoặc pin",
      desc: "Tạo tin đăng với hình ảnh, thông số và giá rõ ràng để thu hút người mua.",
      details: [
        "Chụp ảnh xe/pin từ nhiều góc độ",
        "Nhập thông số kỹ thuật chi tiết",
        "Đặt giá bán hợp lý",
        "Mô tả tình trạng và lịch sử sử dụng"
      ]
    },
    {
      icon: <Handshake className="text-yellow-600" size={32} />,
      title: "Người mua liên hệ & thương lượng",
      desc: "Người mua tìm kiếm sản phẩm, liên hệ qua chat hoặc điện thoại để trao đổi thông tin.",
      details: [
        "Tìm kiếm theo tiêu chí cụ thể",
        "Chat trực tiếp với người bán",
        "Thương lượng giá và điều kiện",
        "Hẹn lịch xem xe/pin trực tiếp"
      ]
    },
    {
      icon: <ShieldCheck className="text-purple-600" size={32} />,
      title: "Giao dịch an toàn",
      desc: "Thực hiện thanh toán qua hệ thống đảm bảo hoặc đối tác được EV Market chứng nhận.",
      details: [
        "Thanh toán qua ví điện tử",
        "Chuyển khoản ngân hàng",
        "Kiểm tra xe/pin trước khi thanh toán",
        "Hoàn tất giao dịch và đánh giá"
      ]
    },
  ];

  const features = [
    {
      icon: <Search className="text-blue-500" size={24} />,
      title: "Tìm kiếm thông minh",
      desc: "Bộ lọc nâng cao giúp tìm đúng sản phẩm mong muốn"
    },
    {
      icon: <MessageCircle className="text-green-500" size={24} />,
      title: "Chat trực tiếp",
      desc: "Liên hệ ngay với người bán qua hệ thống chat tích hợp"
    },
    {
      icon: <CreditCard className="text-yellow-500" size={24} />,
      title: "Thanh toán an toàn",
      desc: "Nhiều phương thức thanh toán được bảo mật cao"
    },
    {
      icon: <Truck className="text-purple-500" size={24} />,
      title: "Vận chuyển",
      desc: "Hỗ trợ giao hàng tận nơi với đối tác uy tín"
    }
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">
          Cách thức hoạt động <span className="text-blue-600">EV Market</span>
        </h1>
        <p className="text-lg text-gray-700 leading-8 mb-10">
          EV Market giúp bạn mua bán xe điện và pin dễ dàng, nhanh chóng, minh bạch và an toàn qua 4 bước đơn giản:
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {steps.map((step, i) => (
            <motion.div 
              key={i} 
              className="p-6 bg-gray-50 rounded-2xl border hover:shadow-md transition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-4">
                {step.icon}
                <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
              </div>
              <p className="text-gray-700 leading-7 mb-4">{step.desc}</p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Chi tiết:</h4>
                <ul className="space-y-1">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl border mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 text-center">
            Tính năng nổi bật của EV Market
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                className="text-center p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              >
                <div className="flex justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Lợi ích khi sử dụng EV Market</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-blue-600" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">An toàn tuyệt đối</h3>
              <p className="text-sm text-gray-600">
                Xác minh danh tính người dùng và bảo vệ thông tin cá nhân với công nghệ mã hóa tiên tiến
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake className="text-green-600" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Minh bạch</h3>
              <p className="text-sm text-gray-600">
                Thông tin sản phẩm chi tiết, giá cả công khai và đánh giá từ người dùng thực tế
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-yellow-600" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Tiện lợi</h3>
              <p className="text-sm text-gray-600">
                Giao diện thân thiện, tìm kiếm nhanh chóng và hỗ trợ khách hàng 24/7
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Sẵn sàng bắt đầu?</h2>
          <p className="text-gray-600 mb-6">
            Tham gia cộng đồng EV Market ngay hôm nay để trải nghiệm mua bán xe điện và pin dễ dàng nhất
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Đăng ký ngay
            </motion.button>
            <motion.button 
              className="px-8 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Tìm hiểu thêm
            </motion.button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HowItWorks;