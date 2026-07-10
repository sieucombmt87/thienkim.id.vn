/**
 * Google Sheet + backend config
 * Điểm gọi login/user qua Apps Script web app.
 */

const TK_GOOGLE_SHEET_API = 'https://script.google.com/macros/s/AKfycbx7JKjWmGZQVY-D2e4dQqE6Dc9zZ3x3QZ3x3QZ3x3QZ3x3QZ3x3/exec';

const TK_LOGIN_ENDPOINTS = [
  TK_GOOGLE_SHEET_API,
  'https://docs.google.com/spreadsheets/d/11vvybEWeClcJFCZIchZ12MsClXDPJ-39iRNQtWGpRDs/edit?gid=1334014683'
];

function tkLoginWithSheet(username, password) {
  return fetchWithSheet_(username, password);
}

async function fetchWithSheet_(username, password) {
  const body = { action: 'login', username, password };

  for (const url of TK_LOGIN_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.ok && data.user) {
        return { ok: true, user: data.user };
      }
      if (data && data.error) {
        return { ok: false, error: data.error };
      }
    } catch (e) {
      // next endpoint
    }
  }
  return { ok: false, error: 'Không kết nối được backend đăng nhập.' };
}

async function fetchWithSheetPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.ok ? await res.json() : { ok: false, error: 'HTTP ' + res.status };
}
