// =============================================
// TK Auth Helpers - exposes session/user APIs to window
// Loaded on every page that needs to read the saved user.
// =============================================

(function() {
  const STORAGE_KEY = "tk_user_session";

  function getSavedUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const u = JSON.parse(raw);
      if (!u || !u.username) return null;
      return u;
    } catch (e) {
      return null;
    }
  }

  function saveUser(user, remember) {
    if (!user || !user.username) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      if (remember) {
        localStorage.setItem(STORAGE_KEY + "_remember", "1");
      } else {
        localStorage.removeItem(STORAGE_KEY + "_remember");
      }
    } catch (e) {
      console.warn("saveUser failed", e);
    }
  }

  function clearUser() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + "_remember");
      localStorage.removeItem("tk_vip_session");
    } catch (e) {}
  }

  const ROLE_LABELS = {
    admin: "ADMIN GATEWAY",
    vip: "KHO BÁU VIP",
    sales: "TAP HOA CHOT DON",
    boss: "Boss",
    leader: "Leader",
    family: "Family",
    truong_ca: "Truong ca",
    tvbh: "TVBH"
  };

  // Expose to window
  window.getSavedUser = getSavedUser;
  window.saveUser = saveUser;
  window.clearUser = clearUser;
  window.ROLE_LABELS = ROLE_LABELS;
})();