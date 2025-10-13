import { motion } from "framer-motion";
import { MapPin, Mail, Phone } from "lucide-react";

export const Contact = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">
          Liên hệ với <span className="text-blue-600">EV Market</span>
        </h1>

        <p className="text-lg text-gray-700 leading-8 mb-10">
          Chúng tôi luôn sẵn sàng hỗ trợ bạn trong mọi thắc mắc về giao dịch, dịch vụ và hợp tác.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-blue-50 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col items-start">
            <Mail className="text-blue-600 mb-3" size={28} />
            <h3 className="text-lg font-semibold mb-1 text-blue-700">Email</h3>
            <p className="text-gray-700 text-sm">support@evmarket.vn</p>
          </div>

          <div className="p-6 bg-green-50 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col items-start">
            <Phone className="text-green-600 mb-3" size={28} />
            <h3 className="text-lg font-semibold mb-1 text-green-700">Hotline</h3>
            <p className="text-gray-700 text-sm">1900 1234</p>
          </div>

          <div className="p-6 bg-yellow-50 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col items-start">
            <MapPin className="text-yellow-600 mb-3" size={28} />
            <h3 className="text-lg font-semibold mb-1 text-yellow-700">Văn phòng</h3>
            <p className="text-gray-700 text-sm">Quận 1, TP. Hồ Chí Minh</p>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 p-8 rounded-2xl border">
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">Liên hệ hợp tác</h2>
          <p className="text-gray-700 mb-3">
            Đối tác doanh nghiệp và truyền thông vui lòng gửi thông tin về:
          </p>
          <p className="text-blue-600 font-medium">📧 partner@evmarket.vn</p>
        </div>
      </motion.div>
    </section>
  );
};

export default Contact;
