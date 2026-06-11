const TK_MODULES = {
  me: {
    title: "Flex Profile Chủ Tịch 😎",
    domain: "me.thienkim.id.vn",
    description: "Trang giới thiệu bản thân, hành trình, sở thích, hình ảnh và portfolio của Thiên Kim.",
    access: "public",
    type: "profile"
  },
  academy: {
    title: "Vũ Trụ Cày Cuốc 📚",
    domain: "academy.thienkim.id.vn",
    description: "Khu vực học tập: tài liệu, ghi chú, khóa học, SOP và nội dung đào tạo.",
    access: "public",
    type: "academy"
  },
  bi: {
    title: "Kho Báu VIP 🔐",
    domain: "bi.thienkim.id.vn",
    description: "Khu dữ liệu VIP, dashboard, báo cáo và dữ liệu quan trọng theo phân quyền.",
    access: "login",
    type: "bi"
  },
  store: {
    title: "Tạp Hóa Chốt Đơn 🛒",
    domain: "store.thienkim.id.vn",
    description: "Khu bán hàng: nước hoa, son, combo, phân phối và quản lý đơn.",
    access: "login",
    type: "store"
  },
  app: {
    title: "Bảo Bối Mì Ăn Liền 🛠️",
    domain: "app.thienkim.id.vn",
    description: "App Center dùng nhanh: báo cáo, kiểm quỹ, QR, random, bài test, kho phần mềm và nhiều tiện ích khác.",
    access: "public",
    type: "app"
  },
  vault: {
    title: "Vault",
    domain: "vault.thienkim.id.vn",
    description: "Kho dữ liệu đặc quyền. Chỉ user 0947924444 được nhìn thấy và truy cập.",
    access: "vault",
    type: "vault"
  },
  admin: {
    title: "Admin",
    domain: "admin.thienkim.id.vn",
    description: "Khu quản trị hệ thống dành riêng cho Admin.",
    access: "admin",
    type: "admin"
  },
  reserve: {
    title: "Kho Dự Trữ",
    domain: "reserve.thienkim.id.vn",
    description: "Danh sách các miền con chưa sử dụng và các module tương lai để không bị quên.",
    access: "admin",
    type: "reserve"
  },
  crm: {
    title: "CRM",
    domain: "crm.thienkim.id.vn",
    description: "Quản lý khách hàng, lịch sử chăm sóc, phân loại lead và pipeline bán hàng.",
    access: "admin",
    type: "reserveItem"
  },
  ai: {
    title: "AI",
    domain: "ai.thienkim.id.vn",
    description: "Công cụ AI, prompt, trợ lý nội bộ và automation.",
    access: "admin",
    type: "reserveItem"
  },
  erp: {
    title: "ERP",
    domain: "erp.thienkim.id.vn",
    description: "Quản trị vận hành, kho, tài chính và quy trình nội bộ.",
    access: "admin",
    type: "reserveItem"
  },
  hr: {
    title: "HR",
    domain: "hr.thienkim.id.vn",
    description: "Nhân sự, ca làm, KPI, đào tạo và hồ sơ đội ngũ.",
    access: "admin",
    type: "reserveItem"
  },
  wiki: {
    title: "Wiki",
    domain: "wiki.thienkim.id.vn",
    description: "Kho tri thức nội bộ, checklist, hướng dẫn và tài liệu chuẩn.",
    access: "admin",
    type: "reserveItem"
  }
};

const TK_APP_TOOLS = [
  { key:"bao-cao", title:"Báo Cáo", desc:"Tổng hợp nhanh báo cáo ngày, tuần, tháng.", icon:"assets/images/app-icons/bao-cao.jpg" },
  { key:"bai-test", title:"Bài Test", desc:"Tạo bài kiểm tra, checklist và form đánh giá.", icon:"assets/images/app-icons/bai-test.jpg" },
  { key:"bau-cua", title:"Bầu Cua", desc:"Mini game/tiện ích random vui vẻ cho đội nhóm.", icon:"assets/images/app-icons/bau-cua.jpg" },
  { key:"random", title:"Random", desc:"Random tên, số, ca trực, nhiệm vụ hoặc lựa chọn.", icon:"assets/images/app-icons/random.jpg" },
  { key:"doc-truyen", title:"Đọc Truyện", desc:"Không gian đọc nhanh, lưu nội dung giải trí.", icon:"assets/images/app-icons/doc-truyen.jpg" },
  { key:"qr-code", title:"QR Code", desc:"Tạo mã QR cho link, nội dung, sản phẩm.", icon:"assets/images/app-icons/qr-code.jpg" },
  { key:"kho-phan-mem", title:"Kho Phần Mềm", desc:"Lưu link công cụ, phần mềm và tài nguyên tải nhanh.", icon:"assets/images/app-icons/kho-phan-mem.jpg" },
  { key:"kiem-quy", title:"Kiểm Quỹ", desc:"Ghi nhận thu chi, đối soát và kiểm quỹ nhanh.", icon:"assets/images/app-icons/kiem-quy.jpg" },
  { key:"tinh-tra-gop", title:"Tính Trả Góp", desc:"Tính khoản trả góp, lãi suất và kế hoạch thanh toán.", icon:"assets/images/app-icons/tinh-tra-gop.jpg" }
];

const TK_RESERVE_DOMAINS = [
  { domain:"crm.thienkim.id.vn", module:"CRM", status:"Dự trữ", note:"Quản lý khách hàng và pipeline." },
  { domain:"ai.thienkim.id.vn", module:"AI", status:"Dự trữ", note:"AI tools, prompt, automation." },
  { domain:"erp.thienkim.id.vn", module:"ERP", status:"Dự trữ", note:"Vận hành, kho, tài chính." },
  { domain:"hr.thienkim.id.vn", module:"HR", status:"Dự trữ", note:"Nhân sự, ca làm, KPI." },
  { domain:"wiki.thienkim.id.vn", module:"Wiki", status:"Dự trữ", note:"Kho tri thức nội bộ." },
  { domain:"docs.thienkim.id.vn", module:"Docs", status:"Tương lai", note:"Tài liệu chính thức." },
  { domain:"media.thienkim.id.vn", module:"Media", status:"Tương lai", note:"Hình ảnh, video, brand kit." },
  { domain:"team.thienkim.id.vn", module:"Team", status:"Tương lai", note:"Không gian đội nhóm." },
  { domain:"lab.thienkim.id.vn", module:"Lab", status:"Tương lai", note:"Thử nghiệm sản phẩm/module mới." }
];

function tkGetModule(key){
  return TK_MODULES[key] || null;
}

function tkCanAccess(module, user){
  if(!module) return false;

  const username = String(user?.username || "").toLowerCase();

  // Admin/Boss test vẫn full quyền các trang, ngoại trừ Vault chỉ user 0947924444.
  if(module.access === "vault"){
    return !!user && username === "0947924444";
  }

  if(user && (user.all_access === true || username === "0947924444" || username === "0987471471")){
    return true;
  }

  if(module.access === "public") return true;
  if(module.access === "login") return !!user;
  if(module.access === "admin") return !!user && user.role === "Admin";
  return false;
}
