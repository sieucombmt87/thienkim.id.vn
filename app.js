<!doctype html>
<button id="adminMobileMenuBtn" class="admin-mobile-menu-btn" type="button">☰ Menu</button>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin Dashboard - THIENKIM UNIVERSE</title><link rel="stylesheet" href="../assets/css/style.css"><style id="admin-mobile-hardfix-79">
@media(max-width:768px){body{overflow-x:hidden!important}body>*{max-width:100vw!important}[class*="layout"],[class*="Layout"],[class*="shell"],[class*="Shell"]{display:block!important;width:100%!important;max-width:100%!important;overflow-x:hidden!important}[class*="side"],[class*="Side"],aside,nav{position:relative!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;overflow:visible!important}[class*="main"],[class*="Main"],[class*="content"],[class*="Content"]{width:100%!important;max-width:100%!important;margin:0!important;overflow-x:hidden!important;padding-left:12px!important;padding-right:12px!important}.menu,.nav-list{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}.menu a,.menu button,.nav-list a,.nav-list button,aside a,nav a{min-height:46px!important;font-size:13px!important;line-height:1.15!important;padding:9px!important;border-radius:14px!important}h1{font-size:32px!important;line-height:1.05!important}h2{font-size:23px!important}}
</style><style id="admin-mobile-menu-80">
@media(max-width:768px){
  body{overflow-x:hidden!important}
  .admin-mobile-menu-btn{
    position:fixed;top:76px;right:12px;z-index:9999;
    height:40px;border:0;border-radius:999px;padding:0 14px;
    background:#f6c945;color:#111;font-weight:1000;box-shadow:0 8px 20px rgba(0,0,0,.28)
  }
  body:not(.admin-menu-open) aside,
  body:not(.admin-menu-open) [class*="side"],
  body:not(.admin-menu-open) [class*="Side"]{
    display:none!important;
  }
  body.admin-menu-open aside,
  body.admin-menu-open [class*="side"],
  body.admin-menu-open [class*="Side"]{
    display:block!important;
    width:100%!important;max-width:100%!important;
    position:relative!important;height:auto!important;overflow:visible!important;
    padding:14px!important;
  }
  [class*="layout"],[class*="Layout"],[class*="shell"],[class*="Shell"]{
    display:block!important;width:100%!important;max-width:100%!important;overflow-x:hidden!important
  }
  [class*="main"],[class*="Main"],[class*="content"],[class*="Content"],main{
    width:100%!important;max-width:100%!important;margin:0!important;padding:14px!important;overflow-x:hidden!important
  }
}
</style>
<script id="admin-mobile-menu-80-js">
document.addEventListener("DOMContentLoaded",function(){
  var b=document.getElementById("adminMobileMenuBtn");
  if(b){b.addEventListener("click",function(){document.body.classList.toggle("admin-menu-open");});}
});
</script>
</head>
<body class="admin-page">
  <aside class="admin-sidebar">
    <div class="admin-logo">✦ <span>ThienKim<br>Universe</span></div>
    <div id="adminUserBox" class="admin-user"></div>
    <nav id="adminMenu"></nav>
    <button id="adminLogout">Đăng xuất</button><a href="../index.html">Trang chủ</a>
  </aside>
  <main class="admin-main"><h1>Dashboard</h1><p>Khu quản trị theo phân quyền Google Sheet.</p><section class="dash-grid" id="dashGrid"></section></main>
  <script src="../config/google-sheet.js"></script><script src="../assets/js/admin.js"></script>
<div id="buildVersion" title="THIENKIM build version">TKver8.0</div>
</body></html>
