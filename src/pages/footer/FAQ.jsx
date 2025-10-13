import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

export const FAQ = () => {
  const faqs = [
    {
      q: "EV Market có thu phí không?",
      a: "Đăng tin cơ bản hoàn toàn miễn phí. Tuy nhiên, một số dịch vụ nâng cao như Đẩy tin, Gói Nổi bật hoặc Kiểm định xe/pin sẽ có mức phí nhỏ tuỳ gói dịch vụ.",
    },
    {
      q: "Làm sao để báo cáo gian lận?",
      a: "Bạn có thể nhấn nút 'Báo cáo' ngay trong trang tin đăng, chọn lý do phù hợp và gửi thông tin. Đội ngũ kiểm duyệt của EV Market sẽ xử lý trong vòng 24 giờ.",
    },
    {
      q: "Tôi cần xác minh tài khoản để làm gì?",
      a: "Xác minh giúp tăng độ tin cậy cho người bán và mở khóa nhiều tính năng như đăng tin chuyên nghiệp, quản lý gian hàng và thanh toán qua hệ thống bảo chứng.",
    },
    {
      q: "EV Market có hỗ trợ giao dịch an toàn không?",
      a: "Có. Chúng tôi cung cấp hệ thống thanh toán escrow (giữ tiền trung gian) đảm bảo chỉ giải ngân khi cả hai bên xác nhận bàn giao thành công.",
    },
    {
      q: "Tôi có thể chỉnh sửa hoặc xoá tin đăng không?",
      a: "Có thể. Vào mục 'Tin của tôi', chọn tin cần chỉnh sửa hoặc xoá. Hệ thống sẽ cập nhật ngay lập tức.",
    },
    {
      q: "Làm sao để nhận hỗ trợ nhanh nhất?",
      a: "Bạn có thể gửi email tới support@evmarket.vn hoặc gọi hotline 1900 1234. Thời gian hỗ trợ từ 8h30–18h00 các ngày làm việc.",
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <HelpCircle size={32} className="text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900">
            Câu hỏi thường gặp <span className="text-blue-600">EV Market</span>
          </h1>
        </div>

        <p className="text-lg text-gray-700 mb-10 leading-8">
          Dưới đây là những câu hỏi phổ biến nhất mà người dùng thường gặp khi sử dụng EV Market.
        </p>

        {/* FAQ List */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start gap-2">
                <span className="text-blue-600 font-bold">Q{index + 1}:</span>
                {faq.q}
              </h3>
              <p className="text-gray-700 leading-7 pl-6">
                <span className="text-green-600 font-semibold">A:</span> {faq.a}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default FAQ;
