/**
 * TKver0.0.7 - Google Sheet Login API
 * Dùng cho Google Apps Script Web App.
 *
 * Changelog:
 *  v0.0.6 → Thêm normalizeUsername_ (SĐT VN tự thêm '0').
 *  v0.0.7 → Fix status check (chỉ khóa khi chứa lock/inactive/...,
 *           tránh cột status là số/checkbox/trống bị hiểu thành khóa).
 *           clean_() loại bỏ ký tự ẩn \r \n \t trong cell Sheet.
 *
 * Sheet link hiện tại:
 * https://docs.google.com/spreadsheets/d/11vvybEWeClcJFCZIchZ12MsClXDPJ-39iRNQtWGpRDs/edit?gid=1334014683
 *
 * Cột gợi ý user sheet: username | password | role | full_name | status | note
 *
 * Cột gợi ý user_permissions sheet: username | vip_access | create_video | ai_prompt | image_prompt | app_order | mood_tracking
 */

const SPREADSHEET_ID = '11vvybEWeClcJFCZIchZ12MsClXDPJ-39iRNQtWGpRDs';
const SHEET_GID = 1334014683;
const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    const params = parseParams_(e);
    const action = String(params.action || '').toLowerCase().trim();

    if (!action) {
      return json_({ ok: false, error: 'Thiếu action.' });
    }

    if (action === 'ping') {
      return json_({ ok: true, message: 'TK API OK', time: new Date().toISOString() });
    }

    if (action === 'login') {
      return login_(params);
    }

    if (action === 'get_users') {
      return getUsers_(params);
    }

    if (action === 'set_user_permissions') {
      return setUserPermissions_(params);
    }

    return json_({ ok: false, error: 'Action không hợp lệ.' });
  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message ? err.message : err),
      line: err && err.lineNumber ? err.lineNumber : null
    });
  }
}

function parseParams_(e) {
  const params = {};

  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(key => {
      params[key] = e.parameter[key];
    });
  }

  if (e && e.postData && e.postData.contents) {
    const raw = e.postData.contents;
    try {
      const body = JSON.parse(raw);
      if (body && typeof body === 'object') {
        Object.keys(body).forEach(key => {
          params[key] = body[key];
        });
      }
    } catch (err) {
      try {
        const body = JSON.parse(raw.replace(/&/g, '&').replace(/"/g, '\"'));
        if (body && typeof body === 'object') {
          Object.keys(body).forEach(key => {
            params[key] = body[key];
          });
        }
      } catch (err2) {
        // form-urlencoded/text fallback
      }
    }
  }

  return params;
}

function login_(params) {
  const username = clean_(params.username);
  const password = clean_(params.password);

  if (!username || !password) {
    return json_({ ok: false, error: 'Thiếu username hoặc password.' });
  }

  const targetUsername = normalizeUsername_(username).toLowerCase();
  const targetPassword = password;

  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    return json_({ ok: false, error: 'Không mở được Google Sheet. Kiểm tra quyền truy cập.' });
  }

  const sheet = getTargetSheet_(ss);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return json_({ ok: false, error: 'Sheet chưa có dữ liệu user.' });
  }

  const dataRange = sheet.getRange(1, 1, lastRow, Math.min(sheet.getLastColumn(), 20));
  const values = dataRange.getValues();
  const headers = values[0].map(h => clean_(h).toLowerCase());

  const idx = {
    username: headers.indexOf('username'),
    password: headers.indexOf('password'),
    role: headers.indexOf('role'),
    full_name: headers.indexOf('full_name'),
    status: headers.indexOf('status')
  };

  if (idx.username < 0 || idx.password < 0 || idx.role < 0) {
    return json_({
      ok: false,
      error: 'Sheet thiếu cột bắt buộc: username, password, role.'
    });
  }

  let matchedUser = null;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowUsername = clean_(row[idx.username]);
    const rowPassword = clean_(row[idx.password]);

    if (rowUsername.toLowerCase() === targetUsername && rowPassword === targetPassword) {
      const statusRaw = idx.status >= 0 ? clean_(row[idx.status]) : 'active';
      const status = statusRaw.toLowerCase();
      const lockedKeywords = ['lock', 'inactive', 'disable', 'disabled', 'block', 'blocked', 'banned', 'khoa', 'vohieu', 'vo_hieu'];
      const isLocked = lockedKeywords.some(k => status === k || status.indexOf(k) === 0);

      if (status && isLocked) {
        return json_({ ok: false, error: 'Tài khoản đang bị khóa hoặc chưa active.' });
      }

      matchedUser = {
        username: rowUsername,
        full_name: idx.full_name >= 0 ? clean_(row[idx.full_name]) : rowUsername,
        role: clean_(row[idx.role]) || 'TVBH',
        status: 'active',
        source: 'google_sheet'
      };

      headers.forEach((h, colIndex) => {
        if (!matchedUser[h] && !['username','password','pass','pwd','full_name','role','status'].includes(h)) {
          matchedUser[h] = clean_(row[colIndex]);
        }
      });

      break;
    }
  }

  if (!matchedUser) {
    return json_({ ok: false, error: 'Không tìm thấy user hoặc sai mật khẩu.' });
  }

  const permission = readPermissionForUser_(ss, matchedUser.username);
  if (permission) {
    matchedUser.permissions = permission;
  }

  return json_({ ok: true, user: matchedUser });
}

function getUsers_(params) {
  const requester = clean_(params.requester_username);
  if (!requester) return json_({ ok: false, error: 'Thiếu requester_username.' });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = getTargetSheet_(ss);
  const permSheetName = 'user_permissions';
  const permSheet = ensureSheet_(ss, permSheetName, ['username','vip_access','create_video','ai_prompt','image_prompt','app_order','mood_tracking']);

  const userValues = userSheet.getRange(1, 1, userSheet.getLastRow(), Math.min(userSheet.getLastColumn(), 20)).getValues();
  const permValues = permSheet.getRange(1, 1, permSheet.getLastRow(), permSheet.getLastColumn()).getValues();

  const permHeader = (permValues[0] || []).map(h => clean_(h).toLowerCase());
  const permRows = permValues.slice(1).map(row => {
    const obj = {};
    permHeader.forEach((h, i) => obj[h] = clean_(row[i]));
    return obj;
  });
  const permMap = {};
  permRows.forEach(r => { if (r.username) permMap[r.username.toLowerCase()] = r; });

  const users = [];
  for (let i = 1; i < userValues.length; i++) {
    const row = userValues[i];
    const username = normalizeUsername_(clean_(row[0]));
    if (!username) continue;
    const user = { username };
    for (let j = 1; j < row.length; j++) {
      const header = clean_(userValues[0][j]).toLowerCase();
      if (header && !['password','pass','pwd'].includes(header)) user[header] = clean_(row[j]);
    }
    const perm = permMap[username.toLowerCase()];
    if (perm) user.permissions = perm;
    users.push(user);
  }

  return json_({ ok: true, users });
}

function setUserPermissions_(params) {
  const requester = clean_(params.requester_username);
  const targetUsername = clean_(params.username);
  const vipAccess = clean_(params.vip_access);
  const createVideo = clean_(params.create_video);
  const aiPrompt = clean_(params.ai_prompt);
  const imagePrompt = clean_(params.image_prompt);
  const appOrder = clean_(params.app_order);
  const moodTracking = clean_(params.mood_tracking);

  if (!requester || !targetUsername) return json_({ ok: false, error: 'Thiếu requester_username hoặc username.' });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const permSheet = ensureSheet_(ss, 'user_permissions', ['username','vip_access','create_video','ai_prompt','image_prompt','app_order','mood_tracking']);
  const values = permSheet.getRange(1, 1, permSheet.getLastRow(), permSheet.getLastColumn()).getValues();
  const headers = values[0].map(h => clean_(h).toLowerCase());
  const idx = {
    username: headers.indexOf('username'),
    vip_access: headers.indexOf('vip_access'),
    create_video: headers.indexOf('create_video'),
    ai_prompt: headers.indexOf('ai_prompt'),
    image_prompt: headers.indexOf('image_prompt'),
    app_order: headers.indexOf('app_order'),
    mood_tracking: headers.indexOf('mood_tracking')
  };

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (normalizeUsername_(clean_(values[i][idx.username])).toLowerCase() === targetUsername.toLowerCase()) {
      rowIndex = i + 1;
      break;
    }
  }

  const row = [];
  headers.forEach((_, i) => {
    if (i === idx.username) row.push(targetUsername);
    else if (i === idx.vip_access) row.push(vipAccess);
    else if (i === idx.create_video) row.push(createVideo);
    else if (i === idx.ai_prompt) row.push(aiPrompt);
    else if (i === idx.image_prompt) row.push(imagePrompt);
    else if (i === idx.app_order) row.push(appOrder);
    else if (i === idx.mood_tracking) row.push(moodTracking);
    else row.push('');
  });

  if (rowIndex > 0) {
    permSheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    permSheet.appendRow(row);
  }

  return json_({ ok: true, message: 'Đã cập nhật quyền user.' });
}

function readPermissionForUser_(ss, username) {
  const permSheet = ensureSheet_(ss, 'user_permissions', ['username','vip_access','create_video','ai_prompt','image_prompt','app_order','mood_tracking']);
  const values = permSheet.getRange(1, 1, permSheet.getLastRow(), permSheet.getLastColumn()).getValues();
  const headers = values[0].map(h => clean_(h).toLowerCase());
  for (let i = 1; i < values.length; i++) {
    if (normalizeUsername_(clean_(values[i][0])).toLowerCase() === String(username).toLowerCase()) {
      const obj = {};
      headers.forEach((h, idx) => { if (h) obj[h] = clean_(values[i][idx]); });
      return obj;
    }
  }
  return null;
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function getTargetSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();

  for (const sh of sheets) {
    if (sh.getSheetId() === SHEET_GID) {
      return sh;
    }
  }

  return sheets[0];
}

function clean_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeUsername_(value) {
  const s = String(value || '').trim();
  if (/^9\d{9}$/.test(s)) return '0' + s;
  return s;
}

function json_(obj) {
  const json = JSON.stringify(obj);
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
