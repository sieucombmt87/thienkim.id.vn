document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || "admin";
  const next = params.get("next") || "";

  const modeChip = document.getElementById("loginModeChip");
  const loginStar = document.getElementById("loginStarLogo");
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMessage");
  const clock = document.getElementById("adminLoginClock");

  const MODE_LABELS = {
    admin: "ADMIN GATEWAY",
    vip: "KHO BÁU VIP",
    sales: "TẠP HÓA CHỐT ĐƠN"
  };

  if(modeChip){
    modeChip.textContent = MODE_LABELS[mode] || "THIENKIM LOGIN";
  }

  // Logo ngôi sao trong cổng VIP/Sales sẽ chuyển thẳng sang cổng Admin.
  // Ở cổng Admin thì click logo chỉ làm sáng lại form.
  if(loginStar){
    loginStar.addEventListener("click", () => {
      if(mode === "vip" || mode === "sales"){
        location.href = "login.html?mode=admin";
      }else{
        loginStar.classList.add("pulse");
        setTimeout(() => loginStar.classList.remove("pulse"), 650);
      }
    });
  }

  function updateClock(){
    if(!clock) return;
    const now = new Date();
    clock.textContent = "🕒 " + now.toLocaleTimeString("vi-VN");
  }

  updateClock();
  setInterval(updateClock, 1000);

  if(!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if(!msg) return;
    msg.className = "login-message";
    msg.textContent = "Đang kết nối Google Sheet...";

    try{
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const remember = document.getElementById("remember").checked;

      let data;

      // TKver4.7 - Offline test accounts, không cần Google Sheet
      const offlineUsers = {
        "0947924444": {
          password: "0987471471",
          user: {
            username: "0947924444",
            full_name: "Admin Test Full",
            role: "Admin",
            status: "active",
            source: "offline",
            all_access: true,
            vip_access: "Y",
            create_video: "Y",
            ai_prompt: "Y",
            vault_access: "Y"
          }
        },
        "0987471471": {
          password: "0947924444",
          user: {
            username: "0987471471",
            full_name: "Boss Test Full",
            role: "Boss",
            status: "active",
            source: "offline",
            all_access: true,
            vip_access: "Y",
            create_video: "Y",
            ai_prompt: "Y"
          }
        }
      };

      if(offlineUsers[username] && offlineUsers[username].password === password){
        data = {
          ok: true,
          user: offlineUsers[username].user
        };
      }else{
        data = await apiLogin(username, password);
      }

      if(!data.ok){
        msg.className = "login-message error";
        msg.textContent = data.error || "Đăng nhập thất bại.";
        return;
      }

      if(mode === "admin" && data.user.role !== "Admin" && data.user.all_access !== true){
        msg.className = "login-message error";
        msg.textContent = "Cổng này chỉ dành cho Admin.";
        return;
      }

      saveUser(data.user, remember);
      if(mode === "vip" && typeof tkSaveVipSession === "function") tkSaveVipSession(data.user);
      msg.className = "login-message success";
      msg.textContent = "Đăng nhập thành công. Đang chuyển trang...";

      setTimeout(() => {
        if(next === "app"){
          location.href = "apps/index.html";
        }else if(data.user.role === "Admin" || mode === "admin"){
          location.href = "admin/index.html";
        }else{
          location.href = "index.html";
        }
      }, 650);
    }catch(err){
      msg.className = "login-message error";
      msg.textContent = "Không kết nối được API. Hãy kiểm tra Apps Script hoặc dùng tài khoản test offline để vào trước."; console.error(err);
    }
  });
});


/* TKver4.7 behavior: VIP/Sales star redirects to Admin; Admin star pulses only. */

function tkSaveVipSession(user){
  if(!user) return;
  localStorage.setItem("tk_vip_session", JSON.stringify({username:user.username, role:user.role, created_at:Date.now()}));
}
