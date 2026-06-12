const APP_VERSION = "TKver1.3";
let currentAssetMode = "video";
let pendingCopyAfterConfirm = false;
let uploadConfirmed = false;

const TOOL_URLS = {
  video: [
    ["Google Flow", "https://labs.google/fx/tools/flow"],
    ["Veo", "https://deepmind.google/models/veo/"],
    ["Gemini", "https://gemini.google.com/"],
    ["ChatGPT", "https://chatgpt.com/"],
    ["AI Studio", "https://aistudio.google.com/"]
  ],
  image: [
    ["Gemini", "https://gemini.google.com/"],
    ["ChatGPT", "https://chatgpt.com/"],
    ["AI Studio", "https://aistudio.google.com/"],
    ["Canva", "https://www.canva.com/ai-image-generator/"],
    ["Adobe Firefly", "https://firefly.adobe.com/"]
  ]
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
    if (host.includes("dienmayxanh") || host.includes("thegioididong")) return "Điện Máy Xanh / Thế Giới Di Động";
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

function guessCustomer(productText) {
  const t = (productText || "").toLowerCase();
  if (/kem|mỹ phẩm|serum|son|sữa rửa mặt|chống nắng/.test(t)) return "Nữ 18-35 tuổi, quan tâm làm đẹp, chăm sóc da, thích sản phẩm dễ dùng và có ưu đãi rõ ràng.";
  if (/máy lạnh|tủ lạnh|máy giặt|điện máy|tivi|tv/.test(t)) return "Gia đình, chủ nhà, người mua sắm thiết bị điện máy, ưu tiên độ bền, tiết kiệm điện, bảo hành và giá tốt.";
  if (/sữa|bé|bỉm|mẹ|trẻ/.test(t)) return "Mẹ bỉm, gia đình có trẻ nhỏ, quan tâm chất lượng, an toàn, nguồn gốc rõ ràng và ưu đãi mua nhiều.";
  if (/điện thoại|iphone|samsung|laptop|máy tính/.test(t)) return "Người trẻ, dân văn phòng, học sinh/sinh viên hoặc người cần thiết bị công nghệ, quan tâm hiệu năng, giá và trả góp.";
  return "AI tự phân tích khách hàng mục tiêu dựa trên sản phẩm, giá, lợi ích và nơi bán.";
}

function guessPrice(productText, storeName) {
  const t = (productText || "").toLowerCase();
  if (/iphone|samsung|laptop/.test(t)) return "Theo giá đang hiển thị trên trang sản phẩm; nếu không đọc được giá, dùng câu: giá tốt tại " + storeName;
  if (/kem|serum|son|mỹ phẩm/.test(t)) return "Giá ưu đãi theo trang bán hàng; nếu chưa có giá, gợi ý từ 99K-399K tùy dung tích/phiên bản.";
  if (/máy lạnh|tủ lạnh|máy giặt|tivi|tv/.test(t)) return "Theo giá đang niêm yết trên website; nếu chưa có giá, dùng câu: liên hệ để nhận giá ưu đãi hôm nay.";
  return "Theo giá đang hiển thị trên trang sản phẩm; nếu chưa có, người bán nhập giá thật vào ô này.";
}

function suggestProductInfo() {
  const productInput = $("productInput").value.trim();
  const productName = cleanProductName(productInput);
  const storeName = detectStoreName(productInput);
  const promoField = $("promotion");
  const priceField = $("price");
  const customerField = $("customer");

  $("sourceHint").innerText = productInput
    ? `Đã nhận diện nơi bán/gợi ý: ${storeName}. Prompt sẽ ưu tiên nội dung sản phẩm, web hãng hoặc trang bán hàng nếu công cụ AI có thể truy cập link.`
    : "Bạn chưa nhập sản phẩm/link. Tool sẽ dùng mẫu chung để tạo prompt.";

  $("shortDesc").value = `${productName} là sản phẩm cần được giới thiệu tập trung vào lợi ích thật, điểm nổi bật và lý do khách hàng nên quan tâm. Nếu link sản phẩm/web hãng có nội dung mô tả, hãy ưu tiên khai thác thông tin chính xác từ trang đó. Nội dung bán hàng nên gợi ý rõ nơi mua/đặt hàng tại ${storeName}, nhưng không làm người xem bị rối bởi quá nhiều thông tin.`;

  if (!priceField.value.trim()) priceField.value = guessPrice(productInput, storeName);
  if (!customerField.value.trim()) customerField.value = guessCustomer(productInput);
  if (!promoField.value.trim()) {
    promoField.value = productInput.includes("http")
      ? "Tìm khuyến mãi/voucher/flash sale trên trang sản phẩm; nếu không thấy, đề xuất ưu đãi phù hợp để tăng chuyển đổi."
      : "AI tự đề xuất ưu đãi phù hợp để tăng chuyển đổi.";
  }

  updateHelperNotes();
}

function clearPromotion() {
  $("promotion").value = "";
  $("promotion").focus();
  $("copyStatus").innerText = "Đã xóa khuyến mãi. Bạn có thể nhập nội dung mong muốn.";
}

function setAssetMode(mode) {
  currentAssetMode = mode;
  $("modeVideoCard").classList.toggle("active", mode === "video");
  $("modeImageCard").classList.toggle("active", mode === "image");
  renderToolLinks();
  updateHelperNotes();
}

function renderToolLinks() {
  const wrap = $("toolLinks");
  if (!wrap) return;
  wrap.innerHTML = "";
  TOOL_URLS[currentAssetMode].forEach(([label, url]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.onclick = () => window.open(url, "_blank", "noopener,noreferrer");
    wrap.appendChild(btn);
  });
}

function updateHelperNotes() {
  const character = $("character").value;
  const scene = $("scene").value;
  const charFile = $("characterFile").files[0];
  const sceneFile = $("sceneFile").files[0];
  const modeText = currentAssetMode === "video" ? "AI video" : "AI tạo ảnh";

  $("characterNote").innerText = charFile
    ? `Đã chọn file nhân vật: ${charFile.name}. Khi mở công cụ ${modeText}, hãy upload đúng file này để kết quả khớp prompt.`
    : character === "Upload file nhân vật riêng"
      ? `Bạn đã chọn dùng file nhân vật riêng. Hãy chọn file ở ô upload, sau đó upload lại file này lên công cụ ${modeText}.`
      : character === "AI tự chọn"
        ? "AI sẽ tự chọn nhân vật phù hợp. Nếu có nhân vật sẵn, hãy upload vào công cụ AI sau khi copy prompt."
        : `Prompt sẽ yêu cầu nhân vật dạng: ${character}. Nếu có hình/video mẫu, hãy upload thêm vào công cụ AI.`;

  $("sceneNote").innerText = sceneFile
    ? `Đã chọn file bối cảnh: ${sceneFile.name}. Khi mở công cụ ${modeText}, hãy upload đúng file này để kết quả khớp prompt.`
    : scene === "Upload file bối cảnh riêng"
      ? `Bạn đã chọn dùng file bối cảnh riêng. Hãy chọn file ở ô upload, sau đó upload lại file này lên công cụ ${modeText}.`
      : scene.includes("AI tự chọn")
        ? "AI sẽ dựa trên mô tả ngắn, nơi bán và sản phẩm để dựng bối cảnh phù hợp."
        : `Prompt sẽ yêu cầu bối cảnh: ${scene}. Nếu có ảnh/video nền, hãy upload thêm vào công cụ AI.`;
}

function needsUploadConfirmation() {
  const charFile = $("characterFile").files[0];
  const sceneFile = $("sceneFile").files[0];
  const characterUpload = $("character").value === "Upload file nhân vật riêng";
  const sceneUpload = $("scene").value === "Upload file bối cảnh riêng";
  return charFile || sceneFile || characterUpload || sceneUpload;
}

function buildPrompt() {
  const productInput = $("productInput").value.trim() || "AI tự đề xuất sản phẩm phù hợp";
  const productName = cleanProductName(productInput);
  const storeName = detectStoreName(productInput);
  const shortDesc = $("shortDesc").value.trim() || "AI tự tạo mô tả ngắn dựa trên tên sản phẩm hoặc link sản phẩm.";
  const price = $("price").value.trim() || guessPrice(productInput, storeName);
  const promotion = $("promotion").value.trim() || "Không có khuyến mãi cụ thể, hãy tìm trên trang sản phẩm nếu có link; nếu không có thì đề xuất ưu đãi phù hợp.";
  const customer = $("customer").value.trim() || guessCustomer(productInput);
  const contentType = currentAssetMode === "video" ? "VIDEO BÁN HÀNG" : "HÌNH ẢNH BÁN HÀNG";
  const videoStyle = $("videoStyle").value;
  const duration = $("duration").value;
  const character = $("character").value;
  const scene = $("scene").value;
  const charFile = $("characterFile").files[0];
  const sceneFile = $("sceneFile").files[0];

  const outputRequest = currentAssetMode === "video"
    ? `1. Kịch bản lời thoại theo từng cảnh.\n2. Prompt tạo video chi tiết.\n3. Prompt tạo hình đại diện/thumbnail.\n4. Gợi ý giọng đọc.\n5. Caption đăng bài.\n6. Hashtag.\n7. CTA bán hàng.\n8. Checklist kiểm tra trước khi xuất video.`
    : `1. Prompt tạo ảnh quảng cáo chi tiết.\n2. Bố cục hình ảnh đề xuất.\n3. Text ngắn nên đặt trên ảnh.\n4. Prompt tạo thumbnail/sản phẩm.\n5. Caption đăng bài.\n6. Hashtag.\n7. CTA bán hàng.\n8. Checklist kiểm tra trước khi xuất ảnh.`;

  return `Bạn là chuyên gia tạo ${contentType} bằng AI cho Thiên Kim Universe.

Hãy tạo nội dung bán hàng ngắn, hấp dẫn, dễ hiểu và có khả năng chuyển đổi cao.

THÔNG TIN ĐẦU VÀO:
- Tên/link sản phẩm: ${productInput}
- Tên sản phẩm hiểu theo nội dung: ${productName}
- Nơi bán/kênh giới thiệu gợi ý: ${storeName}
- Mô tả ngắn: ${shortDesc}
- Giá bán/gợi ý giá: ${price}
- Khuyến mãi: ${promotion}
- Đối tượng khách hàng: ${customer}
- Kiểu nội dung: ${videoStyle}
- Thời lượng/định dạng: ${duration}
- Nhân vật: ${character}
- Bối cảnh: ${scene}

YÊU CẦU KHAI THÁC LINK/TÊN SẢN PHẨM:
- Nếu có link sản phẩm, hãy ưu tiên đọc thông tin mô tả sản phẩm, hình ảnh, giá đang hiển thị, khuyến mãi/voucher/flash sale và nội dung từ web hãng hoặc trang bán hàng.
- Nếu không đọc được link, hãy tự suy luận hợp lý từ tên sản phẩm, nhưng phải ghi rõ phần nào là gợi ý.
- Mô tả phải tập trung vào sản phẩm, lợi ích thật và nơi bán/kênh mua hàng đang muốn giới thiệu.
- Giá bán dùng theo trang sản phẩm nếu có; nếu không có thì dùng giá/gợi ý giá đã nhập.
- Đối tượng khách hàng phải dựa trên sản phẩm và nhu cầu thực tế.

GỢI Ý FILE NGƯỜI DÙNG CÓ SẴN:
- Nhân vật mẫu: ${charFile ? "Có file mẫu tên " + charFile.name + ". Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng nhân vật trong file upload." : character === "Upload file nhân vật riêng" ? "Người dùng chọn dùng file nhân vật riêng nhưng chưa khai báo tên file. Hãy nhắc người dùng upload file nhân vật lên công cụ AI." : "Chưa có file mẫu. Hãy tự tạo/chọn nhân vật phù hợp với sản phẩm."}
- Bối cảnh mẫu: ${sceneFile ? "Có file bối cảnh tên " + sceneFile.name + ". Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng bối cảnh trong file upload." : scene === "Upload file bối cảnh riêng" ? "Người dùng chọn dùng file bối cảnh riêng nhưng chưa khai báo tên file. Hãy nhắc người dùng upload file bối cảnh lên công cụ AI." : "Chưa có file bối cảnh. Hãy dựng bối cảnh dựa trên mô tả sản phẩm và nơi bán."}

YÊU CẦU CHẤT LƯỢNG:
1. Có hook mạnh trong 3 giây đầu nếu là video, hoặc điểm nhìn nổi bật nếu là hình ảnh.
2. Nêu đúng vấn đề/nỗi đau của khách hàng.
3. Giới thiệu sản phẩm như giải pháp tự nhiên, đáng tin.
4. Nêu lợi ích rõ ràng, tránh nói quá đà.
5. Nhắc giá/khuyến mãi nếu phù hợp.
6. Có CTA rõ: nhắn tin, đặt hàng, bấm mua, hoặc xem link sản phẩm.
7. Phù hợp TikTok, Facebook, YouTube, Zalo.
8. Phong cách hình ảnh rõ nét, ánh sáng đẹp, bố cục chuyên nghiệp.
9. Nếu thông tin còn thiếu, hãy tự đề xuất phương án hợp lý nhất.

CẤU TRÚC GỢI Ý:
- Phần 1: Hook thu hút.
- Phần 2: Vấn đề khách hàng.
- Phần 3: Sản phẩm xuất hiện.
- Phần 4: Lợi ích chính.
- Phần 5: Ưu đãi hoặc lý do nên mua ngay.
- Phần 6: Kêu gọi hành động.

HÃY TRẢ VỀ ĐẦY ĐỦ:
${outputRequest}`;
}

function generatePrompt() {
  const prompt = buildPrompt();
  $("promptOutput").value = prompt;
  uploadConfirmed = false;
  $("copyStatus").innerText = "Đã tạo prompt. Bạn có thể sửa rồi bấm ❤️ Copy Prompt VIP.";
}

async function actuallyCopyPrompt() {
  try {
    await navigator.clipboard.writeText($("promptOutput").value);
    $("copyStatus").innerText = currentAssetMode === "video"
      ? "Đã copy Prompt VIP. Hãy dán vào Google Flow, Gemini, ChatGPT, Veo hoặc công cụ AI video khác."
      : "Đã copy Prompt VIP. Hãy dán vào Gemini, ChatGPT, AI Studio hoặc công cụ AI tạo ảnh khác.";
  } catch (e) {
    $("promptOutput").select();
    document.execCommand("copy");
    $("copyStatus").innerText = "Đã copy bằng chế độ dự phòng.";
  }
}

async function copyVipPrompt() {
  if (!$("promptOutput").value.trim()) generatePrompt();
  if (needsUploadConfirmation() && !uploadConfirmed) {
    pendingCopyAfterConfirm = true;
    showUploadModal();
    return;
  }
  await actuallyCopyPrompt();
}

function showUploadModal() {
  const list = [];
  const charFile = $("characterFile").files[0];
  const sceneFile = $("sceneFile").files[0];
  if ($("character").value === "Upload file nhân vật riêng" || charFile) list.push(charFile ? `Nhân vật: ${charFile.name}` : "Nhân vật: cần upload file hình/video nhân vật");
  if ($("scene").value === "Upload file bối cảnh riêng" || sceneFile) list.push(sceneFile ? `Bối cảnh: ${sceneFile.name}` : "Bối cảnh: cần upload file hình/video bối cảnh");
  $("uploadModalText").innerText = `Bạn đã chọn dùng file riêng. Sau khi copy prompt, bạn cần upload đúng file này lên tool AI để lấy đúng hình như prompt đã tạo. ${list.join(" • ")}`;
  $("uploadModal").classList.add("show");
  $("uploadModal").setAttribute("aria-hidden", "false");
}

function closeUploadModal(confirmed) {
  $("uploadModal").classList.remove("show");
  $("uploadModal").setAttribute("aria-hidden", "true");
  if (confirmed) {
    uploadConfirmed = true;
    if (pendingCopyAfterConfirm) {
      pendingCopyAfterConfirm = false;
      actuallyCopyPrompt();
    }
  } else {
    pendingCopyAfterConfirm = false;
    $("copyStatus").innerText = "Bạn có thể kiểm tra lại file upload rồi bấm copy lần nữa.";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  $("versionText").innerText = APP_VERSION;
  renderToolLinks();
  updateHelperNotes();
});
