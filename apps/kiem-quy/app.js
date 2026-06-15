const DENOMS=[500000,200000,100000,50000,20000,10000,5000,2000,1000,500];
const fmt=n=>Number(n||0).toLocaleString("vi-VN");
const parse=v=>Number(String(v||"").replace(/[^\d-]/g,""))||0;
const rows=document.getElementById("cashRows");
function renderRows(){
 rows.innerHTML=DENOMS.map(d=>`<tr><td>${d>=1000?d/1000+"k":d}</td><td><input data-denom="${d}" inputmode="numeric" value="0"></td><td id="sum-${d}">0</td></tr>`).join("");
 rows.querySelectorAll("input").forEach(i=>i.addEventListener("input",calc));
 calc();
}
function calc(){
 let total=0;
 rows.querySelectorAll("input").forEach(i=>{
   const denom=Number(i.dataset.denom); const qty=parse(i.value); const sum=denom*qty;
   total+=sum; document.getElementById("sum-"+denom).textContent=fmt(sum);
 });
 document.getElementById("countTotal").textContent=fmt(total);
 const sys=parse(document.getElementById("systemTotal").value);
 const diff=total-sys;
 document.getElementById("diffTotal").textContent=fmt(diff);
 document.getElementById("diffTotal").style.color=diff===0?"#ffe98b":(diff>0?"#00d9ff":"#ff6b6b");
}
document.getElementById("systemTotal").addEventListener("input",calc);
document.getElementById("clearBtn").onclick=()=>{rows.querySelectorAll("input").forEach(i=>i.value=0);document.getElementById("systemTotal").value="";calc();};
document.getElementById("saveBtn").onclick=()=>{
 const item={time:new Date().toLocaleString("vi-VN"), total:document.getElementById("countTotal").textContent, system:document.getElementById("systemTotal").value, diff:document.getElementById("diffTotal").textContent};
 const list=JSON.parse(localStorage.getItem("tk_cash_history")||"[]"); list.unshift(item); localStorage.setItem("tk_cash_history",JSON.stringify(list.slice(0,50))); renderHistory(); alert("Đã lưu lịch sử.");
};
document.getElementById("historyBtn").onclick=()=>{document.getElementById("historyBox").classList.toggle("hidden");renderHistory();};
function renderHistory(){
 const list=JSON.parse(localStorage.getItem("tk_cash_history")||"[]");
 document.getElementById("historyList").innerHTML=list.length?list.map(x=>`<div class="history-item"><b>${x.time}</b><br>Tổng: ${x.total} • Hệ thống: ${x.system||0} • Chênh: ${x.diff}</div>`).join(""):"Chưa có lịch sử.";
}
renderRows();