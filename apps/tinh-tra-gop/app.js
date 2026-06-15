const fmt=n=>Number(n||0).toLocaleString("vi-VN");
const parse=v=>Number(String(v||"").replace(/[^\d.-]/g,""))||0;
const $=id=>document.getElementById(id);
function insTotal(){let t=0,n=[];document.querySelectorAll(".ins").forEach(i=>{if(i.checked){t+=Number(i.dataset.price);n.push(`${i.dataset.name}: ${fmt(i.dataset.price)}`)}});return {t,n};}
function calc(){
 const sale=parse($("salePrice").value), base=parse($("basePrice").value), fee=11000, ins=insTotal();
 const downType=$("downType").value, dp=parse($("downPercent").value);
 const down=downType==="%"?Math.round(sale*dp/100):dp;
 const remain=Math.max(0,sale-down);
 const months=parse($("months").value)||1, rate=parse($("interest").value)/100;
 const interest=remain*rate*months;
 const monthly=Math.round((remain+interest+fee*months)/months);
 const total=down+remain+interest+fee*months+ins.t;
 const diff=total-base;
 $("fee").textContent=fmt(fee);$("downTotal").textContent=fmt(down);$("remain").textContent=fmt(remain);$("monthly").textContent=fmt(monthly);$("totalPay").textContent=fmt(total);$("diff").textContent=fmt(diff);
 $("note").textContent=`* Đưa trước bao gồm: [ ${ins.n.join(" | ")} ].`;
 $("bhkv").textContent=fmt(211000);$("bhrv").textContent=fmt(715000);$("bhmr").textContent=fmt(750000);$("bh11").textContent=fmt(554000);
}
document.querySelectorAll("input,select").forEach(el=>el.addEventListener("input",calc));
document.querySelectorAll("select").forEach(el=>el.addEventListener("change",calc));
calc();