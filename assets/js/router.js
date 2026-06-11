document.addEventListener("DOMContentLoaded", () => {
  const key = document.body.dataset.module || new URLSearchParams(location.search).get("module") || "me";
  const module = tkGetModule(key);
  const user = typeof getSavedUser === "function" ? getSavedUser() : null;

  if(!module){
    document.querySelector("#moduleTitle").textContent = "Module không tồn tại";
    document.querySelector("#moduleDesc").textContent = "Bạn có thể copy file mẫu và tạo module mới trong config/modules.js.";
    return;
  }

  if(!tkCanAccess(module, user)){
    if(module.access === "admin"){
      alert("Module này chỉ dành cho Admin.");
      location.href = "../login.html?mode=admin";
      return;
    }

    if(module.access === "vault"){
      alert("Vault chỉ dành cho user htbmt, 10341 hoặc Admin offline.");
      location.href = "../index.html";
      return;
    }

    location.href = "../login.html?mode=" + (key === "store" ? "sales" : "vip");
    return;
  }

  document.title = module.title + " - THIENKIM UNIVERSE";
  document.querySelector("#moduleDomain").textContent = module.domain;
  document.querySelector("#moduleTitle").textContent = module.title;
  document.querySelector("#moduleDesc").textContent = module.description;

  const status = document.querySelector("#moduleStatus");
  if(status){
    if(user){
      status.textContent = `Đang đăng nhập: ${user.full_name || user.username} • ${user.role}`;
      status.classList.remove("hidden");
    }else{
      status.textContent = "Public module";
      status.classList.remove("hidden");
    }
  }
});
