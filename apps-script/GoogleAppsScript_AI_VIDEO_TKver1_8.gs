/******************************************************
 * TK-AI-VIDEO Backend - Google Apps Script
 * Version: AI.TKver8.6
 * Dùng cho: https://thienkim.id.vn/apps/ai-video/
 *
 * Cách dùng nhanh:
 * 1) Mở Google Apps Script đang triển khai web app của bạn.
 * 2) Dán toàn bộ file này vào Code.gs.
 * 3) Sửa SHEET_ID nếu muốn dùng Google Sheet cố định.
 * 4) Deploy > New deployment > Web app > Anyone.
 ******************************************************/

const TK_CONFIG = {
  SHEET_ID: '', // Nếu để trống, script sẽ tạo sheet mới tên TK_AI_VIDEO_DATA trong Drive của tài khoản chạy script.
  SHEET_NAME_FEEDBACK: 'feedback',
  SHEET_NAME_API_STATUS: 'api_status',
  GEMINI_MODEL: 'gemini-1.5-flash',
  GROK_MODEL: 'grok-2-1212'
};

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROK_URL = 'https://api.x.ai/v1/chat/completions';

function doGet(e) {
  return jsonOutput({ ok: true, app: 'TK-AI-VIDEO', version: 'AI.TKver8.6', message: 'Backend đang hoạt động.' });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const action = String(payload.action || '').trim();
    if (!action) return jsonOutput({ ok: false, message: 'Thiếu action.' });

    if (action === 'checkGemini') return jsonOutput(checkGemini(payload.apiKey));
    if (action === 'checkGrok') return jsonOutput(checkGrok(payload.apiKey));
    if (action === 'analyzeProduct') return jsonOutput(analyzeProduct(payload));
    if (action === 'generatePrompt') return jsonOutput(generatePrompt(payload));
    if (action === 'submitFeedback') return jsonOutput(submitFeedback(payload));
    if (action === 'getFeedbackReply') return jsonOutput(getFeedbackReply(payload));

    return jsonOutput({ ok: false, message: 'Action không hợp lệ.' });
  } catch (err) {
    return jsonOutput({ ok: false, message: String(err && err.message ? err.message : err) });
  }
}

function jsonOutput(obj) {
  const json = JSON.stringify(obj);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function parsePayload_(e) {
  const payload = {};

  if (e && e.parameter && typeof e.parameter === 'object') {
    Object.keys(e.parameter).forEach(key => {
      payload[key] = e.parameter[key];
    });
  }

  if (e && e.postData && e.postData.contents) {
    const raw = e.postData.contents;
    try {
      const body = JSON.parse(raw);
      if (body && typeof body === 'object') {
        Object.keys(body).forEach(key => {
          payload[key] = body[key];
        });
      }
    } catch (err) {
      try {
        const body = JSON.parse(raw.replace(/&/g, '&').replace(/"/g, '\"'));
        if (body && typeof body === 'object') {
          Object.keys(body).forEach(key => {
            payload[key] = body[key];
          });
        }
      } catch (err2) {
        // Cho phép form-urlencoded/text fallback nếu cần
      }
    }
  }

  return payload;
}

function checkGemini(apiKey) {
  if (!apiKey) return { ok: false, status: 'red', message: 'Chưa nhập API Key.' };
  try {
    const result = callGemini(apiKey, 'Trả lời duy nhất một chữ: OK');
    const text = (result.text || '').toUpperCase();
    if (text.indexOf('OK') >= 0) return { ok: true, status: 'green', message: 'Còn credit / API hoạt động.' };
    return { ok: true, status: 'green', message: 'API hoạt động.' };
  } catch (err) {
    return parseGeminiError(err);
  }
}

function analyzeProduct(payload) {
  const input = String(payload.productInput || '').trim();
  const apiKey = String(payload.apiKey || '').trim();
  const htmlData = fetchProductPage(input);
  const rawText = String(htmlData.text || '');
  const fallback = fallbackAnalyze(input, rawText);

  if (!apiKey) {
    return Object.assign({ ok: true, source: 'fallback-no-api-key', message: 'Chưa có Gemini API Key, trả về phân tích cơ bản.' }, fallback);
  }

  const prompt = buildAnalysisPrompt_(input, rawText);

  try {
    const gemini = callGemini(apiKey, prompt);
    const parsed = safeJsonParse(gemini.text);
    if (parsed) {
      return {
        ok: true,
        source: String(htmlData.source || 'gemini'),
        shortDesc: Array.isArray(parsed.shortDesc) ? parsed.shortDesc : fallback.shortDesc,
        price: String(parsed.price || fallback.price),
        promotions: Array.isArray(parsed.promotions) ? parsed.promotions : fallback.promotions,
        customer: String(parsed.customer || fallback.customer),
        storeName: String(parsed.storeName || fallback.storeName),
        accountStatus: 'green'
      };
    }
    return Object.assign({ ok: true, source: 'fallback-parse', message: 'Gemini trả về không đúng JSON, dùng phân tích dự phòng.' }, fallback);
  } catch (err) {
    const status = parseGeminiError(err);
    return Object.assign({ ok: true, source: 'fallback-gemini-error', accountStatus: 'red', message: status.message }, fallback);
  }
}

function generatePrompt(payload) {
  const apiKey = String(payload.apiKey || '').trim();
  const basePrompt = String(payload.basePrompt || '').trim();
  const assetMode = String(payload.assetMode || 'video').trim();
  const provider = String(payload.provider || 'gemini').toLowerCase().trim();

  if (!apiKey) return { ok: false, status: 'red', message: 'Chưa nhập API Key.' };

  const systemPrompt = buildGeneratorSystemPrompt_(assetMode, basePrompt);

  try {
    if (provider === 'grok') {
      const grok = callGrok(apiKey, systemPrompt);
      return { ok: true, prompt: String(grok.text || ''), accountStatus: 'green', provider: 'grok' };
    } else {
      const gemini = callGemini(apiKey, systemPrompt);
      return { ok: true, prompt: String(gemini.text || ''), accountStatus: 'green', provider: 'gemini' };
    }
  } catch (err) {
    if (provider === 'grok') {
      return parseGrokError(err);
    } else {
      return parseGeminiError(err);
    }
  }
}

function callGemini(apiKey, prompt) {
  const url = GEMINI_URL + '/' + encodeURIComponent(TK_CONFIG.GEMINI_MODEL) + ':generateContent?key=' + encodeURIComponent(apiKey);
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.55, topP: 0.9, maxOutputTokens: 8192 }
  };
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify(payload)
  });
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code < 200 || code >= 300) throw new Error('Gemini HTTP ' + code + ': ' + body);
  const data = JSON.parse(body);
  const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  const text = parts.map(p => String(p.text || '').trim()).filter(Boolean).join('\n').trim();
  return { text: text, raw: data };
}

function parseGeminiError(err) {
  const msg = String(err && err.message ? err.message : err);
  if (/quota|credit|429|RESOURCE_EXHAUSTED/i.test(msg)) return { ok: false, status: 'red', message: 'Tài khoản đã hết credit, vui lòng đổi tài khoản.' };
  if (/API_KEY_INVALID|invalid|403|PERMISSION/i.test(msg)) return { ok: false, status: 'red', message: 'API Key không hợp lệ hoặc không có quyền dùng Gemini.' };
  return { ok: false, status: 'red', message: msg.slice(0, 260) };
}

function callGrok(apiKey, prompt) {
  const payload = {
    model: TK_CONFIG.GROK_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.55,
    max_tokens: 8192
  };
  const res = UrlFetchApp.fetch(GROK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    muteHttpExceptions: true,
    payload: JSON.stringify(payload)
  });
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code < 200 || code >= 300) throw new Error('Grok HTTP ' + code + ': ' + body);
  const data = JSON.parse(body);
  const text = String(((data.choices || [])[0] || {}).message || {}).content || '';
  return { text: text.trim(), raw: data };
}

function parseGrokError(err) {
  const msg = String(err && err.message ? err.message : err);
  if (/quota|limit|429|RESOURCE_EXHAUSTED/i.test(msg)) return { ok: false, status: 'red', message: 'Grok hết quota, vui lòng thử lại sau.' };
  if (/invalid|unauthorized|401|403/i.test(msg)) return { ok: false, status: 'red', message: 'Grok API Key không hợp lệ.' };
  return { ok: false, status: 'red', message: msg.slice(0, 260) };
}

function fetchProductPage(input) {
  const trimmed = String(input || '').trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return { source: 'name-only', text: trimmed || '' };
  }

  try {
    const res = UrlFetchApp.fetch(trimmed, {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true,
      headers: { 'User-Agent': 'Mozilla/5.0 TK-AI-VIDEO/1.8' }
    });
    const html = String(res.getContentText() || '');
    return { source: trimmed, text: extractReadableText(html, trimmed) };
  } catch (err) {
    return { source: 'fetch-error', text: trimmed + '\nKhông crawl được trang: ' + err.message };
  }
}

function extractReadableText(html, url) {
  const text = String(html || '');
  const title = matchOne(text, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc = matchMeta(text, 'description') || matchMeta(text, 'og:description');
  const ogTitle = matchMeta(text, 'og:title');
  const metaPrice = matchMeta(text, 'product:price:amount') || matchMeta(text, 'og:price:amount') || matchMeta(text, 'product:price') || matchMeta(text, 'price');
  const jsonLdText = extractJsonLdText(text);
  const clean = text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const priceGuess = metaPrice || extractPriceFromText(jsonLdText + '\n' + clean);
  const promoGuess = extractPromoSnippets(clean);

  const parts = [
    'URL: ' + url,
    title ? 'TITLE: ' + decodeHtml(title) : '',
    ogTitle ? 'OG_TITLE: ' + decodeHtml(ogTitle) : '',
    desc ? 'DESCRIPTION: ' + decodeHtml(desc) : '',
    priceGuess ? 'PRICE_DETECTED: ' + decodeHtml(priceGuess) : '',
    promoGuess ? 'PROMOTION_SNIPPETS: ' + promoGuess : '',
    jsonLdText ? 'JSON_LD: ' + decodeHtml(jsonLdText).slice(0, 5000) : '',
    'PAGE_TEXT: ' + decodeHtml(clean).slice(0, 18000)
  ];

  return parts.filter(Boolean).join('\n');
}

function extractJsonLdText(html) {
  const parts = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html || '')) !== null) {
    parts.push(decodeHtml(m[1]).replace(/\s+/g, ' ').trim());
  }
  return parts.join('\n');
}

function matchOne(s, re) {
  const m = String(s || '').match(re);
  return m ? m[1].trim() : '';
}

function matchMeta(html, name) {
  const re1 = new RegExp('<meta[^>]+(?:name|property)=["\']' + escapeReg(name) + '["\'][^>]+content=["\']([^"\']+)["\'][^>]*>', 'i');
  const re2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:name|property)=["\']' + escapeReg(name) + '["\'][^>]*>', 'i');
  return matchOne(html, re1) || matchOne(html, re2);
}

function escapeReg(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractPriceFromText(text) {
  const s = decodeHtml(String(text || ''));
  const patterns = [
    /(?:giá|price|salePrice|priceAmount|PRICE_DETECTED)[^\d]{0,40}(\d{1,3}(?:[\.\,]\d{3}){1,4}\s*(?:₫|đ|vnd|vnđ)?)/i,
    /(\d{1,3}(?:[\.\,]\d{3}){1,4}\s*(?:₫|đ|vnd|vnđ))/i,
    /"price"\s*:\s*"?(\d{4,12})"?/i
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m && m[1]) return formatVndPrice(m[1]);
  }
  return '';
}

function formatVndPrice(v) {
  let s = String(v || '').trim();
  if (/₫|đ|vnd|vnđ/i.test(s)) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 4) return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  return s;
}

function extractPromoSnippets(text) {
  const s = decodeHtml(String(text || '')).replace(/\s+/g, ' ');
  const keywords = /(khuyến mãi|ưu đãi|voucher|flash sale|giảm|trả góp|freeship|miễn phí|tặng|bảo hành|lắp đặt)/ig;
  const snippets = [];
  let m;
  while ((m = keywords.exec(s)) !== null && snippets.length < 8) {
    const start = Math.max(0, m.index - 80);
    const end = Math.min(s.length, m.index + 180);
    const sn = s.slice(start, end).trim();
    if (!snippets.some(x => x.indexOf(sn.slice(0, 35)) >= 0)) snippets.push(sn);
  }
  return snippets.join(' | ');
}

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch (e) {}
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch (e) {}
  }
  return null;
}

function fallbackAnalyze(input, rawText) {
  const s = (String(input || '') + '\n' + String(rawText || '')).toLowerCase();
  let storeName = 'kênh bán hàng bạn muốn giới thiệu';
  if (s.indexOf('dienmayxanh') >= 0) storeName = 'Điện Máy Xanh';
  else if (s.indexOf('thegioididong') >= 0) storeName = 'Thế Giới Di Động';
  else if (s.indexOf('shopee') >= 0) storeName = 'Shopee';
  else if (s.indexOf('lazada') >= 0) storeName = 'Lazada';
  else if (s.indexOf('tiki') >= 0) storeName = 'Tiki';

  let shortDesc = [
    'Tập trung vào 3-5 điểm nổi bật nhất của sản phẩm.',
    'Nêu rõ lợi ích thật, tính năng quan trọng và lý do khách hàng nên quan tâm.',
    'Ưu tiên nội dung từ website gốc/trang bán hàng nếu có.',
    'Gợi ý nơi bán/kênh giới thiệu: ' + storeName + '.'
  ];
  if (/tivi|tv|crystal|uhd|samsung/.test(s)) {
    shortDesc = [
      'Hình ảnh 4K sắc nét, phù hợp giải trí gia đình.',
      'Màu sắc sống động, tạo cảm giác cao cấp khi xem phim/thể thao.',
      'Hệ điều hành thông minh, dễ xem YouTube, Netflix và các ứng dụng phổ biến.',
      'Thiết kế hiện đại, phù hợp phòng khách, phòng ngủ hoặc cửa hàng.',
      'Gợi ý nơi bán/kênh giới thiệu: ' + storeName + '.'
    ];
  }

  const price = extractPriceFromText(rawText) || 'Không tìm thấy giá. Vui lòng nhập tay giá đang hiển thị trên website.';
  const promoText = extractPromoSnippets(rawText);
  const promos = promoText ? promoText.split('|').slice(0, 3).map(x => x.trim()) : [
    'Tìm ưu đãi/voucher đang hiển thị trên website.',
    'Ưu tiên top 3: giảm giá, trả góp 0%, freeship/lắp đặt/quà tặng/bảo hành.',
    'Nếu không có ưu đãi rõ ràng, đề xuất ưu đãi hợp lý để tăng chuyển đổi.'
  ];

  return {
    shortDesc,
    price,
    promotions: promos,
    customer: /tivi|tv|samsung/.test(s) ? 'Gia đình, chủ nhà, người mua sắm thiết bị điện máy, người cần nâng cấp trải nghiệm giải trí tại nhà.' : 'Khách hàng có nhu cầu thực tế với sản phẩm, quan tâm chất lượng, giá trị sử dụng và ưu đãi mua hàng.',
    storeName
  };
}

function buildAnalysisPrompt_(input, rawText) {
  return 'Bạn là chuyên gia phân tích sản phẩm bán hàng online. Hãy đọc dữ liệu trang/tên sản phẩm bên dưới và trả về JSON THUẦN, không markdown.\n\n' +
    'Yêu cầu JSON:\n' +
    '{\n' +
    '  "shortDesc": ["3-5 điểm nhấn tính năng/lợi ích thật của sản phẩm"],\n' +
    '  "price": "giá bán thực tế đang hiển thị trên website nếu tìm thấy, nếu không thì ghi Không tìm thấy giá",\n' +
    '  "promotions": ["top 3 khuyến mãi/voucher/ưu đãi tốt nhất nếu có"],\n' +
    '  "customer": "đối tượng khách hàng phù hợp với sản phẩm",\n' +
    '  "storeName": "nơi bán/kênh bán nếu nhận diện được"\n' +
    '}\n\n' +
    'Đầu vào người dùng: ' + input + '\n\n' +
    'Dữ liệu lấy từ website/tên sản phẩm:\n' + rawText.slice(0, 16000);
}

function buildGeneratorSystemPrompt_(assetMode, basePrompt) {
  return 'Hãy chuyển yêu cầu bên dưới thành một bản PROMPT VIP chuyên nghiệp, rõ mục, dễ copy sang công cụ AI. Giữ đầy đủ các phần: ' + (assetMode === 'image' ? 'prompt ảnh, bố cục ảnh, text trên ảnh, biến thể ảnh, caption, hashtag, CTA, checklist' : 'kịch bản video, prompt video, thumbnail, giọng đọc, caption, hashtag, CTA, checklist') + '.\n\n' +
    'Yêu cầu:\n' +
    '- Viết tiếng Việt dễ hiểu.\n' +
    '- Prompt tạo ảnh/video có thể dùng trực tiếp.\n' +
    '- Nếu có link sản phẩm, nhắc AI đọc đúng giá/khuyến mãi trên web.\n' +
    '- Nếu có file upload nhân vật/bối cảnh, nhắc người dùng upload đúng file vào tool AI.\n' +
    '- Nội dung bán hàng tự nhiên, không nói quá đà.\n\n' +
    'Dữ liệu nền:\n' + basePrompt;
}

function getDb() {
  let ss;
  if (TK_CONFIG.SHEET_ID) {
    ss = SpreadsheetApp.openById(TK_CONFIG.SHEET_ID);
  } else {
    const files = DriveApp.getFilesByName('TK_AI_VIDEO_DATA');
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      ss = SpreadsheetApp.create('TK_AI_VIDEO_DATA');
    }
  }
  ensureSheet(ss, TK_CONFIG.SHEET_NAME_FEEDBACK, ['id', 'time', 'name', 'email', 'message', 'reply', 'status', 'appVersion']);
  ensureSheet(ss, TK_CONFIG.SHEET_NAME_API_STATUS, ['account', 'status', 'last_check', 'note']);
  return ss;
}

function ensureSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function submitFeedback(payload) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = getDb();
    const sh = ss.getSheetByName(TK_CONFIG.SHEET_NAME_FEEDBACK);
    const id = 'FB-' + Date.now();
    sh.appendRow([id, new Date(), String(payload.name || '').trim(), String(payload.email || '').trim(), String(payload.message || '').trim(), '', 'new', String(payload.appVersion || '').trim()]);
    return { ok: true, id, message: 'Đã ghi nhận đóng góp.' };
  } catch (err) {
    return { ok: false, message: 'Lỗi khi lưu góp ý: ' + err.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function getFeedbackReply(payload) {
  const email = String(payload.email || '').trim();
  if (!email) return { ok: false, message: 'Thiếu email hoặc mã nhận phản hồi.' };

  const ss = getDb();
  const sh = ss.getSheetByName(TK_CONFIG.SHEET_NAME_FEEDBACK);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return { ok: true, reply: '', status: '' };

  const lastCol = Math.min(sh.getLastColumn(), 8);
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();

  let latest = null;
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][3] || '').toLowerCase() === email.toLowerCase()) {
      latest = values[i];
      break;
    }
  }

  return { ok: true, reply: latest ? String(latest[5] || '') : '', status: latest ? String(latest[6] || '') : '' };
}
