document.addEventListener("DOMContentLoaded", () => {
  const user = typeof getSavedUser === "function" ? getSavedUser() : null;
  const status = document.getElementById("appUserStatus");
  const content = document.getElementById("appCenterContent");

  if(status){
    if(user){
      const name = user.full_name || user.username || "User";
      const role = user.role || "User";
      const canBack = typeof tkIsAdminBackUser === "function" ? tkIsAdminBackUser(user) : false;
      status.innerHTML = `
        <span class="hello-user ${canBack ? "admin-return-chip" : ""}" ${canBack ? 'data-admin-return="1" title="Quay lại Admin"' : ""}>
          ✨ Chào <b>${name}</b> <em>• ${role}</em>
        </span>
        <button id="quickMoodHeart" class="quick-mood-heart" type="button" title="Hôm nay bạn thế nào?">💗</button>
      `;
    }else{
      status.innerHTML = `<span class="hello-user">✨ Chào bạn</span>`;
    }
    status.classList.remove("hidden");
  }

  renderAppCenter(content, user);
  bindAppClicks();
  bindHeaderActions();
});

function bindHeaderActions(){
  document.querySelectorAll("[data-admin-return]").forEach(el => {
    el.addEventListener("click", () => location.href = "../admin/index.html");
  });
  const heart = document.getElementById("quickMoodHeart");
  if(heart){
    heart.addEventListener("click", () => {
      alert("Thiên Kim chúc bạn hôm nay nhẹ nhàng, tập trung và thật nhiều năng lượng tích cực 💗");
    });
  }
}

function appUrl(tool){
  if(tool.key === "create-video") return "ai-video/";
  if(tool.key === "ai-prompt") return "ai-prompt/";
  return tool.key + "/";
}

function renderAppCenter(box, user){
  if(!box) return;
  const apps = typeof tkGetSortedApps === "function" ? tkGetSortedApps(user) : TK_APP_TOOLS;
  const showManager = typeof tkIsAppManager === "function" ? tkIsAppManager(user) : false;
  box.innerHTML = `
    ${showManager ? `<div class="app-manager-inline"><button class="app-manager-shortcut" onclick="location.href='../admin/app-manager.html'">⚙️ App Manager</button></div>` : ""}
    <div class="app-grid clean-app-grid">
      ${apps.map(tool => `
        <a class="app-tool clean-app-tool ${tool.vip ? "vip-app" : ""}" href="${appUrl(tool)}" data-app-key="${tool.key}" data-vip="${tool.vip ? "1" : "0"}">
          ${tool.vip ? `<span class="vip-badge">👑 VIP</span>` : ""}
          <img src="../${tool.icon}" alt="${tool.title}">
          <strong>${tool.title}</strong>
        </a>`).join("")}
    </div>`;
}

function bindAppClicks(){
  document.querySelectorAll(".app-tool[data-app-key]").forEach(el => {
    el.addEventListener("click", e => {
      const key = el.dataset.appKey;
      const isVip = el.dataset.vip === "1";
      const user = typeof getSavedUser === "function" ? getSavedUser() : null;
      const apps = typeof tkGetAppConfig === "function" ? tkGetAppConfig() : TK_APP_TOOLS;
      const app = apps.find(a => a.key === key) || {key, title:key, vip:isVip};

      if(isVip){
        const hasVip = typeof tkUserHasVipAccess === "function" ? tkUserHasVipAccess(user, app) : !!user;
        const hasSession = typeof tkHasVipSession === "function" ? tkHasVipSession() : false;
        if(!user || (!hasVip && !hasSession)){
          e.preventDefault();
          sessionStorage.setItem("tk_pending_app", key);
          location.href = "../login.html?mode=vip&next=app";
          return;
        }
        if(typeof tkSaveVipSession === "function") tkSaveVipSession(user);
      }

      if(typeof tkTrackAppUse === "function") tkTrackAppUse(key);
    });
  });
}
