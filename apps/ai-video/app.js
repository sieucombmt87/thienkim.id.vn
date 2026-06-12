const APP_VERSION = "AI.TKver3.6";
let currentAssetMode = "video";
let uploadConfirmed = false;
let pendingCopyAfterConfirm = false;
const $ = (id) => document.getElementById(id);

const TOOL_URLS = {
  video: [
    ["Google Flow", "https://flow.google/"],
    ["Veo", "https://aistudio.google.com/"],
    ["Kling", "https://klingai.com/"],
    ["Runway", "https://runwayml.com/"],
    ["Pika", "https://pika.art/"]
  ],
  image: [
    ["Gemini", "https://gemini.google.com/"],
    ["ChatGPT", "https://chatgpt.com/"],
    ["AI Studio", "https://aistudio.google.com/"],
    ["Canva", "https://www.canva.com/"],
    ["Adobe Firefly", "https://firefly.adobe.com/"]
  ]
};

const CONTENT_OPTIONS = {
  video: [
    "Video bán hàng nhanh",
    "Video review sản phẩm",
    "Video kể chuyện cảm xúc",
    "Video chuyên gia tư vấn",
    "Video TVC ngắn",
    "Video TikTok/Reels"
  ],
  image: [
    "Poster quảng cáo",
    "Banner Facebook",
    "Banner Shopee/Lazada",
    "Ảnh sản phẩm",
    "Ảnh Lifestyle",
    "Ảnh AI Studio"
  ]
};

const FORMAT_OPTIONS = {
  video: ["15 giây", "30 giây", "60 giây", "90 giây"],
  image: ["1:1", "4:5", "9:16", "16:9"]
};

function detectStoreName(input) {
  const s = (input || "").toLowerCase();
  if (s.includes("dienmayxanh")) return "Điện Máy Xanh";
  if (s.includes("thegioididong")) return "Thế Giới Di Động";
  if (s.includes("shopee")) return "Shopee";
  if (s.includes("lazada")) return "Lazada";
  if (s.includes("tiki")) return "Tiki";
  if (s.includes("tiktok")) return "TikTok Shop";
  if (s.includes("samsung")) return "Samsung / website hãng hoặc đại lý đang bán";
  if (s.includes("apple")) return "Apple / đại lý ủy quyền";
  if (s.includes("http")) return "Trang sản phẩm trong link đã nhập";
  return "kênh bán hàng bạn muốn giới thiệu";
}

function cleanProductName(input) {
  if (!input) return "sản phẩm cần bán";
  if (!input.includes("http")) return input.trim();
  try {
    const url = new URL(input.trim());
    return decodeURIComponent(url.pathname)
      .replace(/[-_/]+/g, " ")
      .replace(/\.html|\.htm/gi, "")
      .replace(/\s+/g, " ")
      .trim() || "sản phẩm trong link đã nhập";
  } catch {
    return "sản phẩm trong link đã nhập";
  }
}

function guessProductHighlights(productName) {
  const p = productName.toLowerCase();
  if (p.includes("tivi") || p.includes("tv") || p.includes("crystal") || p.includes("uhd")) {
    return [
      "• Hình ảnh sắc nét, phù hợp nhu cầu giải trí gia đình.",
      "• Màu sắc sống động, dễ tạo cảm giác cao cấp khi trình chiếu.",
      "• Hệ điều hành thông minh, thuận tiện xem phim, YouTube và ứng dụng phổ biến.",
      "• Thiết kế hiện đại, phù hợp phòng khách, phòng ngủ hoặc không gian kinh doanh.",
      "• Phù hợp khách hàng muốn nâng cấp trải nghiệm xem với chi phí hợp lý."
    ];
  }
  if (p.includes("kem") || p.includes("mỹ phẩm") || p.includes("serum") || p.includes("sữa rửa mặt")) {
    return [
      "• Tập trung vào lợi ích chăm sóc da và cảm giác sử dụng hằng ngày.",
      "• Phù hợp khách hàng quan tâm vẻ ngoài, độ an toàn và hiệu quả thực tế.",
      "• Có thể khai thác điểm mạnh về thành phần, công dụng và trải nghiệm sau khi dùng.",
      "• Nên trình bày hình ảnh sạch, sáng, tạo cảm giác tin cậy.",
      "• Thích hợp nội dung review, hướng dẫn sử dụng hoặc so sánh trước/sau."
    ];
  }
  if (p.includes("điện thoại") || p.includes("iphone") || p.includes("samsung galaxy")) {
    return [
      "• Tập trung vào hiệu năng, camera, pin và trải nghiệm sử dụng hằng ngày.",
      "• Phù hợp người dùng cần thiết bị làm việc, giải trí và chụp ảnh đẹp.",
      "• Có thể khai thác điểm mạnh về thiết kế, màn hình và tính năng thông minh.",
      "• Dễ tạo nội dung so sánh đời cũ/đời mới hoặc lý do nên nâng cấp.",
      "• Nên làm hình ảnh/video hiện đại, nhanh, rõ tính năng."
    ];
  }
  return [
    "• Tóm tắt 3-5 điểm nổi bật nhất của sản phẩm dựa trên tên/link đã nhập.",
    "• Tập trung vào lợi ích thật, tính năng quan trọng và lý do khách hàng nên quan tâm.",
    "• Nếu link có thông tin sản phẩm hoặc web hãng, ưu tiên khai thác nội dung chính xác từ trang đó.",
    "• Gợi ý nơi bán/kênh mua hàng rõ ràng nhưng không làm nội dung bị rối.",
    "• Trình bày theo hướng dễ hiểu, đáng tin và phù hợp bán hàng online."
  ];
}

function guessPrice(productInput, storeName) {
  if ((productInput || "").includes("http")) {
    return `Giá theo web đang hiển thị tại ${storeName}. Nếu công cụ AI đọc được trang, hãy lấy đúng giá trên web.`;
  }
  return "Giá bán gợi ý theo thị trường hoặc giá người bán nhập.";
}

function guessPromotions(productInput, storeName) {
  if ((productInput || "").includes("http")) {
    return [
      `✓ Ưu tiên lấy khuyến mãi/voucher đang hiển thị trên ${storeName}.`,
      "✓ Nếu có trả góp 0%, freeship, mã giảm giá, quà tặng hoặc bảo hành mở rộng thì đưa vào top 3.",
      "✓ Nếu trang không có ưu đãi rõ ràng, hãy đề xuất 3 ưu đãi phù hợp để tăng chuyển đổi."
    ].join("\n");
  }
  return [
    "✓ Giảm giá trực tiếp hoặc voucher cho khách đặt sớm.",
    "✓ Freeship / hỗ trợ giao hàng / lắp đặt nếu phù hợp sản phẩm.",
    "✓ Tặng quà, bảo hành hoặc tư vấn miễn phí để tăng niềm tin."
  ].join("\n");
}

function guessCustomer(productInput) {
  const s = (productInput || "").toLowerCase();
  if (s.includes("tivi") || s.includes("tv")) return "Gia đình, chủ nhà, người mua sắm thiết bị điện máy, người cần nâng cấp trải nghiệm giải trí tại nhà.";
  if (s.includes("kem") || s.includes("mỹ phẩm") || s.includes("serum")) return "Nữ 18-35 tuổi, người quan tâm chăm sóc da, làm đẹp, an toàn và hiệu quả sử dụng hằng ngày.";
  if (s.includes("điện thoại") || s.includes("iphone") || s.includes("galaxy")) return "Người trẻ, nhân viên văn phòng, người sáng tạo nội dung, khách hàng muốn nâng cấp điện thoại để làm việc và giải trí.";
  if (s.includes("máy lạnh") || s.includes("điều hòa")) return "Gia đình, văn phòng nhỏ, chủ nhà trọ/căn hộ, người cần làm mát tiết kiệm điện và bền bỉ.";
  return "Khách hàng có nhu cầu thực tế với sản phẩm, quan tâm chất lượng, giá trị sử dụng và ưu đãi mua hàng.";
}

function analyzeProduct() {
  const input = $("productInput").value.trim();
  const productName = cleanProductName(input);
  const storeName = detectStoreName(input);
  $("shortDesc").value = guessProductHighlights(productName).join("\n") + `\n\nNơi bán/kênh giới thiệu gợi ý: ${storeName}.`;
  if (!$("price").value.trim()) $("price").value = guessPrice(input, storeName);
  if (!$("promotion").value.trim()) $("promotion").value = guessPromotions(input, storeName);
  if (!$("customer").value.trim()) $("customer").value = guessCustomer(input);
  $("copyStatus").innerText = "Đã phân tích sản phẩm. Bạn có thể chỉnh lại thông tin trước khi tạo prompt.";
  updateHelperNotes();
}

function clearPromotion() {
  $("promotion").value = "";
  $("promotion").focus();
  $("copyStatus").innerText = "Đã xóa khuyến mãi. Bạn có thể nhập nội dung mong muốn.";
}

function fillSelectOptions(id, list) {
  const select = $(id);
  select.innerHTML = "";
  list.forEach((item) => {
    const option = document.createElement("option");
    option.textContent = item;
    option.value = item;
    select.appendChild(option);
  });
}

function setAssetMode(mode) {
  currentAssetMode = mode;
  uploadConfirmed = false;
  $("modeVideoCard").classList.toggle("active", mode === "video");
  $("modeImageCard").classList.toggle("active", mode === "image");
  fillSelectOptions("contentStyle", CONTENT_OPTIONS[mode]);
  fillSelectOptions("formatOption", FORMAT_OPTIONS[mode]);
  renderToolLinks();
  updateHelperNotes();
}

function renderToolLinks() {
  const wrap = $("toolLinks");
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
  const modeText = currentAssetMode === "video" ? "tool AI video" : "tool AI tạo ảnh";

  $("characterNote").innerText = charFile
    ? `Đã chọn file nhân vật: ${charFile.name}. Khi mở ${modeText}, hãy upload đúng file này để kết quả khớp prompt.`
    : character === "Upload file nhân vật riêng"
      ? `Bạn đã chọn dùng file nhân vật riêng. Hãy chọn file ở ô upload, sau đó upload lại file này lên ${modeText}.`
      : character === "AI tự chọn"
        ? "AI sẽ tự chọn nhân vật phù hợp. Nếu có nhân vật sẵn, hãy upload vào công cụ AI sau khi copy prompt."
        : `Prompt sẽ yêu cầu nhân vật dạng: ${character}. Nếu có hình/video mẫu, hãy upload thêm vào công cụ AI.`;

  $("sceneNote").innerText = sceneFile
    ? `Đã chọn file bối cảnh: ${sceneFile.name}. Khi mở ${modeText}, hãy upload đúng file này để kết quả khớp prompt.`
    : scene === "Upload file bối cảnh riêng"
      ? `Bạn đã chọn dùng file bối cảnh riêng. Hãy chọn file ở ô upload, sau đó upload lại file này lên ${modeText}.`
      : scene.includes("AI tự chọn")
        ? "AI sẽ dựa trên mô tả ngắn, nơi bán và sản phẩm để dựng bối cảnh phù hợp."
        : `Prompt sẽ yêu cầu bối cảnh: ${scene}. Nếu có ảnh/video nền, hãy upload thêm vào công cụ AI.`;
}

function needsUploadConfirmation() {
  return $("characterFile").files[0] || $("sceneFile").files[0] || $("character").value === "Upload file nhân vật riêng" || $("scene").value === "Upload file bối cảnh riêng";
}

function buildPrompt() {
  const productInput = $("productInput").value.trim() || "AI tự đề xuất sản phẩm phù hợp";
  const productName = cleanProductName(productInput);
  const storeName = detectStoreName(productInput);
  const shortDesc = $("shortDesc").value.trim() || "Hãy tạo mô tả ngắn 3-5 điểm nổi bật nhất của sản phẩm.";
  const price = $("price").value.trim() || guessPrice(productInput, storeName);
  const promotion = $("promotion").value.trim() || guessPromotions(productInput, storeName);
  const customer = $("customer").value.trim() || guessCustomer(productInput);
  const style = $("contentStyle").value;
  const format = $("formatOption").value;
  const character = $("character").value;
  const scene = $("scene").value;
  const charFile = $("characterFile").files[0];
  const sceneFile = $("sceneFile").files[0];
  const outputType = currentAssetMode === "video" ? "VIDEO BÁN HÀNG" : "HÌNH ẢNH BÁN HÀNG";
  const outputRequest = currentAssetMode === "video"
    ? `1. Kịch bản lời thoại theo từng cảnh.\n2. Prompt tạo video chi tiết.\n3. Prompt tạo thumbnail.\n4. Gợi ý giọng đọc.\n5. Caption đăng bài.\n6. Hashtag.\n7. CTA bán hàng.\n8. Checklist kiểm tra trước khi xuất video.`
    : `1. Prompt tạo ảnh quảng cáo chi tiết.\n2. Bố cục hình ảnh đề xuất.\n3. Text ngắn nên đặt trên ảnh.\n4. Prompt tạo biến thể ảnh.\n5. Caption đăng bài.\n6. Hashtag.\n7. CTA bán hàng.\n8. Checklist kiểm tra trước khi xuất ảnh.`;

  return `Bạn là chuyên gia tạo ${outputType} bằng AI cho Thiên Kim Universe.

Hãy tạo nội dung bán hàng ngắn, hấp dẫn, dễ hiểu và có khả năng chuyển đổi cao.

THÔNG TIN ĐẦU VÀO:
- Tên/link sản phẩm: ${productInput}
- Tên sản phẩm hiểu theo nội dung: ${productName}
- Nơi bán/kênh giới thiệu gợi ý: ${storeName}
- Mô tả ngắn 3-5 điểm nhấn: ${shortDesc}
- Giá bán gợi ý/giá trên web: ${price}
- Top 3 khuyến mãi tốt nhất: ${promotion}
- Đối tượng khách hàng: ${customer}
- Mục cần tạo: ${currentAssetMode === "video" ? "Tạo video" : "Tạo hình ảnh"}
- Kiểu nội dung: ${style}
- Thời lượng/định dạng: ${format}
- Nhân vật: ${character}
- Bối cảnh: ${scene}

YÊU CẦU KHAI THÁC LINK/TÊN SẢN PHẨM:
- Nếu có link sản phẩm, hãy ưu tiên đọc mô tả sản phẩm, thông số, hình ảnh, giá đang hiển thị, khuyến mãi/voucher/flash sale và nội dung từ web hãng hoặc trang bán hàng.
- Nếu công cụ AI không đọc được link, hãy dùng phần thông tin người dùng đã nhập và ghi rõ phần nào là gợi ý.
- Mô tả phải tập trung vào 3-5 điểm nhấn tính năng/lợi ích sản phẩm.
- Giá bán ưu tiên theo trang sản phẩm nếu có; nếu không có thì dùng giá/gợi ý giá đã nhập.
- Khuyến mãi ưu tiên lấy top 3 ưu đãi tốt nhất trên web; nếu không có thì đề xuất ưu đãi hợp lý.
- Đối tượng khách hàng phải dựa trên sản phẩm và nhu cầu thực tế.

GỢI Ý FILE NGƯỜI DÙNG CÓ SẴN:
- Nhân vật mẫu: ${charFile ? "Có file mẫu tên " + charFile.name + ". Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng nhân vật trong file upload." : character === "Upload file nhân vật riêng" ? "Người dùng chọn dùng file nhân vật riêng. Hãy nhắc người dùng upload file nhân vật lên công cụ AI." : "Chưa có file mẫu. Hãy tự tạo/chọn nhân vật phù hợp với sản phẩm."}
- Bối cảnh mẫu: ${sceneFile ? "Có file bối cảnh tên " + sceneFile.name + ". Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng bối cảnh trong file upload." : scene === "Upload file bối cảnh riêng" ? "Người dùng chọn dùng file bối cảnh riêng. Hãy nhắc người dùng upload file bối cảnh lên công cụ AI." : "Chưa có file bối cảnh. Hãy dựng bối cảnh dựa trên mô tả sản phẩm và nơi bán."}

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
      ? "Đã copy Prompt VIP. Hãy dán vào Google Flow, Veo, Kling, Runway, Pika hoặc công cụ AI video khác."
      : "Đã copy Prompt VIP. Hãy dán vào Gemini, ChatGPT, AI Studio, Canva, Firefly hoặc công cụ AI tạo ảnh khác.";
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
  $("uploadModalText").innerText = `Bạn đã chọn dùng file riêng. Sau khi copy prompt, bạn cần upload đúng file hình/video này lên tool AI để lấy đúng hình như prompt đã tạo. ${list.join(" • ")}`;
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
  setAssetMode("video");
  updateHelperNotes();
});
