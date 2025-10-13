import { motion } from "framer-motion";
import { HelpCircle, MessageSquare, Mail, Phone } from "lucide-react";

export const HelpCenter = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">
          Trung tâm hỗ trợ <span className="text-blue-600">EV Market</span>
        </h1>
        <p className="text-lg text-gray-700 leading-8 mb-10">
          Gặp vấn đề khi sử dụng? Hãy xem mục <span className="font-semibold">Câu hỏi thường gặp</span> bên dưới
          hoặc liên hệ đội ngũ hỗ trợ để được xử lý nhanh chóng.
        </p>

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href="#faq"
            className="p-6 bg-blue-50 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-3"
          >
            <HelpCircle className="text-blue-600 mt-1" size={28} />
            <div>
              <h3 className="text-lg font-semibold text-blue-700">Xem FAQ</h3>
              <p className="text-gray-600 text-sm leading-6">
                Tổng hợp các tình huống thường gặp khi mua, bán và kiểm định.
              </p>
            </div>
          </a>

          <a
            href="mailto:support@evmarket.vn?subject=Hỗ%20trợ%20EV%20Market"
            className="p-6 bg-green-50 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-3"
          >
            <Mail className="text-green-600 mt-1" size={28} />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Gửi yêu cầu hỗ trợ</h3>
              <p className="text-gray-600 text-sm leading-6">
                Mô tả vấn đề, đính kèm ảnh/chụp màn hình để chúng tôi xử lý nhanh.
              </p>
            </div>
          </a>

          <div className="p-6 bg-yellow-50 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-3">
            <MessageSquare className="text-yellow-600 mt-1" size={28} />
            <div>
              <h3 className="text-lg font-semibold text-yellow-700">Chat trực tiếp</h3>
              <p className="text-gray-600 text-sm leading-6">
                Sắp ra mắt. Tạm thời vui lòng liên hệ email hoặc hotline.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div id="faq" className="mt-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            {[
              {
                q: "Làm thế nào để xác minh tài khoản người bán?",
                a: "Vào Trang cá nhân → Xác minh. Tải CCCD/CMND và giấy tờ xe. EV Market kiểm tra trong 24–48h.",
              },
              {
                q: "Đăng tin bán xe/pin có phí không?",
                a: "Đăng tin cơ bản miễn phí. Gói Nổi bật/Đẩy tin có phí nhỏ; xem bảng giá tại mục Đăng tin.",
              },
              {
                q: "Quy trình kiểm định diễn ra ra sao?",
                a: "Bạn đặt lịch kiểm định tại mục Dịch vụ. Kỹ thuật viên đối tác đến kiểm tra pin/động cơ/khung gầm và xuất báo cáo.",
              },
              {
                q: "Thanh toán/đặt cọc an toàn như thế nào?",
                a: "Hệ thống escrow giữ tiền cọc cho đến khi hai bên xác nhận bàn giao. Nếu có tranh chấp, đội ngũ hỗ trợ đứng ra xử lý theo chứng từ.",
              },
              {
                q: "Tôi nghi ngờ tin đăng lừa đảo thì phải làm gì?",
                a: "Nhấn Báo cáo trong trang tin, kèm lý do và bằng chứng. Chúng tôi sẽ khóa tin và liên hệ bạn trong vòng 12–24h.",
              },
              {
                q: "Không nhận được email kích hoạt tài khoản?",
                a: "Kiểm tra hộp thư rác/Spam. Nếu vẫn không có, chọn Gửi lại email trong trang Đăng nhập hoặc liên hệ support@evmarket.vn.",
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="group bg-gray-50 border rounded-xl px-5 py-4 open:bg-white open:shadow-sm"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between">
                  <span className="font-medium text-gray-900">{item.q}</span>
                  <span className="ml-4 text-blue-600 group-open:rotate-45 transition">＋</span>
                </summary>
                <p className="mt-3 text-gray-700 leading-7">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Contact fallback */}
        <div className="mt-12 bg-gray-50 p-8 rounded-2xl border">
          <h3 className="text-xl font-semibold mb-3 text-gray-900">Vẫn cần trợ giúp?</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-gray-700">
            <p className="flex items-center gap-2">
              <Mail size={18} className="text-blue-600" /> support@evmarket.vn
            </p>
            <p className="flex items-center gap-2">
              <Phone size={18} className="text-blue-600" /> 1900 1234 (8:30–18:00)
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HelpCenter;
