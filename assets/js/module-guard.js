document.addEventListener("DOMContentLoaded", () => {
  const gate = document.body.dataset.gate || "public";
  const user = typeof getSavedUser === "function" ? getSavedUser() : null;
  const username = String(user?.username || "").toLowerCase();

  if(gate === "admin"){
    if(!user || user.role !== "Admin"){
      alert("Module này chỉ hiển thị cho quyền Admin.");
      location.href = "../login.html?mode=admin";
      return;
    }
  }

  if(gate === "vault"){
    if(!user || !(username === "0947924444" || username === "0947924444" || username === "0987471471")){
      alert("Vault chỉ dành cho user htbmt hoặc 10341.");
      location.href = "../index.html";
      return;
    }
  }
});
