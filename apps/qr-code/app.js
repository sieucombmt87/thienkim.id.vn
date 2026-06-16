let type="qr", items=[], index=0, timer=null, failed=[], played=0;
const input=document.getElementById("contentInput"), preview=document.getElementById("preview");

function makeUrl(text){
  const v=encodeURIComponent(text||"");
  return type==="barcode"
    ? `https://bwipjs-api.metafloor.com/?bcid=code128&text=${v}&scale=3&height=12&includetext`
    : `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${v}`;
}

function parseInputList(raw){
  const text=String(raw||"").trim();
  if(!text) return [];
  let parts=text.split(/\r?\n|[\t,;]+/).map(x=>x.trim()).filter(Boolean);

  // Nếu người dùng copy từ app khác và trình duyệt biến xuống dòng thành khoảng trắng,
  // hệ thống tự tách các chuỗi số dài thành từng QR riêng.
  if(parts.length===1){
    const numericTokens=text.match(/[A-Za-z0-9_-]{8,}/g);
    if(numericTokens && numericTokens.length>1) parts=numericTokens;
  }
  return [...new Set(parts)];
}

function setItems(arr){
  items=[...new Set(arr.map(x=>String(x||"").trim()).filter(Boolean))];
  index=0; played=0; failed=[];
  saveList(); renderList(); showCurrent();
}

function saveList(){localStorage.setItem("tk_qr_items",JSON.stringify(items));}
function loadList(){try{items=JSON.parse(localStorage.getItem("tk_qr_items")||"[]");}catch(e){items=[];}renderList();showCurrent();}
function renderStats(){document.getElementById("totalCount").textContent=items.length;document.getElementById("playedCount").textContent=played;document.getElementById("failedCount").textContent=failed.length;}

function showCurrent(){
  renderStats();
  const text=items[index]||"";
  if(!text){preview.innerHTML="<span>Mã sẽ hiện ở đây...</span>";return;}
  preview.innerHTML=`<img id="codeImg" crossorigin="anonymous" src="${makeUrl(text)}" alt="code"><b class="qr-caption">${index+1}/${items.length||1}</b>`;
}

function renderList(){
  const list=document.getElementById("historyList");
  list.innerHTML=items.map((x,i)=>`<button type="button" data-i="${i}" class="${failed.includes(i)?"failed-item":""}" title="${x.replace(/"/g,'&quot;')}">${i+1}. ${x}</button>`).join("")||"Chưa có danh sách.";
}

input.addEventListener("input",()=>{
  clearTimeout(window.__qrParseTimer);
  window.__qrParseTimer=setTimeout(()=>{
    const arr=parseInputList(input.value);
    if(arr.length) setItems(arr);
  },250);
});

input.addEventListener("paste",()=>{
  setTimeout(()=>{
    const arr=parseInputList(input.value);
    if(arr.length) setItems(arr);
  },60);
});

document.getElementById("historyList").onclick=e=>{
  const b=e.target.closest("button");
  if(!b) return;
  index=Number(b.dataset.i);
  showCurrent();
};

document.querySelectorAll("[data-type]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-type]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  type=b.dataset.type;
  showCurrent();
});

document.getElementById("excelInput").onchange=async e=>{
  const file=e.target.files[0];
  if(!file) return;
  const text=await file.text().catch(()=>null);
  if(text){
    const arr=parseInputList(text);
    setItems(arr);
    input.value=arr.join("\n");
    return;
  }
  alert("File này chưa đọc được trực tiếp. Hãy xuất sang CSV để import nhanh.");
};

function play(){
  stop();
  if(!items.length){
    const arr=parseInputList(input.value);
    if(arr.length) setItems(arr);
    else return alert("Chưa có QR để chạy.");
  }
  const delay=Number(document.getElementById("delaySelect").value);
  timer=setInterval(()=>{
    played++;
    index++;
    if(index>=items.length){
      if(failed.length){
        items=failed.map(i=>items[i]);
        failed=[];
        index=0;
        input.value=items.join("\n");
        alert("Đã chạy hết. Bắt đầu chạy lại các mã lỗi.");
      }else{
        stop();
        index=Math.max(0,items.length-1);
        alert("Đã chạy xong.");
      }
    }
    showCurrent();
    renderList();
  },delay);
}

function stop(){if(timer){clearInterval(timer);timer=null;}}

document.getElementById("playBtn").onclick=play;
document.getElementById("stopBtn").onclick=stop;

document.addEventListener("keydown",e=>{
  if(e.code==="Space"&&items.length){
    e.preventDefault();
    if(!failed.includes(index)) failed.push(index);
    renderStats();
    renderList();
  }
});

document.getElementById("downloadBtn").onclick=()=>{
  const img=document.getElementById("codeImg");
  if(!img) return alert("Chưa có mã.");
  const a=document.createElement("a");
  a.href=img.src;
  a.download=(type==="qr"?"qr-code":"barcode")+".png";
  a.click();
};

document.getElementById("scanTab").onclick=async()=>{
  document.getElementById("scanBox").classList.toggle("hidden");
  if(!("BarcodeDetector" in window)){
    document.getElementById("scanResult").textContent="Trình duyệt chưa hỗ trợ quét mã trực tiếp.";
    return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
    const video=document.getElementById("video");
    video.srcObject=stream;
    await video.play();
    const detector=new BarcodeDetector({formats:["qr_code","code_128"]});
    const t=setInterval(async()=>{
      const codes=await detector.detect(video);
      if(codes.length){
        input.value=codes[0].rawValue;
        setItems([codes[0].rawValue]);
        document.getElementById("scanResult").textContent="Đã quét: "+codes[0].rawValue;
        clearInterval(t);
        stream.getTracks().forEach(x=>x.stop());
      }
    },800);
  }catch(e){
    document.getElementById("scanResult").textContent="Không mở được camera.";
  }
};

document.getElementById("createTab").onclick=()=>document.getElementById("scanBox").classList.add("hidden");
loadList();
