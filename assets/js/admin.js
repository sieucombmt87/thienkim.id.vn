document.addEventListener("DOMContentLoaded", () => {
  const user = getSavedUser();
  if(!user){
    location.href = "../login.html?mode=admin";
    return;
  }

  if(user.role !== "Admin" && user.role !== "VIP" && user.role !== "Family" && user.all_access !== true){
    alert("Trang admin chỉ dành cho tài khoản có quyền quản trị.");
    location.href = "../index.html";
    return;
  }

  const role = user.role || "TVBH";
  document.getElementById("adminUserBox").innerHTML = `<b>${user.full_name || user.username}</b><br>${ROLE_LABELS[role] || role}`;

  const username = String(user.username || "").toLowerCase();
  const canVault = username === "0947924444";

  const modules = [
    ["dashboard","📊 Dashboard","Tổng quan hệ thống","../index.html"],
    ["profile","😎 Flex Profile","Quản lý nội dung Thiên Kim","../me/index.html"],
    ["profile_manager","✍️ Profile Manager","Thêm bài viết, ảnh, timeline","profile-manager.html"],
    ["academy_manager","📘 Academy Manager","Viết/sửa nội dung học tập","academy-manager.html"],
    ["learning","📚 Vũ Trụ Cày Cuốc","Tài liệu, khóa học, ghi chú","../academy/index.html"],
    ["vip","🔐 Kho Báu VIP","Dữ liệu nội bộ theo quyền","../bi/index.html"],
    ["sales","🛒 Tạp Hóa Chốt Đơn","Sản phẩm, đơn hàng, khách hàng","../store/index.html"],
    ["tools","🛠️ Bảo Bối Mì Ăn Liền","Công cụ dùng nhanh","../app/index.html"],
    ...(canVault ? [["vault","🧳 Vault","Kho riêng user 0947924444","../vault/index.html"]] : []),
    ["user_manager","👥 User Manager","Quản lý tài khoản","#"],
    ["role_manager","🛡️ Role Manager","Phân quyền","#"],
    ["sheet_sync","🔄 Google Sheet Sync","Đồng bộ dữ liệu","#"],
    ["reserve","📦 Kho Dự Trữ","Miền con và module chưa dùng","../reserve/index.html"],
    ...(typeof tkIsAppManager === "function" && tkIsAppManager(user) ? [["app_manager","📱 App Manager","Set ứng dụng VIP/thường","app-manager.html"]] : []),
    ["settings","⚙️ System Setting","Cài đặt hệ thống","#"],
    ["reports","📈 Báo cáo","Báo cáo theo quyền","../pages/module.html?module=bi"]
  ];

  const visibleModules = user.role === "Family" ? modules.filter(m => ["profile","profile_manager","learning","academy_manager","tools"].includes(m[0])) : modules;
  document.getElementById("adminMenu").innerHTML = visibleModules.map(m => `<a href="${m[3]}">${m[1]}</a>`).join("");
  document.getElementById("dashGrid").innerHTML = visibleModules.map(m => `<a class="dash-card" href="${m[3]}"><b>${m[1]}</b><span>${m[2]}</span></a>`).join("");

  document.getElementById("adminLogout").addEventListener("click", () => {
    clearUser();
    location.href = "../index.html";
  });
});
