let type="qr", items=[], index=0, timer=null, failed=[], played=0, scanned=[], scanStream=null, scanTimer=null, lastScan="", jsQrReady=false;
const input=document.getElementById("contentInput"), preview=document.getElementById("preview");
let tapState={value:"",count:0,timer:null};

function isMobile(){return matchMedia("(max-width: 768px), (pointer: coarse)").matches;}
function makeUrl(text){const v=encodeURIComponent(text||"");return type==="barcode"?`https://bwipjs-api.metafloor.com/?bcid=code128&text=${v}&scale=3&height=12&includetext`:`https://api.qrserver.com/v1/create-qr-code/?size=520x520&data=${v}`;}
function parseInputList(raw){const text=String(raw||"").trim();if(!text)return[];let parts=text.split(/\r?\n|[\t,;]+/).map(x=>x.trim()).filter(Boolean);if(parts.length===1){const tokens=text.match(/[A-Za-z0-9_-]{8,}/g);if(tokens&&tokens.length>1)parts=tokens;}return[...new Set(parts)];}
function setItems(arr){items=[...new Set(arr.map(x=>String(x||"").trim()).filter(Boolean))];index=0;played=0;failed=[];saveList();renderAll();showCurrent();}
function saveList(){localStorage.setItem("tk_qr_items",JSON.stringify(items));localStorage.setItem("tk_qr_scanned",JSON.stringify(scanned));}
function loadList(){try{items=JSON.parse(localStorage.getItem("tk_qr_items")||"[]");}catch(e){items=[];}try{scanned=JSON.parse(localStorage.getItem("tk_qr_scanned")||"[]");}catch(e){scanned=[];}renderAll();showCurrent();}
function renderStats(){document.getElementById("totalCount").textContent=items.length;document.getElementById("playedCount").textContent=played;document.getElementById("failedCount").textContent=failed.length;document.getElementById("scannedCount").textContent=scanned.length;}
function currentText(){return items[index]||"";}
function showCurrent(){renderStats();const text=currentText();preview.classList.toggle("is-failed",failed.includes(index));if(!text){preview.innerHTML="<span>Mã sẽ hiện ở đây...</span>";return;}preview.innerHTML=`<img id="codeImg" crossorigin="anonymous" src="${makeUrl(text)}" alt="code"><b class="qr-caption">${index+1}/${items.length||1}</b>`;scrollCurrentItem();}
function renderAll(){renderStats();renderMainList();renderSelectorList();renderScannedList();}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function renderMainList(){const list=document.getElementById("historyList");list.innerHTML=items.map((x,i)=>{const cls=["qr-item",i===index?"active":"",failed.includes(i)?"failed":"",scanned.includes(x)?"done":""].join(" ");const status=failed.includes(i)?"Lỗi":(scanned.includes(x)?"Đã quét":"Chờ");return `<div class="${cls}" data-i="${i}"><span class="qr-index">${i+1}</span><span class="qr-text" title="${escapeHtml(x)}">${escapeHtml(x)}</span><span class="qr-status">${status}</span></div>`;}).join("")||"Chưa có danh sách.";}
function renderSelectorList(){const box=document.getElementById("qrSelectorList");if(!box)return;box.innerHTML=items.map((x,i)=>{const cls=["qr-select-item",i===index?"active":"",scanned.includes(x)?"done":""].join(" ");return `<div class="${cls}" data-select-i="${i}" title="${escapeHtml(x)}"><img class="qr-select-thumb" src="${makeUrl(x)}" alt=""><span class="qr-select-text">${i+1}. ${escapeHtml(x)}</span></div>`;}).join("")||"Chưa có QR để chọn.";}
function renderScannedList(){const html=scanned.map((x,i)=>`<div class="qr-item done" data-scan-i="${i}" data-scan-value="${escapeHtml(x)}"><span class="qr-index">${i+1}</span><span class="qr-text" title="${escapeHtml(x)}">${escapeHtml(x)}</span><span class="qr-status">OK</span></div>`).join("")||"Chưa có QR đã quét.";document.getElementById("scannedList").innerHTML=html;document.getElementById("scannedListCamera").innerHTML=html;}
function scrollCurrentItem(){const list=document.getElementById("historyList");const el=list?.querySelector(`[data-i="${index}"]`);if(el)el.scrollIntoView({block:"nearest",behavior:"smooth"});const sel=document.getElementById("qrSelectorList")?.querySelector(`[data-select-i="${index}"]`);if(sel)sel.scrollIntoView({block:"nearest",behavior:"smooth"});}
function markFailed(){if(!items.length)return;if(!failed.includes(index))failed.push(index);preview.classList.add("is-failed");renderAll();}
function markDone(text){const value=String(text||currentText()).trim();if(!value)return;if(!scanned.includes(value))scanned.push(value);saveList();renderAll();}
function nextItem(){if(!items.length)return;markDone(currentText());played++;index++;if(index>=items.length){if(failed.length){items=failed.map(i=>items[i]);failed=[];index=0;input.value=items.join("\n");saveList();alert("Đã chạy hết. Bắt đầu chạy lại các mã lỗi.");}else{stop();index=Math.max(0,items.length-1);alert("Đã chạy xong.");}}renderAll();showCurrent();}
function play(){stop();if(!items.length){const arr=parseInputList(input.value);if(arr.length)setItems(arr);else return alert("Chưa có QR để chạy.");}document.body.classList.toggle("qr-running",isMobile());const delay=Number(document.getElementById("delaySelect").value);timer=setInterval(nextItem,delay);}
function stop(){if(timer){clearInterval(timer);timer=null;}document.body.classList.remove("qr-running");}
function restart(){stop();index=0;played=0;failed=[];renderAll();showCurrent();}
function copyText(text){return navigator.clipboard.writeText(text).then(()=>alert("Đã copy."));}
function downloadText(filename,text,type="text/plain"){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
input.addEventListener("input",()=>{clearTimeout(window.__qrParseTimer);window.__qrParseTimer=setTimeout(()=>{const arr=parseInputList(input.value);if(arr.length)setItems(arr);},250);});
input.addEventListener("paste",()=>setTimeout(()=>{const arr=parseInputList(input.value);if(arr.length)setItems(arr);},60));
document.addEventListener("click",e=>{const row=e.target.closest("[data-i]");if(row){index=Number(row.dataset.i);showCurrent();renderAll();}const sel=e.target.closest("[data-select-i]");if(sel){index=Number(sel.dataset.selectI);showCurrent();renderAll();}});
document.querySelectorAll("[data-type]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-type]").forEach(x=>x.classList.remove("active"));b.classList.add("active");type=b.dataset.type;renderAll();showCurrent();});
document.getElementById("excelInput").onchange=async e=>{const file=e.target.files[0];if(!file)return;const text=await file.text().catch(()=>null);if(text){const arr=parseInputList(text);setItems(arr);input.value=arr.join("\n");return;}alert("File này chưa đọc được trực tiếp. Hãy xuất sang CSV để import nhanh.");};
document.getElementById("playBtn").onclick=play;document.getElementById("stopBtn").onclick=stop;document.getElementById("restartBtn").onclick=restart;
document.addEventListener("keydown",e=>{if(!isMobile()&&e.code==="Space"&&items.length){e.preventDefault();markFailed();}});
preview.addEventListener("click",()=>{if(isMobile())markFailed();});
document.getElementById("downloadBtn").onclick=()=>{const img=document.getElementById("codeImg");if(!img)return alert("Chưa có mã.");const a=document.createElement("a");a.href=img.src;a.download=(type==="qr"?"qr-code":"barcode")+".png";a.click();};
function copyAllItems(){if(!items.length)return alert("Chưa có danh sách QR.");copyText(items.join("\n"));}
function copyScanned(){if(!scanned.length)return alert("Chưa có dữ liệu đã quét.");copyText(scanned.join("\n"));}
function exportTxt(){if(!scanned.length)return alert("Chưa có dữ liệu đã quét.");downloadText("qr-da-quet.txt",scanned.join("\n"),"text/plain");}
function exportCsv(){if(!scanned.length)return alert("Chưa có dữ liệu đã quét.");const csv="STT,QR\n"+scanned.map((x,i)=>`${i+1},"${String(x).replace(/"/g,'""')}"`).join("\n");downloadText("qr-da-quet.csv",csv,"text/csv");}
function clearScanned(){if(!scanned.length)return alert("Danh sách đã quét đang trống.");if(confirm("Xóa toàn bộ QR đã quét? Hành động này không thể hoàn tác.")){scanned=[];saveList();renderAll();alert("Đã xóa danh sách đã quét.");}}
function handleScannedTap(value){if(!value)return;if(tapState.value!==value){tapState={value,count:0,timer:null};}tapState.count++;clearTimeout(tapState.timer);if(tapState.count===2){copyText(value);tapState.timer=setTimeout(()=>tapState={value:"",count:0,timer:null},650);}else if(tapState.count>=3){if(confirm("Xóa QR này khỏi danh sách đã quét?")){scanned=scanned.filter(x=>x!==value);saveList();renderAll();}tapState={value:"",count:0,timer:null};}else{tapState.timer=setTimeout(()=>tapState={value:"",count:0,timer:null},650);}}
document.addEventListener("click",e=>{const scan=e.target.closest("[data-scan-value]");if(scan)handleScannedTap(scan.dataset.scanValue);});
document.getElementById("copyAllBtn").onclick=copyAllItems;document.getElementById("copyAllBtn2").onclick=copyAllItems;document.getElementById("copyScannedBtn").onclick=copyScanned;document.getElementById("copyScannedBtn2").onclick=copyScanned;document.getElementById("exportTxtBtn").onclick=exportTxt;document.getElementById("exportTxtBtn2").onclick=exportTxt;document.getElementById("exportCsvBtn").onclick=exportCsv;document.getElementById("exportCsvBtn2").onclick=exportCsv;document.getElementById("clearScannedBtn").onclick=clearScanned;document.getElementById("clearScannedBtn2").onclick=clearScanned;document.getElementById("copyLastScanBtn").onclick=()=>lastScan?copyText(lastScan):alert("Chưa có mã vừa quét.");
document.getElementById("scanTab").onclick=()=>startScan();document.getElementById("scanRetryBtn").onclick=()=>startScan(true);document.getElementById("stopScanBtn").onclick=()=>{stopScan(true);showCreateMode();};document.getElementById("createTab").onclick=()=>{stopScan(true);showCreateMode();};

function showScanMode(){document.getElementById("createMode").classList.add("hidden");document.getElementById("scanBox").classList.remove("hidden");document.getElementById("scanTab").classList.add("active");document.getElementById("createTab").classList.remove("active");}
function showCreateMode(){document.getElementById("createMode").classList.remove("hidden");document.getElementById("scanBox").classList.add("hidden");document.getElementById("createTab").classList.add("active");document.getElementById("scanTab").classList.remove("active");}
function loadJsQr(){if(window.jsQR)return Promise.resolve(true);return new Promise(resolve=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s);});}

async function startScan(retry=false){
  showScanMode();
  const result=document.getElementById("scanResult");
  try{
    stopScan(false);
    const constraints={video:{facingMode:isMobile()?{ideal:"environment"}:"user",width:{ideal:1280},height:{ideal:720},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]},audio:false};
    scanStream=await navigator.mediaDevices.getUserMedia(constraints).catch(()=>navigator.mediaDevices.getUserMedia({video:true,audio:false}));
    const video=document.getElementById("video");
    video.srcObject=scanStream;
    video.setAttribute("playsinline","true");
    video.muted=true;
    await video.play();
    result.textContent=retry?"Đang quét lại...":"Đang chờ quét...";
    const hasDetector="BarcodeDetector" in window;
    const detector=hasDetector?new BarcodeDetector({formats:["qr_code","code_128"]}):null;
    const jsqrLoaded=await loadJsQr();
    const canvas=document.getElementById("scanCanvas");
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    scanTimer=setInterval(async()=>{
      try{
        let value="";
        if(detector){
          const codes=await detector.detect(video);
          if(codes.length)value=codes[0].rawValue;
        }
        if(!value && jsqrLoaded && window.jsQR && video.videoWidth>0){
          canvas.width=video.videoWidth;canvas.height=video.videoHeight;
          ctx.drawImage(video,0,0,canvas.width,canvas.height);
          const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
          const code=jsQR(imageData.data, imageData.width, imageData.height, {inversionAttempts:"attemptBoth"});
          if(code)value=code.data;
        }
        if(value)onScanValue(value);
      }catch(err){}
    },420);
  }catch(e){
    result.innerHTML='<span class="scan-error-note">Không mở được camera. Kiểm tra quyền camera hoặc dùng HTTPS.</span>';
    if(confirm("Quét không được. Bạn muốn quét lại không?"))startScan(true);
  }
}
function onScanValue(value){
  if(!value || value===lastScan)return;
  lastScan=value;
  markDone(value);
  document.getElementById("scanResult").textContent=value;
  if(!items.includes(value)){items.push(value);input.value=items.join("\n");saveList();}
  renderAll();
  setTimeout(()=>{if(lastScan===value)lastScan="";},900);
}
function stopScan(hide=true){if(scanTimer){clearInterval(scanTimer);scanTimer=null;}if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null;}if(hide)document.getElementById("scanBox").classList.add("hidden");}
loadList();
