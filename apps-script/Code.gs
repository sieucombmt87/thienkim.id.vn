/**
 * TKver4.0 - Google Sheet Login API
 * Dùng cho Google Apps Script Web App.
 *
 * Sheet link hiện tại:
 * https://docs.google.com/spreadsheets/d/11vvybEWeClcJFCZIchZ12MsClXDPJ-39iRNQtWGpRDs/edit?gid=1334014683
 *
 * Cột gợi ý:
 * username | password | role | full_name | status | note
 *
 * status nên để: active
 */

const SPREADSHEET_ID = '11vvybEWeClcJFCZIchZ12MsClXDPJ-39iRNQtWGpRDs';
const SHEET_GID = 1334014683;

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
      return json_({ ok: true, message: 'TK API OK', time: new Date().toISOString() });
    }

    if (action === 'login') {
      return login_(params);
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
      // Cho phép form-urlencoded/text fallback nếu cần
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
    return json_({
      ok: false,
      error: 'Sheet thiếu cột bắt buộc: username, password, role.'
    });
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

      // TKver4.0: trả thêm các cột mở rộng nếu có trong Google Sheet
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
  return String(value === null || value === undefined ? '' : value).trim();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
