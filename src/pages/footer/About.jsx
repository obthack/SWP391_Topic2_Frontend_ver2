import { motion } from "framer-motion";

export const About = () => {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16 text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">
          Giới thiệu về <span className="text-blue-600">EV Market</span>
        </h1>

        <p className="text-lg leading-8 mb-5 text-gray-700">
          <strong>EV Market</strong> là nền tảng giao dịch xe điện và pin cũ đầu tiên tại Việt Nam,
          hướng đến việc tạo ra <span className="font-semibold">một thị trường minh bạch, an toàn</span> 
          và hiệu quả cho người mua – người bán.
        </p>

        <p className="text-lg leading-8 mb-5 text-gray-700">
          Chúng tôi cung cấp <span className="font-semibold">công cụ kiểm định độc lập, hệ thống xác minh người dùng</span> 
          và quy trình thanh toán có đảm bảo, giúp hạn chế rủi ro khi giao dịch tài sản có giá trị cao như xe điện và pin.
        </p>

        <p className="text-lg leading-8 text-gray-700">
          Với sứ mệnh <span className="italic">“Kết nối năng lượng xanh, trao đổi niềm tin”</span>,
          EV Market mong muốn đồng hành cùng cộng đồng trong hành trình chuyển đổi sang phương tiện thân thiện môi trường,
          góp phần thúc đẩy <span className="font-semibold text-blue-600">nền kinh tế xanh Việt Nam</span>.
        </p>
      </motion.div>

      <motion.div
        className="mt-10 grid md:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="p-6 rounded-2xl bg-blue-50 shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Minh bạch</h3>
          <p className="text-gray-600 text-sm leading-6">
            Mọi giao dịch được hỗ trợ kiểm định và công khai thông tin rõ ràng, giúp người dùng yên tâm khi mua bán.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-green-50 shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-green-700 mb-2">An toàn</h3>
          <p className="text-gray-600 text-sm leading-6">
            Tích hợp xác thực tài khoản, escrow và hệ thống phản hồi giúp đảm bảo an toàn cho cả người mua và người bán.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-yellow-50 shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">Tiện lợi</h3>
          <p className="text-gray-600 text-sm leading-6">
            Giao diện thân thiện, hỗ trợ chat trực tiếp, đặt cọc và thanh toán chỉ trong vài bước nhanh chóng.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default About;
