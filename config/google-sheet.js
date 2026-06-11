const GOOGLE_SHEET_API="https://script.google.com/macros/s/AKfycbxDK7dofRtVP1kwCgZIpvWBFJ0P2WZy9UVbirFRIO2YN070ggx6IVoX9HxM--u6-Cux/exec";
const ROLE_LABELS={"Admin":"👑 Admin","Boss":"💼 Boss","Leader":"🚀 Leader","Trưởng ca":"📋 Trưởng ca","TVBH":"🛒 TVBH"};
const ROLE_PERMISSIONS={"Admin":["dashboard","profile","learning","vip","sales","tools","user_manager","role_manager","sheet_sync","settings"],"Boss":["dashboard","profile","learning","vip","sales","tools","user_manager","role_manager","sheet_sync","settings","reports"],"Leader":["dashboard","learning","vip","sales","tools","reports"],"Trưởng ca":["dashboard","sales","tools","reports"],"TVBH":["sales","tools"]};
function getSavedUser(){try{return JSON.parse(localStorage.getItem("tk_user")||sessionStorage.getItem("tk_user")||"null")}catch(e){return null}}
function saveUser(user,remember=true){(remember?localStorage:sessionStorage).setItem("tk_user",JSON.stringify(user));if(remember)sessionStorage.removeItem("tk_user")}
function clearUser(){localStorage.removeItem("tk_user");sessionStorage.removeItem("tk_user")}
async function apiLogin(username,password){const res=await fetch(GOOGLE_SHEET_API,{method:"POST",body:JSON.stringify({action:"login",username,password})});return await res.json()}
