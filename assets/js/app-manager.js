document.addEventListener("DOMContentLoaded", () => {
  const user = typeof getSavedUser === "function" ? getSavedUser() : null;
  if(!user || !(typeof tkIsAppManager === "function" ? tkIsAppManager(user) : false)){
    alert("Chỉ role VIP hoặc user 0947924444 được set ứng dụng VIP/thường.");
    location.href = "../login.html?mode=admin";
    return;
  }

  document.getElementById("adminUserBox").innerHTML = `<b>${user.full_name || user.username}</b><br>${user.role}`;
  document.getElementById("adminLogout").onclick = () => {
    clearUser();
    location.href = "../index.html";
  };

  renderAppManager();

  document.getElementById("resetAppConfig").onclick = () => {
    localStorage.removeItem("tk_app_config");
    renderAppManager();
  };

  document.getElementById("exportAppConfig").onclick = async () => {
    const json = JSON.stringify(JSON.parse(localStorage.getItem("tk_app_config") || "{}"), null, 2);
    document.getElementById("appConfigExport").value = json;
    try{ await navigator.clipboard.writeText(json); alert("Đã copy JSON cấu hình app."); }catch(e){}
  };
});

function renderAppManager(){
  const apps = typeof tkGetAppConfig === "function" ? tkGetAppConfig() : TK_APP_TOOLS;
  const box = document.getElementById("appManagerList");
  box.innerHTML = apps.map(app => `
    <div class="app-manager-row">
      <div class="app-manager-info">
        <img src="../${app.icon}" alt="${app.title}">
        <div><b>${app.title}</b><span>${app.key}</span></div>
      </div>
      <label class="vip-switch">
        <input type="checkbox" ${app.vip ? "checked" : ""} data-app-vip="${app.key}">
        <span>VIP</span>
      </label>
    </div>
  `).join("");

  document.querySelectorAll("[data-app-vip]").forEach(input => {
    input.addEventListener("change", () => {
      const key = input.dataset.appVip;
      let config = {};
      try{ config = JSON.parse(localStorage.getItem("tk_app_config") || "{}"); }catch(e){}
      config[key] = config[key] || {};
      config[key].vip = input.checked;
      localStorage.setItem("tk_app_config", JSON.stringify(config));
      renderAppManager();
    });
  });
}
