// =============================================
// THIENKIM VERSION CONFIG
// Cập nhật VERSION khi có thay đổi
// =============================================
const TK_VERSION = '0.0.12';

// Auto-inject version badge vào cuối body
(function() {
  // Chờ DOM ready
  function init() {
    // Tạo version badge nếu chưa có
    let badge = document.getElementById('buildVersion');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'buildVersion';
      badge.title = `THIENKIM build ${TK_VERSION}`;
      document.body.appendChild(badge);
    }
    badge.textContent = `TKver${TK_VERSION}`;
    badge.title = `THIENKIM build ${TK_VERSION}`;
    
    // Log version ra console
    console.log('%c THIENKIM ', 'background:#667eea;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold;', `v${TK_VERSION}`);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Export cho các module khác sử dụng
if (typeof window !== 'undefined') {
  window.TK_VERSION = TK_VERSION;
  window.TK_VER = 'TKver' + TK_VERSION;
}
