// =============================================
// THIENKIM VERSION CONFIG
// Cập nhật VERSION khi có thay đổi
// =============================================
const TK_VERSION = '0.0.1';

// Auto-inject version badge vào cuối body
(function() {
  // Chờ DOM ready
  function init() {
    // Tạo version badge nếu chưa có
    let badge = document.getElementById('buildVersion');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'buildVersion';
      badge.style.cssText = 'position:fixed;bottom:8px;right:10px;font-size:10px;color:#667eea;opacity:0.5;z-index:9999;pointer-events:none;';
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
