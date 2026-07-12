/**
 * Template cho file cấu hình CỤC BỘ (không commit lên git).
 *
 * Hướng dẫn:
 * 1. Sao chép file này thành `config/local.js`
 * 2. Dán URL Apps Script /exec thật của mày vào TK_GOOGLE_SHEET_API_EXEC
 * 3. Reload trang — login và mọi API khác sẽ dùng URL production.
 *
 * Lấy URL /exec ở đâu?
 *   Apps Script → Deploy → Manage deployments → copy URL "Web app URL"
 *   Đảm bảo "Who has access" = "Anyone" (hoặc "Anyone with Google account")
 *   URL phải kết thúc bằng /exec, không phải /dev
 */

(function () {
  const TK_LOCAL_CONFIG = {
    // Dán URL /exec thật của mày vào đây
    TK_GOOGLE_SHEET_API_EXEC: 'https://script.google.com/macros/s/PASTE_YOUR_DEPLOYMENT_ID/exec'
  };

  if (typeof window !== 'undefined') {
    window.TK_LOCAL_CONFIG = TK_LOCAL_CONFIG;
  }
})();