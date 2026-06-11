const TK_MODULES = {
  me: {
    title: "Flex Profile Chủ Tịch 😎",
    domain: "me.thienkim.id.vn",
    description: "Trang giới thiệu bản thân, hành trình, sở thích, hình ảnh và portfolio của Thiên Kim.",
    access: "public"
  },
  academy: {
    title: "Vũ Trụ Cày Cuốc 📚",
    domain: "academy.thienkim.id.vn",
    description: "Khu vực học tập: tài liệu, ghi chú, khóa học, SOP và nội dung đào tạo.",
    access: "public"
  },
  bi: {
    title: "Kho Báu VIP 🔐",
    domain: "bi.thienkim.id.vn",
    description: "Khu dữ liệu VIP, dashboard, báo cáo và dữ liệu quan trọng theo phân quyền.",
    access: "login"
  },
  store: {
    title: "Tạp Hóa Chốt Đơn 🛒",
    domain: "store.thienkim.id.vn",
    description: "Khu bán hàng: nước hoa, son, combo, phân phối và quản lý đơn.",
    access: "login"
  },
  app: {
    title: "Bảo Bối Mì Ăn Liền 🛠️",
    domain: "app.thienkim.id.vn",
    description: "Tiện ích dùng nhanh: lịch, bảng tính, cloud, ghi chú và AI tools.",
    access: "public"
  },
  vault: {
    title: "Vault",
    domain: "vault.thienkim.id.vn",
    description: "Kho dữ liệu đặc quyền. Chỉ user htbmt, 10341 hoặc Admin offline có toàn quyền.",
    access: "vault"
  },
  admin: {
    title: "Admin",
    domain: "admin.thienkim.id.vn",
    description: "Khu quản trị hệ thống dành riêng cho Admin.",
    access: "admin"
  },
  crm: {
    title: "CRM",
    domain: "crm.thienkim.id.vn",
    description: "Quản lý khách hàng, lịch sử chăm sóc, phân loại lead và pipeline bán hàng.",
    access: "admin"
  },
  ai: {
    title: "AI",
    domain: "ai.thienkim.id.vn",
    description: "Công cụ AI, prompt, trợ lý nội bộ và automation.",
    access: "admin"
  },
  erp: {
    title: "ERP",
    domain: "erp.thienkim.id.vn",
    description: "Quản trị vận hành, kho, tài chính và quy trình nội bộ.",
    access: "admin"
  },
  hr: {
    title: "HR",
    domain: "hr.thienkim.id.vn",
    description: "Nhân sự, ca làm, KPI, đào tạo và hồ sơ đội ngũ.",
    access: "admin"
  },
  wiki: {
    title: "Wiki",
    domain: "wiki.thienkim.id.vn",
    description: "Kho tri thức nội bộ, checklist, hướng dẫn và tài liệu chuẩn.",
    access: "admin"
  }
};

function tkGetModule(key){
  return TK_MODULES[key] || null;
}

function tkCanAccess(module, user){
  if(!module) return false;

  const username = String(user?.username || "").toLowerCase();

  // TKver1.9: tài khoản test full quyền cho toàn bộ trang
  if(user && (user.all_access === true || username === "0947924444" || username === "0987471471")){
    return true;
  }

  if(module.access === "public") return true;
  if(module.access === "login") return !!user;
  if(module.access === "admin") return !!user && user.role === "Admin";
  if(module.access === "vault"){
    return !!user && (username === "htbmt" || username === "10341" || username === "0947924444" || username === "0987471471");
  }
  return false;
}
