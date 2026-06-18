/* TKver6.1 HTTPS camera redirect */
if(location.protocol !== "https:" && location.hostname !== "localhost"){
  location.replace("https://" + location.host + location.pathname + location.search + location.hash);
}
let type="qr", items=[], index=0, timer=null, failed=[], played=0, scanned=[], scanStream=null, scanTimer=null, lastScan="";
const input=document.getElementById("contentInput"), preview=document.getElementById("preview");
let tapState={value:"",count:0,timer:null};
let holdTimer=null, holdFired=false;
let scanPool=[], singleAutoTimer=null, lastSingleAdded="";

function isMobile(){return matchMedia("(max-width: 768px), (pointer: coarse)").matches;}
function normalizeScannedList(list){return (Array.isArray(list)?list:[]).map(x=>typeof x==="string"?{value:x,state:"ok",deleted:false}:{value:String(x.value||""),state:x.state||"ok",deleted:!!x.deleted}).filter(x=>x.value);}
function makeUrl(text){const v=encodeURIComponent(text||"");return type==="barcode"?`https://bwipjs-api.metafloor.com/?bcid=code128&text=${v}&scale=3&height=12&includetext`:`https://api.qrserver.com/v1/create-qr-code/?size=520x520&data=${v}`;}
function parseInputList(raw){const text=String(raw||"").trim();if(!text)return[];let parts=text.split(/\r?\n|[\t,;]+/).map(x=>x.trim()).filter(Boolean);if(parts.length===1){const tokens=text.match(/[A-Za-z0-9_-]{8,}/g);if(tokens&&tokens.length>1)parts=tokens;}return[...new Set(parts)];}
function setItems(arr){items=[...new Set(arr.map(x=>String(x||"").trim()).filter(Boolean))];index=0;played=0;failed=[];saveList();renderAll();showCurrent();}
function saveList(){localStorage.setItem("tk_qr_items",JSON.stringify(items));localStorage.setItem("tk_qr_scanned",JSON.stringify(scanned));}
function loadList(){try{items=JSON.parse(localStorage.getItem("tk_qr_items")||"[]");}catch(e){items=[];}try{scanned=normalizeScannedList(JSON.parse(localStorage.getItem("tk_qr_scanned")||"[]"));}catch(e){scanned=[];}renderAll();showCurrent();}
function activeScannedValues(){return scanned.filter(x=>!x.deleted).map(x=>x.value);}
function renderStats(){document.getElementById("totalCount").textContent=items.length;document.getElementById("playedCount").textContent=played;document.getElementById("failedCount").textContent=failed.length;document.getElementById("scannedCount").textContent=activeScannedValues().length;}
function currentText(){return items[index]||"";}
function showCurrent(){renderStats();const text=currentText();preview.classList.toggle("is-failed",failed.includes(index));if(!text){preview.innerHTML="<span>Mã sẽ hiện ở đây...</span>";return;}preview.innerHTML=`<img id="codeImg" crossorigin="anonymous" src="${makeUrl(text)}" alt="code"><b class="qr-caption">${index+1}/${items.length||1}</b>`;scrollCurrentItem();}
function renderAll(){renderStats();renderMainList();renderScannedList();}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function renderMainList(){const list=document.getElementById("historyList");if(!list)return;const active=activeScannedValues();list.innerHTML=items.map((x,i)=>{const cls=["qr-item",i===index?"active":"",failed.includes(i)?"failed":"",active.includes(x)?"done":""].join(" ");const status=failed.includes(i)?"Lỗi":(active.includes(x)?"Đã quét":"Chờ");return `<div class="${cls}" data-i="${i}"><span class="qr-index">${i+1}</span><span class="qr-text" title="${escapeHtml(x)}">${escapeHtml(x)}</span><span class="qr-status">${status}</span></div>`;}).join("")||"Chưa có danh sách.";}
function renderScannedList(){const html=scanned.map((x,i)=>`<div class="qr-item done" data-scan-value="${escapeHtml(x.value)}" data-state="${escapeHtml(x.state||"ok")}" data-deleted="${x.deleted?"true":"false"}"><span class="qr-index">${i+1}</span><span class="qr-text" title="${escapeHtml(x.value)}">${escapeHtml(x.value)}</span><span class="qr-status">${x.deleted?"DELETE":(x.state==="copy"?"COPY":"OK")}</span></div>`).join("")||"Chưa có QR đã quét.";document.getElementById("scannedList").innerHTML=html;document.getElementById("scannedListCamera").innerHTML=html;}
function scrollCurrentItem(){const el=document.getElementById("historyList")?.querySelector(`[data-i="${index}"]`);if(el)el.scrollIntoView({block:"nearest",behavior:"smooth"});}
function markFailed(){if(!items.length)return;if(!failed.includes(index))failed.push(index);preview.classList.add("is-failed");renderAll();}
function addScanned(value){
  try{ if(typeof inventoryRecordScan==='function' && inventoryRows && inventoryRows.length) inventoryRecordScan(value); }catch(e){}value=String(value||"").trim();if(!value)return;scanned=scanned.filter(x=>x.value!==value);scanned.unshift({value,state:"ok",deleted:false});lastSingleAdded=value;saveList();renderAll();}
function markDone(text){addScanned(text||currentText());}
function nextItem(){if(!items.length)return;markDone(currentText());played++;index++;if(index>=items.length){if(failed.length){items=failed.map(i=>items[i]);failed=[];index=0;input.value=items.join("\n");saveList();alert("Đã chạy hết. Bắt đầu chạy lại các mã lỗi.");}else{stop();index=Math.max(0,items.length-1);alert("Đã chạy xong.");}}renderAll();showCurrent();}
function play(){stop();if(!items.length){const arr=parseInputList(input.value);if(arr.length)setItems(arr);else return alert("Chưa có QR để chạy.");}document.body.classList.toggle("qr-running",isMobile());const delay=Number(document.getElementById("delaySelect").value);timer=setInterval(nextItem,delay);}
function stop(){if(timer){clearInterval(timer);timer=null;}document.body.classList.remove("qr-running");}
function restart(){stop();index=0;played=0;failed=[];renderAll();showCurrent();}
function copyText(text,silent=false){return navigator.clipboard.writeText(text).then(()=>{if(!silent)flashCopy();});}
function flashCopy(){const r=document.getElementById("scanResult");if(r){const old=r.textContent;r.textContent="COPY";setTimeout(()=>{if(r.textContent==="COPY")r.textContent=lastScan||old;},420);}}
function downloadText(filename,text,type="text/plain"){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
input.addEventListener("input",()=>{clearTimeout(window.__qrParseTimer);window.__qrParseTimer=setTimeout(()=>{const arr=parseInputList(input.value);if(arr.length)setItems(arr);},250);});
input.addEventListener("paste",()=>setTimeout(()=>{const arr=parseInputList(input.value);if(arr.length)setItems(arr);},60));
document.addEventListener("click",e=>{const row=e.target.closest("[data-i]");if(row){index=Number(row.dataset.i);showCurrent();renderAll();}});
document.querySelectorAll("[data-type]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-type]").forEach(x=>x.classList.remove("active"));b.classList.add("active");type=b.dataset.type;showCurrent();});
document.getElementById("excelInput").onchange=async e=>{const file=e.target.files[0];if(!file)return;const text=await file.text().catch(()=>null);if(text){const arr=parseInputList(text);setItems(arr);input.value=arr.join("\n");return;}alert("File này chưa đọc được trực tiếp. Hãy xuất sang CSV để import nhanh.");};
document.getElementById("playBtn").onclick=play;document.getElementById("stopBtn").onclick=stop;document.getElementById("restartBtn").onclick=restart;
document.addEventListener("keydown",e=>{if(!isMobile()&&e.code==="Space"&&items.length){e.preventDefault();markFailed();}});
preview.addEventListener("click",()=>{if(isMobile())markFailed();});
document.getElementById("downloadBtn").onclick=()=>{const img=document.getElementById("codeImg");if(!img)return alert("Chưa có mã.");const a=document.createElement("a");a.href=img.src;a.download=(type==="qr"?"qr-code":"barcode")+".png";a.click();};
function copyAllItems(){if(!items.length)return alert("Chưa có danh sách QR.");copyText(items.join("\n"));}
function copyScanned(){const vals=activeScannedValues();if(!vals.length)return alert("Chưa có dữ liệu đã quét.");copyText(vals.join("\n"));}
function exportTxt(){const vals=activeScannedValues();if(!vals.length)return alert("Chưa có dữ liệu đã quét.");downloadText("qr-da-quet.txt",vals.join("\n"),"text/plain");}
function exportCsv(){const vals=activeScannedValues();if(!vals.length)return alert("Chưa có dữ liệu đã quét.");const csv="STT,QR\n"+vals.map((x,i)=>`${i+1},"${String(x).replace(/"/g,'""')}"`).join("\n");downloadText("qr-da-quet.csv",csv,"text/csv");}
function clearScanned(){if(!scanned.length)return alert("Danh sách đã quét đang trống.");if(confirm("Xóa toàn bộ QR đã quét? Hành động này không thể hoàn tác.")){scanned=[];saveList();renderAll();}}
function copyScannedItem(value){const item=scanned.find(x=>x.value===value);if(!item)return;item.state="copy";item.deleted=false;copyText(value,true);saveList();renderAll();}
function deleteScannedItem(value){const item=scanned.find(x=>x.value===value);if(!item)return;item.state="delete";item.deleted=true;saveList();renderAll();}
document.addEventListener("click",e=>{const scan=e.target.closest("[data-scan-value]");if(scan){const value=scan.dataset.scanValue;if(tapState.value!==value){clearTimeout(tapState.timer);tapState={value,count:0,timer:null};}tapState.count++;clearTimeout(tapState.timer);tapState.timer=setTimeout(()=>{if(tapState.count>=2)deleteScannedItem(value);tapState={value:"",count:0,timer:null};},260);}const cand=e.target.closest("[data-candidate-value]");if(cand)addScanned(cand.dataset.candidateValue);});
document.addEventListener("pointerdown",e=>{const scan=e.target.closest("[data-scan-value]");const result=e.target.closest(".scan-result-box,.scan-single-result");holdFired=false;clearTimeout(holdTimer);if(scan){holdTimer=setTimeout(()=>{holdFired=true;copyScannedItem(scan.dataset.scanValue);},650);}else if(result && lastScan){result.classList.add("hold-copy");holdTimer=setTimeout(()=>{holdFired=true;copyText(lastScan,true);flashCopy();result.classList.remove("hold-copy");},650);}});
document.addEventListener("pointerup",()=>{clearTimeout(holdTimer);document.querySelector(".scan-result-box,.scan-single-result")?.classList.remove("hold-copy");});
document.getElementById("copyAllBtn").onclick=copyAllItems;document.getElementById("copyScannedBtn").onclick=copyScanned;document.getElementById("copyScannedBtn2").onclick=copyScanned;document.getElementById("exportTxtBtn").onclick=exportTxt;document.getElementById("exportTxtBtn2").onclick=exportTxt;document.getElementById("exportCsvBtn").onclick=exportCsv;document.getElementById("exportCsvBtn2").onclick=exportCsv;document.getElementById("clearScannedBtn").onclick=clearScanned;document.getElementById("clearScannedBtn2").onclick=clearScanned;document.getElementById("copyLastScanBtn").onclick=()=>lastScan?copyText(lastScan):alert("Chưa có mã vừa quét.");
document.getElementById("scanTab").onclick=()=>startScan();document.getElementById("scanRetryBtn").onclick=()=>startScan(true);document.getElementById("stopScanBtn").onclick=()=>{stopScan(true);showCreateMode();};document.getElementById("createTab").onclick=()=>{stopScan(true);showCreateMode();};

function showScanMode(){document.getElementById("createMode").classList.add("hidden");document.getElementById("scanBox").classList.remove("hidden");document.getElementById("scanTab").classList.add("active");document.getElementById("createTab").classList.remove("active");}
function showCreateMode(){document.getElementById("createMode").classList.remove("hidden");document.getElementById("scanBox").classList.add("hidden");document.getElementById("createTab").classList.add("active");document.getElementById("scanTab").classList.remove("active");}

function resetScanChoiceUI(){
  scanPool=[];
  clearTimeout(singleAutoTimer);
  const box=document.getElementById("scanCandidateList");
  if(box)box.innerHTML="";
  showSingleScan("Đang chờ quét...");
  lastScan="";
}
function showFocusDot(clientX,clientY){
  const frame=document.querySelector(".scan-frame");
  if(!frame)return;
  const rect=frame.getBoundingClientRect();
  const dot=document.createElement("span");
  dot.className="scan-focus-dot";
  dot.style.left=(clientX-rect.left)+"px";
  dot.style.top=(clientY-rect.top)+"px";
  frame.appendChild(dot);
  setTimeout(()=>dot.remove(),760);
}
async function tryFocusAtPoint(clientX,clientY){
  showFocusDot(clientX,clientY);
  try{
    const videoTrack=scanStream?.getVideoTracks?.()[0];
    if(!videoTrack)return;
    const caps=videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
    const settings={advanced:[]};
    if(caps.focusMode && caps.focusMode.includes("continuous")) settings.advanced.push({focusMode:"continuous"});
    if(caps.pointsOfInterest){
      const rect=document.querySelector(".scan-frame").getBoundingClientRect();
      settings.pointsOfInterest=[{x:Math.max(0,Math.min(1,(clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(clientY-rect.top)/rect.height))}];
    }
    if(settings.advanced.length || settings.pointsOfInterest) await videoTrack.applyConstraints(settings);
  }catch(e){}
}

function loadJsQr(){if(window.jsQR)return Promise.resolve(true);return new Promise(resolve=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s);});}
function candidateType(v){const s=String(v).toUpperCase();if(/^RT[0-9A-Z-]{8,}$/.test(s)||/S\/N|SERIAL|^SN|S-N/.test(s))return"S/N";if(/SN/.test(s))return"SN";if(/IMEI/.test(s)||/^\d{14,17}$/.test(s))return"IMEI";return"CODE";}
function sortCandidates(arr){const rank={"S/N":0,"SN":1,"IMEI":2,"CODE":3};return[...new Set(arr.map(x=>String(x||"").trim()).filter(Boolean))].sort((a,b)=>(rank[candidateType(a)]??9)-(rank[candidateType(b)]??9)||a.localeCompare(b));}
function setMergedState(state){const box=document.getElementById("scanMergedBox");const single=document.getElementById("scanSingleResult");if(box){box.classList.remove("empty","single","multi");box.classList.add(state);}if(single)single.classList.toggle("empty",state==="empty");}
function showSingleScan(value){const r=document.getElementById("scanResult");if(r)r.textContent=value||"Đang chờ quét...";setMergedState(value?"single":"empty");}
function renderCandidatesFromPool(){const sorted=sortCandidates(scanPool);const box=document.getElementById("scanCandidateList");if(!box)return;if(sorted.length<=1){box.innerHTML="";setMergedState(sorted.length===1?"single":"empty");return;}setMergedState("multi");box.innerHTML=sorted.map(v=>{const t=candidateType(v);return `<div class="scan-candidate-item ${t!=="CODE"?"priority":""}" data-candidate-value="${escapeHtml(v)}"><span class="scan-candidate-type">${t}</span><span class="scan-candidate-value" title="${escapeHtml(v)}">${escapeHtml(v)}</span><span class="scan-candidate-add">CHỌN</span></div>`;}).join("");}
function renderCandidates(arr){scanPool=sortCandidates(arr);renderCandidatesFromPool();}
async function startScan(retry=false){showScanMode();resetScanChoiceUI();const result=document.getElementById("scanResult");try{stopScan(false);const constraints={video:{facingMode:isMobile()?{ideal:"environment"}:"user",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]},audio:false};scanStream=await tkOpenBestCamera();const video=document.getElementById("video");video.srcObject=scanStream;video.setAttribute("playsinline","true");video.muted=true;await video.play();
    setTimeout(tkApplyCameraZoom,180);result.textContent=retry?"Đang quét lại...":"Đang chờ quét...";const detector=("BarcodeDetector" in window)?new BarcodeDetector({formats:["qr_code","code_128","ean_13","ean_8","upc_a","upc_e"]}):null;const jsqrLoaded=await loadJsQr();const canvas=document.getElementById("scanCanvas");const ctx=canvas.getContext("2d",{willReadFrequently:true});scanTimer=setInterval(async()=>{try{let values=[];if(video.videoWidth>0){canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0,canvas.width,canvas.height);if(detector)values=values.concat(await detectAllOrientations(detector,canvas));if(jsqrLoaded&&window.jsQR){const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);const code=jsQR(imageData.data,imageData.width,imageData.height,{inversionAttempts:"attemptBoth"});if(code&&code.data)values.push(code.data);}}if(values.length)onScanValues(values);}catch(err){}},420);}catch(e){result.innerHTML='<span class="scan-error-note">Không mở được camera. Kiểm tra quyền camera hoặc dùng HTTPS.</span>';renderCameraHelp();}}
async function detectAllOrientations(detector,sourceCanvas){let values=[];async function run(c){try{const codes=await detector.detect(c);values=values.concat(codes.map(x=>x.rawValue).filter(Boolean));}catch(e){}}await run(sourceCanvas);const tmp=document.createElement("canvas");const t=tmp.getContext("2d");tmp.width=sourceCanvas.height;tmp.height=sourceCanvas.width;t.translate(tmp.width/2,tmp.height/2);t.rotate(Math.PI/2);t.drawImage(sourceCanvas,-sourceCanvas.width/2,-sourceCanvas.height/2);await run(tmp);t.setTransform(1,0,0,1,0,0);t.clearRect(0,0,tmp.width,tmp.height);t.translate(tmp.width/2,tmp.height/2);t.rotate(-Math.PI/2);t.drawImage(sourceCanvas,-sourceCanvas.width/2,-sourceCanvas.height/2);await run(tmp);return values;}
function onScanValues(values){
  const incoming=sortCandidates(values);
  if(!incoming.length)return;
  scanPool=sortCandidates(scanPool.concat(incoming));
  const sorted=scanPool;
  if(!sorted.length){renderCandidatesFromPool();showSingleScan("");return;}
  lastScan=sorted[0];

  if(sorted.length===1){
    showSingleScan(sorted[0]);
    renderCandidatesFromPool();
    clearTimeout(singleAutoTimer);
    singleAutoTimer=setTimeout(()=>{
      if(scanPool.length===1 && lastSingleAdded!==sorted[0]) addScanned(sorted[0]);
    },950);
    return;
  }

  clearTimeout(singleAutoTimer);
  const r=document.getElementById("scanResult");
  if(r) r.textContent=sorted[0];
  renderCandidatesFromPool();
}

/* TKver6.1 camera zoom + image scan scaffold */
async function tkApplyCameraZoom(){
  try{
    const track=scanStream?.getVideoTracks?.()[0]; if(!track) return;
    const caps=track.getCapabilities?track.getCapabilities():{};
    const zoom=Number(document.getElementById("zoomSelect")?.value||1);
    if(caps.zoom){const z=Math.max(caps.zoom.min||1,Math.min(caps.zoom.max||zoom,zoom));await track.applyConstraints({advanced:[{zoom:z}]});}
  }catch(e){}
}
document.getElementById("zoomSelect")?.addEventListener("change",tkApplyCameraZoom);
document.getElementById("pickImageScanBtn")?.addEventListener("click",()=>document.getElementById("imageScanInput")?.click());
document.getElementById("imageScanInput")?.addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file) return;
  alert("Đã nhận ảnh. Bản này chuẩn bị nền chọn ảnh; nếu camera lỗi hãy dùng HTTPS hoặc cấp lại quyền camera.");
});

function renderCameraHelp(){const result=document.getElementById('scanResult');if(result)result.innerHTML='Không mở được camera. Bấm Quét lại hoặc dùng Chọn ảnh.';}

/* TKver6.1 Inventory Module */
let inventoryRows=[], inventoryMap={}, inventoryExtra=[], inventoryMode=false;

function normalizeCode(v){return String(v||"").trim().replace(/\s+/g,"").toUpperCase();}
function parseInventoryLine(line, idx){
  const raw=String(line||"").trim();
  if(!raw)return null;
  const parts=raw.split(/\s+/);
  const code=normalizeCode(parts.shift());
  const name=parts.join(" ").trim();
  return code?{code,name,count:0,order:idx+1}:null;
}
function parseInventoryText(text){return String(text||"").split(/\r?\n/).map(parseInventoryLine).filter(Boolean);}
function rebuildInventoryMap(){inventoryMap={};inventoryRows.forEach((r,i)=>{inventoryMap[normalizeCode(r.code)]=i});}
function saveInventory(){localStorage.setItem("tk_inventory_rows",JSON.stringify(inventoryRows));localStorage.setItem("tk_inventory_extra",JSON.stringify(inventoryExtra));}
function loadInventory(){
  try{inventoryRows=JSON.parse(localStorage.getItem("tk_inventory_rows")||"[]")}catch(e){inventoryRows=[]}
  try{inventoryExtra=JSON.parse(localStorage.getItem("tk_inventory_extra")||"[]")}catch(e){inventoryExtra=[]}
  inventoryRows=inventoryRows.map((r,i)=>({code:normalizeCode(r.code),name:r.name||"",count:Number(r.count||0),order:i+1}));
  rebuildInventoryMap(); renderInventory();
}
function setInventoryRows(rows){
  inventoryRows=rows.map((r,i)=>({code:normalizeCode(r.code),name:r.name||"",count:0,order:i+1}));
  inventoryExtra=[];rebuildInventoryMap();saveInventory();renderInventory();
}
function inventoryRecordScan(raw){
  const code=normalizeCode(raw);
  if(!code || !inventoryRows.length)return false;
  const idx=inventoryMap[code];
  if(idx!==undefined){inventoryRows[idx].count=(inventoryRows[idx].count||0)+1;saveInventory();renderInventory(code);return true;}
  const found=inventoryExtra.find(x=>x.code===code);
  if(found)found.count++;else inventoryExtra.unshift({code,count:1});
  saveInventory();renderInventory();return false;
}
function inventoryDeleteOne(raw){
  const code=normalizeCode(raw), idx=inventoryMap[code];
  if(idx!==undefined && inventoryRows[idx].count>0){inventoryRows[idx].count--;saveInventory();renderInventory(code);return true;}
  return false;
}
function inventoryCopy(raw){const code=normalizeCode(raw);if(code)copyText(code,true);}
function renderInventory(activeCode=""){
  const body=document.getElementById("inventoryTableBody"); if(!body)return;
  const total=inventoryRows.length, done=inventoryRows.filter(r=>(r.count||0)>0).length;
  const missing=inventoryRows.filter(r=>(r.count||0)===0).length;
  const totalCount=inventoryRows.reduce((s,r)=>s+Number(r.count||0),0);
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};
  set("invTotal",total);set("invDone",done);set("invMissing",missing);set("invTotalCount",totalCount);
  const st=document.getElementById("inventoryStatus");if(st)st.textContent=total?`Đã nạp ${total} mã • Tổng SL ${totalCount}`:"Chưa nạp dữ liệu";
  body.innerHTML=inventoryRows.map((r,i)=>{
    const count=Number(r.count||0), cls=count>0?"inv-ok":"inv-missing";
    const badge=count>0?`<span class="inv-count-badge">${count===1?"OK":count}</span>`:`<span class="inv-count-badge">0</span>`;
    return `<tr class="${cls}" data-code="${escapeHtml(r.code)}"><td>${i+1}</td><td>${escapeHtml(r.code)}</td><td>${escapeHtml(r.name||"")}</td><td>${badge}</td></tr>`;
  }).join("") || `<tr><td colspan="4">Chưa có dữ liệu kiểm kê.</td></tr>`;
  const extraBox=document.getElementById("inventoryExtraList");
  if(extraBox)extraBox.innerHTML=inventoryExtra.length?inventoryExtra.map(x=>`<div class="inventory-extra-item">${escapeHtml(x.code)}${x.count>1?` • ${x.count} lần`:""}</div>`).join(""):"Chưa có.";
  if(activeCode){const row=body.querySelector(`[data-code="${CSS.escape(activeCode)}"]`);if(row)row.scrollIntoView({block:"center",behavior:"smooth"});}
}
function getMissingText(){return inventoryRows.filter(r=>Number(r.count||0)===0).map(r=>r.name?`${r.code} ${r.name}`:r.code).join("\n");}
function exportInventoryMissing(type){
  const missing=inventoryRows.filter(r=>Number(r.count||0)===0);
  if(!missing.length)return alert("Không còn mã chưa bắn.");
  if(type==="csv"){
    const csv="STT,Code,Ten san pham\n"+missing.map((r,i)=>`${i+1},"${r.code.replace(/"/g,'""')}","${(r.name||"").replace(/"/g,'""')}"`).join("\n");
    downloadText("imei-chua-ban.csv",csv,"text/csv");
  }else downloadText("imei-chua-ban.txt",getMissingText(),"text/plain");
}
function setScanSubMode(mode){
  inventoryMode=mode==="inventory";
  document.getElementById("inventoryPanel")?.classList.toggle("hidden",!inventoryMode);
  document.getElementById("scanSubModeInventory")?.classList.toggle("active",inventoryMode);
  document.getElementById("scanSubModeNormal")?.classList.toggle("active",!inventoryMode);
}
document.getElementById("scanSubModeInventory")?.addEventListener("click",()=>setScanSubMode("inventory"));
document.getElementById("scanSubModeNormal")?.addEventListener("click",()=>setScanSubMode("normal"));
document.getElementById("loadInventoryBtn")?.addEventListener("click",()=>setInventoryRows(parseInventoryText(document.getElementById("inventoryInput").value)));
document.getElementById("clearInventoryBtn")?.addEventListener("click",()=>{if(confirm("Xóa toàn bộ bảng kiểm kê?"))setInventoryRows([])});
document.getElementById("manualScanBtn")?.addEventListener("click",()=>{const inp=document.getElementById("manualScanInput");inventoryRecordScan(inp.value);inp.value="";inp.focus();});
document.getElementById("manualScanInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("manualScanBtn").click();}});
document.getElementById("finishInventoryBtn")?.addEventListener("click",()=>{renderInventory();alert(`Chưa bắn ${inventoryRows.filter(r=>Number(r.count||0)===0).length} mã. Tổng SL IMEI đã đếm: ${inventoryRows.reduce((s,r)=>s+Number(r.count||0),0)}`)});
document.getElementById("copyMissingBtn")?.addEventListener("click",()=>{const t=getMissingText();if(!t)return alert("Không còn mã chưa bắn.");copyText(t,true);alert("Đã copy mã chưa bắn.");});
document.getElementById("exportMissingTxtBtn")?.addEventListener("click",()=>exportInventoryMissing("txt"));
document.getElementById("exportMissingCsvBtn")?.addEventListener("click",()=>exportInventoryMissing("csv"));
document.getElementById("copyExtraBtn")?.addEventListener("click",()=>{const t=inventoryExtra.map(x=>`${x.code}${x.count>1?` ${x.count} lần`:""}`).join("\n");if(!t)return alert("Chưa có mã ngoài bảng.");copyText(t,true);alert("Đã copy mã ngoài bảng.");});
document.getElementById("inventoryFileBtn")?.addEventListener("click",()=>document.getElementById("inventoryFile")?.click());
document.getElementById("inventoryFile")?.addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;const text=await file.text();document.getElementById("inventoryInput").value=text;setInventoryRows(parseInventoryText(text));});
document.addEventListener("dblclick",e=>{const row=e.target.closest("#inventoryTableBody tr[data-code]");if(row)inventoryDeleteOne(row.dataset.code);});
document.addEventListener("contextmenu",e=>{const row=e.target.closest("#inventoryTableBody tr[data-code]");if(row){e.preventDefault();inventoryCopy(row.dataset.code);}});
loadInventory();
