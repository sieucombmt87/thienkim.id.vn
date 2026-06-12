const $ = (id) => document.getElementById(id);

const demoData = {
  productName: "Kem chống nắng ABC",
  productDesc: "SPF50+, không nhờn rít, phù hợp da dầu, dùng hằng ngày khi đi làm hoặc đi chơi.",
  price: "199K",
  promotion: "Mua 2 tặng 1 trong hôm nay",
  customer: "Nữ 18-35 tuổi, thích làm đẹp, sợ da bị sạm nám"
};

function getValue(id, fallback) {
  const el = $(id);
  return el && el.value.trim() ? el.value.trim() : fallback;
}

function buildSalesPrompt() {
  const productName = getValue("productName", "AI tự đề xuất sản phẩm phù hợp");
  const productDesc = getValue("productDesc", "AI tự viết mô tả sản phẩm dựa trên ngành hàng");
  const price = getValue("price", "Không có giá cụ thể");
  const promotion = getValue("promotion", "AI tự đề xuất ưu đãi phù hợp");
  const customer = getValue("customer", "AI tự phân tích khách hàng mục tiêu");
  const videoStyle = getValue("videoStyle", "AI tự chọn");
  const character = getValue("character", "AI tự chọn");
  const scene = getValue("scene", "AI tự chọn");
  const platform = getValue("platform", "TikTok / Facebook Reel / YouTube Shorts");
  const duration = getValue("duration", "20-30 giây");

  return `Bạn là chuyên gia tạo video bán hàng bằng AI cho nền tảng Thiên Kim Universe.

Mục tiêu: tạo một video bán hàng ngắn, hấp dẫn, dễ hiểu, có khả năng chuyển đổi cao, phù hợp cho người xem mạng xã hội.

THÔNG TIN SẢN PHẨM:
- Tên sản phẩm: ${productName}
- Mô tả sản phẩm: ${productDesc}
- Giá bán: ${price}
- Khuyến mãi: ${promotion}
- Đối tượng khách hàng: ${customer}
- Kiểu video: ${videoStyle}
- Nhân vật đại diện: ${character}
- Bối cảnh: ${scene}
- Nền tảng xuất bản: ${platform}
- Thời lượng mong muốn: ${duration}

YÊU CẦU CHIẾN LƯỢC:
1. Phân tích nhanh khách hàng mục tiêu.
2. Tìm insight/nỗi đau khiến khách hàng quan tâm.
3. Tạo hook thật mạnh trong 3 giây đầu.
4. Giới thiệu sản phẩm như một giải pháp tự nhiên, không nói quá lố.
5. Làm rõ lợi ích chính, ưu đãi và lời kêu gọi hành động.
6. Văn phong gần gũi, dễ tin, dễ nghe, phù hợp người Việt.

CẤU TRÚC VIDEO:
- Cảnh 1: Hook thu hút.
- Cảnh 2: Vấn đề khách hàng đang gặp.
- Cảnh 3: Sản phẩm xuất hiện như giải pháp.
- Cảnh 4: Lợi ích chính và bằng chứng thuyết phục.
- Cảnh 5: Ưu đãi hoặc lý do nên mua ngay.
- Cảnh 6: CTA rõ ràng.

YÊU CẦU HÌNH ẢNH/VIDEO:
- Ánh sáng đẹp, bố cục chuyên nghiệp.
- Nhân vật tự nhiên, biểu cảm tin cậy.
- Cảnh phù hợp sản phẩm và khách hàng mục tiêu.
- Nếu thiếu thông tin, hãy tự đề xuất phương án hợp lý nhất.

HÃY TRẢ VỀ ĐẦY ĐỦ 7 PHẦN:
1. Phân tích sản phẩm và khách hàng.
2. Kịch bản lời thoại theo từng cảnh.
3. Prompt tạo video chi tiết.
4. Prompt tạo ảnh thumbnail/cover.
5. Gợi ý giọng đọc.
6. Caption đăng bài.
7. Hashtag và CTA bán hàng.`;
}

function buildUserGuide() {
  return `Hướng dẫn dùng App VIP AI Video Bán Hàng:

1. Nhập thông tin sản phẩm.
2. Bấm nút ❤️ Copy Prompt VIP.
3. Mở Google Flow, Gemini, ChatGPT, Veo hoặc công cụ AI video khác.
4. Đăng nhập bằng tài khoản của người dùng.
5. Dán prompt đã copy.
6. Tạo video và tải về để đăng TikTok, Facebook, YouTube hoặc Zalo.

Lưu ý: Website Thiên Kim chỉ tạo prompt thông minh, không dùng credit của chủ website.`;
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    $("copyStatus").textContent = successMessage;
  } catch (error) {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    $("copyStatus").textContent = successMessage;
  }
}

function copySalesPrompt() {
  copyText(buildSalesPrompt(), "Đã copy Prompt VIP. Hãy dán vào Google Flow, Gemini hoặc công cụ AI video khác.");
}

function copyGuide() {
  copyText(buildUserGuide(), "Đã copy hướng dẫn sử dụng cho người dùng.");
}

function fillDemo() {
  Object.entries(demoData).forEach(([id, value]) => {
    if ($(id)) $(id).value = value;
  });
  $("copyStatus").textContent = "Đã điền dữ liệu mẫu. Bạn có thể bấm ❤️ Copy Prompt VIP.";
}

window.addEventListener("DOMContentLoaded", () => {
  $("copyBtn").addEventListener("click", copySalesPrompt);
  $("copyGuideBtn").addEventListener("click", copyGuide);
  $("fillDemoBtn").addEventListener("click", fillDemo);
});
