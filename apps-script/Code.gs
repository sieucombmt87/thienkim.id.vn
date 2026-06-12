/**
 * Thiên Kim Universe - Google Apps Script API
 * Bản gộp từ Code.gs hiện tại + API cho App AI Video
 * Version: TKver2.5 backend / hỗ trợ AI.TKver1.7 frontend
 *
 * GIỮ NGUYÊN:
 * - action=ping
 * - action=login
 *
 * THÊM MỚI:
 * - action=gemini_check
 * - action=product_analyze
 * - action=save_feedback
 * - action=get_feedback_reply
 * - action=save_user_profile
 * - action=get_user_profile
 *
 * Sheet chính đang dùng:
 * https://docs.google.com/spreadsheets/d/11vvybEWeClcJFCZIchZ12MsClXDPJ-39iRNQtWGpRDs/edit?gid=1334014683
 */

const SPREADSHEET_ID = '11vvybEWeClcJFCZIchZ12MsClXDPJ-39iRNQtWGpRDs';
const SHEET_GID = 1334014683;

const TK_API_VERSION = 'TKver2.5';
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    const params = parseParams_(e);
    const action = String(params.action || '').toLowerCase();

    if (action === 'ping') {
      return json_({ ok: true, message: 'TK API OK', version: TK_API_VERSION, time: new Date().toISOString() });
    }

    if (action === 'login') {
      return login_(params);
    }

    if (action === 'gemini_check') {
      return geminiCheck_(params);
    }

    if (action === 'product_analyze') {
      return productAnalyze_(params);
    }

    if (action === 'save_feedback') {
      return saveFeedback_(params);
    }

    if (action === 'get_feedback_reply') {
      return getFeedbackReply_(params);
    }

    if (action === 'save_user_profile') {
      return saveUserProfile_(params);
    }

    if (action === 'get_user_profile') {
      return getUserProfile_(params);
    }

    return json_({ ok: false, error: 'Action không hợp lệ.', action });
  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message ? err.message : err),
      line: err && err.lineNumber ? err.lineNumber : null
    });
  }
}

function parseParams_(e) {
  let params = {};

  if (e && e.parameter) {
    params = Object.assign(params, e.parameter);
  }

  if (e && e.postData && e.postData.contents) {
    const raw = e.postData.contents;
    try {
      const body = JSON.parse(raw);
      params = Object.assign(params, body);
    } catch (err) {
      // fallback cho form/text nếu cần
      try {
        raw.split('&').forEach(pair => {
          const parts = pair.split('=');
          if (parts[0]) params[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join('=') || '');
        });
      } catch (e2) {}
    }
  }

  return params;
}

/*******************************
 * 1) LOGIN - GIỮ NGUYÊN LOGIC CŨ
 *******************************/

function login_(params) {
  const username = clean_(params.username);
  const password = clean_(params.password);

  if (!username || !password) {
    return json_({ ok: false, error: 'Thiếu username hoặc password.' });
  }

  const sheet = getTargetSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return json_({ ok: false, error: 'Sheet chưa có dữ liệu user.' });
  }

  const headers = values[0].map(h => clean_(h).toLowerCase());
  const idx = {
    username: headers.indexOf('username'),
    password: headers.indexOf('password'),
    role: headers.indexOf('role'),
    full_name: headers.indexOf('full_name'),
    status: headers.indexOf('status')
  };

  if (idx.username < 0 || idx.password < 0 || idx.role < 0) {
    return json_({ ok: false, error: 'Sheet thiếu cột bắt buộc: username, password, role.' });
  }

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowUsername = clean_(row[idx.username]);
    const rowPassword = clean_(row[idx.password]);

    if (rowUsername === username && rowPassword === password) {
      const status = idx.status >= 0 ? clean_(row[idx.status]).toLowerCase() : 'active';

      if (status && status !== 'active') {
        return json_({ ok: false, error: 'Tài khoản đang bị khóa hoặc chưa active.' });
      }

      const user = {
        username: rowUsername,
        full_name: idx.full_name >= 0 ? clean_(row[idx.full_name]) : rowUsername,
        role: clean_(row[idx.role]) || 'TVBH',
        status: 'active',
        source: 'google_sheet'
      };

      headers.forEach((h, colIndex) => {
        if (!user[h] && !['username','password','full_name','role','status'].includes(h)) {
          user[h] = clean_(row[colIndex]);
        }
      });

      return json_({ ok: true, user });
    }
  }

  return json_({ ok: false, error: 'Không tìm thấy user hoặc sai mật khẩu.' });
}

/*******************************
 * 2) GEMINI CHECK
 * API key gửi từ trình duyệt, Apps Script chỉ dùng để test, không lưu key.
 *******************************/

function geminiCheck_(params) {
  const apiKey = clean_(params.api_key || params.apiKey || params.key);
  const account = clean_(params.account || 'Tài khoản');

  if (!apiKey) {
    return json_({ ok: false, status: 'missing', color: 'red', message: 'Chưa nhập API Key.' });
  }

  const result = callGemini_(apiKey, 'Trả lời đúng 1 chữ: OK', { maxOutputTokens: 16 });

  const statusSheet = getOrCreateSheet_('gemini_status', ['time', 'account', 'status', 'message']);
  statusSheet.appendRow([new Date(), account, result.ok ? 'active' : 'error', result.message || result.error || '']);

  if (result.ok) {
    return json_({ ok: true, status: 'active', color: 'green', message: 'API đang hoạt động ổn định.' });
  }

  const msg = String(result.error || result.message || '').toLowerCase();
  const isQuota = msg.indexOf('quota') >= 0 || msg.indexOf('credit') >= 0 || msg.indexOf('resource_exhausted') >= 0 || msg.indexOf('429') >= 0;

  return json_({
    ok: false,
    status: isQuota ? 'no_credit' : 'error',
    color: 'red',
    message: isQuota ? 'Tài khoản đã hết credit, vui lòng đổi tài khoản.' : (result.error || 'API lỗi hoặc không hợp lệ.')
  });
}

/*******************************
 * 3) PRODUCT ANALYZE
 *******************************/

function productAnalyze_(params) {
  const apiKey = clean_(params.api_key || params.apiKey || params.key);
  const productName = clean_(params.product_name || params.productName || params.name);
  const productUrl = clean_(params.product_url || params.productUrl || params.url || params.link);
  const desiredPrice = clean_(params.desired_price || params.desiredPrice || params.user_price);
  const storeAddress = clean_(params.store_address || params.storeAddress || params.address);
  const phone = clean_(params.phone || params.contact_phone || params.contactPhone);
  const createType = clean_(params.create_type || params.createType || params.type || 'image'); // image | video
  const sellingPlace = clean_(params.selling_place || params.sellingPlace || params.channel || '');

  let scraped = {
    ok: false,
    title: productName,
    description: '',
    price: '',
    promotions: [],
    images: [],
    textSample: '',
    source: productUrl || 'manual_input',
    error: ''
  };

  if (productUrl && isUrl_(productUrl)) {
    scraped = scrapeProductPage_(productUrl);
  }

  const fallbackName = scraped.title || productName || 'Sản phẩm cần quảng cáo';
  const fallbackDescription = scraped.description || 'Chưa đọc được mô tả từ website. Hãy dùng thông tin người dùng nhập và ghi rõ phần nào là gợi ý.';
  const fallbackPrice = scraped.price || desiredPrice || '';
  const fallbackPromos = scraped.promotions && scraped.promotions.length ? scraped.promotions.slice(0, 3) : [];

  let analysis = buildFallbackAnalysis_({
    productName: fallbackName,
    description: fallbackDescription,
    price: fallbackPrice,
    desiredPrice,
    promotions: fallbackPromos,
    storeAddress,
    phone,
    createType,
    sellingPlace,
    sourceUrl: productUrl,
    images: scraped.images
  });

  if (apiKey) {
    const aiPrompt = buildProductAnalyzePrompt_({
      productName: fallbackName,
      productUrl,
      pageTitle: scraped.title,
      pageDescription: scraped.description,
      pageText: scraped.textSample,
      pagePrice: scraped.price,
      promotions: fallbackPromos,
      desiredPrice,
      storeAddress,
      phone,
      createType,
      sellingPlace,
      images: scraped.images
    });

    const ai = callGemini_(apiKey, aiPrompt, { maxOutputTokens: 4096 });
    if (ai.ok && ai.text) {
      analysis.ai_raw = ai.text;
      analysis.prompt_vip = ai.text;
      analysis.used_ai = true;
    } else {
      analysis.used_ai = false;
      analysis.ai_error = ai.error || ai.message || 'Gemini không trả dữ liệu.';
    }
  }

  const cache = getOrCreateSheet_('product_cache', ['time','url','product_name','price','desired_price','promotions','description','source']);
  cache.appendRow([
    new Date(),
    productUrl,
    analysis.product_name,
    analysis.web_price,
    analysis.desired_price,
    Array.isArray(analysis.promotions) ? analysis.promotions.join(' | ') : clean_(analysis.promotions),
    Array.isArray(analysis.short_description) ? analysis.short_description.join(' | ') : clean_(analysis.short_description),
    scraped.ok ? 'scraped' : 'fallback'
  ]);

  return json_({ ok: true, data: analysis, scraped });
}

function scrapeProductPage_(url) {
  const result = {
    ok: false,
    title: '',
    description: '',
    price: '',
    promotions: [],
    images: [],
    textSample: '',
    source: url,
    error: ''
  };

  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThienKimBot/1.0; +https://thienkim.id.vn)'
      }
    });

    const code = res.getResponseCode();
    const html = res.getContentText('UTF-8');

    if (code < 200 || code >= 400 || !html) {
      result.error = 'Không đọc được trang sản phẩm. HTTP ' + code;
      return result;
    }

    result.ok = true;
    result.title = firstMatch_(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                   firstMatch_(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || '';

    result.description = firstMatch_(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                         firstMatch_(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) || '';

    result.price = extractPrice_(html);
    result.promotions = extractPromotions_(html).slice(0, 3);
    result.images = extractImages_(html).slice(0, 5);

    const text = stripHtml_(html);
    result.textSample = text.substring(0, 9000);

    if (!result.description) {
      result.description = text.substring(0, 600);
    }

    return result;
  } catch (err) {
    result.error = String(err && err.message ? err.message : err);
    return result;
  }
}

function extractPrice_(html) {
  const candidates = [];

  const patterns = [
    /"price"\s*:\s*"?([0-9\.\,]+)"?/ig,
    /property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/ig,
    /itemprop=["']price["'][^>]+content=["']([^"']+)["']/ig,
    /class=["'][^"']*(?:price|gia|giaban|sale-price|product-price)[^"']*["'][^>]*>([\s\S]{0,180}?)<\//ig,
    /([0-9]{1,3}(?:\.[0-9]{3})+(?:\s?₫|\s?đ|\s?VND))/ig
  ];

  patterns.forEach(re => {
    let m;
    while ((m = re.exec(html)) !== null) {
      const val = normalizePrice_(stripHtml_(m[1] || ''));
      if (val && candidates.indexOf(val) < 0) candidates.push(val);
      if (candidates.length >= 8) break;
    }
  });

  return candidates[0] || '';
}

function extractPromotions_(html) {
  const text = stripHtml_(html);
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const keys = ['khuyến mãi','ưu đãi','voucher','flash sale','trả góp','giảm','tặng','freeship','miễn phí','lắp đặt','bảo hành'];
  const found = [];

  lines.forEach(line => {
    const low = line.toLowerCase();
    if (line.length >= 10 && line.length <= 180 && keys.some(k => low.indexOf(k) >= 0)) {
      if (!found.some(x => x.toLowerCase() === low)) found.push(line);
    }
  });

  return found.slice(0, 10);
}

function extractImages_(html) {
  const found = [];
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/ig,
    /<img[^>]+src=["']([^"']+)["']/ig
  ];
  patterns.forEach(re => {
    let m;
    while ((m = re.exec(html)) !== null) {
      const src = clean_(m[1]);
      if (src && found.indexOf(src) < 0 && !src.startsWith('data:')) found.push(src);
      if (found.length >= 8) break;
    }
  });
  return found;
}

function buildProductAnalyzePrompt_(input) {
  const mode = String(input.createType || 'image').toLowerCase().indexOf('video') >= 0 ? 'VIDEO' : 'IMAGE';

  const base = `
Bạn là trợ lý AI của Thiên Kim Universe, chuyên tạo PROMPT VIP cho bán hàng.

YÊU CẦU KHAI THÁC LINK/TÊN SẢN PHẨM:
- Nếu có link sản phẩm, hãy ưu tiên đọc mô tả sản phẩm, thông số, hình ảnh, giá đang hiển thị, khuyến mãi/voucher/flash sale và nội dung từ web hãng hoặc trang bán hàng.
- Nếu công cụ AI không đọc được link, hãy dùng phần thông tin người dùng đã nhập và ghi rõ phần nào là gợi ý.
- Mô tả phải tập trung vào 3-5 điểm nhấn tính năng/lợi ích sản phẩm.
- Giá bán ưu tiên theo trang sản phẩm nếu có; nếu không có thì dùng giá/gợi ý giá đã nhập.
- Khuyến mãi ưu tiên lấy top 3 ưu đãi tốt nhất trên web; nếu không có thì đề xuất ưu đãi hợp lý.
- Đối tượng khách hàng phải dựa trên sản phẩm và nhu cầu thực tế.

GỢI Ý FILE NGƯỜI DÙNG CÓ SẴN:
- Nhân vật mẫu: Có file mẫu tên hinh_mau.png_202606121054.jpeg. Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng nhân vật trong file upload.
- Bối cảnh mẫu: Có file bối cảnh tên 1-vong-dao-quanh-trung-tam-gia-dung-dien-may-xanh-5.jpg. Người dùng sẽ upload file này vào công cụ AI, hãy ưu tiên dùng bối cảnh trong file upload.

DỮ LIỆU ĐỌC ĐƯỢC:
- Tên/trang: ${input.productName || input.pageTitle || ''}
- Link sản phẩm: ${input.productUrl || ''}
- Nơi bán/kênh giới thiệu gợi ý: ${input.sellingPlace || input.storeAddress || ''}
- Giá web đang hiển thị: ${input.pagePrice || 'Chưa lấy được'}
- Giá người dùng mong muốn: ${input.desiredPrice || 'Không nhập'}
- Địa chỉ siêu thị/cửa hàng: ${input.storeAddress || 'Không nhập'}
- Số điện thoại liên hệ: ${input.phone || 'Không nhập'}
- Khuyến mãi đọc được: ${(input.promotions || []).join(' | ') || 'Chưa lấy được'}
- Mô tả meta: ${input.pageDescription || ''}
- Nội dung trang rút gọn: ${input.pageText || ''}
- Hình ảnh đọc được: ${(input.images || []).join(' | ') || 'Không có'}

Hãy trả kết quả bằng tiếng Việt, rõ ràng, có thể copy dùng ngay.
`;

  if (mode === 'VIDEO') {
    return base + `
MỤC CẦN TẠO: VIDEO

Đóng vai một Đạo diễn Video Thương mại (Commercial Video Director) và Chuyên gia Prompt AI Video (AI Video Prompt Engineer). Tôi muốn sản xuất một video ngắn 15-30 giây để quảng cáo sản phẩm đang phân tích, bán tại nơi bán/kênh giới thiệu gợi ý, với phong cách hiện đại, chuyên nghiệp, nhịp độ nhanh, có khả năng chuyển đổi cao.

Hãy xây dựng kế hoạch kịch bản video gồm đúng các phần sau:

0. TÓM TẮT SẢN PHẨM
- Tên sản phẩm
- Mô tả ngắn 3-5 điểm nhấn tính năng/lợi ích
- Giá web đang hiển thị
- Giá mong muốn nếu có
- Top 3 khuyến mãi tốt nhất
- Đối tượng khách hàng mục tiêu

1. KỊCH BẢN PHÂN CẢNH (SHOT-BY-SHOT PROMPT)
Cung cấp 3-4 prompt tiếng Anh chi tiết để đưa vào công cụ tạo video AI. Mỗi shot khoảng 4-5 giây theo công thức:
[Góc máy] + [Chủ thể] + [Hành động chi tiết] + [Bối cảnh] + [Chuyển động Camera cụ thể] + [Chất lượng 4K, Cinematic lighting].

2. KỊCH BẢN LỜI BÌNH (VOICEOVER)
Viết lời thoại hấp dẫn, khớp từng phân cảnh. Chỉ định rõ tone giọng.

3. CHỮ XUẤT HIỆN TRÊN VIDEO (ON-SCREEN TEXT)
Gợi ý chữ xuất hiện theo từng giây để người xem không bật tiếng vẫn hiểu.

4. GỢI Ý ÂM THANH (SOUND & MUSIC)
Đề xuất nhạc nền và hiệu ứng âm thanh.

5. CAPTION ĐĂNG BÀI
Viết caption Facebook/Zalo/TikTok theo cấu trúc Hook -> Vấn đề -> Lợi ích -> Ưu đãi -> CTA.

6. HASHTAG

7. CTA BÁN HÀNG

8. CHECKLIST TRƯỚC KHI XUẤT VIDEO
`;
  }

  return base + `
MỤC CẦN TẠO: HÌNH ẢNH

Đóng vai một Chuyên gia Digital Marketing và Midjourney Prompt Engineer. Tôi muốn làm một chiến dịch quảng cáo mạng xã hội cho sản phẩm đang phân tích, bán tại nơi bán/kênh giới thiệu gợi ý. Tôi có thể đính kèm hình nhân vật mẫu và bối cảnh mẫu.

Hãy cung cấp kế hoạch nội dung gồm đúng các phần sau:

0. TÓM TẮT SẢN PHẨM
- Tên sản phẩm
- Mô tả ngắn 3-5 điểm nhấn tính năng/lợi ích
- Giá web đang hiển thị
- Giá mong muốn nếu có
- Top 3 khuyến mãi tốt nhất
- Đối tượng khách hàng mục tiêu

1. PROMPT TẠO ẢNH QUẢNG CÁO CHI TIẾT
Viết 1 prompt tiếng Anh chi tiết để tạo ảnh quảng cáo thương mại, có không gian chèn text, tỷ lệ 1:1, version 6.0. Nếu có file upload thì nhắc người dùng đính kèm link/file ảnh nhân vật và bối cảnh.

2. BỐ CỤC HÌNH ẢNH ĐỀ XUẤT
Chia bố cục theo phần trên / giữa / dưới để chèn text và sản phẩm.

3. TEXT NGẮN NÊN ĐẶT TRÊN ẢNH
Gồm Headline, Sub-headline, Badge ưu đãi.

4. PROMPT TẠO BIẾN THỂ ẢNH LIFESTYLE
Viết 1 prompt tiếng Anh tạo ảnh biến thể theo phong cách đời sống, tạo cảm giác khao khát.

5. CAPTION ĐĂNG BÀI FB/ZALO
Chuẩn SEO, tối ưu chuyển đổi theo cấu trúc Hook -> Nêu vấn đề -> Tính năng/Lợi ích -> Ưu đãi -> CTA.

6. HASHTAG

7. CTA BÁN HÀNG

8. CHECKLIST KIỂM TRA TRƯỚC KHI XUẤT ẢNH & ĐĂNG BÀI
`;
}

function buildFallbackAnalysis_(input) {
  const promos = input.promotions && input.promotions.length ? input.promotions.slice(0,3) : [
    'Trả góp 0% nếu phù hợp chính sách bán hàng',
    'Ưu đãi/giảm giá theo chương trình hiện tại',
    'Hỗ trợ giao hàng hoặc tư vấn nhanh'
  ];

  const features = makeFeatureBullets_(input.description);

  return {
    product_name: input.productName,
    short_description: features,
    web_price: input.price || 'Chưa lấy được giá từ website',
    desired_price: input.desiredPrice || '',
    final_price_note: input.desiredPrice ? 'Ưu tiên hiển thị giá người dùng mong muốn trong nội dung bán hàng.' : 'Ưu tiên giá lấy từ website nếu có.',
    promotions: promos,
    target_customer: guessCustomer_(input.productName + ' ' + input.description),
    store_address: input.storeAddress || '',
    contact_phone: input.phone || '',
    create_type: input.createType,
    source_url: input.sourceUrl || '',
    images: input.images || [],
    used_ai: false,
    prompt_vip: buildManualPromptVip_(input, features, promos)
  };
}

function buildManualPromptVip_(input, features, promos) {
  const isVideo = String(input.createType || '').toLowerCase().indexOf('video') >= 0;
  const title = input.productName || 'Sản phẩm cần quảng cáo';
  const place = input.sellingPlace || input.storeAddress || 'kênh bán hàng đang giới thiệu';
  const priceLine = input.desiredPrice || input.price || 'Điền giá thực tế trước khi đăng';

  if (isVideo) {
    return `Đóng vai một Đạo diễn Video Thương mại và Chuyên gia Prompt AI Video. Tôi muốn sản xuất một video ngắn 15-30 giây để quảng cáo sản phẩm ${title}, bán tại ${place}, phong cách hiện đại, chuyên nghiệp, nhịp độ nhanh.\n\nTóm tắt sản phẩm:\n${features.map(x => '- ' + x).join('\n')}\nGiá: ${priceLine}\nKhuyến mãi:\n${promos.map(x => '- ' + x).join('\n')}\n\nHãy xây dựng: 1) Shot-by-shot prompt tiếng Anh 3-4 cảnh, 2) Voiceover, 3) On-screen text, 4) Sound & Music, 5) Caption, 6) Hashtag, 7) CTA, 8) Checklist.`;
  }

  return `Đóng vai một Chuyên gia Digital Marketing và Midjourney Prompt Engineer. Tôi muốn làm chiến dịch quảng cáo mạng xã hội cho sản phẩm ${title}, bán tại ${place}.\n\nTóm tắt sản phẩm:\n${features.map(x => '- ' + x).join('\n')}\nGiá: ${priceLine}\nKhuyến mãi:\n${promos.map(x => '- ' + x).join('\n')}\n\nHãy cung cấp: 1) Prompt tiếng Anh tạo ảnh quảng cáo thương mại 1:1 --v 6.0, 2) Bố cục thiết kế, 3) Text ngắn trên ảnh, 4) Prompt lifestyle, 5) Caption FB/Zalo, 6) Hashtag, 7) CTA, 8) Checklist.`;
}

/*******************************
 * 4) FEEDBACK CENTER
 *******************************/

function saveFeedback_(params) {
  const sheet = getOrCreateSheet_('feedback', ['id','time','username','name','email','phone','title','message','reply','status']);
  const id = 'FB' + Utilities.getUuid().slice(0, 8).toUpperCase();
  sheet.appendRow([
    id,
    new Date(),
    clean_(params.username),
    clean_(params.name),
    clean_(params.email),
    clean_(params.phone),
    clean_(params.title || 'Đóng góp App AI Video'),
    clean_(params.message),
    '',
    'new'
  ]);
  return json_({ ok: true, id, message: 'Đã ghi nhận đóng góp. Thiên Kim sẽ phản hồi sớm.' });
}

function getFeedbackReply_(params) {
  const username = clean_(params.username);
  const email = clean_(params.email);
  const phone = clean_(params.phone);
  const sheet = getOrCreateSheet_('feedback', ['id','time','username','name','email','phone','title','message','reply','status']);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return json_({ ok: true, replies: [] });

  const headers = values[0].map(h => clean_(h).toLowerCase());
  const idx = colIndexMap_(headers);
  const replies = [];

  for (let i = values.length - 1; i >= 1; i--) {
    const r = values[i];
    const match =
      (username && clean_(r[idx.username]) === username) ||
      (email && clean_(r[idx.email]) === email) ||
      (phone && clean_(r[idx.phone]) === phone);

    if (match && clean_(r[idx.reply])) {
      replies.push({
        id: clean_(r[idx.id]),
        time: String(r[idx.time]),
        title: clean_(r[idx.title]),
        message: clean_(r[idx.message]),
        reply: clean_(r[idx.reply]),
        status: clean_(r[idx.status])
      });
    }
    if (replies.length >= 5) break;
  }

  return json_({ ok: true, replies });
}

/*******************************
 * 5) USER PROFILE: số điện thoại, địa chỉ lưu mọi phiên
 *******************************/

function saveUserProfile_(params) {
  const username = clean_(params.username || params.email || params.phone || 'anonymous');
  const sheet = getOrCreateSheet_('user_profile', ['username','time','name','email','phone','store_address','note']);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => clean_(h).toLowerCase());
  const idx = colIndexMap_(headers);

  for (let i = 1; i < values.length; i++) {
    if (clean_(values[i][idx.username]) === username) {
      sheet.getRange(i + 1, idx.time + 1).setValue(new Date());
      sheet.getRange(i + 1, idx.name + 1).setValue(clean_(params.name));
      sheet.getRange(i + 1, idx.email + 1).setValue(clean_(params.email));
      sheet.getRange(i + 1, idx.phone + 1).setValue(clean_(params.phone));
      sheet.getRange(i + 1, idx.store_address + 1).setValue(clean_(params.store_address || params.storeAddress));
      sheet.getRange(i + 1, idx.note + 1).setValue(clean_(params.note));
      return json_({ ok: true, message: 'Đã cập nhật thông tin người dùng.' });
    }
  }

  sheet.appendRow([
    username,
    new Date(),
    clean_(params.name),
    clean_(params.email),
    clean_(params.phone),
    clean_(params.store_address || params.storeAddress),
    clean_(params.note)
  ]);
  return json_({ ok: true, message: 'Đã lưu thông tin người dùng.' });
}

function getUserProfile_(params) {
  const username = clean_(params.username || params.email || params.phone || 'anonymous');
  const sheet = getOrCreateSheet_('user_profile', ['username','time','name','email','phone','store_address','note']);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return json_({ ok: true, profile: null });

  const headers = values[0].map(h => clean_(h).toLowerCase());
  const idx = colIndexMap_(headers);

  for (let i = values.length - 1; i >= 1; i--) {
    const r = values[i];
    if (clean_(r[idx.username]) === username) {
      return json_({
        ok: true,
        profile: {
          username: clean_(r[idx.username]),
          name: clean_(r[idx.name]),
          email: clean_(r[idx.email]),
          phone: clean_(r[idx.phone]),
          store_address: clean_(r[idx.store_address]),
          note: clean_(r[idx.note])
        }
      });
    }
  }

  return json_({ ok: true, profile: null });
}

/*******************************
 * GEMINI HELPER
 *******************************/

function callGemini_(apiKey, prompt, options) {
  try {
    const model = clean_((options && options.model) || DEFAULT_GEMINI_MODEL);
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: (options && options.maxOutputTokens) || 2048
      }
    };

    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    });

    const code = res.getResponseCode();
    const text = res.getContentText();
    let data = {};
    try { data = JSON.parse(text); } catch (e) {}

    if (code >= 200 && code < 300) {
      const out = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
        ? data.candidates[0].content.parts.map(p => p.text || '').join('\n').trim()
        : '';
      return { ok: true, text: out, message: 'Gemini OK' };
    }

    return { ok: false, error: text || ('HTTP ' + code), code };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

/*******************************
 * COMMON HELPERS
 *******************************/

function getTargetSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();

  for (const sh of sheets) {
    if (sh.getSheetId() === SHEET_GID) return sh;
  }
  return sheets[0];
}

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    return sh;
  }

  const lastCol = sh.getLastColumn();
  if (lastCol === 0) {
    sh.appendRow(headers);
    return sh;
  }

  const existing = sh.getRange(1, 1, 1, Math.max(lastCol, headers.length)).getValues()[0].map(h => clean_(h));
  if (!existing[0]) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function colIndexMap_(headers) {
  const out = {};
  headers.forEach((h, i) => out[h] = i);
  return out;
}

function clean_(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isUrl_(s) {
  return /^https?:\/\//i.test(String(s || ''));
}

function firstMatch_(text, re) {
  const m = re.exec(text || '');
  return m ? decodeHtml_(stripHtml_(m[1] || '')) : '';
}

function stripHtml_(html) {
  return decodeHtml_(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim());
}

function decodeHtml_(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function normalizePrice_(s) {
  let v = clean_(s).replace(/\s+/g, ' ');
  const m = v.match(/[0-9]{1,3}(?:[\.\,][0-9]{3})+|[0-9]{5,}/);
  if (!m) return '';
  let num = m[0].replace(/,/g, '.');
  if (!/[₫đ]|vnd/i.test(v)) v = num + 'đ';
  else v = num + 'đ';
  return v;
}

function makeFeatureBullets_(description) {
  const text = clean_(description);
  const parts = text
    .split(/[\.\n;•\-]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 12 && s.length <= 140);

  const unique = [];
  parts.forEach(p => {
    if (!unique.some(x => x.toLowerCase() === p.toLowerCase())) unique.push(p);
  });

  if (unique.length >= 3) return unique.slice(0, 5);

  return [
    'Nổi bật về trải nghiệm sử dụng và tính tiện lợi cho khách hàng',
    'Thiết kế/sản phẩm phù hợp nhu cầu mua sắm hiện đại',
    'Có thể truyền tải lợi ích rõ ràng trong nội dung quảng cáo',
    'Phù hợp triển khai bài đăng, ảnh quảng cáo hoặc video ngắn',
    'Cần kiểm tra lại thông tin chính xác từ link sản phẩm trước khi đăng'
  ];
}

function guessCustomer_(text) {
  const s = String(text || '').toLowerCase();
  if (s.indexOf('tivi') >= 0 || s.indexOf('tv') >= 0) return 'Gia đình, người thích giải trí tại nhà, khách hàng muốn nâng cấp phòng khách hoặc phòng ngủ.';
  if (s.indexOf('máy lạnh') >= 0 || s.indexOf('điều hòa') >= 0) return 'Gia đình, văn phòng nhỏ, cửa hàng cần làm mát tiết kiệm điện.';
  if (s.indexOf('mỹ phẩm') >= 0 || s.indexOf('kem') >= 0 || s.indexOf('son') >= 0) return 'Nữ 18-35 tuổi, quan tâm chăm sóc cá nhân, làm đẹp và ưu đãi mua sắm.';
  if (s.indexOf('điện thoại') >= 0 || s.indexOf('iphone') >= 0 || s.indexOf('samsung') >= 0) return 'Người dùng công nghệ, học sinh/sinh viên, nhân viên văn phòng, người cần nâng cấp thiết bị.';
  return 'Khách hàng đang có nhu cầu mua sản phẩm, quan tâm giá tốt, uy tín nơi bán và ưu đãi rõ ràng.';
}
