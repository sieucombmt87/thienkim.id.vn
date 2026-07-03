const APP_VERSION = (window.TK_CONFIG && TK_CONFIG.VERSION) || "AI.TKver9.0";
let currentAssetMode = "video";
let uploadConfirmed = false;
let pendingCopyAfterConfirm = false;
let selectedAccount = Number(localStorage.getItem(storageKey("selectedAccount")) || 1);
let selectedProvider = localStorage.getItem(storageKey("selectedProvider")) || "gemini";
const $ = (id) => document.getElementById(id);

// AI Providers Configuration
const AI_PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    icon: "✨",
    color: "#4285f4",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/",
    models: {
      video: "gemini-1.5-flash",
      image: "gemini-1.5-flash"
    },
    defaultModel: "gemini-1.5-flash"
  },
  grok: {
    name: "xAI Grok",
    icon: "🤖",
    color: "#8b5cf6",
    apiUrl: "https://api.x.ai/v1/",
    models: {
      video: "grok-2-1212",
      image: "grok-2-1212"
    },
    defaultModel: "grok-2-1212"
  }
};

function storageKey(name) { return ((window.TK_CONFIG && TK_CONFIG.STORAGE_PREFIX) || "TK_AI_VIDEO_") + name; }

const TOOL_URLS = {
  video: [
    ["Google Flow", "https://flow.google/"],
    ["Veo / AI Studio", "https://aistudio.google.com/"],
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

// Video Mode Specialized Config
const VIDEO_CONFIG = {
  contentStyles: [
    { value: "Video bán hàng nhanh", desc: "15-30s, hook mạnh, CTA ngay" },
    { value: "Video review sản phẩm", desc: "Unbox, đánh giá chi tiết" },
    { value: "Video kể chuyện cảm xúc", desc: "Storytelling, cảm xúc" },
    { value: "Video chuyên gia tư vấn", desc: "Authority, tin cậy" },
    { value: "Video TVC ngắn", desc: "Quảng cáo chuyên nghiệp" },
    { value: "Video TikTok/Reels", desc: "Xu hướng, viral" }
  ],
  formats: ["15 giây", "30 giây", "60 giây", "90 giây", "3 phút"],
  aspectRatios: ["9:16 (Dọc)", "16:9 (Ngang)", "1:1 (Vuông)"],
  durations: {
    "15 giây": 15,
    "30 giây": 30,
    "60 giây": 60,
    "90 giây": 90,
    "3 phút": 180
  },
  characters: [
    { value: "AI tự chọn", icon: "🎭" },
    { value: "MC nữ chuyên nghiệp", icon: "👩‍💼" },
    { value: "MC nam chuyên nghiệp", icon: "👨‍💼" },
    { value: "Chuyên gia/lĩnh vực", icon: "🎓" },
    { value: "KOL/Influencer", icon: "🌟" },
    { value: "Người bán hàng thân thiện", icon: "😊" },
    { value: "CEO/Business owner", icon: "👔" },
    { value: "Upload nhân vật riêng", icon: "📤" }
  ],
  scenes: [
    { value: "AI tự chọn theo sản phẩm", icon: "🎬" },
    { value: "Studio sang trọng", icon: "✨" },
    { value: "Cửa hàng/siêu thị", icon: "🏪" },
    { value: "Văn phòng hiện đại", icon: "🏢" },
    { value: "Ngoài trời/thiên nhiên", icon: "🌳" },
    { value: "Showroom cao cấp", icon: "🏬" },
    { value: "Home studio", icon: "🏠" },
    { value: "Upload bối cảnh riêng", icon: "📤" }
  ],
  videoTypes: [
    { value: "Talking head", icon: "🗣️", desc: "Người nói trước camera" },
    { value: "Product showcase", icon: "📦", desc: "Giới thiệu sản phẩm" },
    { value: "Lifestyle/UGC", icon: "🎥", desc: "Phong cách đời thường" },
    { value: "Animation", icon: "🎨", desc: "Hoạt hình/mini movie" },
    { value: "Cinematic", icon: "🎬", desc: "Điện ảnh chuyên nghiệp" }
  ],
  voiceOptions: [
    { value: "Nữ trẻ trung", tone: "hào hứng, năng động" },
    { value: "Nữ trầm ấm", tone: "tin cậy, chuyên nghiệp" },
    { value: "Nam trẻ trung", tone: "năng động, thân thiện" },
    { value: "Nam trầm ấm", tone: "authority, chuyên gia" },
    { value: "Chuyên gia", tone: "đáng tin cậy, am hiểu" },
    { value: "MC truyền hình", tone: "chuyên nghiệp, tin cậy" }
  ],
  musicStyles: [
    { value: "Nhạc nền nhẹ nhàng", mood: "thư giãn, chuyên nghiệp" },
    { value: "Nhạc bán hàng sôi động", mood: "năng động, kích thích" },
    { value: "Cinematic/Hành động", mood: "hoành tráng, cảm xúc" },
    { value: "Acoustic/ Acoustic", mood: "gần gũi, thật" },
    { value: "EDM/Electronic", mood: "hiện đại, công nghệ" },
    { value: "Không nhạc nền", mood: "chỉ giọng nói" }
  ]
};

// Image Mode Specialized Config
const IMAGE_CONFIG = {
  contentStyles: [
    { value: "Poster quảng cáo", desc: "1 hình, nhiều text" },
    { value: "Banner Facebook", desc: "1200x628, nhiều space" },
    { value: "Banner Shopee/Lazada", desc: "Tối ưu sàn TMĐT" },
    { value: "Ảnh sản phẩm chuyên nghiệp", desc: "E-commerce ready" },
    { value: "Ảnh Lifestyle", desc: "Đời thường, thực tế" },
    { value: "Carousel/Gallery", desc: "Nhiều ảnh liên quan" }
  ],
  formats: ["1:1 (Vuông)", "4:5 (Instagram)", "9:16 (Story)", "16:9 (Banner)"],
  aspectRatios: {
    "1:1 (Vuông)": "1:1",
    "4:5 (Instagram)": "4:5",
    "9:16 (Story)": "9:16",
    "16:9 (Banner)": "16:9"
  },
  designStyles: [
    { value: "Minimalist", icon: "◻️", desc: "Tối giản, sang trọng" },
    { value: "Bold/Modern", icon: "🟧", desc: "Nổi bật, mạnh mẽ" },
    { value: "Luxury/Premium", icon: "✨", desc: "Cao cấp, đẳng cấp" },
    { value: "Playful/Fun", icon: "🎨", desc: "Vui nhộn, trẻ trung" },
    { value: "Professional", icon: "💼", desc: "Chỉnh chu, uy tín" },
    { value: "Natural/Organic", icon: "🌿", desc: "Mộc mạc, thật" }
  ],
  imageTypes: [
    { value: "Product only", icon: "📦", desc: "Chỉ sản phẩm" },
    { value: "Product + Background", icon: "🖼️", desc: "Sản phẩm + nền" },
    { value: "Mockup场景", icon: "📱", desc: "Sản phẩm đang dùng" },
    { value: "Lifestyle", icon: "🌅", desc: "Sản phẩm trong đời thường" },
    { value: "Comparison/Before-After", icon: "⚖️", desc: "So sánh trước/sau" },
    { value: "Flat Lay", icon: "📋", desc: "Sắp xếp ngang" }
  ],
  colorSchemes: [
    { value: "Tự động theo thương hiệu", icon: "🎨" },
    { value: "Vibrant/Nổi bật", icon: "🔴" },
    { value: "Pastel/Nhạt", icon: "🩵" },
    { value: "Dark/Luxury", icon: "🖤" },
    { value: "Neutral/Trui", icon: "⚪" },
    { value: "Warm tones/Ấm", icon: "🟠" },
    { value: "Cool tones/Lạnh", icon: "🔵" }
  ]
};

const CONTENT_OPTIONS = {
  video: ["Video bán hàng nhanh", "Video review sản phẩm", "Video kể chuyện cảm xúc", "Video chuyên gia tư vấn", "Video TVC ngắn", "Video TikTok/Reels"],
  image: ["Poster quảng cáo", "Banner Facebook", "Banner Shopee/Lazada", "Ảnh sản phẩm", "Ảnh Lifestyle", "Ảnh AI Studio"]
};
const FORMAT_OPTIONS = { video: ["15 giây", "30 giây", "60 giây", "90 giây"], image: ["1:1", "4:5", "9:16", "16:9"] };

// Helper functions for configs
function getContentStyles(mode) {
  if (mode === "video" && VIDEO_CONFIG) return VIDEO_CONFIG.contentStyles.map(s => s.value);
  if (mode === "image" && IMAGE_CONFIG) return IMAGE_CONFIG.contentStyles.map(s => s.value);
  return CONTENT_OPTIONS[mode] || [];
}

function getFormats(mode) {
  if (mode === "video" && VIDEO_CONFIG) return VIDEO_CONFIG.formats;
  if (mode === "image" && IMAGE_CONFIG) return IMAGE_CONFIG.formats;
  return FORMAT_OPTIONS[mode] || [];
}

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
  try { const url = new URL(input.trim()); return decodeURIComponent(url.pathname).replace(/[-_/]+/g, " ").replace(/\.html|\.htm/gi, "").replace(/\s+/g, " ").trim() || "sản phẩm trong link đã nhập"; } catch { return "sản phẩm trong link đã nhập"; }
}
function guessProductHighlights(productName) {
  const p = productName.toLowerCase();
  if (p.includes("tivi") || p.includes("tv") || p.includes("crystal") || p.includes("uhd")) return ["• Hình ảnh sắc nét, phù hợp nhu cầu giải trí gia đình.", "• Màu sắc sống động, dễ tạo cảm giác cao cấp khi trình chiếu.", "• Hệ điều hành thông minh, thuận tiện xem phim, YouTube và ứng dụng phổ biến.", "• Thiết kế hiện đại, phù hợp phòng khách, phòng ngủ hoặc không gian kinh doanh.", "• Phù hợp khách hàng muốn nâng cấp trải nghiệm xem với chi phí hợp lý."];
  if (p.includes("kem") || p.includes("mỹ phẩm") || p.includes("serum") || p.includes("sữa rửa mặt")) return ["• Tập trung vào lợi ích chăm sóc da và cảm giác sử dụng hằng ngày.", "• Phù hợp khách hàng quan tâm vẻ ngoài, độ an toàn và hiệu quả thực tế.", "• Có thể khai thác điểm mạnh về thành phần, công dụng và trải nghiệm sau khi dùng.", "• Nên trình bày hình ảnh sạch, sáng, tạo cảm giác tin cậy.", "• Thích hợp nội dung review, hướng dẫn sử dụng hoặc so sánh trước/sau."];
  if (p.includes("điện thoại") || p.includes("iphone") || p.includes("samsung galaxy")) return ["• Tập trung vào hiệu năng, camera, pin và trải nghiệm sử dụng hằng ngày.", "• Phù hợp người dùng cần thiết bị làm việc, giải trí và chụp ảnh đẹp.", "• Có thể khai thác điểm mạnh về thiết kế, màn hình và tính năng thông minh.", "• Dễ tạo nội dung so sánh đời cũ/đời mới hoặc lý do nên nâng cấp.", "• Nên làm hình ảnh/video hiện đại, nhanh, rõ tính năng."];
  return ["• Tóm tắt 3-5 điểm nổi bật nhất của sản phẩm dựa trên tên/link đã nhập.", "• Tập trung vào lợi ích thật, tính năng quan trọng và lý do khách hàng nên quan tâm.", "• Nếu link có thông tin sản phẩm hoặc web hãng, ưu tiên khai thác nội dung chính xác từ trang đó.", "• Gợi ý nơi bán/kênh mua hàng rõ ràng nhưng không làm nội dung bị rối.", "• Trình bày theo hướng dễ hiểu, đáng tin và phù hợp bán hàng online."];
}
function guessPrice(productInput, storeName) { return (productInput || "").includes("http") ? `Lấy đúng giá thực tế đang hiển thị trên website tại ${storeName}. Nếu chưa đúng, hãy nhập tay giá thật vào ô này.` : "Nhập giá bán thực tế hoặc để AI gợi ý theo sản phẩm."; }
function guessPromotions(productInput, storeName) { return (productInput || "").includes("http") ? [`✓ Tìm ưu đãi/voucher đang hiển thị trên ${storeName}.`, "✓ Ưu tiên top 3: giảm giá, trả góp 0%, freeship/lắp đặt/quà tặng/bảo hành.", "✓ Nếu trang không có ưu đãi rõ ràng, đề xuất 3 ưu đãi hợp lý để tăng chuyển đổi."].join("\n") : ["✓ Giảm giá trực tiếp hoặc voucher cho khách đặt sớm.", "✓ Freeship / hỗ trợ giao hàng / lắp đặt nếu phù hợp sản phẩm.", "✓ Tặng quà, bảo hành hoặc tư vấn miễn phí để tăng niềm tin."].join("\n"); }
function guessCustomer(productInput) { const s = (productInput || "").toLowerCase(); if (s.includes("tivi") || s.includes("tv")) return "Gia đình, chủ nhà, người mua sắm thiết bị điện máy, người cần nâng cấp trải nghiệm giải trí tại nhà."; if (s.includes("kem") || s.includes("mỹ phẩm") || s.includes("serum")) return "Nữ 18-35 tuổi, người quan tâm chăm sóc da, làm đẹp, an toàn và hiệu quả sử dụng hằng ngày."; if (s.includes("điện thoại") || s.includes("iphone") || s.includes("galaxy")) return "Người trẻ, nhân viên văn phòng, người sáng tạo nội dung, khách hàng muốn nâng cấp điện thoại để làm việc và giải trí."; return "Khách hàng có nhu cầu thực tế với sản phẩm, quan tâm chất lượng, giá trị sử dụng và ưu đãi mua hàng."; }

async function tkApi(action, payload = {}) {
  const url = (window.TK_CONFIG && TK_CONFIG.APPS_SCRIPT_URL) || "";
  if (!url) throw new Error("Chưa cấu hình APPS_SCRIPT_URL");
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...payload }) });
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error("Backend trả về dữ liệu không hợp lệ"); }
}

function getApiKey(i = selectedAccount) { return localStorage.getItem(storageKey(`geminiKey${i}`)) || ""; }
function setAccountStatus(i, status, note = "") { localStorage.setItem(storageKey(`accountStatus${i}`), status); localStorage.setItem(storageKey(`accountNote${i}`), note); if (status === "red") localStorage.setItem(storageKey(`nextCheck${i}`), String(Date.now() + 5 * 60 * 60 * 1000)); renderApiAccounts(); }
function getAccountStatus(i) { return localStorage.getItem(storageKey(`accountStatus${i}`)) || "gray"; }

function renderApiAccounts() {
  const wrap = $("apiAccounts");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (let i = 1; i <= 3; i++) {
    const status = getAccountStatus(i);
    const note = localStorage.getItem(storageKey(`accountNote${i}`)) || "Chưa kiểm tra";
    const card = document.createElement("div");
    card.className = `api-card ${selectedAccount === i ? "selected" : ""}`;
    card.innerHTML = `<div class="api-head"><span class="api-title">Tài khoản ${i}</span><span class="api-dot ${status === "green" ? "green" : status === "gray" ? "gray" : ""}"></span></div><input id="geminiKey${i}" type="password" placeholder="Nhập Gemini API Key tài khoản ${i}" value="${escapeHtml(getApiKey(i))}"><div class="api-meta">${escapeHtml(note)}</div><button type="button" class="mini-btn ghost" onclick="selectAccount(${i})">Dùng tài khoản ${i}</button>`;
    wrap.appendChild(card);
  }
}
function escapeHtml(s) { return String(s || "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }
function saveApiKeys() { for (let i = 1; i <= 3; i++) localStorage.setItem(storageKey(`geminiKey${i}`), $(`geminiKey${i}`).value.trim()); $("apiStatus").className = "status success"; $("apiStatus").innerText = "Đã lưu API Key trên trình duyệt của bạn."; renderApiAccounts(); }
function selectAccount(i) { saveApiKeys(); selectedAccount = i; localStorage.setItem(storageKey("selectedAccount"), String(i)); renderApiAccounts(); $("apiStatus").innerText = `Đang chọn tài khoản ${i}.`; }
async function checkAccount(i) { const key = getApiKey(i); if (!key) { setAccountStatus(i, "gray", "Chưa nhập API Key"); return false; } try { const data = await tkApi("checkGemini", { apiKey: key }); if (data.ok) { setAccountStatus(i, "green", "Còn credit / API hoạt động"); return true; } setAccountStatus(i, "red", data.message || "Tài khoản đã hết credit hoặc lỗi API"); return false; } catch (e) { setAccountStatus(i, "red", e.message || "Không kiểm tra được"); return false; } }
async function checkAllAccounts() { saveApiKeys(); $("apiStatus").className = "status"; $("apiStatus").innerText = "Đang kiểm tra 3 tài khoản..."; let ok = false; for (let i = 1; i <= 3; i++) { if (await checkAccount(i)) ok = true; } $("apiStatus").className = ok ? "status success" : "status error"; $("apiStatus").innerText = ok ? "Đã kiểm tra xong. Tài khoản xanh có thể dùng." : "Cả 3 tài khoản đều hết credit hoặc chưa dùng được. Hệ thống sẽ nhắc kiểm tra lại sau 5 tiếng."; }
async function autoRecheckDueAccounts() { for (let i = 1; i <= 3; i++) { const next = Number(localStorage.getItem(storageKey(`nextCheck${i}`)) || 0); if (next && Date.now() >= next && getApiKey(i)) await checkAccount(i); } }

async function analyzeProduct(useBackend = true) {
  const input = $("productInput").value.trim();
  const productName = cleanProductName(input);
  const storeName = detectStoreName(input);
  setBusy(true); $("copyStatus").innerText = "Đang phân tích sản phẩm...";
  if (useBackend) {
    try {
      const data = await tkApi("analyzeProduct", { productInput: input, assetMode: currentAssetMode, apiKey: getApiKey() });
      if (data && data.ok) {
        $("shortDesc").value = normalizeBullets(data.shortDesc) || guessProductHighlights(productName).join("\n");
        $("price").value = data.price || guessPrice(input, storeName);
        $("promotion").value = normalizePromos(data.promotions) || guessPromotions(input, storeName);
        $("customer").value = data.customer || guessCustomer(input);
        $("copyStatus").innerText = "Đã phân tích bằng backend. Bạn có thể sửa trước khi copy.";
        if (data.accountStatus === "red") setAccountStatus(selectedAccount, "red", data.message || "Tài khoản đã hết credit, vui lòng đổi tài khoản");
        else if (getApiKey()) setAccountStatus(selectedAccount, "green", "Còn credit / API hoạt động");
        generatePrompt(false);
        setBusy(false); return;
      }
    } catch (e) { $("copyStatus").innerText = "Backend chưa phản hồi, dùng chế độ gợi ý nhanh tại máy."; }
  }
  $("shortDesc").value = guessProductHighlights(productName).join("\n") + `\n\nNơi bán/kênh giới thiệu gợi ý: ${storeName}.`;
  if (!$("price").value.trim()) $("price").value = guessPrice(input, storeName);
  if (!$("promotion").value.trim()) $("promotion").value = guessPromotions(input, storeName);
  if (!$("customer").value.trim()) $("customer").value = guessCustomer(input);
  generatePrompt(false); setBusy(false);
}
function normalizeBullets(v) { if (Array.isArray(v)) return v.map(x => String(x).trim().startsWith("•") ? x : `• ${x}`).join("\n"); return v || ""; }
function normalizePromos(v) { if (Array.isArray(v)) return v.map(x => String(x).trim().startsWith("✓") ? x : `✓ ${x}`).join("\n"); return v || ""; }
function setBusy(isBusy) { document.body.classList.toggle("loading", isBusy); }
function clearPromotion() { $("promotion").value = ""; $("promotion").focus(); $("copyStatus").innerText = "Đã xóa khuyến mãi. Bạn có thể nhập nội dung mong muốn."; }
function fillSelectOptions(id, list) { const select = $(id); select.innerHTML = ""; list.forEach(item => { const o = document.createElement("option"); o.textContent = item; o.value = item; select.appendChild(o); }); }
function setAssetMode(mode) { currentAssetMode = mode; uploadConfirmed = false; $("modeVideoCard").classList.toggle("active", mode === "video"); $("modeImageCard").classList.toggle("active", mode === "image"); fillSelectOptions("contentStyle", CONTENT_OPTIONS[mode]); fillSelectOptions("formatOption", FORMAT_OPTIONS[mode]); renderToolLinks(); updateHelperNotes(); }
function renderToolLinks() { const wrap = $("toolLinks"); wrap.innerHTML = ""; TOOL_URLS[currentAssetMode].forEach(([label, url]) => { const btn = document.createElement("button"); btn.type = "button"; btn.textContent = label; btn.onclick = () => window.open(url, "_blank", "noopener,noreferrer"); wrap.appendChild(btn); }); }
function toggleConnected(tool) { const key = storageKey(`${tool}Connected`); const next = localStorage.getItem(key) !== "true"; localStorage.setItem(key, String(next)); updateConnections(); if (!next) window.open(tool === "canva" ? "https://www.canva.com/" : "https://chatgpt.com/", "_blank", "noopener,noreferrer"); }
function updateConnections() { [["canva", "Canva"], ["chatgpt", "ChatGPT"]].forEach(([key, label]) => { const el = $(`${key}Status`); const connected = localStorage.getItem(storageKey(`${key}Connected`)) === "true"; el.classList.toggle("connected", connected); el.textContent = connected ? `${label}: đã kết nối` : `${label}: chưa kết nối`; }); }
function handleCharacterFileChange() { if ($("characterFile").files[0]) $("character").value = "Upload file nhân vật riêng"; updateHelperNotes(); }
function handleSceneFileChange() { if ($("sceneFile").files[0]) $("scene").value = "Upload file bối cảnh riêng"; updateHelperNotes(); }
function updateHelperNotes() { const character = $("character").value; const scene = $("scene").value; const charFile = $("characterFile").files[0]; const sceneFile = $("sceneFile").files[0]; const modeText = currentAssetMode === "video" ? "tool AI video" : "tool AI tạo ảnh"; $("characterNote").innerText = charFile ? `Đã chọn file nhân vật: ${charFile.name}. Khi mở ${modeText}, hãy upload đúng file này để kết quả khớp prompt.` : character === "Upload file nhân vật riêng" ? `Bạn đã chọn dùng file nhân vật riêng. Hãy chọn file ở ô upload, sau đó upload lại file này lên ${modeText}.` : character === "AI tự chọn" ? "AI sẽ tự chọn nhân vật phù hợp. Nếu có nhân vật sẵn, hãy upload vào công cụ AI sau khi copy prompt." : `Prompt sẽ yêu cầu nhân vật dạng: ${character}. Nếu có hình/video mẫu, hãy upload thêm vào công cụ AI.`; $("sceneNote").innerText = sceneFile ? `Đã chọn file bối cảnh: ${sceneFile.name}. Khi mở ${modeText}, hãy upload đúng file này để kết quả khớp prompt.` : scene === "Upload file bối cảnh riêng" ? `Bạn đã chọn dùng file bối cảnh riêng. Hãy chọn file ở ô upload, sau đó upload lại file này lên ${modeText}.` : scene.includes("AI tự chọn") ? "AI sẽ dựa trên mô tả ngắn, nơi bán và sản phẩm để dựng bối cảnh phù hợp." : `Prompt sẽ yêu cầu bối cảnh: ${scene}. Nếu có ảnh/video nền, hãy upload thêm vào công cụ AI.`; }
function needsUploadConfirmation() { return $("characterFile").files[0] || $("sceneFile").files[0] || $("character").value === "Upload file nhân vật riêng" || $("scene").value === "Upload file bối cảnh riêng"; }

function buildPrompt() {
  const productInput = $("productInput").value.trim() || "AI tự đề xuất sản phẩm phù hợp";
  const productName = cleanProductName(productInput);
  const storeName = detectStoreName(productInput);
  const shortDesc = $("shortDesc").value.trim() || "Hãy tạo mô tả ngắn 3-5 điểm nổi bật nhất của sản phẩm.";
  const price = $("price").value.trim() || guessPrice(productInput, storeName);
  const promotion = $("promotion").value.trim() || guessPromotions(productInput, storeName);
  const customer = $("customer").value.trim() || guessCustomer(productInput);
  const style = $("contentStyle").value; const format = $("formatOption").value; const character = $("character").value; const scene = $("scene").value;
  const charFile = $("characterFile").files[0]; const sceneFile = $("sceneFile").files[0];
  const outputType = currentAssetMode === "video" ? "VIDEO BÁN HÀNG" : "HÌNH ẢNH BÁN HÀNG";
  const outputRequest = currentAssetMode === "video" ? `1. Kịch bản lời thoại theo từng cảnh.\n2. Prompt tạo video chi tiết.\n3. Prompt tạo thumbnail.\n4. Gợi ý giọng đọc.\n5. Caption đăng bài.\n6. Hashtag.\n7. CTA bán hàng.\n8. Checklist kiểm tra trước khi xuất video.` : `1. PROMPT TẠO ẢNH QUẢNG CÁO CHI TIẾT.\n2. BỐ CỤC HÌNH ẢNH ĐỀ XUẤT.\n3. TEXT NGẮN NÊN ĐẶT TRÊN ẢNH.\n4. PROMPT TẠO BIẾN THỂ ẢNH.\n5. CAPTION ĐĂNG BÀI.\n6. HASHTAG.\n7. CTA BÁN HÀNG.\n8. CHECKLIST KIỂM TRA TRƯỚC KHI XUẤT ẢNH & ĐĂNG BÀI.`;
  return `Bạn là chuyên gia tạo ${outputType} bằng AI cho Thiên Kim Universe.\n\nHãy tạo nội dung bán hàng ngắn, hấp dẫn, dễ hiểu và có khả năng chuyển đổi cao.\n\nTHÔNG TIN ĐẦU VÀO:\n- Tên/link sản phẩm: ${productInput}\n- Tên sản phẩm hiểu theo nội dung: ${productName}\n- Nơi bán/kênh giới thiệu gợi ý: ${storeName}\n- Mô tả ngắn 3-5 điểm nhấn: ${shortDesc}\n- Giá bán gợi ý/giá trên web: ${price}\n- Top 3 khuyến mãi tốt nhất: ${promotion}\n- Đối tượng khách hàng: ${customer}\n- Mục cần tạo: ${currentAssetMode === "video" ? "Tạo clip" : "Tạo hình ảnh"}\n- Kiểu nội dung: ${style}\n- Thời lượng/định dạng: ${format}\n- Nhân vật: ${character}\n- Bối cảnh: ${scene}\n\nYÊU CẦU KHAI THÁC LINK/TÊN SẢN PHẨM:\n- Nếu có link sản phẩm, hãy ưu tiên đọc mô tả sản phẩm, thông số, hình ảnh, giá đang hiển thị, khuyến mãi/voucher/flash sale và nội dung từ web hãng hoặc trang bán hàng.\n- Nếu công cụ AI không đọc được link, hãy dùng phần thông tin người dùng đã nhập và ghi rõ phần nào là gợi ý.\n- Mô tả phải tập trung vào 3-5 điểm nhấn tính năng/lợi ích sản phẩm.\n- Giá bán ưu tiên theo trang sản phẩm nếu có; nếu không có thì dùng giá/gợi ý giá đã nhập.\n- Khuyến mãi ưu tiên lấy top 3 ưu đãi tốt nhất trên web; nếu không có thì đề xuất ưu đãi hợp lý.\n- Đối tượng khách hàng phải dựa trên sản phẩm và nhu cầu thực tế.\n\nGỢI Ý FILE NGƯỜI DÙNG CÓ SẴN:\n- Nhân vật mẫu: ${charFile ? "Có file mẫu tên " + charFile.name + ". Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng nhân vật trong file upload." : character === "Upload file nhân vật riêng" ? "Người dùng chọn dùng file nhân vật riêng. Hãy nhắc người dùng upload file nhân vật lên công cụ AI." : "Chưa có file mẫu. Hãy tự tạo/chọn nhân vật phù hợp với sản phẩm."}\n- Bối cảnh mẫu: ${sceneFile ? "Có file bối cảnh tên " + sceneFile.name + ". Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng bối cảnh trong file upload." : scene === "Upload file bối cảnh riêng" ? "Người dùng chọn dùng file bối cảnh riêng. Hãy nhắc người dùng upload file bối cảnh lên công cụ AI." : "Chưa có file bối cảnh. Hãy dựng bối cảnh dựa trên mô tả sản phẩm và nơi bán."}\n\nYÊU CẦU CHẤT LƯỢNG:\n1. Có hook mạnh trong 3 giây đầu nếu là video, hoặc điểm nhìn nổi bật nếu là hình ảnh.\n2. Nêu đúng vấn đề/nỗi đau của khách hàng.\n3. Giới thiệu sản phẩm như giải pháp tự nhiên, đáng tin.\n4. Nêu lợi ích rõ ràng, tránh nói quá đà.\n5. Nhắc giá/khuyến mãi nếu phù hợp.\n6. Có CTA rõ: nhắn tin, đặt hàng, bấm mua, hoặc xem link sản phẩm.\n7. Phù hợp TikTok, Facebook, YouTube, Zalo.\n8. Phong cách hình ảnh rõ nét, ánh sáng đẹp, bố cục chuyên nghiệp.\n9. Nếu thông tin còn thiếu, hãy tự đề xuất phương án hợp lý nhất.\n\nHÃY TRẢ VỀ ĐẦY ĐỦ:\n${outputRequest}`;
}
function generatePrompt(showStatus = true) { const prompt = buildPrompt(); $("promptOutput").value = prompt; uploadConfirmed = false; if (showStatus) $("copyStatus").innerText = "Đã tạo prompt. Bạn có thể sửa rồi bấm ❤️ Copy Prompt VIP."; }
async function generatePromptWithGemini() { saveApiKeys(); if (!getApiKey()) { $("apiStatus").className = "status error"; $("apiStatus").innerText = "Bạn chưa nhập API Key cho tài khoản đang chọn."; return; } if (!$("shortDesc").value.trim()) await analyzeProduct(true); setBusy(true); $("apiStatus").className = "status"; $("apiStatus").innerText = `Đang tạo prompt bằng Gemini tài khoản ${selectedAccount}...`; try { const data = await tkApi("generatePrompt", { apiKey: getApiKey(), basePrompt: buildPrompt(), assetMode: currentAssetMode }); if (data.ok && data.prompt) { $("promptOutput").value = data.prompt; setAccountStatus(selectedAccount, "green", "Còn credit / tạo prompt thành công"); $("apiStatus").className = "status success"; $("apiStatus").innerText = "Gemini đã tạo Prompt VIP. Bạn có thể sửa rồi copy."; } else { setAccountStatus(selectedAccount, "red", data.message || "Tài khoản đã hết credit, vui lòng đổi tài khoản"); $("apiStatus").className = "status error"; $("apiStatus").innerText = data.message || "Tài khoản đã hết credit, vui lòng đổi tài khoản"; generatePrompt(false); } } catch (e) { setAccountStatus(selectedAccount, "red", e.message || "Lỗi kết nối Gemini"); $("apiStatus").className = "status error"; $("apiStatus").innerText = "Không gọi được backend. Đã tạo prompt tại máy để dùng tạm."; generatePrompt(false); } setBusy(false); }
async function actuallyCopyPrompt() { try { await navigator.clipboard.writeText($("promptOutput").value); $("copyStatus").innerText = currentAssetMode === "video" ? "Đã copy Prompt VIP. Hãy dán vào công cụ AI tạo video bạn chọn." : "Đã copy Prompt VIP. Hãy dán vào công cụ AI tạo hình ảnh bạn chọn."; } catch (e) { $("promptOutput").select(); document.execCommand("copy"); $("copyStatus").innerText = "Đã copy bằng chế độ dự phòng."; } }
async function copyVipPrompt() { if (!$("promptOutput").value.trim()) generatePrompt(); if (needsUploadConfirmation() && !uploadConfirmed) { pendingCopyAfterConfirm = true; showUploadModal(); return; } await actuallyCopyPrompt(); }
function showUploadModal() { const list = []; const charFile = $("characterFile").files[0]; const sceneFile = $("sceneFile").files[0]; if ($("character").value === "Upload file nhân vật riêng" || charFile) list.push(charFile ? `Nhân vật: ${charFile.name}` : "Nhân vật: cần upload file hình/video nhân vật"); if ($("scene").value === "Upload file bối cảnh riêng" || sceneFile) list.push(sceneFile ? `Bối cảnh: ${sceneFile.name}` : "Bối cảnh: cần upload file hình/video bối cảnh"); $("uploadModalText").innerText = `Bạn đã chọn dùng file riêng. Sau khi copy prompt, bạn cần upload đúng file hình/video này lên tool AI để lấy đúng hình như prompt đã tạo. ${list.join(" • ")}`; $("uploadModal").classList.add("show"); $("uploadModal").setAttribute("aria-hidden", "false"); }
function closeUploadModal(confirmed) { $("uploadModal").classList.remove("show"); $("uploadModal").setAttribute("aria-hidden", "true"); if (confirmed) { uploadConfirmed = true; if (pendingCopyAfterConfirm) { pendingCopyAfterConfirm = false; actuallyCopyPrompt(); } } else { pendingCopyAfterConfirm = false; $("copyStatus").innerText = "Bạn có thể kiểm tra lại file upload rồi bấm copy lần nữa."; } }
async function submitFeedback() { const name = $("feedbackName").value.trim(); const email = $("feedbackEmail").value.trim() || localStorage.getItem(storageKey("feedbackId")) || `guest-${Date.now()}`; const message = $("feedbackMessage").value.trim(); if (!message) { $("feedbackStatus").innerText = "Bạn chưa nhập góp ý."; return; } localStorage.setItem(storageKey("feedbackId"), email); $("feedbackStatus").innerText = "Đang gửi góp ý..."; try { const data = await tkApi("submitFeedback", { name, email, message, appVersion: APP_VERSION }); $("feedbackStatus").className = data.ok ? "status success" : "status error"; $("feedbackStatus").innerText = data.ok ? "Đã ghi nhận đóng góp vào Google Sheet." : (data.message || "Không gửi được góp ý."); if (data.ok) $("feedbackMessage").value = ""; } catch (e) { $("feedbackStatus").className = "status error"; $("feedbackStatus").innerText = "Không kết nối được Apps Script để ghi góp ý."; } }
async function loadFeedbackReply() { const email = $("feedbackEmail").value.trim() || localStorage.getItem(storageKey("feedbackId")); if (!email) { $("feedbackStatus").innerText = "Nhập email hoặc mã nhận phản hồi trước."; return; } try { const data = await tkApi("getFeedbackReply", { email }); const box = $("feedbackReply"); box.style.display = "block"; box.innerText = data.reply ? `Phản hồi từ Thiên Kim:\n${data.reply}` : "Chưa có phản hồi mới."; } catch (e) { $("feedbackStatus").className = "status error"; $("feedbackStatus").innerText = "Không đọc được phản hồi."; } }
window.addEventListener("DOMContentLoaded", () => { setAssetMode("video"); renderApiAccounts(); updateConnections(); updateHelperNotes(); autoRecheckDueAccounts(); });

/***********************
 * AI.TKver8.6 Overrides
 ***********************/
let apiModalAccount = 1;

// Provider Management Functions
function getProviderKey() { return localStorage.getItem(storageKey("providerKey")) || ""; }
function setProviderKey(key) { localStorage.setItem(storageKey("providerKey"), key); }
function getCurrentProvider() { return AI_PROVIDERS[selectedProvider] || AI_PROVIDERS.gemini; }
function getProviderApiKey(provider) {
  provider = provider || selectedProvider;
  if (provider === "grok") return localStorage.getItem(storageKey("grokApiKey")) || "";
  return localStorage.getItem(storageKey(`geminiKey${selectedAccount}`)) || "";
}

function selectProvider(provider) {
  selectedProvider = provider;
  setProviderKey(provider);
  localStorage.setItem(storageKey("selectedProvider"), provider);
  renderProviderSelector();
  renderApiPills();
  updateModeUI();
  updateToolLinks();
  $("apiStatus").className = "status";
  $("apiStatus").innerText = `Đang dùng ${getCurrentProvider().name}.`;
}

function renderProviderSelector() {
  const wrap = $("providerSelector");
  if (!wrap) return;
  wrap.innerHTML = "";
  Object.entries(AI_PROVIDERS).forEach(([key, p]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `provider-btn ${selectedProvider === key ? "active" : ""}`;
    btn.style.setProperty("--provider-color", p.color);
    btn.innerHTML = `<span class="provider-icon">${p.icon}</span><span>${p.name}</span>`;
    btn.onclick = () => selectProvider(key);
    wrap.appendChild(btn);
  });
}

function updateToolLinks() {
  const wrap = $("toolLinks");
  wrap.innerHTML = "";
  const urls = currentAssetMode === "video" ? TOOL_URLS.video : TOOL_URLS.image;
  urls.forEach(([label, url]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.onclick = () => window.open(url, "_blank", "noopener,noreferrer");
    wrap.appendChild(btn);
  });
}

// Mode-specific UI Management
function updateModeUI() {
  const isVideo = currentAssetMode === "video";

  // Toggle visibility of specialized sections
  if ($("videoSpecificSection")) $("videoSpecificSection").style.display = isVideo ? "block" : "none";
  if ($("imageSpecificSection")) $("imageSpecificSection").style.display = isVideo ? "none" : "block";

  // Update card styling
  $("modeVideoCard").classList.toggle("active", isVideo);
  $("modeImageCard").classList.toggle("active", !isVideo);

  // Update header title
  if ($("modeTitle")) {
    $("modeTitle").innerHTML = isVideo
      ? "🎬 Chế độ Video - Tạo Clip bán hàng"
      : "🖼️ Chế độ Hình ảnh - Tạo Ảnh quảng cáo";
  }

  // Fill selects with mode-specific options
  fillSelectOptions("contentStyle", getContentStyles(currentAssetMode));
  fillSelectOptions("formatOption", getFormats(currentAssetMode));

  // Update helper notes
  updateHelperNotes();
  updateToolLinks();

  // Save preference
  localStorage.setItem(storageKey("lastMode"), currentAssetMode);
}

function setAssetMode(mode) {
  currentAssetMode = mode;
  uploadConfirmed = false;
  updateModeUI();
}

// Extended API Functions with Provider Support
function getApiKey(i = selectedAccount) {
  return localStorage.getItem(storageKey(`geminiKey${i}`)) || "";
}

function setAccountStatus(i, status, note = "") {
  localStorage.setItem(storageKey(`accountStatus${i}`), status);
  localStorage.setItem(storageKey(`accountNote${i}`), note);
  if (status === "red") localStorage.setItem(storageKey(`nextCheck${i}`), String(Date.now() + 5 * 60 * 60 * 1000));
  updateApiPills();
}
function getAccountStatus(i) { return localStorage.getItem(storageKey(`accountStatus${i}`)) || "gray"; }
function updateApiPills() {
  for (let i = 1; i <= 3; i++) {
    const el = $(`apiPill${i}`);
    if (!el) continue;
    const status = getAccountStatus(i);
    el.classList.remove("green", "red", "gray", "selected");
    el.classList.add(status === "green" ? "green" : status === "red" ? "red" : "gray");
    if (selectedAccount === i) el.classList.add("selected");
    const label = status === "green" ? "ổn định" : status === "red" ? "lỗi / hết credit" : "chưa kiểm tra";
    el.title = `API tài khoản ${i}: ${label}`;
  }
}
function openApiModal(i) {
  apiModalAccount = i;
  selectedAccount = i;
  localStorage.setItem(storageKey("selectedAccount"), String(i));
  updateApiPills();
  $("apiModalTitle").innerText = `API tài khoản ${i}`;
  $("apiModalInput").value = getApiKey(i);
  const note = localStorage.getItem(storageKey(`accountNote${i}`)) || "Dán API Key rồi bấm Hoàn tất hoặc Kiểm tra API.";
  $("apiModalStatus").className = "status";
  $("apiModalStatus").innerText = note;
  $("apiModal").classList.add("show");
  $("apiModal").setAttribute("aria-hidden", "false");
}
function closeApiModal() {
  $("apiModal").classList.remove("show");
  $("apiModal").setAttribute("aria-hidden", "true");
}
function saveApiFromModal() {
  const key = $("apiModalInput").value.trim();
  localStorage.setItem(storageKey(`geminiKey${apiModalAccount}`), key);
  localStorage.setItem(storageKey("selectedAccount"), String(apiModalAccount));
  selectedAccount = apiModalAccount;
  if (key && getAccountStatus(apiModalAccount) === "gray") setAccountStatus(apiModalAccount, "gray", "Đã lưu key. Bấm kiểm tra API để xác nhận.");
  $("apiModalStatus").className = "status success";
  $("apiModalStatus").innerText = "Đã lưu API Key trên trình duyệt này.";
  $("apiStatus").className = "status success";
  $("apiStatus").innerText = `Đã lưu API tài khoản ${apiModalAccount}.`;
  updateApiPills();
}
async function checkApiFromModal() {
  saveApiFromModal();
  $("apiModalStatus").className = "status";
  $("apiModalStatus").innerText = "Đang kiểm tra API...";
  const ok = await checkAccount(apiModalAccount);
  $("apiModalStatus").className = ok ? "status success" : "status error";
  $("apiModalStatus").innerText = localStorage.getItem(storageKey(`accountNote${apiModalAccount}`)) || (ok ? "API hoạt động." : "API lỗi hoặc hết credit.");
}
function openApiHelp() {
  $("apiHelpModal").classList.add("show");
  $("apiHelpModal").setAttribute("aria-hidden", "false");
}
function closeApiHelp() {
  $("apiHelpModal").classList.remove("show");
  $("apiHelpModal").setAttribute("aria-hidden", "true");
}
function saveApiKeys() { updateApiPills(); return true; }
function selectAccount(i) { selectedAccount = i; localStorage.setItem(storageKey("selectedAccount"), String(i)); updateApiPills(); }
async function checkSelectedAccount() {
  const i = selectedAccount || 1;
  $("apiStatus").className = "status";
  $("apiStatus").innerText = `Đang kiểm tra API tài khoản ${i}...`;
  const ok = await checkAccount(i);
  $("apiStatus").className = ok ? "status success" : "status error";
  $("apiStatus").innerText = localStorage.getItem(storageKey(`accountNote${i}`)) || (ok ? "API hoạt động." : "API lỗi hoặc hết credit.");
}
async function checkAllAccounts() {
  $("apiStatus").className = "status";
  $("apiStatus").innerText = "Đang kiểm tra 3 tài khoản...";
  let ok = false;
  for (let i = 1; i <= 3; i++) if (await checkAccount(i)) ok = true;
  $("apiStatus").className = ok ? "status success" : "status error";
  $("apiStatus").innerText = ok ? "Đã kiểm tra xong. Tài khoản xanh có thể dùng." : "Cả 3 tài khoản đều hết credit hoặc chưa dùng được. Hệ thống sẽ nhắc kiểm tra lại sau 5 tiếng.";
}

function saveContactInfo() {
  localStorage.setItem(storageKey("storeAddress"), $("storeAddress").value.trim());
  localStorage.setItem(storageKey("contactPhone"), $("contactPhone").value.trim());
  $("copyStatus").innerText = "Đã cập nhật địa chỉ và số điện thoại trên trình duyệt này.";
}
function loadContactInfo() {
  if ($("storeAddress")) $("storeAddress").value = localStorage.getItem(storageKey("storeAddress")) || "";
  if ($("contactPhone")) $("contactPhone").value = localStorage.getItem(storageKey("contactPhone")) || "";
}

function getWebPriceValue(productInput, storeName) {
  return $("webPrice").value.trim() || guessPrice(productInput, storeName);
}
function getDisplayPriceValue(productInput, storeName) {
  return $("desiredPrice").value.trim() || getWebPriceValue(productInput, storeName);
}

async function analyzeProduct(useBackend = true) {
  const input = $("productInput").value.trim();
  const productName = cleanProductName(input);
  const storeName = detectStoreName(input);
  setBusy(true);
  $("copyStatus").innerText = "Đang phân tích sản phẩm, giá web và khuyến mãi...";
  if (useBackend) {
    try {
      const data = await tkApi("analyzeProduct", { productInput: input, assetMode: currentAssetMode, apiKey: getApiKey() });
      if (data && data.ok) {
        $("shortDesc").value = normalizeBullets(data.shortDesc) || guessProductHighlights(productName).join("\n");
        $("webPrice").value = data.price || guessPrice(input, storeName);
        $("promotion").value = normalizePromos(data.promotions) || guessPromotions(input, storeName);
        $("customer").value = data.customer || guessCustomer(input);
        if (data.storeName && !$("storeAddress").value.trim()) $("storeAddress").value = data.storeName;
        $("copyStatus").innerText = "Đã phân tích xong. Bạn có thể sửa giá mong muốn, khuyến mãi hoặc thông tin liên hệ trước khi tạo prompt.";
        if (data.accountStatus === "red") setAccountStatus(selectedAccount, "red", data.message || "Tài khoản đã hết credit, vui lòng đổi tài khoản");
        else if (getApiKey()) setAccountStatus(selectedAccount, "green", "Còn credit / API hoạt động");
        generatePrompt(false);
        setBusy(false);
        return;
      }
    } catch (e) {
      $("copyStatus").innerText = "Backend chưa phản hồi, dùng chế độ gợi ý nhanh tại máy.";
    }
  }
  $("shortDesc").value = guessProductHighlights(productName).join("\n") + `\n\nNơi bán/kênh giới thiệu gợi ý: ${storeName}.`;
  if (!$("webPrice").value.trim()) $("webPrice").value = guessPrice(input, storeName);
  if (!$("promotion").value.trim()) $("promotion").value = guessPromotions(input, storeName);
  if (!$("customer").value.trim()) $("customer").value = guessCustomer(input);
  if (!$("storeAddress").value.trim()) $("storeAddress").value = storeName;
  generatePrompt(false);
  setBusy(false);
}

function buildVideoPrompt(data) {
  return `Đóng vai một Đạo diễn Video Thương mại (Commercial Video Director) và Chuyên gia Prompt AI Video (AI Video Prompt Engineer). Tôi muốn sản xuất một video ngắn (${data.format}) để quảng cáo sản phẩm ${data.productName}, bán tại ${data.storeContext} với phong cách ${data.style}.

THÔNG TIN SẢN PHẨM:
- Link/tên sản phẩm: ${data.productInput}
- Mô tả ngắn 3-5 điểm nhấn: ${data.shortDesc}
- Giá web đang hiển thị: ${data.webPrice}
- Giá hiển thị mong muốn: ${data.displayPrice}
- Top 3 khuyến mãi/ưu đãi: ${data.promotion}
- Đối tượng khách hàng: ${data.customer}
- Địa chỉ siêu thị/nơi bán: ${data.storeAddress}
- Số điện thoại liên hệ: ${data.contactPhone}
- Nhân vật: ${data.characterInstruction}
- Bối cảnh: ${data.sceneInstruction}

YÊU CẦU KHAI THÁC LINK/TÊN SẢN PHẨM:
- Nếu có link sản phẩm, hãy ưu tiên đọc mô tả sản phẩm, thông số, hình ảnh, giá đang hiển thị, khuyến mãi/voucher/flash sale và nội dung từ web hãng hoặc trang bán hàng.
- Nếu công cụ AI không đọc được link, hãy dùng phần thông tin người dùng đã nhập và ghi rõ phần nào là gợi ý.
- Mô tả phải tập trung vào 3-5 điểm nhấn tính năng/lợi ích sản phẩm.
- Giá bán ưu tiên theo trang sản phẩm nếu có; nếu không có thì dùng giá/gợi ý giá đã nhập.
- Khuyến mãi ưu tiên lấy top 3 ưu đãi tốt nhất trên web; nếu không có thì đề xuất ưu đãi hợp lý.
- Đối tượng khách hàng phải dựa trên sản phẩm và nhu cầu thực tế.

GỢI Ý FILE NGƯỜI DÙNG CÓ SẴN:
- Nhân vật mẫu: ${data.characterFileText}
- Bối cảnh mẫu: ${data.sceneFileText}

Hãy xây dựng cho tôi một kế hoạch kịch bản video bao gồm 4 phần sau:

1. KỊCH BẢN PHÂN CẢNH (SHOT-BY-SHOT PROMPT)
Cung cấp 3-4 prompt tiếng Anh chi tiết để đưa vào công cụ tạo video AI. Mỗi phân cảnh khoảng 4-5 giây, tuân thủ công thức:
[Góc máy] + [Chủ thể] + [Hành động chi tiết] + [Bối cảnh] + [Chuyển động Camera cụ thể] + [Chất lượng 4K, Cinematic lighting].

2. KỊCH BẢN LỜI BÌNH (VOICEOVER)
Viết lời thoại hấp dẫn, đọc khớp với từng phân cảnh. Chỉ định rõ giọng đọc (Tone of voice: Nam/Nữ, hào hứng, trầm ấm hoặc chuyên gia).

3. CHỮ XUẤT HIỆN TRÊN VIDEO (ON-SCREEN TEXT)
Gợi ý các dòng chữ xuất hiện ở giây nào để nhấn mạnh tính năng/ưu đãi, giúp người xem không bật tiếng vẫn hiểu thông điệp.

4. GỢI Ý ÂM THANH (SOUND & MUSIC)
Đề xuất nhạc nền và hiệu ứng âm thanh như swoosh, ting, cinematic hit để tăng độ sinh động.

5. CAPTION ĐĂNG BÀI + HASHTAG + CTA
Viết caption Facebook/Zalo/TikTok theo cấu trúc Hook -> Vấn đề -> Sản phẩm -> Lợi ích -> Ưu đãi -> Kêu gọi hành động. Thêm hashtag và mẫu câu trả lời comment/inbox.

6. CHECKLIST KIỂM TRA TRƯỚC KHI XUẤT VIDEO
Kiểm tra khuôn mặt, tay, sản phẩm, giá, khuyến mãi, text, màu thương hiệu, âm thanh và CTA.`;
}

function buildImagePrompt(data) {
  return `Đóng vai một Chuyên gia Digital Marketing và Midjourney Prompt Engineer. Tôi muốn làm một chiến dịch quảng cáo mạng xã hội cho sản phẩm ${data.productName}, bán tại ${data.storeContext}. Tôi có đính kèm ${data.uploadCount} hình ảnh mẫu.

THÔNG TIN SẢN PHẨM:
- Link/tên sản phẩm: ${data.productInput}
- Mô tả ngắn 3-5 điểm nhấn: ${data.shortDesc}
- Giá web đang hiển thị: ${data.webPrice}
- Giá hiển thị mong muốn: ${data.displayPrice}
- Top 3 khuyến mãi/ưu đãi: ${data.promotion}
- Đối tượng khách hàng: ${data.customer}
- Địa chỉ siêu thị/nơi bán: ${data.storeAddress}
- Số điện thoại liên hệ: ${data.contactPhone}
- Nhân vật: ${data.characterInstruction}
- Bối cảnh: ${data.sceneInstruction}
- Định dạng ảnh: ${data.format}
- Kiểu nội dung: ${data.style}

YÊU CẦU KHAI THÁC LINK/TÊN SẢN PHẨM:
- Nếu có link sản phẩm, hãy ưu tiên đọc mô tả sản phẩm, thông số, hình ảnh, giá đang hiển thị, khuyến mãi/voucher/flash sale và nội dung từ web hãng hoặc trang bán hàng.
- Nếu công cụ AI không đọc được link, hãy dùng phần thông tin người dùng đã nhập và ghi rõ phần nào là gợi ý.
- Mô tả phải tập trung vào 3-5 điểm nhấn tính năng/lợi ích sản phẩm.
- Giá bán ưu tiên theo trang sản phẩm nếu có; nếu không có thì dùng giá/gợi ý giá đã nhập.
- Khuyến mãi ưu tiên lấy top 3 ưu đãi tốt nhất trên web; nếu không có thì đề xuất ưu đãi hợp lý.
- Đối tượng khách hàng phải dựa trên sản phẩm và nhu cầu thực tế.

GỢI Ý FILE NGƯỜI DÙNG CÓ SẴN:
- Nhân vật mẫu: ${data.characterFileText}
- Bối cảnh mẫu: ${data.sceneFileText}

Hãy cung cấp cho tôi một kế hoạch nội dung bao gồm 5 phần chi tiết sau:

1. PROMPT TẠO ẢNH QUẢNG CÁO CHI TIẾT
Viết 1 prompt tiếng Anh chi tiết để tạo ảnh quảng cáo thương mại, có không gian chèn text, tỷ lệ ${data.format}, phong cách high-end commercial photography, sharp focus, vibrant colors, studio lighting, hyper-realistic, 8K resolution, --v 6.0.

2. BỐ CỤC HÌNH ẢNH ĐỀ XUẤT
Gợi ý bố cục chia 1/3 phía trên, 1/3 ở giữa, 1/3 phía dưới để chèn headline, sản phẩm, nhân vật, khuyến mãi và CTA.

3. TEXT NGẮN NÊN ĐẶT TRÊN ẢNH
Đề xuất Headline, Sub-headline, Badge ưu đãi, CTA ngắn. Chữ phải dễ đọc, có tính chuyển đổi cao.

4. PROMPT TẠO BIẾN THỂ ẢNH LIFESTYLE
Viết 1 prompt tiếng Anh tạo ảnh biến thể theo phong cách đời sống, tạo cảm giác khao khát và gần gũi.

5. CAPTION ĐĂNG FACEBOOK/ZALO CHUẨN SEO, TỐI ƯU CHUYỂN ĐỔI
Viết theo cấu trúc Hook -> Nêu vấn đề -> Tính năng/Lợi ích -> Ưu đãi -> Kêu gọi hành động. Thêm hashtag, CTA comment/inbox, checklist kiểm tra ảnh trước khi đăng.`;
}

function buildPrompt() {
  const productInput = $("productInput").value.trim() || "AI tự đề xuất sản phẩm phù hợp";
  const productName = cleanProductName(productInput);
  const storeName = detectStoreName(productInput);
  const shortDesc = $("shortDesc").value.trim() || "Hãy tạo mô tả ngắn 3-5 điểm nổi bật nhất của sản phẩm.";
  const webPrice = getWebPriceValue(productInput, storeName);
  const desired = $("desiredPrice").value.trim();
  const displayPrice = desired || webPrice;
  const promotion = $("promotion").value.trim() || guessPromotions(productInput, storeName);
  const customer = $("customer").value.trim() || guessCustomer(productInput);
  const style = $("contentStyle").value;
  const format = $("formatOption").value;
  const character = $("character").value;
  const scene = $("scene").value;
  const charFile = $("characterFile").files[0];
  const sceneFile = $("sceneFile").files[0];
  const storeAddress = $("storeAddress").value.trim() || storeName;
  const contactPhone = $("contactPhone").value.trim() || "Chưa nhập số điện thoại liên hệ";
  const uploadCount = [charFile, sceneFile].filter(Boolean).length || (character.includes("Upload") || scene.includes("Upload") ? "các" : "0");
  const characterFileText = charFile ? `Có file mẫu tên ${charFile.name}. Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng nhân vật trong file upload.` : "Có file mẫu tên hinh_mau.png_202606121054.jpeg nếu người dùng có sẵn. Khi người dùng upload file này vào công cụ AI, hãy ưu tiên dùng nhân vật trong file upload.";
  const sceneFileText = sceneFile ? `Có file bối cảnh tên ${sceneFile.name}. Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng bối cảnh trong file upload.` : "Có file bối cảnh tên 1-vong-dao-quanh-trung-tam-gia-dung-dien-may-xanh-5.jpg nếu người dùng có sẵn. Khi người dùng upload file này vào công cụ AI, hãy ưu tiên dùng bối cảnh trong file upload.";
  const data = {
    productInput, productName,
    storeContext: storeAddress || storeName,
    shortDesc, webPrice, displayPrice, promotion, customer,
    storeAddress, contactPhone, style, format,
    characterInstruction: charFile ? `Dùng nhân vật từ file upload: ${charFile.name}` : character,
    sceneInstruction: sceneFile ? `Dùng bối cảnh từ file upload: ${sceneFile.name}` : scene,
    characterFileText, sceneFileText, uploadCount
  };
  return currentAssetMode === "video" ? buildVideoPrompt(data) : buildImagePrompt(data);
}

// Main function to generate prompt with current provider
async function generatePromptWithAI() {
  const provider = getCurrentProvider();

  if (provider === "grok") {
    await generatePromptWithGrok();
  } else {
    await generatePromptWithGemini();
  }
}

// Gemini-specific function
async function generatePromptWithGemini() {
  if (!getApiKey()) {
    $("apiStatus").className = "status error";
    $("apiStatus").innerText = "Bạn chưa nhập API Key cho tài khoản đang chọn.";
    openApiModal(selectedAccount || 1);
    return;
  }
  if (!$("shortDesc").value.trim()) await analyzeProduct(true);
  setBusy(true);
  $("apiStatus").className = "status";
  $("apiStatus").innerText = `Đang tạo prompt bằng Gemini tài khoản ${selectedAccount}...`;
  try {
    const data = await tkApi("generatePrompt", { apiKey: getApiKey(), basePrompt: buildPrompt(), assetMode: currentAssetMode, provider: "gemini" });
    if (data.ok && data.prompt) {
      $("promptOutput").value = data.prompt;
      setAccountStatus(selectedAccount, "green", "Còn credit / tạo prompt thành công");
      $("apiStatus").className = "status success";
      $("apiStatus").innerText = "Gemini đã tạo Prompt VIP. Bạn có thể sửa rồi copy.";
    } else {
      setAccountStatus(selectedAccount, "red", data.message || "Tài khoản đã hết credit, vui lòng đổi tài khoản");
      $("apiStatus").className = "status error";
      $("apiStatus").innerText = data.message || "Tài khoản đã hết credit, vui lòng đổi tài khoản";
      generatePrompt(false);
    }
  } catch (e) {
    setAccountStatus(selectedAccount, "red", e.message || "Lỗi kết nối Gemini");
    $("apiStatus").className = "status error";
    $("apiStatus").innerText = "Không gọi được backend. Đã tạo prompt tại máy để dùng tạm.";
    generatePrompt(false);
  }
  setBusy(false);
}

// Grok-specific function
async function generatePromptWithGrok() {
  const apiKey = getProviderApiKey("grok");
  if (!apiKey) {
    $("apiStatus").className = "status error";
    $("apiStatus").innerText = "Bạn chưa nhập Grok API Key. Vui lòng nhập key.";
    openGrokApiModal();
    return;
  }
  if (!$("shortDesc").value.trim()) await analyzeProduct(true);
  setBusy(true);
  $("apiStatus").className = "status";
  $("apiStatus").innerText = "Đang tạo prompt bằng Grok...";
  try {
    const data = await tkApi("generatePrompt", { apiKey: apiKey, basePrompt: buildPrompt(), assetMode: currentAssetMode, provider: "grok" });
    if (data.ok && data.prompt) {
      $("promptOutput").value = data.prompt;
      setGrokStatus("green", "Grok hoạt động tốt");
      $("apiStatus").className = "status success";
      $("apiStatus").innerText = "Grok đã tạo Prompt VIP. Bạn có thể sửa rồi copy.";
    } else {
      setGrokStatus("red", data.message || "Grok lỗi");
      $("apiStatus").className = "status error";
      $("apiStatus").innerText = data.message || "Grok lỗi. Vui lòng thử lại.";
      generatePrompt(false);
    }
  } catch (e) {
    setGrokStatus("red", e.message || "Lỗi kết nối");
    $("apiStatus").className = "status error";
    $("apiStatus").innerText = "Không gọi được Grok. Đã tạo prompt tại máy để dùng tạm.";
    generatePrompt(false);
  }
  setBusy(false);
}

// Grok API management
function setGrokStatus(status, note = "") {
  localStorage.setItem(storageKey("grokStatus"), status);
  localStorage.setItem(storageKey("grokNote"), note);
  if (status === "red") localStorage.setItem(storageKey("grokNextCheck"), String(Date.now() + 5 * 60 * 60 * 1000));
  updateGrokStatusIndicator();
}

function getGrokStatus() {
  return localStorage.getItem(storageKey("grokStatus")) || "gray";
}

function updateGrokStatusIndicator() {
  const el = $("grokStatusIndicator");
  if (!el) return;
  const status = getGrokStatus();
  el.className = `status-indicator ${status}`;
  el.title = `Grok: ${status === "green" ? "hoạt động" : status === "red" ? "lỗi" : "chưa kiểm tra"}`;
}

function openGrokApiModal() {
  $("grokApiModalTitle").innerText = "Grok API Key";
  $("grokApiModalInput").value = getProviderApiKey("grok");
  const note = localStorage.getItem(storageKey("grokNote")) || "Dán Grok API Key rồi bấm Hoàn tất.";
  $("grokApiModalStatus").className = "status";
  $("grokApiModalStatus").innerText = note;
  $("grokApiModal").classList.add("show");
  $("grokApiModal").setAttribute("aria-hidden", "false");
}

function closeGrokApiModal() {
  $("grokApiModal").classList.remove("show");
  $("grokApiModal").setAttribute("aria-hidden", "true");
}

function saveGrokApiFromModal() {
  const key = $("grokApiModalInput").value.trim();
  localStorage.setItem(storageKey("grokApiKey"), key);
  if (key) setGrokStatus("gray", "Đã lưu key. Bấm kiểm tra để xác nhận.");
  $("grokApiModalStatus").className = "status success";
  $("grokApiModalStatus").innerText = "Đã lưu Grok API Key.";
  $("apiStatus").className = "status success";
  $("apiStatus").innerText = "Đã lưu Grok API.";
  updateGrokStatusIndicator();
}

async function checkGrokApiFromModal() {
  saveGrokApiFromModal();
  $("grokApiModalStatus").className = "status";
  $("grokApiModalStatus").innerText = "Đang kiểm tra Grok API...";
  const ok = await checkGrokApi();
  $("grokApiModalStatus").className = ok ? "status success" : "status error";
  $("grokApiModalStatus").innerText = localStorage.getItem(storageKey("grokNote")) || (ok ? "Grok hoạt động." : "Grok lỗi hoặc hết quota.");
}

async function checkGrokApi() {
  const apiKey = getProviderApiKey("grok");
  if (!apiKey) {
    setGrokStatus("gray", "Chưa nhập API Key");
    return false;
  }
  try {
    const data = await tkApi("checkGrok", { apiKey: apiKey });
    if (data.ok) {
      setGrokStatus("green", "Còn credit / API hoạt động");
      return true;
    }
    setGrokStatus("red", data.message || "Grok lỗi");
    return false;
  } catch (e) {
    setGrokStatus("red", e.message || "Không kiểm tra được");
    return false;
  }
}

// Render API pills with provider support
function renderApiPills() {
  // For Gemini, show account pills
  if (selectedProvider === "gemini") {
    if ($("geminiAccountsSection")) $("geminiAccountsSection").style.display = "flex";
    if ($("grokApiSection")) $("grokApiSection").style.display = "none";
  } else {
    if ($("geminiAccountsSection")) $("geminiAccountsSection").style.display = "none";
    if ($("grokApiSection")) $("grokApiSection").style.display = "block";
  }
  updateApiPills();
  updateGrokStatusIndicator();
}

window.addEventListener("DOMContentLoaded", () => {
  // Load saved preferences
  const savedProvider = localStorage.getItem(storageKey("selectedProvider")) || "gemini";
  const savedMode = localStorage.getItem(storageKey("lastMode")) || "video";
  selectedProvider = savedProvider;

  // Initialize UI
  loadContactInfo();
  renderProviderSelector();
  renderApiPills();
  updateModeUI();
  updateHelperNotes();
  autoRecheckDueAccounts();

  const note = "API Key lưu trên trình duyệt. Bấm từng tài khoản để nhập/kiểm tra.";
  if ($("apiStatus")) $("apiStatus").innerText = note;
});


function syncEditableVipPrompt() {
  const editable = document.getElementById("promptVipEditable");
  if (!editable) return;
  const sourceIds = ["finalPrompt", "promptOutput", "resultPrompt", "generatedPrompt", "promptText"];
  for (const id of sourceIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    const value = ("value" in el ? el.value : el.innerText || el.textContent || "").trim();
    if (value) {
      editable.value = value;
      return;
    }
  }
}

function copyEditableVipPrompt() {
  const editable = document.getElementById("promptVipEditable");
  if (!editable || !editable.value.trim()) {
    if (typeof syncEditableVipPrompt === "function") syncEditableVipPrompt();
  }
  const text = editable && editable.value ? editable.value.trim() : "";
  if (!text) {
    alert("Chưa có Prompt VIP để copy.");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    const status = document.getElementById("copyStatus");
    if (status) status.innerText = "Đã copy Prompt VIP đã chỉnh sửa.";
    else alert("Đã copy Prompt VIP.");
  }).catch(() => alert("Không copy được. Hãy chọn thủ công và copy."));
}

document.addEventListener("input", (event) => {
  if (event.target && event.target.id === "promptVipEditable") {
    event.target.dataset.edited = "1";
  }
});

const TK_SYNC_PROMPT_TIMER = setInterval(() => {
  const editable = document.getElementById("promptVipEditable");
  if (editable && editable.dataset.edited !== "1") syncEditableVipPrompt();
}, 1200);
