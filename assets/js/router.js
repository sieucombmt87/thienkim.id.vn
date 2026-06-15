document.addEventListener("DOMContentLoaded", () => {
  const key = document.body.dataset.module || new URLSearchParams(location.search).get("module") || "me";
  const module = tkGetModule(key);
  const user = typeof getSavedUser === "function" ? getSavedUser() : null;

  if(!module){
    document.querySelector("#moduleTitle").textContent = "Module không tồn tại";
    document.querySelector("#moduleDesc").textContent = "";
    return;
  }

  if(!tkCanAccess(module, user)){
    if(module.access === "admin"){
      alert("Module này chỉ dành cho Admin hoặc tài khoản test full quyền.");
      location.href = "../login.html?mode=admin";
      return;
    }

    if(module.access === "vault"){
      alert("Vault chỉ dành riêng cho user 0947924444.");
      location.href = "../index.html";
      return;
    }

    location.href = "../login.html?mode=" + (key === "store" ? "sales" : "vip");
    return;
  }

  document.title = module.title + " - THIENKIM UNIVERSE";
  document.querySelector("#moduleDomain").textContent = "";
  document.querySelector("#moduleTitle").textContent = cleanTitle(module.title);
  document.querySelector("#moduleDesc").textContent = "";

  const status = document.querySelector("#moduleStatus");
  if(status){
    if(user){
      const name = user.full_name || user.username || "User";
      const role = user.role || "User";
      status.innerHTML = renderUserStatus(user);
    }else{
      status.textContent = "✨ Chào bạn";
    }
    status.classList.remove("hidden");
  }

  const content = document.querySelector("#moduleContent");
  if(content){
    content.innerHTML = renderComfortLayer(user) + renderModule(module, key, user);
    bindComfortLayer();
    startWellnessReminder();
    bindAppCenterClicks();
  }
});

function cleanTitle(title){
  return String(title || "THIENKIM").replace(/[😎📚🔐🛒🛠️]/g, "").trim().toUpperCase();
}


function renderUserStatus(user){
  if(!user){
    return `<span class="hello-user">✨ Chào bạn</span>`;
  }
  const name = user.full_name || user.username || "User";
  const role = user.role || "User";
  const canBack = (typeof tkIsAdminBackUser === "function" ? tkIsAdminBackUser(user) : (role === "Admin" || role === "VIP"));
  return `
    <span class="hello-user ${canBack ? "admin-return-chip" : ""}" ${canBack ? 'data-admin-return="1" title="Quay lại trang Admin"' : ""}>
      ✨ Chào <b>${name}</b> <em>• ${role}</em>
    </span>
    <button id="quickMoodHeart" class="quick-mood-heart" type="button" title="Hôm nay bạn thế nào?">💗</button>
  `;
}

function renderAdminBackButton(user){
  const canBack = typeof tkIsAdminBackUser === "function" ? tkIsAdminBackUser(user) : false;
  return canBack ? `<a class="admin-back-link" href="../admin/index.html">← Quay lại Admin</a>` : "";
}

function renderComfortLayer(user){
  const name = user ? (user.full_name || user.username || "bạn") : "bạn";
  return `
    <aside id="comfortDrawer" class="comfort-drawer hidden">
      <div class="comfort-drawer-head">
        <div><span class="comfort-kicker">THIENKIM CARE</span><h2>Hôm nay ${name} thế nào?</h2></div>
        <button id="comfortClose" type="button">×</button>
      </div>
      <div class="comfort-drawer-body">
        <section class="comfort-card">
          <div class="mood-actions">
            <button data-mood="happy">😊 Vui vẻ</button>
            <button data-mood="sad">😔 Hơi buồn</button>
            <button data-mood="private">🤐 Không muốn chia sẻ</button>
          </div>
          <p id="moodMessage" class="mood-message">Chọn một cảm xúc nhỏ để Thiên Kim gửi bạn một lời nhắn nhẹ nhàng.</p>
        </section>
        <section class="comfort-card quote-card"><span class="comfort-kicker">🌟 Câu nói hôm nay</span><p id="dailyQuote"></p></section>
        <section class="comfort-card achievement-card">
          <span class="comfort-kicker">🎯 Thành tựu hôm nay</span>
          <div class="achievement-row"><input id="achievementInput" placeholder="Hôm nay bạn đã hoàn thành điều gì?"><button id="saveAchievement">Lưu</button></div>
          <p id="achievementSaved" class="mood-message"></p>
        </section>
        <section class="comfort-card login-history-card"><span class="comfort-kicker">🕘 Lịch sử đăng nhập</span><div id="loginHistoryList" class="login-history-list"></div></section>
      </div>
    </aside>
    <div id="wellnessToast" class="wellness-toast hidden">
      <button id="closeWellness" type="button">×</button>
      <h3>💧 Nghỉ nhẹ một chút nhé</h3>
      <p>Đã hơn 30 phút rồi. Đứng lên uống một ly nước hoặc vận động nhẹ để cơ thể thoải mái hơn rồi tiếp tục.</p>
      <button id="doneWellness" type="button">Đã uống rồi 👍</button>
    </div>
  `;
}

function bindComfortLayer(){
  document.querySelectorAll("[data-admin-return]").forEach(el=>{
    el.addEventListener("click",()=>{ location.href="../admin/index.html"; });
  });

  const heart = document.getElementById("quickMoodHeart");
  const drawerQuick = document.getElementById("comfortDrawer");
  if(heart && drawerQuick) heart.addEventListener("click", () => drawerQuick.classList.toggle("hidden"));

  const drawer=document.getElementById("comfortDrawer");
  const toggle=document.getElementById("comfortToggle");
  const close=document.getElementById("comfortClose");
  if(toggle&&drawer) toggle.addEventListener("click",()=>drawer.classList.toggle("hidden"));
  if(close&&drawer) close.addEventListener("click",()=>drawer.classList.add("hidden"));

  const messages={
    happy:"Tuyệt vời 🎉 Hãy tận dụng năng lượng tích cực này để hoàn thành một việc quan trọng nhất hôm nay.",
    sad:"Mọi chuyện rồi sẽ ổn 💜 Bạn không cần giải quyết tất cả ngay hôm nay. Chỉ cần đi tiếp một bước nhỏ là đủ.",
    private:"Không sao cả 🌙 Bạn không cần phải chia sẻ điều gì nếu chưa sẵn sàng. Chúc bạn một ngày thật bình an."
  };

  document.querySelectorAll("[data-mood]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const msg=document.getElementById("moodMessage");
      if(!msg) return;
      msg.textContent=messages[btn.dataset.mood]||messages.private;
      msg.classList.add("active");
      localStorage.setItem("tk_mood",btn.dataset.mood);
    });
  });

  renderLoginHistory();

  const quotes=[
    "Kỷ luật là cây cầu nối giữa mục tiêu và thành tựu.",
    "Bạn không cần hoàn hảo, chỉ cần tốt hơn hôm qua một chút.",
    "Một bước nhỏ hôm nay có thể mở ra một cánh cửa lớn ngày mai.",
    "Năng lượng tốt bắt đầu từ một tâm trí được chăm sóc.",
    "Làm chậm lại không có nghĩa là bỏ cuộc.",
    "Việc lớn bắt đầu bằng một hành động nhỏ nhưng đều đặn."
  ];
  const quoteEl=document.getElementById("dailyQuote");
  if(quoteEl) quoteEl.textContent=`“${quotes[new Date().getDate()%quotes.length]}”`;

  const input=document.getElementById("achievementInput");
  const saved=document.getElementById("achievementSaved");
  const btn=document.getElementById("saveAchievement");
  if(input) input.value=localStorage.getItem("tk_today_achievement")||"";
  if(saved&&input&&input.value) saved.textContent="Đã lưu thành tựu hôm nay ✨";
  if(btn&&input&&saved){
    btn.addEventListener("click",()=>{
      const value=(input.value||"").trim();
      if(!value){saved.textContent="Bạn có thể ghi một điều rất nhỏ cũng được.";return;}
      localStorage.setItem("tk_today_achievement",value);
      saved.textContent="Đã lưu rồi. Bạn làm tốt lắm ✨";
    });
  }
}

function startWellnessReminder(){
  if(sessionStorage.getItem("tk_wellness_shown")==="1") return;
  setTimeout(()=>{
    const toast=document.getElementById("wellnessToast");
    if(toast){toast.classList.remove("hidden");sessionStorage.setItem("tk_wellness_shown","1");}
  },30*60*1000);
  document.addEventListener("click",(e)=>{
    if(e.target&&(e.target.id==="closeWellness"||e.target.id==="doneWellness")){
      const toast=document.getElementById("wellnessToast");
      if(toast) toast.classList.add("hidden");
    }
  });
}

function renderLoginHistory(){
  const box=document.getElementById("loginHistoryList");
  if(!box) return;
  let history=[];
  try{history=JSON.parse(localStorage.getItem("tk_login_history")||"[]");}catch(e){}
  if(!history.length){box.innerHTML=`<p class="mood-message">Chưa có lịch sử đăng nhập.</p>`;return;}
  box.innerHTML=history.slice(0,4).map(item=>{
    const time=new Date(item.login_at).toLocaleString("vi-VN");
    return `<div class="login-history-item"><b>${item.full_name||item.username}</b><span>${item.role||"User"} • ${time}</span></div>`;
  }).join("");
}

function renderModule(module, key, user){
  if(module.type === "profile") return profileDemo();
  if(module.type === "academy") return renderAdminBackButton(user) + academyDemo();
  if(module.type === "bi") return biDemo();
  if(module.type === "store") return renderAdminBackButton(user) + storeDemo();
  if(module.type === "app") return appCenterDemo();
  if(module.type === "reserve") return renderAdminBackButton(user) + reserveDemo();
  if(module.type === "vault") return vaultDemo(user);
  if(module.type === "reserveItem") return reserveItemDemo(module);
  return genericDemo(module);
}

function profileDemo(){
  return `
    <div class="demo-grid two">
      <div class="demo-card hero-demo">
        <h2>Flex Profile Chủ Tịch</h2>
        <p>Không gian profile cá nhân, hành trình, hình ảnh, cột mốc và những điều tạo nên màu sắc riêng.</p>
        <div class="tag-row"><span>Profile</span><span>Timeline</span><span>Portfolio</span></div>
      </div>
      <div class="demo-card">
        <h3>Timeline demo</h3>
        <ul class="pretty-list">
          <li>🌟 Hành trình nổi bật</li>
          <li>🎨 Sở thích & phong cách</li>
          <li>🏆 Thành tựu nhỏ mỗi ngày</li>
          <li>💌 Kết nối và câu chuyện</li>
        </ul>
      </div>
    </div>${lessonHtml}`;
}

function academyDemo(){
  let lessons=[];try{lessons=JSON.parse(localStorage.getItem("tk_academy_lessons")||"[]")}catch(e){}
  const lessonHtml=lessons.length?`<div class="demo-card"><h3>📝 Bài học Family/Admin đã thêm</h3><div class="lesson-list">${lessons.map(l=>`<div class="lesson-item"><b>${l.title}</b><span>${l.category} • ${l.author||""}</span><p>${l.content}</p></div>`).join("")}</div></div>`:"";
  return `
    <div class="demo-grid three">
      <div class="demo-card"><h3>📚 Khóa học</h3><p>Danh sách bài học, video, tài liệu và lộ trình học tập.</p></div>
      <div class="demo-card"><h3>✅ Checklist</h3><p>Theo dõi nhiệm vụ học tập, bài tập và tiến độ hoàn thành.</p></div>
      <div class="demo-card"><h3>🧠 Ghi chú</h3><p>Lưu ý tưởng, công thức, SOP và tài liệu ôn tập nhanh.</p></div>
    </div>`;
}

function biDemo(){
  return `
    <div class="demo-grid three">
      <div class="demo-card stat"><b>128</b><span>Báo cáo</span></div>
      <div class="demo-card stat"><b>24</b><span>Dashboard</span></div>
      <div class="demo-card stat"><b>VIP</b><span>Dữ liệu phân quyền</span></div>
    </div>
    <div class="demo-card"><h3>🔐 Kho Báu VIP</h3><p>Khu dữ liệu VIP có thể nối Google Sheet, dashboard hoặc tài liệu nội bộ.</p></div>`;
}

function storeDemo(){
  const products = [
    ["Nước hoa TK Bloom", "390.000đ", "Hương ngọt nhẹ, phù hợp hằng ngày."],
    ["Son Velvet Cherry", "189.000đ", "Màu đỏ cherry, chất son mềm mịn."],
    ["Combo Nàng Thơ", "529.000đ", "Nước hoa + son + hộp quà."],
    ["Mini Perfume Set", "299.000đ", "Set trải nghiệm nhiều mùi."]
  ];
  return `
    <div class="store-hero">
      <div>
        <h2>Tạp Hóa Chốt Đơn</h2>
        <p>Demo trang bán nước hoa, son và combo. Có thể mở rộng giỏ hàng, tracking đơn và phân quyền nhà phân phối.</p>
      </div>
      <button>Khám phá sản phẩm →</button>
    </div>
    <div class="product-grid">
      ${products.map(p=>`<article class="product-card"><div class="product-img">💄</div><h3>${p[0]}</h3><p>${p[2]}</p><b>${p[1]}</b><button>Thêm vào giỏ</button></article>`).join("")}
    </div>`;
}

function appCenterDemo(){
  const user = typeof getSavedUser === "function" ? getSavedUser() : null;
  const apps = typeof tkGetSortedApps === "function" ? tkGetSortedApps(user) : TK_APP_TOOLS;
  const showManager = typeof tkIsAppManager === "function" ? tkIsAppManager(user) : false;
  return `
    ${renderAdminBackButton(user)}
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

function appUrl(tool){
  if(tool.key === "create-video") return "../apps/ai-video/";
  if(tool.key === "ai-prompt") return "../apps/ai-prompt/";
  return "../apps/" + tool.key + "/";
}

function reserveDemo(){
  return `
    <div class="demo-card">
      <h3>📦 Kho Dự Trữ Domain</h3>
      <p>Danh sách các miền con chưa sử dụng để sau này không bị quên khi mở rộng hệ sinh thái.</p>
    </div>
    <div class="domain-table">
      <div><b>Domain</b><b>Module</b><b>Trạng thái</b><b>Ghi chú</b></div>
      ${TK_RESERVE_DOMAINS.map(d=>`<div><span>${d.domain}</span><span>${d.module}</span><span>${d.status}</span><span>${d.note}</span></div>`).join("")}
    </div>`;
}

function vaultDemo(user){
  return `<div class="demo-card"><h3>🔒 Vault Private</h3><p>Xin chào ${user?.full_name || user?.username}. Đây là kho riêng chỉ user 0947924444 được truy cập.</p></div>`;
}

function reserveItemDemo(module){
  return `<div class="demo-card"><h3>${module.title}</h3><p>${module.description}</p><p>Module này đang nằm trong Kho Dự Trữ.</p></div>`;
}

function genericDemo(module){
  return `<div class="demo-card"><h3>${module.title}</h3><p>${module.description}</p></div>`;
}


/* TKver4.0 app click handler */
function bindAppCenterClicks(){
  document.querySelectorAll(".app-tool[data-app-key]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const key = el.dataset.appKey;
      const isVip = el.dataset.vip === "1";
      const user = typeof getSavedUser === "function" ? getSavedUser() : null;
      const apps = typeof tkGetAppConfig === "function" ? tkGetAppConfig() : TK_APP_TOOLS;
      const app = apps.find(a => a.key === key) || {key, title:key, vip:isVip};

      if(isVip){
        const hasVip = typeof tkUserHasVipAccess === "function" ? tkUserHasVipAccess(user, app) : !!user;
        const hasSession = typeof tkHasVipSession === "function" ? tkHasVipSession() : false;
        if(!user || (!hasVip && !hasSession)){
          sessionStorage.setItem("tk_pending_app", key);
          location.href = "../login.html?mode=vip&next=app";
          return;
        }
        if(typeof tkSaveVipSession === "function") tkSaveVipSession(user);
      }

      if(typeof tkTrackAppUse === "function") tkTrackAppUse(key);
      showAppLaunch(app);
    });
  });
}

function showAppLaunch(app){
  const key = app.key;
  let url = "../apps/" + key + "/";
  if(key === "create-video") url = "../apps/ai-video/";
  if(key === "ai-prompt") url = "../apps/ai-prompt/";
  location.href = url;
}
