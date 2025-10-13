import { motion } from "framer-motion";
import { CheckCircle2, Ban, Scale, FileText } from "lucide-react";

export const Terms = () => {
  const terms = [
    {
      icon: <CheckCircle2 className="text-blue-600" size={28} />,
      title: "Cam kết người dùng",
      desc: "Người dùng phải cung cấp thông tin chính xác và chịu trách nhiệm với mọi nội dung đăng tải.",
    },
    {
      icon: <FileText className="text-green-600" size={28} />,
      title: "Quy định đăng tin",
      desc: "Tin đăng phải đúng thực tế, có hình ảnh thật và không vi phạm quy định pháp luật.",
    },
    {
      icon: <Ban className="text-red-600" size={28} />,
      title: "Hành vi bị cấm",
      desc: "Không được đăng tin giả mạo, spam, lừa đảo, hay sử dụng nền tảng cho mục đích phi pháp.",
    },
    {
      icon: <Scale className="text-yellow-600" size={28} />,
      title: "Trách nhiệm và giải quyết tranh chấp",
      desc: "EV Market đóng vai trò trung gian, hỗ trợ xác minh và giải quyết tranh chấp dựa trên chứng cứ hợp pháp.",
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
          Điều khoản sử dụng <span className="text-blue-600">EV Market</span>
        </h1>
        <p className="text-lg text-gray-700 leading-8 mb-10">
          Khi sử dụng EV Market, bạn đồng ý tuân thủ các điều khoản sau nhằm đảm bảo môi trường giao dịch minh bạch, an toàn và đúng pháp luật.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {terms.map((t, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-2xl border hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                {t.icon}
                <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
              </div>
              <p className="text-gray-700 leading-7">
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Terms;
