document.addEventListener("DOMContentLoaded", () => {
  const user = typeof getSavedUser === "function" ? getSavedUser() : null;
  const logout = document.getElementById("logoutBtn");
  const badge = document.getElementById("roleBadge");
  const adminStar = document.getElementById("adminStar");

  function canGoAdmin(u){
    if(!u) return false;
    const username = String(u.username || "").toLowerCase();
    const role = String(u.role || "").toLowerCase();
    return role === "admin" || role === "vip" || username === "0947924444" || u.all_access === true;
  }

  if(user){
    if(logout) logout.classList.remove("hidden");
    if(badge){
      const label = ROLE_LABELS[user.role] || user.role || "User";
      badge.textContent = `${label} • ${user.full_name || user.username}`;
      badge.classList.remove("hidden");
      if(canGoAdmin(user)){
        badge.classList.add("admin-return-chip");
        badge.title = "Quay lại trang Admin";
        badge.addEventListener("click", () => location.href = "admin/index.html");
      }
    }

    const username = String(user.username || "").toLowerCase();
    if(String(user.role || "").toLowerCase() === "admin") document.body.classList.add("role-admin");
    if(username === "0947924444") document.body.classList.add("vault-enabled");
  }

  if(logout){
    logout.addEventListener("click", () => {
      clearUser();
      localStorage.removeItem("tk_vip_session");
      location.href = "index.html";
    });
  }

  if(adminStar){
    adminStar.addEventListener("click", () => {
      if(canGoAdmin(getSavedUser())) location.href = "admin/index.html";
      else location.href = "login.html?mode=admin";
    });
  }

  const routeMap = {
    profile: "me/index.html",
    learning: "academy/index.html",
    tools: "apps/index.html",
    vip: "bi/index.html",
    sales: "store/index.html"
  };

  document.querySelectorAll(".card-shell").forEach(card => {
    card.addEventListener("click", e => {
      if(e.target.closest("a")) return;
      const section = card.dataset.open;
      const u = getSavedUser();
      if((section === "vip" || section === "sales") && !u){
        location.href = `login.html?mode=${section}`;
        return;
      }
      location.href = routeMap[section] || "index.html";
    });
  });
});
