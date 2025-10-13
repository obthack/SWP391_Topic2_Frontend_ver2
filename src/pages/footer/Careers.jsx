import { motion } from "framer-motion";

export const Careers = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      > 
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">
          Cơ hội nghề nghiệp tại <span className="text-blue-600">EV Market</span>
        </h1>
        <p className="text-lg text-gray-700 leading-8 mb-8">
          EV Market là nơi hội tụ những con người năng động, đam mê công nghệ và mong muốn góp phần thúc đẩy
          <span className="font-semibold text-blue-600"> xu hướng năng lượng xanh tại Việt Nam.</span>  
          Chúng tôi không chỉ xây dựng nền tảng mua bán xe điện – mà còn tạo ra một cộng đồng cùng nhau phát triển.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-blue-50 rounded-2xl shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Văn hóa sáng tạo</h3>
            <p className="text-gray-600 text-sm leading-6">
              Mỗi ý tưởng mới đều được trân trọng. Chúng tôi khuyến khích tinh thần học hỏi, thử nghiệm và chia sẻ.
            </p>
          </div>

          <div className="p-6 bg-green-50 rounded-2xl shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-green-700 mb-2">Môi trường linh hoạt</h3>
            <p className="text-gray-600 text-sm leading-6">
              Làm việc hybrid, thời gian linh hoạt, tôn trọng sự cân bằng giữa công việc và cuộc sống.
            </p>
          </div>

          <div className="p-6 bg-yellow-50 rounded-2xl shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-yellow-700 mb-2">Cơ hội phát triển</h3>
            <p className="text-gray-600 text-sm leading-6">
              Cùng EV Market, bạn được trao quyền chủ động và cơ hội phát triển trong lĩnh vực năng lượng sạch.
            </p>
          </div>
        </div>

        <div className="mt-10 bg-gray-50 p-8 rounded-2xl border">
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">Gia nhập cùng chúng tôi</h2>
          <p className="text-gray-700 mb-3">
            Nếu bạn muốn trở thành một phần của đội ngũ EV Market, hãy gửi CV hoặc portfolio của bạn về:
          </p>
          <p className="text-blue-600 font-medium">📧 hr@evmarket.vn</p>
        </div>
      </motion.div>
    </section>
  );
};

export default Careers;
