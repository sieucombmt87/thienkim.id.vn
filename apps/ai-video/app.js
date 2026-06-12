const APP_VERSION = "TKver1.1";

const TOOL_URLS = {
  flow: "https://labs.google/fx/tools/flow",
  gemini: "https://gemini.google.com/",
  chatgpt: "https://chatgpt.com/",
  veo: "https://deepmind.google/models/veo/",
  aistudio: "https://aistudio.google.com/"
};

function $(id) { return document.getElementById(id); }

function detectStoreName(input) {
  const text = (input || "").trim();
  try {
    const url = new URL(text.startsWith("http") ? text : "https://" + text);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("shopee")) return "Shopee";
    if (host.includes("lazada")) return "Lazada";
    if (host.includes("tiktok")) return "TikTok Shop";
    if (host.includes("tiki")) return "Tiki";
    if (host.includes("sendo")) return "Sendo";
    if (host.includes("facebook")) return "Facebook Shop/Fanpage";
    return host;
  } catch (e) {
    return "kênh bán hàng bạn đang muốn giới thiệu";
  }
}

function cleanProductName(input) {
  const text = (input || "").trim();
  if (!text) return "sản phẩm đang cần bán";
  if (/^https?:\/\//i.test(text) || text.includes(".")) return "sản phẩm trong link đã nhập";
  return text;
}

function suggestProductInfo() {
  const productInput = $("productInput").value.trim();
  const productName = cleanProductName(productInput);
  const storeName = detectStoreName(productInput);
  const promoField = $("promotion");

  if (!productInput) {
    $("sourceHint").innerText = "Bạn chưa nhập sản phẩm/link. Tool sẽ dùng mẫu chung để tạo prompt.";
  } else {
    $("sourceHint").innerText = `Đã nhận diện nơi bán/gợi ý: ${storeName}.`;
  }

  $("shortDesc").value = `${productName} là sản phẩm phù hợp để giới thiệu theo phong cách bán hàng ngắn gọn, dễ hiểu và tập trung vào lợi ích thật của khách hàng. Nội dung nên nhấn mạnh điểm nổi bật, lý do nên mua ngay và sự tiện lợi khi đặt hàng tại ${storeName}. Nếu đây là link sản phẩm, hãy ưu tiên khai thác hình ảnh, mô tả, ưu đãi và thông tin có trên trang bán hàng đó.`;

  if (!promoField.value.trim()) {
    promoField.value = productInput.includes("http")
      ? "Hãy kiểm tra khuyến mãi trực tiếp trên trang sản phẩm; nếu không có, đề xuất ưu đãi phù hợp để tăng chuyển đổi."
      : "AI tự đề xuất ưu đãi phù hợp để tăng chuyển đổi.";
  }

  updateHelperNotes();
}

function clearPromotion() {
  $("promotion").value = "";
  $("promotion").focus();
  $("copyStatus").innerText = "Đã xóa khuyến mãi. Bạn có thể nhập nội dung mong muốn.";
}

function updateHelperNotes() {
  const character = $("character").value;
  const scene = $("scene").value;
  const charFile = $("characterFile").files[0];
  const sceneFile = $("sceneFile").files[0];

  $("characterNote").innerText = charFile
    ? `Đã chọn file nhân vật: ${charFile.name}. Sau khi mở công cụ AI video, hãy upload file này kèm prompt.`
    : character === "AI tự chọn"
      ? "AI sẽ tự chọn nhân vật phù hợp. Nếu có nhân vật sẵn, hãy upload vào công cụ AI video sau khi copy prompt."
      : `Prompt sẽ yêu cầu nhân vật dạng: ${character}. Nếu có hình/video mẫu, hãy upload thêm vào công cụ AI video.`;

  $("sceneNote").innerText = sceneFile
    ? `Đã chọn file bối cảnh: ${sceneFile.name}. Sau khi mở công cụ AI video, hãy upload file này kèm prompt.`
    : scene.includes("AI tự chọn")
      ? "AI sẽ dựa trên mô tả ngắn và nơi bán để dựng bối cảnh phù hợp."
      : `Prompt sẽ yêu cầu bối cảnh: ${scene}. Nếu có ảnh/video nền, hãy upload thêm vào công cụ AI video.`;
}

function buildPrompt() {
  const productInput = $("productInput").value.trim() || "AI tự đề xuất sản phẩm phù hợp";
  const productName = cleanProductName(productInput);
  const storeName = detectStoreName(productInput);
  const shortDesc = $("shortDesc").value.trim() || "AI tự tạo mô tả ngắn dựa trên tên sản phẩm hoặc link sản phẩm.";
  const price = $("price").value.trim() || "Không có giá cụ thể, hãy đề xuất cách nói giá linh hoạt.";
  const promotion = $("promotion").value.trim() || "Không có khuyến mãi cụ thể, hãy đề xuất ưu đãi phù hợp.";
  const customer = $("customer").value.trim() || "AI tự phân tích khách hàng mục tiêu.";
  const videoStyle = $("videoStyle").value;
  const duration = $("duration").value;
  const character = $("character").value;
  const scene = $("scene").value;
  const charFile = $("characterFile").files[0];
  const sceneFile = $("sceneFile").files[0];

  return `Bạn là chuyên gia tạo video bán hàng bằng AI cho Thiên Kim Universe.

Hãy tạo một video bán hàng ngắn, hấp dẫn, dễ hiểu và có khả năng chuyển đổi cao.

THÔNG TIN ĐẦU VÀO:
- Tên/link sản phẩm: ${productInput}
- Tên sản phẩm hiểu theo nội dung: ${productName}
- Nơi bán/kênh giới thiệu gợi ý: ${storeName}
- Mô tả ngắn: ${shortDesc}
- Giá bán: ${price}
- Khuyến mãi: ${promotion}
- Đối tượng khách hàng: ${customer}
- Kiểu video: ${videoStyle}
- Thời lượng: ${duration}
- Nhân vật: ${character}
- Bối cảnh: ${scene}

GỢI Ý FILE NGƯỜI DÙNG CÓ SẴN:
- Nhân vật mẫu: ${charFile ? "Có file mẫu tên " + charFile.name + ". Hãy ưu tiên dùng nhân vật trong file upload." : "Chưa có file mẫu. Hãy tự tạo/chọn nhân vật phù hợp với sản phẩm."}
- Bối cảnh mẫu: ${sceneFile ? "Có file bối cảnh tên " + sceneFile.name + ". Hãy ưu tiên dùng bối cảnh trong file upload." : "Chưa có file bối cảnh. Hãy dựng bối cảnh dựa trên mô tả sản phẩm và nơi bán."}

YÊU CẦU VIDEO:
1. Có hook mạnh trong 3 giây đầu.
2. Nêu đúng vấn đề/nỗi đau của khách hàng.
3. Giới thiệu sản phẩm như giải pháp tự nhiên, đáng tin.
4. Nêu lợi ích rõ ràng, tránh nói quá đà.
5. Nhắc giá/khuyến mãi nếu phù hợp.
6. Có CTA rõ: nhắn tin, đặt hàng, bấm mua, hoặc xem link sản phẩm.
7. Phù hợp TikTok, Facebook Reel, YouTube Shorts và Zalo.
8. Phong cách hình ảnh rõ nét, ánh sáng đẹp, bố cục chuyên nghiệp.
9. Nếu thông tin còn thiếu, hãy tự đề xuất phương án hợp lý nhất.

CẤU TRÚC CẢNH:
- Cảnh 1: Hook thu hút.
- Cảnh 2: Vấn đề khách hàng.
- Cảnh 3: Sản phẩm xuất hiện.
- Cảnh 4: Lợi ích chính.
- Cảnh 5: Ưu đãi hoặc lý do nên mua ngay.
- Cảnh 6: Kêu gọi hành động.

HÃY TRẢ VỀ ĐẦY ĐỦ:
1. Kịch bản lời thoại theo từng cảnh.
2. Prompt tạo video chi tiết.
3. Prompt tạo hình đại diện/thumbnail.
4. Gợi ý giọng đọc.
5. Caption đăng bài.
6. Hashtag.
7. CTA bán hàng.
8. Checklist kiểm tra trước khi xuất video.`;
}

function generatePrompt() {
  const prompt = buildPrompt();
  $("promptOutput").value = prompt;
  $("copyStatus").innerText = "Đã tạo prompt. Bạn có thể sửa rồi bấm ❤️ Copy Prompt VIP.";
}

async function copyVipPrompt() {
  if (!$("promptOutput").value.trim()) generatePrompt();
  try {
    await navigator.clipboard.writeText($("promptOutput").value);
    $("copyStatus").innerText = "Đã copy Prompt VIP. Hãy dán vào Google Flow, Gemini, ChatGPT, Veo hoặc công cụ AI video khác.";
  } catch (e) {
    $("promptOutput").select();
    document.execCommand("copy");
    $("copyStatus").innerText = "Đã copy bằng chế độ dự phòng.";
  }
}

function openTool(name) {
  const url = TOOL_URLS[name];
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

window.addEventListener("DOMContentLoaded", () => {
  $("versionText").innerText = APP_VERSION;
  updateHelperNotes();
});
