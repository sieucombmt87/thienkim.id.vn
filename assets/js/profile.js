let TK_PROFILE = {};
let TK_POSTS = [];
let TK_FILTER = { year: "all", month: "all" };

const TK_START_YEAR = 2017;
const TK_CURRENT_YEAR = new Date().getFullYear();
const TK_MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  renderInfo();
  setupFilters();
  setupTabs();
  renderAll();
  setupLightbox();
});

async function loadJson(path, fallback){
  try{
    const res = await fetch(path + "?t=" + Date.now());
    return res.ok ? await res.json() : fallback;
  }catch(e){ return fallback; }
}

async function loadData(){
  TK_PROFILE = await loadJson("../data/profile-info.json", {});
  const serverPosts = await loadJson("../data/profile-posts.json", []);
  let localPosts = [];
  try{ localPosts = JSON.parse(localStorage.getItem("tk_profile_posts") || "[]"); }catch(e){}

  const user = typeof getSavedUser === "function" ? getSavedUser() : null;
  const role = String(user?.role || "").toLowerCase();

  TK_POSTS = [...localPosts, ...serverPosts]
    .filter(post => {
      if((post.status || "published") !== "published") return false;
      if((post.visibility || "public") === "only") return role === "family";
      return true;
    })
    .map(normalizePost)
    .sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function normalizePost(post){
  const date = post.date || `${post.year || TK_CURRENT_YEAR}-${String(post.month || 1).padStart(2,"0")}-01`;
  const parts = String(date).split("-");
  const year = Number(post.year || parts[0] || TK_CURRENT_YEAR);
  const month = Number(post.month || parts[1] || 1);
  return {...post, year, month, date, images: Array.isArray(post.images) ? post.images : (post.cover_image ? [post.cover_image] : [])};
}

function asset(path){
  if(!path) return "../assets/images/ui/admin-star.png";
  if(path.startsWith("http") || path.startsWith("../")) return path;
  return "../" + path;
}

function $(id){ return document.getElementById(id); }

function renderInfo(){
  if($("profileName")) $("profileName").textContent = TK_PROFILE.name || "Thiên Kim";
  if($("profileSubtitle")) $("profileSubtitle").textContent = TK_PROFILE.subtitle || "Một vũ trụ nhỏ đầy sắc màu.";
  if($("profileIntro")) $("profileIntro").textContent = TK_PROFILE.intro || "Hành trình trưởng thành được lưu lại theo từng năm, từng tháng.";
  if($("profileAvatar")) $("profileAvatar").src = asset(TK_PROFILE.avatar);
  if($("profileQr")) $("profileQr").src = asset(TK_PROFILE.qr_contact);
  if($("profileSocials")){
    $("profileSocials").innerHTML = (TK_PROFILE.social_links || []).map(item => `<a href="${item.url || "#"}" target="_blank">${item.label || "Link"}</a>`).join("");
  }
}

function setupFilters(){
  const years = [];
  for(let year = TK_CURRENT_YEAR; year >= TK_START_YEAR; year--) years.push(year);

  if($("yearFilter")){
    $("yearFilter").innerHTML = `<option value="all">Tất cả năm</option>` + years.map(y => `<option value="${y}">${y}</option>`).join("");
    $("yearFilter").onchange = () => { TK_FILTER.year = $("yearFilter").value; renderAll(); };
  }
  if($("monthFilter")){
    $("monthFilter").innerHTML = `<option value="all">Tất cả tháng</option>` + TK_MONTHS.map(m => `<option value="${Number(m)}">Tháng ${m}</option>`).join("");
    $("monthFilter").onchange = () => { TK_FILTER.month = $("monthFilter").value; renderAll(); };
  }
  if($("clearFilter")){
    $("clearFilter").onclick = () => {
      TK_FILTER = {year:"all", month:"all"};
      if($("yearFilter")) $("yearFilter").value = "all";
      if($("monthFilter")) $("monthFilter").value = "all";
      renderAll();
    };
  }
}

function setupTabs(){
  document.querySelectorAll(".profile-tabs button").forEach(button => {
    button.onclick = () => {
      document.querySelectorAll(".profile-tabs button").forEach(x => x.classList.remove("active"));
      button.classList.add("active");
      document.querySelectorAll(".profile-tab-view").forEach(view => view.classList.add("hidden"));
      const target = $(button.dataset.tab + "View");
      if(target) target.classList.remove("hidden");
    };
  });
}

function filtered(){
  return TK_POSTS.filter(post =>
    (TK_FILTER.year === "all" || String(post.year) === String(TK_FILTER.year)) &&
    (TK_FILTER.month === "all" || String(post.month) === String(TK_FILTER.month))
  );
}

function renderAll(){
  renderMemoryWall();
  renderTimeline();
  renderAchievements();
  renderGoals();
  renderGallery();
}

function yearRange(){
  const years = [];
  for(let year = TK_CURRENT_YEAR; year >= TK_START_YEAR; year--) years.push(year);
  return years;
}

function postsFor(year, month){
  return TK_POSTS.filter(post => Number(post.year) === Number(year) && Number(post.month) === Number(month));
}

function randomFrom(list){ return list && list.length ? list[Math.floor(Math.random() * list.length)] : ""; }

function monthImage(year, month){
  const imgs = postsFor(year, month).flatMap(post => post.images && post.images.length ? post.images : (post.cover_image ? [post.cover_image] : []));
  return randomFrom(imgs.slice(0, 5));
}

function monthLabel(month){ return `Tháng ${String(month).padStart(2,"0")}`; }

function renderMemoryWall(){
  const box = $("memoryWall");
  if(!box) return;
  const years = yearRange().filter(year => TK_FILTER.year === "all" || String(year) === String(TK_FILTER.year));
  box.innerHTML = years.map(year => {
    const months = TK_MONTHS.map(Number).filter(month => TK_FILTER.month === "all" || String(month) === String(TK_FILTER.month));
    return `<section class="memory-year"><div class="memory-year-head"><h3>${year}</h3><span>${year === TK_CURRENT_YEAR ? "Hiện tại" : "Ký ức"}</span></div><div class="memory-month-grid">${months.map(month => renderMonthCard(year, month)).join("")}</div></section>`;
  }).join("");
}

function renderMonthCard(year, month){
  const posts = postsFor(year, month);
  const img = monthImage(year, month);
  const count = posts.reduce((sum, post) => sum + Math.max(1, (post.images || []).length), 0);
  return `<article class="memory-month-card ${posts.length ? "has-memory" : "is-empty"}"><div class="memory-thumb">${img ? `<img src="${asset(img)}" alt="${year} ${monthLabel(month)}">` : `<span>✦</span>`}</div><div class="memory-month-info"><b>${monthLabel(month)}</b><em>${count ? `${count} ảnh/kỷ niệm` : "Chưa cập nhật"}</em></div></article>`;
}

function renderTimeline(){
  const box = $("timelineView");
  if(!box) return;
  const posts = filtered().sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")));
  if(!posts.length){ box.innerHTML = `<div class="profile-empty">Chưa có bài viết.</div>`; return; }
  const grouped = {};
  posts.forEach(post => { (grouped[post.year] ||= []).push(post); });
  box.innerHTML = Object.keys(grouped).sort((a,b) => Number(b)-Number(a)).map(year => `<section class="timeline-year"><h3>${year}</h3><div class="timeline-list">${grouped[year].map(renderPostCard).join("")}</div></section>`).join("");
}

function renderPostCard(post){
  return `<article class="profile-post-card">${post.cover_image ? `<img src="${asset(post.cover_image)}" alt="${post.title || ""}" data-lightbox="${asset(post.cover_image)}">` : ""}<div><span>${String(post.date || "").split("-").reverse().join("/")}</span><h4>${post.title || "Kỷ niệm"}</h4><p>${post.content || ""}</p></div></article>`;
}

function renderAchievements(){
  const box = $("achievementsView");
  if(!box) return;
  const items = (TK_PROFILE.achievements || []).slice().sort((a,b) => Number(b.year || 0)-Number(a.year || 0));
  box.innerHTML = items.length ? `<div class="profile-list">${items.map(item => `<div><b>${item.year || ""}</b><span>${item.title || ""}</span></div>`).join("")}</div>` : `<div class="profile-empty">Chưa có thành tích.</div>`;
}

function renderGoals(){
  const box = $("goalsView");
  if(!box) return;
  const items = (TK_PROFILE.goals || []).slice().sort((a,b) => Number(b.year || 0)-Number(a.year || 0));
  box.innerHTML = items.length ? `<div class="goal-list">${items.map(item => `<div class="goal-item"><b>${item.year || ""} • ${item.title || ""}</b><div class="goal-bar"><span style="width:${Number(item.progress || 0)}%"></span></div></div>`).join("")}</div>` : `<div class="profile-empty">Chưa có mục tiêu.</div>`;
}

function renderGallery(){
  const box = $("galleryView");
  if(!box) return;
  const images = filtered().flatMap(post => post.images || []);
  box.innerHTML = images.length ? `<div class="profile-gallery">${images.map(img => `<img src="${asset(img)}" data-lightbox="${asset(img)}" alt="">`).join("")}</div>` : `<div class="profile-empty">Chưa có hình ảnh.</div>`;
}

function setupLightbox(){
  const lightbox = $("profileLightbox");
  const image = $("lightboxImage");
  const close = $("closeLightbox");
  document.addEventListener("click", event => {
    const target = event.target.closest("[data-lightbox]");
    if(!target || !lightbox || !image) return;
    image.src = target.dataset.lightbox;
    lightbox.classList.remove("hidden");
  });
  if(close) close.onclick = () => lightbox.classList.add("hidden");
  if(lightbox) lightbox.onclick = event => { if(event.target === lightbox) lightbox.classList.add("hidden"); };
}
