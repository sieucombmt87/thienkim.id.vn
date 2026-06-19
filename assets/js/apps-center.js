
/* TKver7.7 guest usage sort */
function tkGetCurrentUserForAppCenter(){try{return JSON.parse(localStorage.getItem("tk_current_user")||localStorage.getItem("currentUser")||localStorage.getItem("tk_user")||"null")}catch(e){return null}}
function tkReadAppUsage(){try{return JSON.parse(localStorage.getItem("tk_app_usage")||"{}")}catch(e){return {}}}
function tkTrackAppUsage(key){try{const u=tkReadAppUsage();u[key]=(u[key]||0)+1;localStorage.setItem("tk_app_usage",JSON.stringify(u))}catch(e){}}
document.addEventListener("click",e=>{const a=e.target.closest("[data-app-key],.app-card,a[href*='/apps/']");if(!a)return;const key=a.dataset.appKey||a.dataset.key||(a.getAttribute("href")||"").split("/").filter(Boolean).pop()||a.textContent.trim();if(key)tkTrackAppUsage(key)});
function tkApplyGuestUsageDomSort(){const user=tkGetCurrentUserForAppCenter();if(user&&(user.role||user.phone||user.name||user.username))return;const grid=document.querySelector(".app-grid,.apps-grid,#appGrid");if(!grid)return;const usage=tkReadAppUsage();[...grid.children].sort((a,b)=>{const ak=a.dataset.appKey||a.dataset.key||a.textContent.trim();const bk=b.dataset.appKey||b.dataset.key||b.textContent.trim();return (usage[bk]||0)-(usage[ak]||0)}).forEach(el=>grid.appendChild(el))}
document.addEventListener("DOMContentLoaded",()=>setTimeout(tkApplyGuestUsageDomSort,180));

(function(){
  window.TK_APP_TOOLS = Array.isArray(window.TK_APP_TOOLS) ? window.TK_APP_TOOLS : (typeof TK_APP_TOOLS !== "undefined" ? TK_APP_TOOLS : []);
  const hasRace = window.TK_APP_TOOLS.some(app => app && app.key === "random-race");
  if(!hasRace){
    window.TK_APP_TOOLS.unshift({
      key:"random-race",
      title:"Random Race",
      desc:"Quay random bằng hiệu ứng cuộc đua, Top 1/Top 3 và lịch sử.",
      icon:"assets/images/app-icons/random-race.svg",
      vip:false
    });
  }
  document.addEventListener("DOMContentLoaded",()=>{
    const v=document.getElementById("buildVersion");
    if(v) v.textContent="TKver7.7";
  });
})();


(function(){
  if(document.getElementById("tk47AppCenterFix")) return;
  const style=document.createElement("style");
  style.id="tk47AppCenterFix";
  style.textContent=`
    .clean-app-tool .app-icon-wrap{display:inline-flex!important;position:relative!important;align-items:center!important;justify-content:center!important;margin-bottom:8px!important}
    .clean-app-tool .app-icon-wrap img,.clean-app-tool img{display:block!important;opacity:1!important;visibility:visible!important}
    .clean-app-tool .vip-logo-badge{display:inline-flex!important}
  `;
  document.head.appendChild(style);
})();

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
          <span class="app-icon-wrap">
            <img src="../${tool.icon}" alt="${tool.title}">
            ${tool.vip ? `<span class="vip-logo-badge">VIP</span>` : ""}
          </span>
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
