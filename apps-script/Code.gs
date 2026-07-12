/**
 * TKver0.0.8 - Google Sheet Login API
 * Đọc đúng schema file Users_ThienKim.id.vn.xlsx.
 *
 * Sheet chính: "Users_Permissions" - bảng user gộp luôn permission.
 *  Cột chuẩn:
 *    user_id, username, password, full_name, role, department, status,
 *    family_access, vip_access, vault_access, create_video, ai_prompt,
 *    app_order, mood_tracking, created_at, last_login, notes, email, phone
 *
 * Sheet phụ:
 *   - "App_Permissions"  : danh sách app + gate VIP
 *   - "Role_Matrix"      : ma trận quyền theo role
 *   - "khaibaothidua"    : danh sách khai báo thi đua
 *   - "Login_Audit"      : log login (auto tạo)
 *   - "api_status"       : log trạng thái API (auto tạo)
 *
 * Changelog:
 *   v0.0.6 → normalizeUsername_ thêm '0' đầu cho SĐT VN bị cắt số 0.
 *   v0.0.7 → status guard dùng keyword lock/inactive/... thay vì so sánh cứng;
 *            clean_() strip \r \n \t.
 *   v0.0.8 → Ưu tiên sheet "Users_Permissions" (đúng schema file mới);
 *            fallback về SHEET_GID nếu không tìm thấy.
 *            Đọc permission thẳng từ row user (gộp sẵn trong bảng),
 *            đồng thời vẫn hỗ trợ nối sang sheet "user_permissions" cũ.
 *            Thêm action: 'app_permissions', 'login_audit'.
 *            Thêm audit log tự động vào sheet "Login_Audit".
 *            Cho phép login khi status = "Active" (đúng schema file Excel).
 */

const SPREADSHEET_ID = '11vvybEWeClcJFCZIchZ12MsClXDPJ-39iRNQtWGpRDs';
const SHEET_GID = 1334014683;
const USER_SHEET_NAME = 'Users_Permissions';
const PERM_SHEET_NAME = 'user_permissions';
const APP_SHEET_NAME = 'App_Permissions';
const AUDIT_SHEET_NAME = 'Login_Audit';
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
      return json_({ ok: true, message: 'TK API OK', version: '0.0.8', time: new Date().toISOString() });
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

    if (action === 'app_permissions') {
      return getAppPermissions_(params);
    }

    if (action === 'login_audit') {
      return getLoginAudit_(params);
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
    Object.keys(e.parameter).forEach(k => { params[k] = e.parameter[k]; });
  }
  if (e && e.postData && e.postData.contents) {
    const raw = e.postData.contents;
    try {
      const body = JSON.parse(raw);
      if (body && typeof body === 'object') {
        Object.keys(body).forEach(k => { params[k] = body[k]; });
      }
    } catch (err) {
      try {
        const body = JSON.parse(raw.replace(/&/g, '&').replace(/"/g, '\"'));
        if (body && typeof body === 'object') {
          Object.keys(body).forEach(k => { params[k] = body[k]; });
        }
      } catch (err2) { /* fallback */ }
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

  const sheet = getUserSheet_(ss);
  if (!sheet) {
    return json_({ ok: false, error: 'Không tìm thấy sheet user (Users_Permissions).' });
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return json_({ ok: false, error: 'Sheet chưa có dữ liệu user.' });
  }

  const lastCol = Math.min(sheet.getLastColumn(), 25);
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(h => clean_(h).toLowerCase());

  const idx = {
    user_id: headers.indexOf('user_id'),
    username: headers.indexOf('username'),
    password: headers.indexOf('password'),
    role: headers.indexOf('role'),
    department: headers.indexOf('department'),
    full_name: headers.indexOf('full_name'),
    status: headers.indexOf('status'),
    family_access: headers.indexOf('family_access'),
    vip_access: headers.indexOf('vip_access'),
    vault_access: headers.indexOf('vault_access'),
    create_video: headers.indexOf('create_video'),
    ai_prompt: headers.indexOf('ai_prompt'),
    app_order: headers.indexOf('app_order'),
    mood_tracking: headers.indexOf('mood_tracking'),
    email: headers.indexOf('email'),
    phone: headers.indexOf('phone')
  };

  if (idx.username < 0 || idx.password < 0 || idx.role < 0) {
    logAudit_(ss, username, 'FAIL', 'Thiếu cột bắt buộc trong sheet user');
    return json_({
      ok: false,
      error: 'Sheet thiếu cột bắt buộc: username, password, role.'
    });
  }

  let matchedUser = null;
  let failReason = 'Không tìm thấy user hoặc sai mật khẩu.';

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowUsername = clean_(row[idx.username]);
    if (!rowUsername) continue;
    const rowPassword = clean_(row[idx.password]);
    const rowUsernameNorm = normalizeUsername_(rowUsername).toLowerCase();

    if (rowUsernameNorm === targetUsername && rowPassword === targetPassword) {
      const statusRaw = idx.status >= 0 ? clean_(row[idx.status]) : 'Active';
      const status = statusRaw.toLowerCase();
      const lockedKeywords = ['lock', 'inactive', 'disable', 'disabled', 'block', 'blocked', 'banned', 'khoa', 'vohieu', 'vo_hieu'];
      const isLocked = lockedKeywords.some(k => status === k || status.indexOf(k) === 0);

      if (status && isLocked) {
        logAudit_(ss, rowUsername, 'LOCKED', 'Tài khoản bị khóa theo status=' + statusRaw);
        return json_({ ok: false, error: 'Tài khoản đang bị khóa hoặc chưa active.' });
      }

      matchedUser = {
        user_id: idx.user_id >= 0 ? row[idx.user_id] : '',
        username: rowUsername,
        full_name: idx.full_name >= 0 ? clean_(row[idx.full_name]) : rowUsername,
        role: clean_(row[idx.role]) || 'TVBH',
        department: idx.department >= 0 ? clean_(row[idx.department]) : '',
        status: 'active',
        email: idx.email >= 0 ? clean_(row[idx.email]) : '',
        phone: idx.phone >= 0 ? clean_(row[idx.phone]) : '',
        source: 'google_sheet'
      };

      const permInline = {
        family_access: idx.family_access >= 0 ? clean_(row[idx.family_access]) : '',
        vip_access: idx.vip_access >= 0 ? clean_(row[idx.vip_access]) : '',
        vault_access: idx.vault_access >= 0 ? clean_(row[idx.vault_access]) : '',
        create_video: idx.create_video >= 0 ? clean_(row[idx.create_video]) : '',
        ai_prompt: idx.ai_prompt >= 0 ? clean_(row[idx.ai_prompt]) : '',
        app_order: idx.app_order >= 0 ? clean_(row[idx.app_order]) : '[]',
        mood_tracking: idx.mood_tracking >= 0 ? clean_(row[idx.mood_tracking]) : ''
      };
      matchedUser.permissions = permInline;
      break;
    } else if (rowUsernameNorm === targetUsername) {
      failReason = 'Sai mật khẩu cho user ' + rowUsername + '.';
    }
  }

  if (!matchedUser) {
    logAudit_(ss, username, 'FAIL', failReason);
    return json_({ ok: false, error: failReason });
  }

  // Nếu sheet Users_Permissions để trống các cột permission,
  // nối sang sheet "user_permissions" cũ (giữ tương thích ngược).
  const hasAnyInlinePerm = Object.values(matchedUser.permissions).some(v => v && v !== '[]');
  if (!hasAnyInlinePerm) {
    const legacy = readLegacyPermission_(ss, matchedUser.username);
    if (legacy) matchedUser.permissions = legacy;
  }

  // Thông tin vault/Admin đặc biệt cho SĐT 0947924444
  const specialVault = normalizeUsername_(matchedUser.username);
  if (specialVault === '0947924444') {
    matchedUser.permissions.vault_access = 'Y';
    matchedUser.special = 'vault_admin';
  }

  // Cập nhật last_login
  try {
    const userRowIdx = values.findIndex((row, i) => i > 0 && normalizeUsername_(clean_(row[idx.username])).toLowerCase() === targetUsername);
    if (userRowIdx > 0) {
      const tsCol = headers.indexOf('last_login');
      if (tsCol >= 0) {
        sheet.getRange(userRowIdx + 1, tsCol + 1).setValue(new Date());
      }
    }
  } catch (e) { /* best-effort */ }

  logAudit_(ss, matchedUser.username, 'OK', 'role=' + matchedUser.role);
  return json_({ ok: true, user: matchedUser });
}

function getUsers_(params) {
  const requester = clean_(params.requester_username);
  if (!requester) return json_({ ok: false, error: 'Thiếu requester_username.' });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = getUserSheet_(ss);
  if (!userSheet) return json_({ ok: false, error: 'Không tìm thấy sheet user.' });

  const lastCol = Math.min(userSheet.getLastColumn(), 25);
  const values = userSheet.getRange(1, 1, userSheet.getLastRow(), lastCol).getValues();
  const headers = (values[0] || []).map(h => clean_(h).toLowerCase());

  const users = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const username = normalizeUsername_(clean_(row[headers.indexOf('username')]));
    if (!username) continue;
    const obj = { username };
    headers.forEach((h, j) => {
      if (!h) return;
      if (h === 'password' || h === 'pass' || h === 'pwd') return;
      obj[h] = clean_(row[j]);
    });
    users.push(obj);
  }
  return json_({ ok: true, users });
}

function setUserPermissions_(params) {
  const requester = clean_(params.requester_username);
  const targetUsername = clean_(params.username);
  if (!requester || !targetUsername) return json_({ ok: false, error: 'Thiếu requester_username hoặc username.' });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getUserSheet_(ss);
  if (!sheet) return json_({ ok: false, error: 'Không tìm thấy sheet user.' });

  const values = sheet.getRange(1, 1, sheet.getLastRow(), Math.min(sheet.getLastColumn(), 25)).getValues();
  const headers = values[0].map(h => clean_(h).toLowerCase());
  const cols = ['vip_access','create_video','ai_prompt','family_access','vault_access','app_order','mood_tracking'];
  const colIdx = {};
  cols.forEach(c => { colIdx[c] = headers.indexOf(c); });

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (normalizeUsername_(clean_(values[i][headers.indexOf('username')])).toLowerCase() === targetUsername.toLowerCase()) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex < 0) return json_({ ok: false, error: 'Không tìm thấy user ' + targetUsername });

  cols.forEach(c => {
    const j = colIdx[c];
    if (j >= 0 && params[c] !== undefined) {
      sheet.getRange(rowIndex, j + 1).setValue(clean_(params[c]));
    }
  });

  return json_({ ok: true, message: 'Đã cập nhật quyền user ' + targetUsername });
}

function getAppPermissions_(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(APP_SHEET_NAME);
  if (!sh) return json_({ ok: true, apps: [] });
  const values = sh.getDataRange().getValues();
  const headers = (values[0] || []).map(h => clean_(h).toLowerCase());
  const apps = values.slice(1)
    .filter(r => r.some(c => c !== '' && c !== null))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = clean_(r[i]); });
      return obj;
    });
  return json_({ ok: true, apps });
}

function getLoginAudit_(params) {
  const limit = Math.max(1, Math.min(parseInt(params.limit, 10) || 50, 500));
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(AUDIT_SHEET_NAME);
  if (!sh) return json_({ ok: true, rows: [] });
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return json_({ ok: true, rows: [] });
  const headers = values[0].map(h => clean_(h).toLowerCase());
  const rows = values.slice(-limit).reverse().map(r => {
    const o = {};
    headers.forEach((h, i) => { if (h) o[h] = clean_(r[i]); });
    return o;
  });
  return json_({ ok: true, rows });
}

function readLegacyPermission_(ss, username) {
  const permSheet = ss.getSheetByName(PERM_SHEET_NAME);
  if (!permSheet) return null;
  const values = permSheet.getDataRange().getValues();
  if (values.length < 2) return null;
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

function logAudit_(ss, username, status, detail) {
  try {
    const sh = ensureSheet_(ss, AUDIT_SHEET_NAME, ['timestamp','username','status','detail']);
    sh.appendRow([new Date(), username, status, detail || '']);
  } catch (e) { /* never throw from audit */ }
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function getUserSheet_(ss) {
  const preferred = ss.getSheetByName(USER_SHEET_NAME);
  if (preferred) return preferred;
  const sheets = ss.getSheets();
  for (const sh of sheets) {
    if (sh.getSheetId() === SHEET_GID) return sh;
  }
  return sheets[0] || null;
}

function clean_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeUsername_(value) {
  let s = String(value || '').trim();
  s = s.replace(/[^0-9a-zA-Z_]/g, '');
  if (/^9\d{9}$/.test(s)) return '0' + s;
  return s;
}

function json_(obj) {
  const json = JSON.stringify(obj);
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
