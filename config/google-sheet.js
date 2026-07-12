/**
 * Google Sheet + backend config
 * Điểm gọi login/user qua Apps Script web app.
 */

// TODO: cấu hình URL /exec thật từ Apps Script đã deploy.
// Mặc định fallback sang bản test (chỉ chủ script truy cập được) — KHÔNG dùng cho user thường.
// Khi deploy production, mày thay URL dưới bằng URL /exec (bắt đăng bằng https://script.google.com/macros/s/.../exec).
const TK_GOOGLE_SHEET_API_DEV = 'https://script.google.com/macros/s/AKfycbwevK4LQgr8jLASGHTSt7g89No4qNSxM_c-lodATS4/dev';
const TK_GOOGLE_SHEET_API_EXEC = 'https://script.google.com/macros/s/AKfycbw52oWiX-WGz3MWYTHOD-bJJeLqGqOIS-qhQ7WGMnSDnaJqt3Bmj1DDuUIdCqIOp906/exec';

function tkResolveApiUrl_() {
  // 1. Ưu tiên config cục bộ (config/local.js — gitignored)
  if (typeof window !== 'undefined' && window.TK_LOCAL_CONFIG && window.TK_LOCAL_CONFIG.TK_GOOGLE_SHEET_API_EXEC) {
    const localUrl = String(window.TK_LOCAL_CONFIG.TK_GOOGLE_SHEET_API_EXEC).trim();
    if (localUrl && localUrl.indexOf('http') === 0) return localUrl;
  }
  // 2. Hằng số TK_GOOGLE_SHEET_API_EXEC trong file này
  if (TK_GOOGLE_SHEET_API_EXEC) return TK_GOOGLE_SHEET_API_EXEC;
  // 3. Fallback dev (chỉ chủ script truy cập được — dùng để smoke test)
  return TK_GOOGLE_SHEET_API_DEV;
}

const TK_GOOGLE_SHEET_API = tkResolveApiUrl_();

if (typeof window !== 'undefined') {
  window.TK_GOOGLE_SHEET_API = TK_GOOGLE_SHEET_API;
  window.TK_GOOGLE_SHEET_API_EXEC = TK_GOOGLE_SHEET_API_EXEC;
  window.TK_GOOGLE_SHEET_API_DEV = TK_GOOGLE_SHEET_API_DEV;
}

const TK_LOGIN_ENDPOINTS = [
  TK_GOOGLE_SHEET_API
];

function tkLoginWithSheet(username, password) {
  return fetchWithSheet_(username, password);
}

// Compatibility wrapper for callers using apiLogin(...)
async function apiLogin(username, password) {
  try {
    return await tkLoginWithSheet(username, password);
  } catch (e) {
    return { ok: false, error: 'API error: ' + (e && e.message || e) };
  }
}

if (typeof window !== 'undefined') {
  window.tkLoginWithSheet = tkLoginWithSheet;
  window.apiLogin = apiLogin;
}

async function fetchWithSheet_(username, password) {
  const body = { action: 'login', username, password };
  const errors = [];

  for (const url of TK_LOGIN_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        redirect: 'follow'
      });

      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}

      if (!res.ok) {
        errors.push('HTTP ' + res.status + ' @ ' + url + ' :: ' + text.slice(0, 200));
        continue;
      }

      if (data && data.ok && data.user) {
        return { ok: true, user: data.user };
      }

      if (data && data.error) {
        return { ok: false, error: data.error };
      }

      errors.push('Phản hồi không hợp lệ từ ' + url + ' :: ' + text.slice(0, 200));
    } catch (e) {
      errors.push('Lỗi mạng @ ' + url + ' :: ' + (e && e.message ? e.message : e));
    }
  }

  if (typeof console !== 'undefined' && console.error) {
    console.error('[TK login] All endpoints failed:', errors);
  }

  return {
    ok: false,
    error: 'Không kết nối được backend đăng nhập.',
    debug: errors
  };
}

async function fetchWithSheetPost(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      return { ok: false, error: 'Phản hồi không phải JSON :: ' + text.slice(0, 200) };
    }
  } catch (e) {
    return { ok: false, error: 'Lỗi mạng :: ' + (e && e.message ? e.message : e) };
  }
}
