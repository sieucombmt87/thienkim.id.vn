/* TK-EDU-LAB TKver1.1 - Academy route patch
   Dán đoạn này vào ĐẦU file /pages/module.html, ngay trước code render module hiện tại.
   Mục tiêu: giữ nguyên link cũ /pages/module.html?module=academy nhưng tự mở app học tập /apps/edu-lab/
*/
(function () {
  var params = new URLSearchParams(window.location.search);
  var moduleName = params.get('module');
  if (moduleName === 'academy') {
    window.location.replace('/apps/edu-lab/');
  }
})();
