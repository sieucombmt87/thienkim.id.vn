const GOOGLE_SHEET_API="https://script.google.com/macros/s/AKfycbxDK7dofRtVP1kwCgZIpvWBFJ0P2WZy9UVbirFRIO2YN070ggx6IVoX9HxM--u6-Cux/exec";
const ROLE_LABELS={"Admin":"👑 Admin","VIP":"👑 VIP","Boss":"💼 Boss","Leader":"🚀 Leader","Trưởng ca":"📋 Trưởng ca","TVBH":"🛒 TVBH","Family":"👨‍👩‍👧 Family"};
const ROLE_PERMISSIONS={"Admin":["dashboard","profile","learning","vip","sales","tools","user_manager","role_manager","sheet_sync","settings","reports"],"VIP":["dashboard","profile","learning","vip","sales","tools","app_manager","settings","reports"],"Boss":["dashboard","profile","learning","vip","sales","tools","user_manager","role_manager","sheet_sync","settings","reports"],"Leader":["dashboard","learning","vip","sales","tools","reports"],"Trưởng ca":["dashboard","sales","tools","reports"],"TVBH":["sales","tools"],"Family":["dashboard","profile_manager","academy_manager","profile","learning","tools"]};
function getSavedUser(){try{return JSON.parse(localStorage.getItem("tk_user")||sessionStorage.getItem("tk_user")||"null")}catch(e){return null}}
function saveUser(user,remember=true){(remember?localStorage:sessionStorage).setItem("tk_user",JSON.stringify(user));if(remember)sessionStorage.removeItem("tk_user")}
function clearUser(){localStorage.removeItem("tk_user");sessionStorage.removeItem("tk_user")}
async function apiLogin(username,password){
  const payload = {action:"login", username:String(username||"").trim(), password:String(password||"").trim()};

  async function readJsonResponse(res){
    const text = await res.text();
    try{
      return JSON.parse(text);
    }catch(e){
      return {
        ok:false,
        error:"API không trả về JSON. Có thể Apps Script chưa cấp quyền, chưa Deploy lại hoặc đang lỗi quyền truy cập.",
        raw:text.slice(0,300)
      };
    }
  }

  // Cách 1: POST text/plain để tránh preflight CORS
  try{
    const res = await fetch(GOOGLE_SHEET_API, {
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(payload),
      redirect:"follow"
    });
    const data = await readJsonResponse(res);
    if(data && data.ok !== undefined) return data;
  }catch(e){
    console.warn("POST login failed, fallback GET", e);
  }

  // Cách 2: GET fallback, dễ test trực tiếp trên trình duyệt
  try{
    const url = GOOGLE_SHEET_API
      + "?action=login"
      + "&username=" + encodeURIComponent(payload.username)
      + "&password=" + encodeURIComponent(payload.password)
      + "&t=" + Date.now();
    const res = await fetch(url, {method:"GET", redirect:"follow"});
    return await readJsonResponse(res);
  }catch(e){
    return {
      ok:false,
      error:"Không kết nối được API Google Sheet. Kiểm tra link Apps Script, quyền Deploy và đã Deploy phiên bản mới chưa.",
      detail:String(e && e.message ? e.message : e)
    };
  }
}


/* TKver3.6 - Session history + 80-minute inactivity timeout */
const TK_SESSION_TIMEOUT_MS = 80 * 60 * 1000;

function tkNow(){
  return Date.now();
}

function tkTouchSession(){
  const raw = localStorage.getItem("tk_user") || sessionStorage.getItem("tk_user");
  if(!raw) return;
  try{
    const user = JSON.parse(raw);
    user.last_active_at = tkNow();
    const storage = localStorage.getItem("tk_user") ? localStorage : sessionStorage;
    storage.setItem("tk_user", JSON.stringify(user));
  }catch(e){}
}

function tkIsSessionExpired(user){
  if(!user) return true;
  const last = Number(user.last_active_at || user.login_at || 0);
  if(!last) return false;
  return tkNow() - last > TK_SESSION_TIMEOUT_MS;
}

function tkSaveLoginHistory(user){
  try{
    const history = JSON.parse(localStorage.getItem("tk_login_history") || "[]");
    history.unshift({
      username: user.username,
      full_name: user.full_name || user.username,
      role: user.role || "User",
      login_at: user.login_at || tkNow()
    });
    localStorage.setItem("tk_login_history", JSON.stringify(history.slice(0, 20)));
  }catch(e){}
}

// Override old helpers with stronger session behavior
function saveUser(user, remember){
  user.login_at = user.login_at || tkNow();
  user.last_active_at = tkNow();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("tk_user", JSON.stringify(user));
  tkSaveLoginHistory(user);
}

function getSavedUser(){
  let raw = localStorage.getItem("tk_user") || sessionStorage.getItem("tk_user");
  if(!raw) return null;

  try{
    const user = JSON.parse(raw);
    if(tkIsSessionExpired(user)){
      clearUser();
      return null;
    }
    return user;
  }catch(e){
    clearUser();
    return null;
  }
}

function clearUser(){
  localStorage.removeItem("tk_user");
  sessionStorage.removeItem("tk_user");
}

["click","keydown","mousemove","scroll","touchstart"].forEach(evt => {
  window.addEventListener(evt, () => {
    if(window.__tkTouchTimer) return;
    window.__tkTouchTimer = setTimeout(() => {
      tkTouchSession();
      window.__tkTouchTimer = null;
    }, 1000);
  }, {passive:true});
});

setInterval(() => {
  const user = getSavedUser();
  if(!user) return;
  if(tkIsSessionExpired(user)){
    clearUser();
    alert("Phiên đăng nhập đã hết hạn do không sử dụng trong 80 phút.");
    location.href = location.pathname.includes("/admin/") ? "../login.html?mode=admin" : "login.html?mode=admin";
  }
}, 60 * 1000);
