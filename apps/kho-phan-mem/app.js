// =============================================
// KHO PHẦN MỀM - THIENKIM APP
// Upload file lên Google Drive
// =============================================

// CẤU HÌNH - UPLOAD LÊN GOOGLE DRIVE CỦA BẠN
const GOOGLE_SCRIPT_URL = '';

// FOLDER ID GOOGLE DRIVE MẶC ĐỊNH
const DRIVE_FOLDERS = {
  android: '1et9mL9i5zN3FDs1w09BbvnOdBdZB8AmN',  // Folder App Android
  windows: '1WRvqQ_E6jD3ik93VUQ8VFFg5e5UsEzd7'     // Folder App Windows
};

// MẬT KHẨU ADMIN (thay đổi nếu cần)
const ADMIN_PASSWORD = 'thienkim2024';

// State
let currentFile = {
  android: null,
  windows: null
};

// Kiểm tra admin
function isAdmin() {
  return localStorage.getItem('tk_admin_mode') === 'true';
}

function setAdminMode(enabled) {
  localStorage.setItem('tk_admin_mode', enabled ? 'true' : 'false');
}

// =============================================
// KHỞI TẠO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  loadFileLists();
  initDragDrop();
  checkConfig();
  checkAdminStatus();
});

// =============================================
// KIỂM TRA & CẬP NHẬT TRẠNG THÁI ADMIN
// =============================================
function checkAdminStatus() {
  const adminBadge = document.getElementById('adminBadge');
  const adminPanel = document.getElementById('adminPanel');
  
  if (isAdmin()) {
    adminBadge.innerHTML = '🔓 Admin';
    if (adminPanel) adminPanel.style.display = 'block';
    showAdminFeatures(true);
  } else {
    adminBadge.innerHTML = '🔒 User';
    if (adminPanel) adminPanel.style.display = 'none';
    showAdminFeatures(false);
  }
}

function showAdminFeatures(show) {
  // Ẩn/hiện các nút upload, xóa, xem link
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = show ? '' : 'none';
  });
}

function toggleAdminLogin() {
  if (isAdmin()) {
    setAdminMode(false);
    checkAdminStatus();
    showToast('Đã thoát chế độ Admin', 'success');
  } else {
    const password = prompt('Nhập mật khẩu Admin:');
    if (password === ADMIN_PASSWORD) {
      setAdminMode(true);
      checkAdminStatus();
      showToast('Đã đăng nhập Admin thành công!', 'success');
    } else if (password !== null) {
      showToast('Sai mật khẩu!', 'error');
    }
  }
}

// =============================================
// TAB SWITCHING
// =============================================
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// =============================================
// DRAG & DROP
// =============================================
function initDragDrop() {
  ['android', 'windows'].forEach(type => {
    const zone = document.getElementById(`${type}Zone`);
    const input = document.getElementById(`${type}Input`);
    
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(type, e.dataTransfer.files[0]);
      }
    });
    
    input.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(type, e.target.files[0]);
      }
    });
  });
}

// =============================================
// XỬ LÝ CHỌN FILE
// =============================================
function handleFileSelect(type, file) {
  currentFile[type] = file;
  
  const nameInput = document.getElementById(`${type}Name`);
  const selectedDiv = document.getElementById(`${type}Selected`);
  const fileName = document.getElementById(`${type}FileName`);
  const fileSize = document.getElementById(`${type}FileSize`);
  
  // Auto fill tên từ file name (không extension)
  if (!nameInput.value) {
    nameInput.value = file.name.replace(/\.[^/.]+$/, '');
  }
  
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  selectedDiv.classList.add('show');
}

function clearFile(type) {
  currentFile[type] = null;
  document.getElementById(`${type}Input`).value = '';
  document.getElementById(`${type}Selected`).classList.remove('show');
  if (type === 'android' || type === 'windows') {
    document.getElementById(`${type}Name`).value = '';
    document.getElementById(`${type}Version`).value = '';
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================
// UPLOAD FILE
// =============================================
async function uploadFile(type) {
  // Kiểm tra quyền admin
  if (!isAdmin()) {
    showToast('❌ Chỉ Admin mới được phép tải file lên!', 'error');
    return;
  }
  
  const file = currentFile[type];
  const name = document.getElementById(`${type}Name`).value.trim();
  const version = document.getElementById(`${type}Version`).value.trim();
  
  // Validation
  if (!file) {
    showToast('Vui lòng chọn file!', 'error');
    return;
  }
  if (!name) {
    showToast('Vui lòng nhập tên phần mềm!', 'error');
    document.getElementById(`${type}Name`).focus();
    return;
  }
  
  const finalName = version ? `${name} v${version}` : name;
  
  // Kiểm tra cấu hình
  if (!GOOGLE_SCRIPT_URL) {
    // Lưu local nếu chưa có config
    saveFileLocal(type, finalName, file);
    return;
  }
  
  // Show loading
  showLoading(true);
  const btn = document.getElementById(`${type}Btn`);
  btn.disabled = true;
  
  try {
    // Đọc file
    const base64 = await readFileAsBase64(file);
    
    // Upload lên Drive
    const formData = new FormData();
    formData.append('fileName', finalName);
    formData.append('fileType', type);
    formData.append('fileData', base64);
    formData.append('fileSize', file.size);
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Lưu vào local
      saveFileLocal(type, finalName, result.link || '#');
      showToast(`✅ Đã tải lên: ${finalName}`, 'success');
      clearFile(type);
    } else {
      throw new Error(result.error || 'Upload thất bại');
    }
  } catch (err) {
    console.error('Upload error:', err);
    showToast(`❌ Lỗi: ${err.message}`, 'error');
  } finally {
    showLoading(false);
    btn.disabled = false;
  }
}

// =============================================
// ĐỌC FILE -> BASE64
// =============================================
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================================
// LƯU FILE VÀO LOCAL STORAGE
// =============================================
function saveFileLocal(type, name, link) {
  const storageKey = `tk_software_${type}`;
  let files = [];
  
  try {
    files = JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (e) {}
  
  files.unshift({
    name: name,
    link: link,
    date: new Date().toISOString(),
    type: type
  });
  
  // Giữ tối đa 50 file
  if (files.length > 50) {
    files = files.slice(0, 50);
  }
  
  localStorage.setItem(storageKey, JSON.stringify(files));
  loadFileLists();
  
  // Nếu không có link (chưa config), thông báo
  if (!link || link === '#') {
    showToast(`💾 Đã lưu tạm: ${name} (chưa upload lên Drive)`, 'success');
    showToast('⚠️ Cần cấu hình Google Apps Script để upload lên Drive', 'error');
  }
}

// =============================================
// TẢI DANH SÁCH FILE
// =============================================
function loadFileLists() {
  ['android', 'windows'].forEach(type => {
    const container = document.getElementById(`${type}Files`);
    const storageKey = `tk_software_${type}`;
    let files = [];
    
    try {
      files = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (e) {}
    
    if (files.length === 0) {
      container.innerHTML = `
        <div class="empty-list">
          <div class="icon">📂</div>
          <p>Chưa có file nào</p>
        </div>
      `;
      return;
    }
    
    const admin = isAdmin();
    
    container.innerHTML = files.map((file, index) => `
      <div class="file-item">
        <span class="file-icon">${type === 'android' ? '🤖' : '💻'}</span>
        <div class="file-info">
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-date">${formatDate(file.date)}</div>
        </div>
        <div class="file-actions">
          ${admin ? `
            <a href="${escapeHtml(file.link)}" target="_blank" class="btn-view admin-only" ${!file.link || file.link === '#' ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
              🔗 Mở link
            </a>
            <button class="btn-delete admin-only" onclick="deleteFile('${type}', ${index})">
              🗑️ Xóa
            </button>
          ` : `
            <a href="${escapeHtml(file.link)}" target="_blank" class="btn-view">
              ⬇️ Tải về
            </a>
          `}
        </div>
      </div>
    `).join('');
  });
}

function deleteFile(type, index) {
  // Kiểm tra quyền admin
  if (!isAdmin()) {
    showToast('❌ Chỉ Admin mới được phép xóa!', 'error');
    return;
  }
  
  const storageKey = `tk_software_${type}`;
  let files = [];
  
  try {
    files = JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (e) {}
  
  if (confirm('Bạn có chắc muốn xóa file này?')) {
    files.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(files));
    loadFileLists();
    showToast('Đã xóa file!', 'success');
  }
}

function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// =============================================
// LOADING & TOAST
// =============================================
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.classList.add('show');
  } else {
    overlay.classList.remove('show');
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// =============================================
// KIỂM TRA CẤU HÌNH
// =============================================
function checkConfig() {
  const notice = document.getElementById('configNotice');
  if (GOOGLE_SCRIPT_URL) {
    notice.style.display = 'none';
  } else {
    notice.style.display = 'flex';
  }
}

function showSetupGuide() {
  const guide = `<strong>📋 HƯỚNG DẪN CẤU HÌNH GOOGLE DRIVE</strong>

<strong>1️⃣</strong> Tạo Google Apps Script (script.google.com)

<strong>2️⃣</strong> Paste code sau vào <b>Code.gs</b>:

<button type="button" onclick="tkCopySetupGuide(this)" style="position:absolute;top:6px;right:6px;padding:6px 12px;border:1px solid rgba(255,255,255,.3);border-radius:8px;background:rgba(100,255,218,.2);color:#64ffda;cursor:pointer;font-size:12px;font-weight:600;">📋 Copy code</button>

<pre><code>function doPost(e) {
  const { fileName, fileType, fileData } = e.parameter;
  const folderId = fileType === 'android'
    ? '1et9mL9i5zN3FDs1w09BbvnOdBdZB8AmN'
    : '1WRvqQ_E6jD3ik93VUQ8VFFg5e5UsEzd7';
  const folder = DriveApp.getFolderById(folderId);
  const decoded = Utilities.base64Decode(fileData);
  const blob = Utilities.newBlob(decoded, 'application/octet-stream', fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, link: file.getUrl() })
  ).setMimeType(ContentService.MimeType.JSON);
}</code></pre>

<strong>3️⃣</strong> Deploy → New deployment → Web app
&nbsp;&nbsp;&nbsp;&nbsp;Execute as: Me
&nbsp;&nbsp;&nbsp;&nbsp;Who has access: Anyone

<strong>4️⃣</strong> Copy URL deployment và paste vào app.js (GOOGLE_SCRIPT_URL)

<small style="opacity:.7">✅ Folder Android: 1et9mL9i5zN3FDs1w09BbvnOdBdZB8AmN</small>
<small style="opacity:.7">✅ Folder Windows: 1WRvqQ_E6jD3ik93VUQ8VFFg5e5UsEzd7</small>`;

  tkShowGuideModal("Hướng dẫn cấu hình Google Drive", guide);
}

function tkShowGuideModal(title, bodyHtml) {
  let overlay = document.getElementById('tkGuideModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tkGuideModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)';
    overlay.innerHTML = `
      <div style="position:relative;max-width:680px;width:100%;max-height:90vh;background:linear-gradient(135deg,#1a1a3e,#0f0f23);border:1px solid rgba(255,255,255,.15);border-radius:18px;padding:24px;overflow:hidden;display:flex;flex-direction:column;color:#e6f1ff;box-shadow:0 20px 60px rgba(0,0,0,.6)">
        <button type="button" onclick="document.getElementById('tkGuideModal').style.display='none'" style="position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,.1);color:#fff;font-size:18px;cursor:pointer">✕</button>
        <h2 id="tkGuideTitle" style="margin:0 0 16px;color:#64ffda;font-size:18px"></h2>
        <div id="tkGuideBody" style="flex:1;overflow:auto;padding-right:8px;line-height:1.55;font-size:14px"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  }
  document.getElementById('tkGuideTitle').textContent = title;
  document.getElementById('tkGuideBody').innerHTML = bodyHtml;
  overlay.style.display = 'flex';
}

function tkCopySetupGuide(btn) {
  const code = `function doPost(e) {
  const { fileName, fileType, fileData } = e.parameter;
  const folderId = fileType === 'android'
    ? '1et9mL9i5zN3FDs1w09BbvnOdBdZB8AmN'
    : '1WRvqQ_E6jD3ik93VUQ8VFFg5e5UsEzd7';
  const folder = DriveApp.getFolderById(folderId);
  const decoded = Utilities.base64Decode(fileData);
  const blob = Utilities.newBlob(decoded, 'application/octet-stream', fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, link: file.getUrl() })
  ).setMimeType(ContentService.MimeType.JSON);
}`;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✅ Đã copy!';
    setTimeout(() => { btn.textContent = '📋 Copy code'; }, 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✅ Đã copy!';
    setTimeout(() => { btn.textContent = '📋 Copy code'; }, 2000);
  });
}
