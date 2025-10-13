import { motion } from "framer-motion";
import { Shield, EyeOff, Database, Lock } from "lucide-react";

export const Privacy = () => {
  const items = [
    {
      icon: <Shield className="text-blue-600" size={28} />,
      title: "Bảo mật thông tin",
      desc: "Mọi dữ liệu cá nhân được mã hóa và chỉ dùng cho mục đích xác thực, giao dịch và hỗ trợ khách hàng.",
    },
    {
      icon: <EyeOff className="text-green-600" size={28} />,
      title: "Không chia sẻ trái phép",
      desc: "EV Market cam kết không bán hoặc chia sẻ thông tin người dùng cho bên thứ ba nếu không có sự đồng ý.",
    },
    {
      icon: <Database className="text-yellow-600" size={28} />,
      title: "Thu thập có chọn lọc",
      desc: "Chỉ thu thập dữ liệu cần thiết để cải thiện trải nghiệm, hiệu suất và an toàn hệ thống.",
    },
    {
      icon: <Lock className="text-purple-600" size={28} />,
      title: "Quyền kiểm soát",
      desc: "Bạn có thể yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin cá nhân bất cứ lúc nào.",
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">
          Chính sách bảo mật <span className="text-blue-600">EV Market</span>
        </h1>
        <p className="text-lg text-gray-700 leading-8 mb-10">
          Chúng tôi tôn trọng quyền riêng tư của bạn và tuân thủ các tiêu chuẩn bảo mật nghiêm ngặt nhằm bảo vệ dữ liệu cá nhân.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {items.map((item, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-2xl border hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                {item.icon}
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              </div>
              <p className="text-gray-700 leading-7">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-gray-50 p-8 rounded-2xl border">
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">Liên hệ về bảo mật</h2>
          <p className="text-gray-700 mb-3">Nếu có bất kỳ thắc mắc hoặc yêu cầu liên quan đến quyền riêng tư, vui lòng liên hệ:</p>
          <p className="text-blue-600 font-medium">📧 privacy@evmarket.vn</p>
        </div>

        <div className="mt-10 bg-white p-8 rounded-2xl border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Chi tiết chính sách</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">1. Thu thập thông tin</h3>
              <p className="text-gray-700 leading-7">
                Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, tạo tin đăng, hoặc sử dụng các dịch vụ của chúng tôi. 
                Thông tin bao gồm: tên, email, số điện thoại, địa chỉ và thông tin về xe điện/pin bạn muốn mua bán.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">2. Sử dụng thông tin</h3>
              <p className="text-gray-700 leading-7">
                Thông tin của bạn được sử dụng để: cung cấp dịch vụ, xử lý giao dịch, gửi thông báo quan trọng, 
                cải thiện trải nghiệm người dùng và đảm bảo an toàn cho nền tảng.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">3. Bảo vệ thông tin</h3>
              <p className="text-gray-700 leading-7">
                Chúng tôi sử dụng các biện pháp bảo mật tiên tiến như mã hóa SSL, xác thực đa yếu tố, 
                và kiểm tra bảo mật định kỳ để bảo vệ thông tin cá nhân của bạn.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">4. Chia sẻ thông tin</h3>
              <p className="text-gray-700 leading-7">
                Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba 
                trừ khi có sự đồng ý của bạn hoặc theo yêu cầu pháp lý.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">5. Quyền của bạn</h3>
              <p className="text-gray-700 leading-7">
                Bạn có quyền truy cập, chỉnh sửa, xóa thông tin cá nhân hoặc rút lại sự đồng ý 
                bất cứ lúc nào bằng cách liên hệ với chúng tôi qua email privacy@evmarket.vn.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </motion.div>
    </section>
  );
};

export default Privacy;