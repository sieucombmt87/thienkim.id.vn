document.addEventListener("DOMContentLoaded",()=>{const user=getSavedUser(),login=document.getElementById("topLoginBtn"),logout=document.getElementById("logoutBtn"),badge=document.getElementById("roleBadge");if(user){if(login){login.textContent=ROLE_LABELS[user.role]||user.role||"Đã đăng nhập";if(user.role==="Admin")login.href="admin/index.html"}if(logout)logout.classList.remove("hidden");if(badge){badge.textContent=`${ROLE_LABELS[user.role]||user.role} • ${user.full_name||user.username}`;badge.classList.remove("hidden")}}if(logout)logout.addEventListener("click",()=>{clearUser();location.href="index.html"});document.querySelectorAll(".card-shell").forEach(card=>{card.addEventListener("click",e=>{if(e.target.closest("a")||e.target.closest("button"))return;const section=card.dataset.open,u=getSavedUser();if((section==="vip"||section==="sales")&&!u){location.href=`login.html?mode=${section}`;return}const messages={profile:"Flex Profile Chủ Tịch sẽ cập nhật nội dung sau.",learning:"Vũ Trụ Cày Cuốc sẽ cập nhật nội dung sau.",tools:"Bảo Bối Mì Ăn Liền sẽ cập nhật module tiện ích sau.",vip:"Bạn đã có quyền vào Kho Báu VIP.",sales:"Bạn đã có quyền vào Tạp Hóa Chốt Đơn."};alert(messages[section]||"Đang phát triển.")})})});

/* V9 admin clock + role display */
(function(){
  function pad(n){ return String(n).padStart(2,"0"); }
  function updateClock(){
    const el = document.getElementById("systemClock");
    if(!el) return;
    const d = new Date();
    el.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  document.addEventListener("DOMContentLoaded", function(){
    updateClock();
    setInterval(updateClock, 1000 * 15);

    const clockBtn = document.getElementById("adminStar");
    if(clockBtn){
      clockBtn.addEventListener("click", function(){
        const u = typeof getSavedUser === "function" ? getSavedUser() : null;
        if(u && u.role === "Admin") location.href = "admin/index.html";
        else location.href = "login.html?mode=admin";
      });
    }

    const u = typeof getSavedUser === "function" ? getSavedUser() : null;
    if(u){
      const username = String(u.username || "").toLowerCase();
      if(u.role === "Admin") document.body.classList.add("role-admin");
      if(username === "htbmt" || username === "10341" || username === "0947924444" || username === "0987471471" || username === "0947924444" || username === "0987471471") document.body.classList.add("vault-enabled");
    }
  });
})();


/* TKver1.0 - Hidden Admin Star Gateway */
document.addEventListener("DOMContentLoaded", function(){
  const adminStar = document.getElementById("adminStar");
  if(adminStar){
    adminStar.addEventListener("click", function(){
      const u = typeof getSavedUser === "function" ? getSavedUser() : null;
      if(u && u.role === "Admin"){
        location.href = "admin/index.html";
      }else{
        location.href = "login.html?mode=admin";
      }
    });
  }

  const u = typeof getSavedUser === "function" ? getSavedUser() : null;
  if(u){
    const username = String(u.username || "").toLowerCase();
    if(u.role === "Admin") document.body.classList.add("role-admin");
    if(username === "htbmt" || username === "10341" || username === "0947924444" || username === "0987471471" || username === "0947924444" || username === "0987471471") document.body.classList.add("vault-enabled");
  }
});


/* TKver1.1 - Clean Star Admin Gateway */
document.addEventListener("DOMContentLoaded", function(){
  const adminStar = document.getElementById("adminStar");
  if(adminStar && !adminStar.dataset.bound){
    adminStar.dataset.bound = "1";
    adminStar.addEventListener("click", function(){
      location.href = "login.html?mode=admin";
    });
  }

  const u = typeof getSavedUser === "function" ? getSavedUser() : null;
  if(u){
    const username = String(u.username || "").toLowerCase();
    if(u.role === "Admin") document.body.classList.add("role-admin");
    if(username === "htbmt" || username === "10341" || username === "0947924444" || username === "0987471471" || username === "0947924444" || username === "0987471471") document.body.classList.add("vault-enabled");
  }
});


/* TKver1.8 - Professional module navigation */
document.addEventListener("DOMContentLoaded", () => {
  const routes = {
    profile: "me/index.html",
    learning: "academy/index.html",
    vip: "bi/index.html",
    sales: "store/index.html",
    tools: "app/index.html"
  };

  document.querySelectorAll(".card-shell").forEach(card => {
    const clone = card.cloneNode(true);
    card.parentNode.replaceChild(clone, card);

    clone.addEventListener("click", (e) => {
      if(e.target.closest("a") || e.target.closest("button")) return;

      const section = clone.dataset.open;
      const user = typeof getSavedUser === "function" ? getSavedUser() : null;

      if((section === "vip" || section === "sales") && !user){
        location.href = section === "sales" ? "login.html?mode=sales" : "login.html?mode=vip";
        return;
      }

      if(routes[section]){
        location.href = routes[section];
      }
    });
  });

  // Buttons inside cards navigate too
  const btnRoutes = [
    ["profile", "me/index.html"],
    ["learning", "academy/index.html"],
    ["sales", "store/index.html"],
    ["tools", "app/index.html"]
  ];

  btnRoutes.forEach(([section, url]) => {
    const card = document.querySelector(`.card-shell[data-open="${section}"]`);
    if(card){
      const btn = card.querySelector(".card-button");
      if(btn){
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          location.href = url;
        });
      }
    }
  });
});
