/* TKver9.1 QR Code Pro: 3 clean modes */
const $ = (s)=>document.querySelector(s);
const video=$("#video"), canvas=$("#scanCanvas"), ctx=canvas.getContext("2d",{willReadFrequently:true});
let stream=null, scanTimer=null, zxingReader=null, lastValue="", scanPool=[], scanned=[], inventoryMode=false, currentCodeType="qr";
let inventoryRows=[], inventoryMap={}, inventoryExtra=[], exportFilters=new Set(["all"]);

function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function normalizeCode(v){return String(v||"").trim().replace(/\s+/g,"").toUpperCase();}
function unique(arr){return [...new Set(arr.map(x=>String(x||"").trim()).filter(Boolean))];}
function setStatus(t){$("#cameraStatus").textContent=t;}
function downloadText(filename,text,type="text/plain"){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),800);}
async function copyText(t){await navigator.clipboard.writeText(t||"");}
function codeType(v){const s=String(v).toUpperCase();if(/IMEI/.test(s)||/^\d{14,17}$/.test(s))return"IMEI";if(/^RT[0-9A-Z-]{8,}$/.test(s)||s.includes("S/N"))return"S/N";if(/^SN/.test(s)||s.includes("SERIAL"))return"SN";if(/^\d{12,13}$/.test(s))return"EAN";return"CODE";}
function sortCodes(arr){const rank={IMEI:0,"S/N":1,SN:2,EAN:3,CODE:4};return unique(arr).sort((a,b)=>(rank[codeType(a)]??9)-(rank[codeType(b)]??9)||String(a).localeCompare(String(b)));}

function switchMode(mode){
  stopScan(false);
  stopInventoryScan(false);
  document.body.classList.remove("mode-create","mode-scan","mode-inventory");
  document.body.classList.add("mode-"+mode);
  $("#createPanel").classList.toggle("hidden",mode!=="create");
  $("#scanPanel").classList.toggle("hidden",mode!=="scan");
  $("#inventoryPanel").classList.toggle("hidden",mode!=="inventory");
  inventoryMode = mode==="inventory";
  document.querySelectorAll(".main-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  $("#exportToolsCard").classList.toggle("hidden",mode==="create");
  renderExportFilters();
  if(mode==="scan"){ setTimeout(()=>startScan(),120); }
  if(mode==="inventory"){ setTimeout(()=>showInventoryCamera(),80); setTimeout(()=>startInventoryScan(),180); }
}
document.querySelectorAll(".main-tab").forEach(b=>b.addEventListener("click",()=>switchMode(b.dataset.mode)));


/* TKver9.1 safer camera constraints */
async function openCamera(){
  const constraintsList=[
    {video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false},
    {video:{facingMode:"environment"},audio:false},
    {video:true,audio:false}
  ];
  let lastErr;
  for(const c of constraintsList){try{return await navigator.mediaDevices.getUserMedia(c);}catch(e){lastErr=e;}}
  throw lastErr||new Error("Không mở được camera");
}

async function startScan(){
  await stopScan(false);
  setStatus("Đang xin quyền camera...");
  try{
    stream=await openCamera();
    video.srcObject=stream; await video.play();
    setStatus("Camera đang chạy. Đưa mã vào vùng khung.");
    if(window.ZXing){try{zxingReader=new ZXing.BrowserMultiFormatReader()}catch(e){zxingReader=null}}
    scanTimer=setInterval(scanFrame,380);
  }catch(e){setStatus("Không mở được camera: "+((e&&e.message)||"không rõ lỗi"))}
}
async function stopScan(clearStatus=true){
  if(scanTimer){clearInterval(scanTimer);scanTimer=null}
  if(zxingReader){try{zxingReader.reset()}catch(e){} zxingReader=null}
  if(stream){stream.getTracks().forEach(t=>t.stop()); stream=null}
  if(video)video.srcObject=null;
  if(clearStatus)setStatus("Đã dừng camera.");
}
async function scanFrame(){
  if(!video.videoWidth)return;
  canvas.width=video.videoWidth; canvas.height=video.videoHeight; ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const values=[];
  if(zxingReader){try{const r=await zxingReader.decodeFromCanvas(canvas); if(r?.text)values.push(r.text)}catch(e){}}
  if(window.jsQR){try{const data=ctx.getImageData(0,0,canvas.width,canvas.height);const q=jsQR(data.data,data.width,data.height,{inversionAttempts:"attemptBoth"});if(q?.data)values.push(q.data)}catch(e){}}
  if(values.length)handleDetected(values);
}
function handleDetected(values){
  scanPool=sortCodes(scanPool.concat(values)).slice(0,10);
  if(scanPool.length===1){chooseCode(scanPool[0]);scanPool=[];renderCandidates([]);return}
  renderCandidates(scanPool);
}
function renderCandidates(list){
  const card=$("#candidateCard"), box=$("#candidateList");
  if(!list.length){card.classList.add("hidden");box.innerHTML="";return}
  card.classList.remove("hidden");
  box.innerHTML=list.map(v=>`<div class="candidate-item" data-code="${escapeHtml(v)}"><span class="candidate-type">${codeType(v)}</span><span>${escapeHtml(v)}</span><span class="candidate-pick">CHỌN</span></div>`).join("");
}
function chooseCode(v){
  lastValue=v; $("#lastScan").textContent=v; addScanned(v); renderCandidates([]);
}
function findInventoryName(code){const idx=inventoryMap[normalizeCode(code)];return idx!==undefined?(inventoryRows[idx]?.name||""):""}
function findInventoryCount(code){const idx=inventoryMap[normalizeCode(code)];return idx!==undefined?Number(inventoryRows[idx]?.count||0):""}
function showSuccessLock(code){
  $("#successCode").textContent=code||"---";
  $("#successName").textContent=findInventoryName(code)||(inventoryMode?"Mã ngoài bảng / chưa nạp dữ liệu":"");
  const c=findInventoryCount(code); $("#successCount").textContent=c!==""?("SL: "+c):"Đã quét";
  $("#successLock").classList.remove("hidden");
}
function addScanned(v){
  v=String(v||"").trim(); if(!v)return;
  scanned=scanned.filter(x=>x.value!==v); scanned.unshift({value:v,deleted:false});
  if(inventoryMode)inventoryRecordScan(v);
  showSuccessLock(v); renderExportFilters();
}
function activeScanned(){return scanned.filter(x=>!x.deleted).map(x=>x.value)}

function parseInventoryText(text){return String(text||"").split(/\r?\n/).map((line,i)=>{const raw=line.trim();if(!raw)return null;const parts=raw.split(/\s+/);const code=normalizeCode(parts.shift());const name=parts.join(" ").trim();return code?{code,name,count:0,order:i+1}:null}).filter(Boolean)}
function setInventoryRows(rows){inventoryRows=rows;inventoryMap={};inventoryExtra=[];inventoryRows.forEach((r,i)=>inventoryMap[normalizeCode(r.code)]=i);renderInventory()}
function inventoryRecordScan(raw){
  const code=normalizeCode(raw); if(!code||!inventoryRows.length)return;
  const idx=inventoryMap[code];
  if(idx!==undefined){inventoryRows[idx].count=(inventoryRows[idx].count||0)+1;renderInventory(code)}
  else{const ex=inventoryExtra.find(x=>x.code===code);if(ex)ex.count++;else inventoryExtra.unshift({code,count:1})}
}
function inventoryDeleteOne(code){const idx=inventoryMap[normalizeCode(code)];if(idx!==undefined&&inventoryRows[idx].count>0){inventoryRows[idx].count--;renderInventory(code)}}
function renderInventory(active=""){
  $("#invTotal").textContent=inventoryRows.length;
  const done=inventoryRows.filter(x=>(x.count||0)>0).length, missing=inventoryRows.filter(x=>(x.count||0)===0).length, total=inventoryRows.reduce((s,x)=>s+(x.count||0),0);
  $("#invDone").textContent=done;$("#invMissing").textContent=missing;$("#invTotalCount").textContent=total;
  const body=$("#inventoryTableBody");
  body.innerHTML=inventoryRows.length?inventoryRows.map((r,i)=>{const c=r.count||0,cls=c>0?"inv-ok":"inv-missing",badge=`<span class="badge">${c===0?"0":c===1?"OK":c}</span>`;return`<tr class="${cls}" data-code="${escapeHtml(r.code)}"><td>${i+1}</td><td>${escapeHtml(r.code)}</td><td>${escapeHtml(r.name)}</td><td>${badge}</td></tr>`}).join(""):`<tr><td colspan="4">Chưa có dữ liệu kiểm kê.</td></tr>`;
  if(active){const row=body.querySelector(`[data-code="${CSS.escape(normalizeCode(active))}"]`);if(row)row.scrollIntoView({block:"center",behavior:"smooth"})}
  renderExportFilters();
}
function getInventoryExportRows(){
  if(!inventoryRows.length)return activeScanned().map((code,i)=>({code,name:"",count:1,order:i+1}));
  let rows=[]; if(exportFilters.has("all"))rows=inventoryRows; else{if(exportFilters.has("missing"))rows=rows.concat(inventoryRows.filter(x=>(x.count||0)===0));if(exportFilters.has("done"))rows=rows.concat(inventoryRows.filter(x=>(x.count||0)>0))}
  return rows;
}
function getExportText(){return getInventoryExportRows().map(x=>x.name?`${x.code} ${x.name}${(x.count||0)>0?` | SL:${x.count}`:""}`:`${x.code}${(x.count||0)>0?` | SL:${x.count}`:""}`).join("\n")}
function getExportCsv(){return"STT,Code,Ten san pham,SL dem\n"+getInventoryExportRows().map((x,i)=>`${i+1},"${String(x.code).replace(/"/g,'""')}","${String(x.name||"").replace(/"/g,'""')}","${x.count||0}"`).join("\n")}
function setExportFilter(key){if(key==="all")exportFilters=new Set(["all"]);else{exportFilters.delete("all");exportFilters.has(key)?exportFilters.delete(key):exportFilters.add(key);if(!exportFilters.size)exportFilters.add(key)}renderExportFilters()}
function renderExportFilters(){
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.toggle("active",exportFilters.has(b.dataset.exportFilter)));
  const text=getExportText(); const prev=$("#exportPreview"); if(prev && prev.classList.contains("show")) prev.textContent=text?text.split("\n").slice(0,20).join("\n"):"Chưa có dữ liệu.";
}

function generateCode(){
  parseRunCodes();
  runIndex=0;
  renderCurrentCode();
  renderRunLists();
}

$("#startBtn").onclick=startScan; $("#stopBtn").onclick=()=>stopScan(true); $("#imageBtn").onclick=()=>$("#imageInput").click();
$("#candidateList").onclick=e=>{const item=e.target.closest(".candidate-item");if(item)chooseCode(item.dataset.code)};
$("#loadInventoryBtn").onclick=()=>{setInventoryRows(parseInventoryText($("#inventoryInput").value));$("#inventoryPanel").classList.add("collapsed");$("#collapseInventoryBtn").textContent="Mở rộng"};
$("#clearInventoryBtn").onclick=()=>{if(confirm("Xóa bảng kiểm kê?"))setInventoryRows([])};
$("#collapseInventoryBtn").onclick=()=>{const p=$("#inventoryPanel");p.classList.toggle("collapsed");$("#collapseInventoryBtn").textContent=p.classList.contains("collapsed")?"Mở rộng":"Thu gọn"};
$("#manualScanBtn").onclick=()=>{inventoryRecordScan($("#manualScanInput").value);$("#manualScanInput").value=""};
$("#manualScanInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("#manualScanBtn").click()});
$("#finishInventoryBtn").onclick=()=>alert(`Chưa bắn ${inventoryRows.filter(x=>(x.count||0)===0).length} mã. Tổng SL IMEI đã đếm: ${inventoryRows.reduce((s,x)=>s+(x.count||0),0)}`);
$("#openScanFromInventoryBtn").onclick=()=>{showInventoryCamera();};
document.querySelectorAll(".filter-btn").forEach(b=>b.onclick=()=>setExportFilter(b.dataset.exportFilter));
$("#copySelectedExportBtn").onclick=async()=>{await copyText(getExportText());alert("Đã copy dữ liệu đã chọn.")};
$("#exportSelectedTxtBtn").onclick=()=>downloadText("kiem-ke-da-chon.txt",getExportText(),"text/plain");
$("#exportSelectedCsvBtn").onclick=()=>downloadText("kiem-ke-da-chon.csv",getExportCsv(),"text/csv");
document.querySelectorAll(".type-tab").forEach(b=>b.onclick=()=>{
  currentCodeType=b.dataset.codeType;
  document.querySelectorAll(".type-tab").forEach(x=>x.classList.toggle("active",x===b));
  parseRunCodes();
  if(!runCodes.length){
    const raw=document.getElementById("createInput")?.value.trim();
    if(raw) runCodes=raw.split(/\r?\n|[,;\t]+/).map(x=>x.trim()).filter(Boolean);
  }
  runIndex=0;
  renderCurrentCode();
  renderRunLists();
});
$("#generateBtn").onclick=generateCode; $("#clearCreateBtn").onclick=()=>{$("#createInput").value="";$("#codePreview").textContent="Mã sẽ hiện ở đây..."};
$("#downloadCodeBtn").onclick=()=>{const c=$("#codePreview canvas");if(c){const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="qr-code.png";a.click()}else alert("Hãy tạo mã trước.")};
$("#cameraWrap").addEventListener("pointerdown",e=>{const dot=$("#focusDot"),r=$("#cameraWrap").getBoundingClientRect();dot.style.left=(e.clientX-r.left)+"px";dot.style.top=(e.clientY-r.top)+"px";dot.classList.remove("hidden");setTimeout(()=>dot.classList.add("hidden"),700)});
$("#lastScan").addEventListener("pointerdown",()=>{if(lastValue)copyText(lastValue)});
$("#inventoryTableBody").addEventListener("dblclick",e=>{const row=e.target.closest("tr[data-code]");if(row)inventoryDeleteOne(row.dataset.code)});
switchMode("create"); renderInventory(); renderExportFilters();


/* TKver9.1 embedded inventory camera */
let invStream=null, invTimer=null, invZxingReader=null;
const inventoryVideo = document.getElementById("inventoryVideo");
const inventoryCanvas = document.getElementById("inventoryScanCanvas");
const inventoryCtx = inventoryCanvas ? inventoryCanvas.getContext("2d",{willReadFrequently:true}) : null;

function setInventoryCameraStatus(t){
  const el=document.getElementById("inventoryCameraStatus");
  if(el)el.textContent=t;
}
function showInventoryCamera(){
  const box=document.getElementById("inventoryCameraBox");
  if(box){
    box.classList.remove("hidden");
    setTimeout(()=>box.scrollIntoView({block:"start",behavior:"smooth"}),60);
  }
}
async function startInventoryScan(){
  showInventoryCamera();
  await stopInventoryScan(false);
  setInventoryCameraStatus("Đang xin quyền camera kiểm kê...");
  try{
    invStream=await openCamera();
    inventoryVideo.srcObject=invStream;
    await inventoryVideo.play();
    setInventoryCameraStatus("Camera kiểm kê đang chạy. Quét mã sản phẩm.");
    if(window.ZXing){
      try{invZxingReader=new ZXing.BrowserMultiFormatReader()}catch(e){invZxingReader=null}
    }
    invTimer=setInterval(scanInventoryFrame,380);
  }catch(e){
    setInventoryCameraStatus("Không mở được camera kiểm kê: "+((e&&e.message)||"không rõ lỗi"));
  }
}
async function stopInventoryScan(clearStatus=true){
  if(invTimer){clearInterval(invTimer);invTimer=null}
  if(invZxingReader){try{invZxingReader.reset()}catch(e){} invZxingReader=null}
  if(invStream){invStream.getTracks().forEach(t=>t.stop());invStream=null}
  if(inventoryVideo)inventoryVideo.srcObject=null;
  if(clearStatus)setInventoryCameraStatus("Đã dừng camera kiểm kê.");
}
async function scanInventoryFrame(){
  if(!inventoryVideo || !inventoryVideo.videoWidth)return;
  inventoryCanvas.width=inventoryVideo.videoWidth;
  inventoryCanvas.height=inventoryVideo.videoHeight;
  inventoryCtx.drawImage(inventoryVideo,0,0,inventoryCanvas.width,inventoryCanvas.height);
  const values=[];
  values.push(...await detectValuesFromCanvas(inventoryCanvas));
  if(invZxingReader){
    try{const r=await invZxingReader.decodeFromCanvas(inventoryCanvas); if(r?.text)values.push(r.text)}catch(e){}
  }
  if(values.length){
    const v=sortCodes(values)[0];
    const now=Date.now();
    const code=normalizeCode(v);
    const cfg = getScanCooldownConfig ? getScanCooldownConfig() : {any:1000,same:5000,label:"Kiểm kê"};
    if(now-invLastAcceptedAt < cfg.any) return;
    if(code && code===invLastAcceptedCode && now-invLastAcceptedAt < cfg.same) return;
    invLastAcceptedAt=now;
    invLastAcceptedCode=code;
    inventoryRecordScan(v);
    lastValue=v;
    document.getElementById("lastScan").textContent=v;
    showSuccessLock(v);
    tkScanSuccessFeedback(v);
    setInventoryCameraStatus("Đã quét: "+v+" — chờ "+(cfg.any/1000)+"s rồi quét tiếp");
  }
}
document.getElementById("invStartBtn")?.addEventListener("click",startInventoryScan);
document.getElementById("invStopBtn")?.addEventListener("click",()=>stopInventoryScan(true));
document.getElementById("invImageBtn")?.addEventListener("click",()=>document.getElementById("imageInput")?.click());

const oldCopySelectedExport74 = document.getElementById("copySelectedExportBtn")?.onclick;
document.getElementById("copySelectedExportBtn")?.addEventListener("click",()=>{const p=document.getElementById("exportPreview"); if(p){p.classList.remove("hidden");p.classList.add("show");p.textContent=getExportText()||"Chưa có dữ liệu.";}});
document.getElementById("exportSelectedTxtBtn")?.addEventListener("click",()=>{const p=document.getElementById("exportPreview"); if(p){p.classList.remove("hidden");p.classList.add("show");p.textContent=getExportText()||"Chưa có dữ liệu.";}}); 
document.getElementById("exportSelectedCsvBtn")?.addEventListener("click",()=>{const p=document.getElementById("exportPreview"); if(p){p.classList.remove("hidden");p.classList.add("show");p.textContent=getExportCsv().split("\n").slice(0,20).join("\n");}});


/* TKver9.1 native barcode first + advanced QR runner */
let nativeDetector=null;
async function getNativeDetector(){
  if(nativeDetector!==null)return nativeDetector;
  nativeDetector=false;
  if("BarcodeDetector" in window){try{let formats=["qr_code","code_128","code_39","ean_13","ean_8","upc_a","upc_e","itf"];if(BarcodeDetector.getSupportedFormats){const supported=await BarcodeDetector.getSupportedFormats();formats=formats.filter(f=>supported.includes(f));}if(formats.length)nativeDetector=new BarcodeDetector({formats});}catch(e){nativeDetector=false;}}
  return nativeDetector;
}
async function detectValuesFromCanvas(cnv){
  const values=[]; const det=await getNativeDetector();
  if(det){try{const r=await det.detect(cnv);r.forEach(x=>x.rawValue&&values.push(x.rawValue));}catch(e){}}
  if(window.jsQR){try{const c=cnv.getContext("2d",{willReadFrequently:true});const data=c.getImageData(0,0,cnv.width,cnv.height);const q=jsQR(data.data,data.width,data.height,{inversionAttempts:"attemptBoth"});if(q?.data)values.push(q.data);}catch(e){}}
  return values;
}
async function scanFrame(){
  if(!video.videoWidth)return;
  canvas.width=video.videoWidth; canvas.height=video.videoHeight; ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const values=[]; values.push(...await detectValuesFromCanvas(canvas));
  if(zxingReader){try{const r=await zxingReader.decodeFromCanvas(canvas);if(r?.text)values.push(r.text)}catch(e){}}
  if(values.length)handleDetected(values);
}
async function scanInventoryFrame(){
  if(!inventoryVideo||!inventoryVideo.videoWidth)return;
  inventoryCanvas.width=inventoryVideo.videoWidth; inventoryCanvas.height=inventoryVideo.videoHeight; inventoryCtx.drawImage(inventoryVideo,0,0,inventoryCanvas.width,inventoryCanvas.height);
  const values=[]; values.push(...await detectValuesFromCanvas(inventoryCanvas));
  if(invZxingReader){try{const r=await invZxingReader.decodeFromCanvas(inventoryCanvas);if(r?.text)values.push(r.text)}catch(e){}}
  if(values.length){const v=sortCodes(values)[0];inventoryRecordScan(v);lastValue=v;document.getElementById("lastScan").textContent=v;showSuccessLock(v);setInventoryCameraStatus("Đã quét: "+v);}
}
let runCodes=[],runIndex=0,runTimer=null,runErrors=new Set(),runDone=new Set();
function parseRunCodes(){const raw=document.getElementById("createInput")?.value||"";runCodes=raw.split(/\r?\n|[,;\t]+/).map(x=>x.trim()).filter(Boolean);if(!runCodes.length){const p=document.getElementById("codePreview");if(p)p.textContent="Chưa có dữ liệu.";}}
function renderCurrentCode(){const p=document.getElementById("codePreview");if(!p)return;p.innerHTML="";const code=runCodes[runIndex]||"";if(!code){p.textContent="Mã sẽ hiện ở đây...";updateRunStats();return;}if(currentCodeType==="qr"&&window.QRCode){const c=document.createElement("canvas");c.id="currentCodeCanvas";p.appendChild(c);QRCode.toCanvas(c,code,{width:280,margin:2},()=>{});}else if(window.JsBarcode){const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.id="currentBarcodeSvg";p.appendChild(svg);try{JsBarcode(svg,code,{format:"CODE128",displayValue:true})}catch(e){p.textContent=code;}}else p.textContent=code;runDone.add(code);updateRunStats();}
function updateRunStats(){const total=runCodes.length;const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};set("runTotal",total);set("runDone",runDone.size);set("runError",runErrors.size);set("runIndex",total?`${Math.min(runIndex+1,total)}/${total}`:"0/0");renderRunLists();}
function renderRunLists(){const list=document.getElementById("runList"),err=document.getElementById("errorList"),done=document.getElementById("doneList"),status=document.getElementById("runListStatus");if(status)status.textContent=runTimer?"Đang chạy":(runCodes.length?"Đã nạp":"Chưa chạy");if(list)list.innerHTML=runCodes.length?runCodes.map((c,i)=>`<div class="run-item ${i===runIndex?"active":""} ${runErrors.has(c)?"error":""}"><span>${i+1}</span><span>${escapeHtml(c)}</span><span>${runErrors.has(c)?"Lỗi":(runDone.has(c)?"Đã chạy":"Chờ")}</span></div>`).join(""):"Chưa có dữ liệu.";if(err)err.innerHTML=runErrors.size?[...runErrors].map((c,i)=>`<div class="run-item error"><span>${i+1}</span><span>${escapeHtml(c)}</span><span>Lỗi</span></div>`).join(""):"Chưa có lỗi.";if(done)done.innerHTML=runDone.size?[...runDone].map((c,i)=>`<div class="run-item"><span>${i+1}</span><span>${escapeHtml(c)}</span><span>OK</span></div>`).join(""):"Chưa có.";}
function nextRunCode(){if(!runCodes.length)parseRunCodes();if(!runCodes.length)return;runIndex++;if(runIndex>=runCodes.length){if(runErrors.size){runCodes=[...runErrors];runErrors.clear();runIndex=0;renderCurrentCode();return;}pauseRunner();runIndex=runCodes.length-1;updateRunStats();showRunnerDoneToast();return;}renderCurrentCode();}
function showRunnerDoneToast(){const toast=document.createElement("div");toast.textContent="✅ Đã chạy hết tất cả mã!";toast.style.cssText="position:fixed;top:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:14px 28px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 8px 24px rgba(16,185,129,.4);z-index:99999;animation:slideDown .35s ease-out;";if(!document.getElementById("tkRunnerDoneStyle")){const s=document.createElement("style");s.id="tkRunnerDoneStyle";s.textContent="@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}";document.head.appendChild(s);}document.body.appendChild(toast);try{if(navigator.vibrate)navigator.vibrate([120,60,120]);}catch(e){}setTimeout(()=>{toast.style.transition="opacity .35s";toast.style.opacity="0";setTimeout(()=>toast.remove(),350);},3000);}
function playRunner(){if(!runCodes.length)parseRunCodes();if(!runCodes.length)return alert("Chưa có mã để chạy.");pauseRunner(false);renderCurrentCode();const seconds=Math.max(1,parseFloat(document.getElementById("runnerDelay")?.value||5)||5);const delay=Math.round(seconds*1000);runTimer=setInterval(nextRunCode,delay);updateRunStats();}
function pauseRunner(update=true){if(runTimer){clearInterval(runTimer);runTimer=null;}if(update)updateRunStats();}
function resetRunner(){pauseRunner(false);runIndex=0;runErrors.clear();runDone.clear();parseRunCodes();renderCurrentCode();renderRunLists();}
function markCurrentError(){const code=runCodes[runIndex];if(code){runErrors.add(code);updateRunStats();}}
function downloadCurrentCode(){const c=document.querySelector("#codePreview canvas");if(c){const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download=(runCodes[runIndex]||"qr-code")+".png";a.click();return;}alert("Hiện chỉ tải nhanh PNG cho QR Code.");}
document.getElementById("playRunnerBtn")?.addEventListener("click",playRunner);document.getElementById("pauseRunnerBtn")?.addEventListener("click",()=>pauseRunner(true));document.getElementById("resetRunnerBtn")?.addEventListener("click",resetRunner);document.getElementById("downloadCurrentBtn")?.addEventListener("click",downloadCurrentCode);document.getElementById("codePreview")?.addEventListener("click",markCurrentError);document.addEventListener("keydown",e=>{if(e.code==="Space"&&!document.getElementById("createPanel")?.classList.contains("hidden")){e.preventDefault();markCurrentError();}});document.getElementById("copyErrorBtn")?.addEventListener("click",()=>copyText([...runErrors].join("\n")));document.getElementById("copyRunDoneBtn")?.addEventListener("click",()=>copyText([...runDone].join("\n")));document.getElementById("exportRunTxtBtn")?.addEventListener("click",()=>downloadText("qr-phien-chay.txt",runCodes.map((c,i)=>`${i+1}. ${c}${runErrors.has(c)?" | LOI":runDone.has(c)?" | DA CHAY":""}`).join("\n"),"text/plain"));document.getElementById("exportRunCsvBtn")?.addEventListener("click",()=>downloadText("qr-phien-chay.csv","STT,Code,Trang thai\n"+runCodes.map((c,i)=>`${i+1},"${String(c).replace(/"/g,'""')}","${runErrors.has(c)?"LOI":runDone.has(c)?"DA CHAY":"CHO"}"`).join("\n"),"text/csv"));document.getElementById("clearRunStateBtn")?.addEventListener("click",()=>{if(confirm("Xóa phiên chạy hiện tại?")){runCodes=[];runIndex=0;runErrors.clear();runDone.clear();document.getElementById("createInput").value="";document.getElementById("codePreview").textContent="Mã sẽ hiện ở đây...";updateRunStats();}});


/* TKver9.1 sticky result + no manual scan buttons */
function setStickyResult77(code, name="", target="scan"){
  const box=document.getElementById(target==="inventory"?"inventoryStickyResult":"scanCompactResult");
  const c=document.getElementById(target==="inventory"?"inventoryStickyCode":"scanStickyCode");
  const n=document.getElementById(target==="inventory"?"inventoryStickyName":"scanStickyName");
  const count=document.getElementById("inventoryStickyCount");
  if(!box||!c)return;
  c.textContent=code||"---";
  if(n)n.textContent=name||"";
  if(target==="inventory" && count){
    const sl=findInventoryCount(code);
    count.textContent = sl!=="" ? ("SL: "+sl) : "SL: ?";
  }
  box.classList.remove("hidden");
}
const oldShowSuccessLock77 = showSuccessLock;
showSuccessLock = function(code){
  oldShowSuccessLock77(code);
  const name = findInventoryName(code) || (inventoryMode ? "Mã ngoài bảng / chưa nạp dữ liệu" : "");
  setStickyResult77(code, name, inventoryMode ? "inventory" : "scan");
};


/* TKver9.1 inventory one-hand controls + mobile inline actions */
function initInvHand79(){
  const saved=localStorage.getItem("tk_inv_hand")||"right";
  document.body.classList.toggle("inv-hand-right",saved!=="left");
  document.body.classList.toggle("inv-hand-left",saved==="left");
  document.getElementById("invHandRight")?.classList.toggle("active",saved!=="left");
  document.getElementById("invHandLeft")?.classList.toggle("active",saved==="left");
}
document.getElementById("invHandRight")?.addEventListener("click",()=>{localStorage.setItem("tk_inv_hand","right");initInvHand79();});
document.getElementById("invHandLeft")?.addEventListener("click",()=>{localStorage.setItem("tk_inv_hand","left");initInvHand79();});
document.getElementById("invOverlayStartBtn")?.addEventListener("click",startInventoryScan);
document.getElementById("invOverlayStopBtn")?.addEventListener("click",()=>stopInventoryScan(true));
(function moveFinishButtonMobile79(){
  const manual=document.querySelector(".manual-row");
  const finish=document.getElementById("finishInventoryBtn");
  if(manual && finish && !document.getElementById("finishInventoryBtnInline")){
    const clone=finish.cloneNode(true); clone.id="finishInventoryBtnInline"; clone.addEventListener("click",()=>finish.click()); manual.appendChild(clone); finish.style.display="none";
  }
})();
initInvHand79();

/* TKver9.1 live create refresh */
let createRefreshTimer=null;
document.getElementById("createInput")?.addEventListener("input",()=>{
  clearTimeout(createRefreshTimer);
  createRefreshTimer=setTimeout(()=>{
    if(!document.getElementById("createPanel")?.classList.contains("hidden")){
      parseRunCodes(); runIndex=0; renderCurrentCode(); renderRunLists();
    }
  },250);
});

/* TKver9.1 inventory scan throttle */
let invLastAcceptedAt=0;
let invLastAcceptedCode='';


/* TKver9.1 scan cooldown modes */
const TK_SCAN_SPEEDS = {fast:{any:500,same:3000,label:"Nhanh"},inventory:{any:1000,same:5000,label:"Kiểm kê"},safe:{any:2000,same:7000,label:"Chính xác"}};
let tkScanSpeedMode = localStorage.getItem("tk_scan_speed_mode") || "inventory";
function getScanCooldownConfig(){return TK_SCAN_SPEEDS[tkScanSpeedMode] || TK_SCAN_SPEEDS.inventory;}
function setScanSpeedMode(mode){tkScanSpeedMode = TK_SCAN_SPEEDS[mode] ? mode : "inventory";localStorage.setItem("tk_scan_speed_mode",tkScanSpeedMode);const sel=document.getElementById("scanSpeedMode");if(sel)sel.value=tkScanSpeedMode;document.querySelectorAll(".speed-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.speedMode===tkScanSpeedMode));}
document.querySelectorAll(".speed-btn").forEach(btn=>btn.addEventListener("click",()=>setScanSpeedMode(btn.dataset.speedMode)));
setScanSpeedMode(tkScanSpeedMode);
function tkScanSuccessFeedback(code){try{const box=document.getElementById("inventoryCameraWrap")||document.getElementById("cameraWrap");if(box){box.classList.remove("scan-cooldown-flash");void box.offsetWidth;box.classList.add("scan-cooldown-flash");}if(navigator.vibrate)navigator.vibrate(60);}catch(e){}}


/* TKver9.1 FINAL OVERRIDES: QR/Barcode strict + real scan cooldown */
(function(){
  const TK83_SPEEDS = {
    fast: { any: 1000, same: 5000, label: "Nhanh" },
    inventory: { any: 1200, same: 7000, label: "Kiểm kê" },
    safe: { any: 2000, same: 10000, label: "Chính xác" }
  };
  let tk83LockedUntil = 0;
  let tk83LastCode = "";
  let tk83LastCodeAt = 0;

  window.getScanCooldownConfig = function(){
    const mode = window.tkScanSpeedMode || localStorage.getItem("tk_scan_speed_mode") || "inventory";
    return TK83_SPEEDS[mode] || TK83_SPEEDS.inventory;
  };
  window.setScanSpeedMode = function(mode){
    window.tkScanSpeedMode = TK83_SPEEDS[mode] ? mode : "inventory";
    localStorage.setItem("tk_scan_speed_mode", window.tkScanSpeedMode);
    const sel=document.getElementById("scanSpeedMode"); if(sel) sel.value=window.tkScanSpeedMode;
    document.querySelectorAll(".speed-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.speedMode===window.tkScanSpeedMode));
  };
  document.querySelectorAll(".speed-btn").forEach(btn=>{btn.onclick=()=>window.setScanSpeedMode(btn.dataset.speedMode);});
  window.setScanSpeedMode(localStorage.getItem("tk_scan_speed_mode") || "inventory");

  window.tkScanSuccessFeedback = function(code){
    try{
      const box=document.getElementById("inventoryCameraWrap") || document.getElementById("cameraWrap");
      if(box){
        box.classList.remove("scan-cooldown-flash"); void box.offsetWidth; box.classList.add("scan-cooldown-flash");
        box.classList.add("scan-cooldown-locked");
        setTimeout(()=>box.classList.remove("scan-cooldown-locked"), Math.min((window.getScanCooldownConfig().any||1200), 2000));
      }
      if(navigator.vibrate) navigator.vibrate([90,40,90]);
    }catch(e){}
  };

  window.scanInventoryFrame = async function(){
    if(!inventoryVideo || !inventoryVideo.videoWidth) return;
    const now = Date.now();
    if(now < tk83LockedUntil) return;

    inventoryCanvas.width=inventoryVideo.videoWidth;
    inventoryCanvas.height=inventoryVideo.videoHeight;
    inventoryCtx.drawImage(inventoryVideo,0,0,inventoryCanvas.width,inventoryCanvas.height);
    const values=[];
    values.push(...await detectValuesFromCanvas(inventoryCanvas));
    if(invZxingReader){
      try{const r=await invZxingReader.decodeFromCanvas(inventoryCanvas); if(r?.text) values.push(r.text);}catch(e){}
    }
    if(!values.length) return;
    const v=sortCodes(values)[0];
    const code=normalizeCode(v);
    const cfg=window.getScanCooldownConfig();

    if(code && code===tk83LastCode && now-tk83LastCodeAt < cfg.same) return;

    tk83LockedUntil = now + cfg.any;
    tk83LastCode = code;
    tk83LastCodeAt = now;
    invLastAcceptedAt = now;
    invLastAcceptedCode = code;

    inventoryRecordScan(v);
    lastValue=v;
    const last=document.getElementById("lastScan"); if(last) last.textContent=v;
    showSuccessLock(v);
    window.tkScanSuccessFeedback(v);
    setInventoryCameraStatus("Đã quét: "+v+" — khóa "+(cfg.any/1000).toFixed(1)+"s, cùng mã "+(cfg.same/1000).toFixed(0)+"s");
  };

  window.renderCurrentCode = function(){
    const preview=document.getElementById("codePreview");
    const status=document.getElementById("createTypeStatus");
    if(!preview) return;
    preview.innerHTML="";
    const code=(runCodes && runCodes[runIndex]) ? runCodes[runIndex] : "";
    if(!code){preview.textContent="Mã sẽ hiện ở đây..."; if(status)status.textContent="Đang chọn: "+(currentCodeType==="barcode"?"Barcode 128":"QR Code"); updateRunStats(); return;}
    if(currentCodeType==="barcode"){
      if(status)status.textContent="Đang tạo: Barcode 128";
      const holder=document.createElement("div"); holder.style.width="100%"; holder.style.overflow="auto";
      const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.id="currentBarcodeSvg"; holder.appendChild(svg); preview.appendChild(holder);
      if(window.JsBarcode){
        try{JsBarcode(svg, code, {format:"CODE128",displayValue:true,lineColor:"#000",background:"#fff",height:95,margin:12});}
        catch(e){preview.innerHTML='<div class="qr-mode-error">Barcode lỗi với mã này:<br>'+escapeHtml(code)+'</div>';}
      }else{
        preview.innerHTML='<div class="qr-mode-error">Thư viện Barcode chưa tải. Kiểm tra mạng/CDN.</div>';
      }
    }else{
      if(status)status.textContent="Đang tạo: QR Code";
      const c=document.createElement("canvas"); c.id="currentCodeCanvas"; preview.appendChild(c);
      if(window.QRCode && QRCode.toCanvas){
        QRCode.toCanvas(c, code, {width:300,margin:2,errorCorrectionLevel:"M"}, (err)=>{
          if(err) preview.innerHTML='<div class="qr-mode-error">QR lỗi với mã này:<br>'+escapeHtml(code)+'</div>';
        });
      }else{
        preview.innerHTML='<div class="qr-mode-error">Thư viện QR chưa tải. Không chuyển sang Barcode để tránh nhầm loại mã.<br>'+escapeHtml(code)+'</div>';
      }
    }
    runDone.add(code);
    updateRunStats();
  };

  document.querySelectorAll(".type-tab").forEach(btn=>{
    btn.onclick=(ev)=>{
      ev.preventDefault();
      currentCodeType=btn.dataset.codeType || "qr";
      document.querySelectorAll(".type-tab").forEach(x=>x.classList.toggle("active",x===btn));
      parseRunCodes();
      runIndex=0;
      window.renderCurrentCode();
      renderRunLists();
    };
  });
  const gen=document.getElementById("generateBtn");
  if(gen){gen.onclick=()=>{parseRunCodes(); runIndex=0; window.renderCurrentCode(); renderRunLists();};}
  const inp=document.getElementById("createInput");
  if(inp){inp.addEventListener("input",()=>{clearTimeout(window.__tk83CreateTimer); window.__tk83CreateTimer=setTimeout(()=>{if(!document.getElementById("createPanel")?.classList.contains("hidden")){parseRunCodes(); runIndex=0; window.renderCurrentCode(); renderRunLists();}},260);});}
})();


/* TKver9.1 hard QR/Barcode renderer + inventory UX */
function tk84GetCreateCodes(){const raw=document.getElementById("createInput")?.value||"";return raw.split(/\r?\n|[,;\t]+/).map(x=>x.trim()).filter(Boolean);}
function tk84RenderQR(preview, code){preview.innerHTML="";const c=document.createElement("canvas");c.id="currentCodeCanvas";preview.appendChild(c);if(window.QRCode&&QRCode.toCanvas){QRCode.toCanvas(c,code,{width:300,margin:2,errorCorrectionLevel:"M"},function(err){if(err)tk84RenderQRFallback(preview,code);});}else{tk84RenderQRFallback(preview,code);}}
function tk84RenderQRFallback(preview, code){preview.innerHTML="";const img=document.createElement("img");img.className="qr-img-fallback";img.alt="QR Code";img.src="https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl="+encodeURIComponent(code);img.onerror=function(){preview.innerHTML='<div class="qr-fallback">Không tải được QR. Kiểm tra mạng hoặc thư viện QR.<br>'+escapeHtml(code)+'</div>';};preview.appendChild(img);}
function tk84RenderBarcode(preview, code){preview.innerHTML="";const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.id="currentBarcodeSvg";preview.appendChild(svg);if(window.JsBarcode){try{JsBarcode(svg,code,{format:"CODE128",displayValue:true,lineColor:"#000",background:"#fff",height:90,margin:12});}catch(e){preview.innerHTML='<div class="qr-fallback">Không tạo được Barcode 128.<br>'+escapeHtml(code)+'</div>';}}else{preview.innerHTML='<div class="qr-fallback">Thư viện Barcode chưa tải.<br>'+escapeHtml(code)+'</div>';}}
function renderCurrentCode(){const preview=document.getElementById("codePreview");if(!preview)return;if(!runCodes||!runCodes.length)runCodes=tk84GetCreateCodes();const code=runCodes[runIndex]||"";if(!code){preview.textContent="Mã sẽ hiện ở đây...";updateRunStats?.();return;}if(currentCodeType==="barcode")tk84RenderBarcode(preview,code);else tk84RenderQR(preview,code);runDone?.add?.(code);updateRunStats?.();}
function generateCode(){runCodes=tk84GetCreateCodes();runIndex=0;renderCurrentCode();renderRunLists?.();}
document.querySelectorAll(".type-tab").forEach(btn=>{btn.addEventListener("click",function(){currentCodeType=this.dataset.codeType==="barcode"?"barcode":"qr";document.querySelectorAll(".type-tab").forEach(x=>x.classList.toggle("active",x===this));generateCode();});});
document.getElementById("generateBtn")?.addEventListener("click",generateCode);let tk84InputTimer=null;document.getElementById("createInput")?.addEventListener("input",function(){clearTimeout(tk84InputTimer);tk84InputTimer=setTimeout(generateCode,220);});
document.getElementById("finishInventoryInlineBtn")?.addEventListener("click",function(){document.getElementById("finishInventoryBtn")?.click();});
let tk84LastScanAt=0;let tk84LastScanCode="";let tk84ScanLocked=false;
async function scanInventoryFrame(){if(tk84ScanLocked)return;if(!inventoryVideo||!inventoryVideo.videoWidth)return;inventoryCanvas.width=inventoryVideo.videoWidth;inventoryCanvas.height=inventoryVideo.videoHeight;inventoryCtx.drawImage(inventoryVideo,0,0,inventoryCanvas.width,inventoryCanvas.height);const values=[];values.push(...await detectValuesFromCanvas(inventoryCanvas));if(invZxingReader){try{const r=await invZxingReader.decodeFromCanvas(inventoryCanvas);if(r?.text)values.push(r.text)}catch(e){}}if(!values.length)return;const v=sortCodes(values)[0];const code=normalizeCode(v);const now=Date.now();const same=code&&code===tk84LastScanCode;const minGap=same?7000:1200;if(now-tk84LastScanAt<minGap)return;tk84ScanLocked=true;tk84LastScanAt=now;tk84LastScanCode=code;inventoryRecordScan(v);lastValue=v;const last=document.getElementById("lastScan");if(last)last.textContent=v;showSuccessLock(v);setInventoryCameraStatus("Đã quét: "+v+" — khóa 1.2s để tránh cộng nhầm");try{if(navigator.vibrate)navigator.vibrate([160,80,160]);const box=document.getElementById("inventoryCameraWrap");if(box){box.classList.remove("scan-cooldown-flash");void box.offsetWidth;box.classList.add("scan-cooldown-flash");}}catch(e){}setTimeout(()=>{tk84ScanLocked=false;},1200);}


/* TKver9.1 HARD OVERRIDE: QR/Barcode renderer + normal scan list + inventory cleanup */
(function(){
  const $=(id)=>document.getElementById(id);
  function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
  window.escapeHtml=window.escapeHtml||esc;
  window.tk85GetCodes=function(){const raw=$("createInput")?.value||"";return raw.split(/\r?\n|[,;\t]+/).map(x=>x.trim()).filter(Boolean)};
  window.tk85RenderQR=function(preview,code){preview.innerHTML="";const canvas=document.createElement("canvas");canvas.id="currentCodeCanvas";preview.appendChild(canvas);if(window.QRCode&&QRCode.toCanvas){QRCode.toCanvas(canvas,code,{width:300,margin:2,errorCorrectionLevel:"M"},function(err){if(err)tk85RenderQRFallback(preview,code)})}else{tk85RenderQRFallback(preview,code)}};
  window.tk85RenderQRFallback=function(preview,code){preview.innerHTML="";const img=document.createElement("img");img.className="qr-img-fallback";img.alt="QR Code";img.src="https://quickchart.io/qr?size=300&text="+encodeURIComponent(code);img.onerror=function(){preview.innerHTML='<div class="qr-fallback">Không tải được QR.<br>'+esc(code)+'</div>'};preview.appendChild(img)};
  window.tk85RenderBarcode=function(preview,code){preview.innerHTML="";const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.id="currentBarcodeSvg";preview.appendChild(svg);if(window.JsBarcode){try{JsBarcode(svg,code,{format:"CODE128",displayValue:true,lineColor:"#000",background:"#fff",height:92,margin:12})}catch(e){preview.innerHTML='<div class="qr-fallback">Không tạo được Barcode 128.<br>'+esc(code)+'</div>'}}else{preview.innerHTML='<div class="qr-fallback">Thư viện Barcode chưa tải.<br>'+esc(code)+'</div>'}};
  window.renderCurrentCode=function(){const preview=$("codePreview");if(!preview)return;window.runCodes=tk85GetCodes();if(typeof window.runIndex!=="number")window.runIndex=0;if(window.runIndex>=window.runCodes.length)window.runIndex=0;const code=window.runCodes[window.runIndex]||"";if(!code){preview.textContent="Mã sẽ hiện ở đây...";if(typeof updateRunStats==="function")updateRunStats();return}const mode=window.currentCodeType==="barcode"?"barcode":"qr";if(mode==="barcode")tk85RenderBarcode(preview,code);else tk85RenderQR(preview,code);if(window.runDone&&window.runDone.add)window.runDone.add(code);if(typeof updateRunStats==="function")updateRunStats()};
  window.generateCode=function(){window.runCodes=tk85GetCodes();window.runIndex=0;renderCurrentCode();if(typeof renderRunLists==="function")renderRunLists()};
  document.querySelectorAll(".type-tab").forEach(btn=>{btn.addEventListener("click",function(e){window.currentCodeType=this.dataset.codeType==="barcode"?"barcode":"qr";document.querySelectorAll(".type-tab").forEach(x=>x.classList.toggle("active",x===this));generateCode()},true)});
  $("generateBtn")?.addEventListener("click",function(e){e.preventDefault();generateCode()},true);
  let inputTimer=null;$("createInput")?.addEventListener("input",function(){clearTimeout(inputTimer);inputTimer=setTimeout(generateCode,250)});
  window.tk85NormalScans=JSON.parse(localStorage.getItem("tk85_normal_scans")||"[]");window.tk85LatestNormal="";
  function renderNormalList(){const box=$("normalScanResultBox"),latest=$("normalLatestCode"),list=$("normalScannedList");if(box)box.classList.remove("hidden");if(latest)latest.textContent=tk85LatestNormal||"---";if(list)list.textContent=tk85NormalScans.length?tk85NormalScans.map((x,i)=>(i+1)+". "+x).join("\n"):"Chưa có mã đã ghi nhận."}
  window.tk85AddNormal=function(code){if(!code)return;tk85LatestNormal=String(code).trim();renderNormalList()};
  $("addNormalLatestBtn")?.addEventListener("click",function(){if(!tk85LatestNormal)return;tk85NormalScans.unshift(tk85LatestNormal);localStorage.setItem("tk85_normal_scans",JSON.stringify(tk85NormalScans.slice(0,1000)));renderNormalList()});
  $("copyNormalLatestBtn")?.addEventListener("click",()=>navigator.clipboard?.writeText(tk85LatestNormal||""));$("copyNormalAllBtn")?.addEventListener("click",()=>navigator.clipboard?.writeText(tk85NormalScans.join("\n")));$("exportNormalTxtBtn")?.addEventListener("click",()=>downloadText("qr-da-quet.txt",tk85NormalScans.join("\n"),"text/plain"));$("exportNormalCsvBtn")?.addEventListener("click",()=>downloadText("qr-da-quet.csv","STT,Code\n"+tk85NormalScans.map((x,i)=>`${i+1},"${String(x).replace(/"/g,'""')}"`).join("\n"),"text/csv"));
  if(typeof window.handleDetected==="function"){const oldHandle=window.handleDetected;window.handleDetected=function(values){const v=Array.isArray(values)?(typeof sortCodes==="function"?sortCodes(values)[0]:values[0]):values;if(!window.inventoryMode)tk85AddNormal(v);return oldHandle.apply(this,arguments)}}
  $("finishInventoryInlineBtn")?.addEventListener("click",()=>$("finishInventoryBtn")?.click());["openScanFromInventoryBtn","finishInventoryBtn"].forEach(id=>{const el=$(id);if(el)el.style.display="none"});
  let lock=false,lastAt=0,lastCode="";window.scanInventoryFrame=async function(){if(lock)return;if(!window.inventoryVideo||!inventoryVideo.videoWidth)return;inventoryCanvas.width=inventoryVideo.videoWidth;inventoryCanvas.height=inventoryVideo.videoHeight;inventoryCtx.drawImage(inventoryVideo,0,0,inventoryCanvas.width,inventoryCanvas.height);const values=[];values.push(...await detectValuesFromCanvas(inventoryCanvas));if(window.invZxingReader){try{const r=await invZxingReader.decodeFromCanvas(inventoryCanvas);if(r?.text)values.push(r.text)}catch(e){}}if(!values.length)return;const v=sortCodes(values)[0];const code=normalizeCode(v);const now=Date.now();const same=code&&code===lastCode;const gap=same?7000:1200;if(now-lastAt<gap)return;lock=true;lastAt=now;lastCode=code;inventoryRecordScan(v);window.lastValue=v;const last=$("lastScan");if(last)last.textContent=v;showSuccessLock(v);setInventoryCameraStatus("Đã quét: "+v+" — khóa 1.2s");try{if(navigator.vibrate)navigator.vibrate([150,80,150]);const cam=$("inventoryCameraWrap");if(cam){cam.classList.remove("scan-cooldown-flash");void cam.offsetWidth;cam.classList.add("scan-cooldown-flash")}}catch(e){}setTimeout(()=>{lock=false},1200)};
  setTimeout(()=>{if($("createInput")?.value.trim())generateCode()},300);
})();


/* TKver9.1 restore inventory toolbar wiring */
(function(){
  const $=(id)=>document.getElementById(id);
  $("finishInventoryInlineBtn")?.addEventListener("click",()=>$("finishInventoryBtn")?.click());
  $("loadInventoryBtn")?.addEventListener("click",function(){
    if(typeof loadInventoryData==="function") return loadInventoryData();
    if(typeof parseInventoryData==="function") return parseInventoryData();
    if(typeof renderInventoryTable==="function") renderInventoryTable();
    const txt=$("inventoryInput")||document.querySelector(".inventory-panel textarea");
    if(txt && txt.value.trim()) alert("Đã nạp dữ liệu kiểm kê.");
  });
  $("clearInventoryBtn")?.addEventListener("click",function(){
    if(!confirm("Xóa bảng kiểm kê hiện tại?")) return;
    try{ if(window.inventoryItems) window.inventoryItems=[]; if(window.inventoryMap) window.inventoryMap=new Map(); if(window.inventoryScans) window.inventoryScans={}; }catch(e){}
    const table=$("inventoryTableBody")||document.querySelector(".inventory-table tbody");
    if(table) table.innerHTML='<tr><td colspan="4">Chưa có dữ liệu kiểm kê.</td></tr>';
    if(typeof renderInventoryStats==="function") renderInventoryStats();
    if(typeof renderInventoryTable==="function") renderInventoryTable();
  });
  $("collapseInventoryBtn")?.addEventListener("click",function(){
    const panel=document.querySelector(".inventory-panel");
    if(panel){panel.classList.toggle("collapsed");this.textContent=panel.classList.contains("collapsed")?"Mở rộng":"Thu gọn";}
  });
  ["openScanFromInventoryBtn","finishInventoryBtn"].forEach(id=>{const el=$(id); if(el) el.style.display="none";});
})();


/* TKver9.1 FIX inventory buttons real actions */
(function(){
  function $(s){return document.querySelector(s)}
  function $all(s){return Array.from(document.querySelectorAll(s))}
  function norm(v){return String(v||"").trim().replace(/\s+/g,"").toUpperCase()}
  function getInput(){return document.getElementById("inventoryInput") || document.querySelector(".inventory-panel textarea")}
  function parseLines(text){
    return String(text||"").split(/\r?\n/).map((line,i)=>{
      const raw=line.trim();
      if(!raw)return null;
      const parts=raw.split(/\s+/);
      const code=norm(parts.shift());
      const name=parts.join(" ").trim();
      return code ? {code,name,count:0,order:i+1} : null;
    }).filter(Boolean);
  }
  function renderRows(rows, active){
    const body=document.getElementById("inventoryTableBody") || document.querySelector(".inventory-table tbody");
    if(!body)return;
    body.innerHTML = rows.length ? rows.map((r,i)=>{
      const c=Number(r.count||0);
      const cls=c>0?"inv-ok":"inv-missing";
      const badge=`<span class="badge">${c===0?"0":c===1?"OK":c}</span>`;
      return `<tr class="${cls}" data-code="${r.code}"><td>${i+1}</td><td>${r.code}</td><td>${(r.name||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}</td><td>${badge}</td></tr>`;
    }).join("") : '<tr><td colspan="4">Chưa có dữ liệu kiểm kê.</td></tr>';
    if(active){
      const row=body.querySelector(`[data-code="${active}"]`);
      if(row)row.scrollIntoView({block:"center",behavior:"smooth"});
    }
  }
  function updateStats(rows){
    const total=rows.length;
    const done=rows.filter(x=>Number(x.count||0)>0).length;
    const missing=rows.filter(x=>Number(x.count||0)===0).length;
    const count=rows.reduce((s,x)=>s+Number(x.count||0),0);
    const set=(id,val)=>{const el=document.getElementById(id); if(el)el.textContent=val};
    set("invTotal",total); set("invDone",done); set("invMissing",missing); set("invTotalCount",count);
  }
  window.tk88SetInventoryRows=function(rows){
    window.inventoryRows = rows;
    window.inventoryMap = {};
    rows.forEach((r,i)=>window.inventoryMap[norm(r.code)] = i);
    updateStats(rows);
    renderRows(rows);
    if(typeof renderExportFilters==="function") renderExportFilters();
  }
  window.tk88LoadInventory=function(){
    const input=getInput();
    const rows=parseLines(input ? input.value : "");
    if(!rows.length){ alert("Chưa có dữ liệu để nạp. Dán danh sách code + tên sản phẩm trước."); return; }
    tk88SetInventoryRows(rows);
    const panel=document.getElementById("inventoryPanel");
    if(panel)panel.classList.add("collapsed");
    document.querySelectorAll("#collapseInventoryBtn").forEach(b=>b.textContent="Mở rộng");
    const st=document.getElementById("inventoryStickyResult");
    if(st)st.classList.add("hidden");
    alert("Đã nạp "+rows.length+" mã kiểm kê.");
  }
  window.tk88ClearInventory=function(){
    if(!confirm("Xóa toàn bộ bảng kiểm kê?"))return;
    tk88SetInventoryRows([]);
    const input=getInput(); if(input)input.value="";
  }
  window.tk88ToggleInventory=function(){
    const panel=document.getElementById("inventoryPanel");
    if(!panel)return;
    panel.classList.toggle("collapsed");
    document.querySelectorAll("#collapseInventoryBtn").forEach(b=>b.textContent=panel.classList.contains("collapsed")?"Mở rộng":"Thu gọn");
  }
  // Override old buttons using event capture so duplicate/old handlers không phá
  $all("#loadInventoryBtn").forEach(btn=>{btn.onclick=null;btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();tk88LoadInventory();},true)});
  $all("#clearInventoryBtn").forEach(btn=>{btn.onclick=null;btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();tk88ClearInventory();},true)});
  $all("#collapseInventoryBtn").forEach(btn=>{btn.onclick=null;btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();tk88ToggleInventory();},true)});
  // Override scan record so it uses same global table
  window.inventoryRecordScan = function(raw){
    const code=norm(raw);
    if(!code || !window.inventoryRows || !window.inventoryRows.length)return;
    const idx=window.inventoryMap ? window.inventoryMap[code] : undefined;
    if(idx!==undefined && window.inventoryRows[idx]){
      window.inventoryRows[idx].count=Number(window.inventoryRows[idx].count||0)+1;
      updateStats(window.inventoryRows);
      renderRows(window.inventoryRows, code);
    }
  }
})();


/* TKver9.1 FIX QR runner actual render + blue highlight */
(function(){
  const $=(id)=>document.getElementById(id);
  const esc=(s)=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  window.escapeHtml=window.escapeHtml||esc;

  function getCodes(){
    const raw=$("createInput")?.value||"";
    return raw.split(/\r?\n|[,;\t]+/).map(x=>x.trim()).filter(Boolean);
  }
  function renderQR(preview,code){
    preview.innerHTML="";
    const canvas=document.createElement("canvas");
    canvas.id="currentCodeCanvas";
    preview.appendChild(canvas);
    if(window.QRCode&&QRCode.toCanvas){
      QRCode.toCanvas(canvas,code,{width:300,margin:2,errorCorrectionLevel:"M"},err=>{if(err)fallbackQR(preview,code);});
    }else fallbackQR(preview,code);
  }
  function fallbackQR(preview,code){
    preview.innerHTML="";
    const img=document.createElement("img");
    img.className="qr-img-fallback";
    img.alt="QR Code";
    img.src="https://quickchart.io/qr?size=300&text="+encodeURIComponent(code);
    img.onerror=()=>preview.innerHTML='<div class="qr-fallback">Không tải được QR.<br>'+esc(code)+'</div>';
    preview.appendChild(img);
  }
  function renderBarcode(preview,code){
    preview.innerHTML="";
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.id="currentBarcodeSvg";
    preview.appendChild(svg);
    if(window.JsBarcode){
      try{JsBarcode(svg,code,{format:"CODE128",displayValue:true,lineColor:"#000",background:"#fff",height:92,margin:12});}
      catch(e){preview.innerHTML='<div class="qr-fallback">Không tạo được Barcode 128.<br>'+esc(code)+'</div>';}
    }else preview.innerHTML='<div class="qr-fallback">Thư viện Barcode chưa tải.<br>'+esc(code)+'</div>';
  }
  function ensure(){
    window.runCodes=getCodes();
    if(!window.runDone||typeof window.runDone.add!=="function")window.runDone=new Set();
    if(!window.runErrors||typeof window.runErrors.add!=="function")window.runErrors=new Set();
    if(typeof window.runIndex!=="number")window.runIndex=0;
    if(window.runIndex>=window.runCodes.length)window.runIndex=0;
    if(window.runIndex<0)window.runIndex=0;
  }
  window.renderCurrentCode=function(){
    ensure();
    const preview=$("codePreview");
    if(!preview)return;
    const code=window.runCodes[window.runIndex]||"";
    if(!code){
      preview.textContent="Mã sẽ hiện ở đây...";
      if(typeof updateRunStats==="function")updateRunStats();
      renderRunLists();
      return;
    }
    if(window.currentCodeType==="barcode")renderBarcode(preview,code); else renderQR(preview,code);
    window.runDone.add(code);
    if(typeof updateRunStats==="function")updateRunStats();
    renderRunLists();
  };
  window.generateCode=function(){
    window.runCodes=getCodes();
    window.runIndex=0;
    window.runDone=new Set();
    window.runErrors=new Set();
    renderCurrentCode();
  };
  window.renderRunLists=function(){
    ensure();
    const list=$("qrList"), doneList=$("qrDoneList"), errList=$("qrErrorList");
    if(list){
      list.innerHTML=window.runCodes.length?window.runCodes.map((code,i)=>{
        const active=i===window.runIndex?" active-running":"";
        const status=i===window.runIndex?"Đang chạy":(window.runDone.has(code)?"Đã chạy":"");
        return `<div class="qr-list-row${active}" data-index="${i}"><b>${i+1}</b><span>${esc(code)}</span><em>${status}</em></div>`;
      }).join(""):'<div class="empty">Chưa có dữ liệu.</div>';
      const row=list.querySelector(".active-running");
      if(row)row.scrollIntoView({block:"nearest",behavior:"smooth"});
    }
    if(doneList){
      const arr=Array.from(window.runDone);
      doneList.innerHTML=arr.length?arr.map((x,i)=>`<div class="qr-mini-row"><b>${i+1}</b><span>${esc(x)}</span><em>OK</em></div>`).join(""):'<div class="empty">Chưa có.</div>';
    }
    if(errList){
      const arr=Array.from(window.runErrors);
      errList.innerHTML=arr.length?arr.map((x,i)=>`<div class="qr-mini-row error"><b>${i+1}</b><span>${esc(x)}</span><em>Lỗi</em></div>`).join(""):'<div class="empty">Chưa có lỗi.</div>';
    }
    const set=(id,val)=>{const el=$(id);if(el)el.textContent=val};
    set("runTotal",window.runCodes.length);
    set("runDone",window.runDone.size);
    set("runError",window.runErrors.size);
    set("runPosition",window.runCodes.length?((window.runIndex+1)+"/"+window.runCodes.length):"0/0");
  };
  function step(){
    ensure();
    if(!window.runCodes.length){renderCurrentCode();return;}
    const nextIndex=window.runIndex+1;
    if(nextIndex>=window.runCodes.length){
      if(window.runnerTimer){clearInterval(window.runnerTimer);window.runnerTimer=null;}
      window.runIndex=window.runCodes.length-1;
      renderCurrentCode();
      if(typeof showRunnerDoneToast==="function")showRunnerDoneToast();
      return;
    }
    window.runIndex=nextIndex;
    renderCurrentCode();
  }
  function delay(){
    const sel=$("delaySelect")||$("runnerDelay")||document.querySelector(".runner-delay select, .runner-delay input");
    const n=parseFloat(sel?.value||"5");
    return (Number.isFinite(n)?Math.max(1,n):5)*1000;
  }
  window.startRunner=function(){
    ensure();
    if(window.runnerTimer)clearInterval(window.runnerTimer);
    renderCurrentCode();
    window.runnerTimer=setInterval(step,delay());
  };
  window.pauseRunner=function(){if(window.runnerTimer)clearInterval(window.runnerTimer);window.runnerTimer=null;};
  window.resetRunner=function(){
    if(window.runnerTimer)clearInterval(window.runnerTimer);
    window.runnerTimer=null;window.runIndex=0;window.runDone=new Set();window.runErrors=new Set();renderCurrentCode();
  };
  $("startRunnerBtn")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();startRunner();},true);
  $("pauseRunnerBtn")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();pauseRunner();},true);
  $("resetRunnerBtn")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();resetRunner();},true);
  $("generateBtn")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();generateCode();},true);
  document.querySelectorAll(".type-tab").forEach(btn=>{
    btn.addEventListener("click",function(e){
      e.preventDefault();e.stopPropagation();
      window.currentCodeType=this.dataset.codeType==="barcode"?"barcode":"qr";
      document.querySelectorAll(".type-tab").forEach(x=>x.classList.toggle("active",x===this));
      generateCode();
    },true);
  });
  let t=null;
  $("createInput")?.addEventListener("input",()=>{clearTimeout(t);t=setTimeout(generateCode,250);});
  setTimeout(()=>{if($("createInput")?.value.trim())generateCode();},300);
})();


/* TKver9.1 FIX REAL IDS: create runner + copy/export data */
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  const state = {
    codes: [],
    index: 0,
    done: new Set(),
    errors: new Set(),
    timer: null,
    running: false
  };

  function getCodes(){
    const raw = $("createInput")?.value || "";
    return raw.split(/\r?\n|[,;\t]+/).map(x=>x.trim()).filter(Boolean);
  }
  function delayMs(){
    const v = parseFloat($("runnerDelay")?.value || "5");
    return Number.isFinite(v) ? Math.max(1, Math.round(v * 1000)) : 5000;
  }
  function setText(id,val){ const el=$(id); if(el) el.textContent=val; }

  function renderQR(preview, code){
    preview.innerHTML="";
    const canvas=document.createElement("canvas");
    canvas.id="currentCodeCanvas";
    preview.appendChild(canvas);
    if(window.QRCode && QRCode.toCanvas){
      QRCode.toCanvas(canvas, code, {width:300, margin:2, errorCorrectionLevel:"M"}, err=>{ if(err) qrFallback(preview, code); });
    }else{
      qrFallback(preview, code);
    }
  }
  function qrFallback(preview, code){
    preview.innerHTML="";
    const img=document.createElement("img");
    img.className="qr-img-fallback";
    img.alt="QR Code";
    img.src="https://quickchart.io/qr?size=300&text="+encodeURIComponent(code);
    img.onerror=()=>{ preview.innerHTML='<div class="qr-fallback">Không tải được QR.<br>'+esc(code)+'</div>'; };
    preview.appendChild(img);
  }
  function renderBarcode(preview, code){
    preview.innerHTML="";
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.id="currentBarcodeSvg";
    preview.appendChild(svg);
    if(window.JsBarcode){
      try{ JsBarcode(svg, code, {format:"CODE128",displayValue:true,lineColor:"#000",background:"#fff",height:92,margin:12}); }
      catch(e){ preview.innerHTML='<div class="qr-fallback">Không tạo được Barcode 128.<br>'+esc(code)+'</div>'; }
    }else{
      preview.innerHTML='<div class="qr-fallback">Thư viện Barcode chưa tải.<br>'+esc(code)+'</div>';
    }
  }

  function syncCodes(reset=false){
    const newCodes = getCodes();
    const joinedA = newCodes.join("\n");
    const joinedB = state.codes.join("\n");
    if(reset || joinedA !== joinedB){
      state.codes = newCodes;
      state.index = 0;
      state.done = new Set();
      state.errors = new Set();
    }
    if(state.index >= state.codes.length) state.index = 0;
  }

  function renderCurrent(markDone=true){
    syncCodes(false);
    const preview=$("codePreview");
    if(!preview) return;
    const code = state.codes[state.index] || "";
    if(!code){
      preview.textContent="Mã sẽ hiện ở đây...";
      renderLists();
      return;
    }
    if((window.currentCodeType || "qr") === "barcode") renderBarcode(preview, code);
    else renderQR(preview, code);
    if(markDone) state.done.add(code);
    renderLists();
  }

  function renderLists(){
    setText("runTotal", state.codes.length);
    setText("runDone", state.done.size);
    setText("runError", state.errors.size);
    setText("runIndex", state.codes.length ? ((state.index+1)+"/"+state.codes.length) : "0/0");
    setText("runListStatus", state.running ? "Đang chạy" : (state.codes.length ? "Đã nạp" : "Chưa chạy"));

    const list=$("runList");
    if(list){
      list.innerHTML = state.codes.length ? state.codes.map((code,i)=>{
        const active = i===state.index ? " active-running" : "";
        const status = i===state.index ? "Đang chạy" : (state.done.has(code) ? "Đã chạy" : "");
        return `<div class="run-row${active}" data-index="${i}"><b>${i+1}</b><span>${esc(code)}</span><em>${status}</em></div>`;
      }).join("") : "Chưa có dữ liệu.";
      const row=list.querySelector(".active-running");
      if(row) row.scrollIntoView({block:"nearest", behavior:"smooth"});
    }
    const done=$("doneList");
    if(done){
      const arr=[...state.done];
      done.innerHTML = arr.length ? arr.map((x,i)=>`<div class="run-row done"><b>${i+1}</b><span>${esc(x)}</span><em>OK</em></div>`).join("") : "Chưa có.";
    }
    const err=$("errorList");
    if(err){
      const arr=[...state.errors];
      err.innerHTML = arr.length ? arr.map((x,i)=>`<div class="run-row error"><b>${i+1}</b><span>${esc(x)}</span><em>Lỗi</em></div>`).join("") : "Chưa có lỗi.";
    }
  }

  function step(){
    if(!state.codes.length){ syncCodes(true); renderCurrent(false); return; }
    const nextIndex = state.index + 1;
    if(nextIndex >= state.codes.length){
      // Đã chạy hết tất cả mã → dừng interval, hiện thông báo
      if(state.timer){ clearInterval(state.timer); state.timer=null; }
      state.running = false;
      state.index = state.codes.length - 1;
      renderCurrent(true);
      renderLists();
      showRunnerDoneToast();
      return;
    }
    state.index = nextIndex;
    renderCurrent(true);
  }
  function showRunnerDoneToast(){
    if(document.getElementById("tkRunnerDoneToast")) return;
    const toast = document.createElement("div");
    toast.id = "tkRunnerDoneToast";
    toast.textContent = "✅ Đã chạy hết tất cả mã!";
    toast.style.cssText = "position:fixed;top:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:14px 28px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 8px 24px rgba(16,185,129,.4);z-index:99999;animation:slideDown .35s ease-out;";
    if(!document.getElementById("tkRunnerDoneStyle")){
      const s = document.createElement("style");
      s.id = "tkRunnerDoneStyle";
      s.textContent = "@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}";
      document.head.appendChild(s);
    }
    document.body.appendChild(toast);
    try{ if(navigator.vibrate) navigator.vibrate([120,60,120]); }catch(e){}
    setTimeout(()=>{ toast.style.transition="opacity .35s"; toast.style.opacity="0"; setTimeout(()=>toast.remove(),350); }, 3000);
  }

  function play(){
    syncCodes(false);
    if(!state.codes.length) syncCodes(true);
    if(!state.codes.length){ alert("Chưa có dữ liệu QR để chạy."); return; }
    if(state.timer) clearInterval(state.timer);
    state.running = true;
    renderCurrent(true);
    state.timer = setInterval(step, delayMs());
  }
  function pause(){
    if(state.timer) clearInterval(state.timer);
    state.timer=null;
    state.running=false;
    renderLists();
  }
  function reset(){
    pause();
    syncCodes(true);
    renderCurrent(false);
  }
  function generate(){
    pause();
    syncCodes(true);
    renderCurrent(false);
  }
  function currentCode(){ syncCodes(false); return state.codes[state.index] || ""; }

  function copyText(text){
    text = String(text || "");
    if(!text.trim()){ alert("Không có dữ liệu để copy."); return; }
    if(navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text).then(()=>alert("Đã copy dữ liệu."),()=>fallbackCopy(text));
    }else fallbackCopy(text);
  }
  function fallbackCopy(text){
    const ta=document.createElement("textarea");
    ta.value=text; ta.setAttribute("readonly","");
    ta.style.position="fixed"; ta.style.left="-9999px"; ta.style.top="0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try{ document.execCommand("copy"); alert("Đã copy dữ liệu."); }
    catch(e){ alert("Không copy được. Trình duyệt đang chặn clipboard."); }
    ta.remove();
  }
  function download(name, text, type="text/plain"){
    text = String(text || "");
    if(!text.trim()){ alert("Không có dữ liệu để xuất file."); return; }
    const blob=new Blob([text], {type:type+";charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=name;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500);
  }
  function csv(arr){
    return "STT,Code\n" + arr.map((x,i)=>`${i+1},"${String(x).replace(/"/g,'""')}"`).join("\n");
  }

  // Event binding by actual IDs in current HTML
  $("playRunnerBtn")?.addEventListener("click", e=>{e.preventDefault(); e.stopPropagation(); play();}, true);
  $("pauseRunnerBtn")?.addEventListener("click", e=>{e.preventDefault(); e.stopPropagation(); pause();}, true);
  $("resetRunnerBtn")?.addEventListener("click", e=>{e.preventDefault(); e.stopPropagation(); reset();}, true);
  $("generateBtn")?.addEventListener("click", e=>{e.preventDefault(); e.stopPropagation(); generate();}, true);

  $("copyRunDoneBtn")?.addEventListener("click", e=>{e.preventDefault(); copyText([...state.done].join("\n"));}, true);
  $("copyErrorBtn")?.addEventListener("click", e=>{e.preventDefault(); copyText([...state.errors].join("\n"));}, true);
  $("exportRunTxtBtn")?.addEventListener("click", e=>{e.preventDefault(); download("qr-da-chay.txt",[...state.done].join("\n"));}, true);
  $("exportRunCsvBtn")?.addEventListener("click", e=>{e.preventDefault(); download("qr-da-chay.csv",csv([...state.done]),"text/csv");}, true);
  $("clearRunStateBtn")?.addEventListener("click", e=>{e.preventDefault(); if(confirm("Xóa phiên chạy hiện tại?")) reset();}, true);

  $("downloadCurrentBtn")?.addEventListener("click", e=>{
    e.preventDefault();
    const canvas=$("currentCodeCanvas");
    const svg=$("currentBarcodeSvg");
    if(canvas){
      const a=document.createElement("a"); a.download="qr-"+(currentCode()||"code")+".png"; a.href=canvas.toDataURL("image/png"); a.click();
    }else if(svg){
      const data=new XMLSerializer().serializeToString(svg);
      download("barcode-"+(currentCode()||"code")+".svg", data, "image/svg+xml");
    }else alert("Chưa có mã để tải.");
  }, true);

  document.querySelectorAll(".type-tab").forEach(btn=>{
    btn.addEventListener("click", function(e){
      e.preventDefault(); e.stopPropagation();
      window.currentCodeType = this.dataset.codeType === "barcode" ? "barcode" : "qr";
      document.querySelectorAll(".type-tab").forEach(x=>x.classList.toggle("active", x===this));
      setText("createTypeStatus", "Đang chọn: " + (window.currentCodeType==="barcode" ? "Barcode 128" : "QR Code"));
      renderCurrent(false);
    }, true);
  });

  let inputTimer=null;
  $("createInput")?.addEventListener("input", ()=>{
    clearTimeout(inputTimer);
    inputTimer=setTimeout(()=>{ syncCodes(true); renderCurrent(false); }, 220);
  });

  // Mark error
  document.addEventListener("keydown", e=>{
    if(e.code==="Space" && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT"){
      const c=currentCode(); if(c){ state.errors.add(c); renderLists(); e.preventDefault(); }
    }
  }, true);
  $("codePreview")?.addEventListener("click", ()=>{
    if(matchMedia("(max-width: 768px)").matches){
      const c=currentCode(); if(c){ state.errors.add(c); renderLists(); }
    }
  });

  // Expose for debug and old handlers
  window.tkRunner90 = {state, play, pause, reset, generate, renderCurrent, renderLists};
  window.startRunner = play;
  window.pauseRunner = pause;
  window.resetRunner = reset;
  window.generateCode = generate;
  window.renderCurrentCode = renderCurrent;
  window.renderRunLists = renderLists;

  setTimeout(()=>{ syncCodes(true); renderCurrent(false); }, 250);
})();


/* TKver9.1 BUTTON AUDIT + COPY/EXPORT HARD FIX */
(function(){
  const $=id=>document.getElementById(id);
  const $$=sel=>Array.from(document.querySelectorAll(sel));
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  const norm=s=>String(s||"").trim().replace(/\s+/g,"").toUpperCase();
  function toast(msg,ok=true){try{let t=$("tkToast91");if(!t){t=document.createElement("div");t.id="tkToast91";t.style.cssText="position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:999999;padding:11px 15px;border-radius:999px;color:#fff;font-weight:900;box-shadow:0 10px 25px rgba(0,0,0,.25);max-width:92vw;text-align:center";document.body.appendChild(t)}t.style.background=ok?"#128a42":"#e0314b";t.textContent=msg;t.style.display="block";clearTimeout(window.tkToastTimer91);window.tkToastTimer91=setTimeout(()=>t.style.display="none",1800)}catch(e){alert(msg)}}
  async function copyText(text,label="dữ liệu"){text=String(text||"");if(!text.trim()){toast("Không có "+label+" để copy.",false);return false}try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}else{const ta=document.createElement("textarea");ta.value=text;ta.readOnly=true;ta.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";document.body.appendChild(ta);ta.focus();ta.select();const ok=document.execCommand("copy");ta.remove();if(!ok)throw new Error("copy fail")}toast("Đã copy "+label+": "+text.split(/\r?\n/).filter(Boolean).length+" dòng.");return true}catch(e){console.error(e);toast("Không copy được. Trình duyệt đang chặn clipboard.",false);return false}}
  function downloadText(name,text,type="text/plain"){text=String(text||"");if(!text.trim()){toast("Không có dữ liệu để xuất file.",false);return false}const blob=new Blob(["\ufeff"+text],{type:type+";charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},600);toast("Đã tải file "+name);return true}
  function csvLine(cols){return cols.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")}
  function getCreateCodes(){return ($("createInput")?.value||"").split(/\r?\n|[,;\t]+/).map(x=>x.trim()).filter(Boolean)}
  function runnerState(){return window.tkRunner90?.state || {codes:getCreateCodes(),done:new Set(),errors:new Set(),index:0}}
  function runDone(){return Array.from(runnerState().done||[])}
  function runErr(){return Array.from(runnerState().errors||[])}
  function currentCode(){const s=runnerState();return (s.codes||[])[s.index||0]||getCreateCodes()[0]||"code"}
  function bind(id,fn){const el=$(id);if(!el){console.warn("TKver9.1 missing",id);return}el.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();fn(e)},true)}

  // Create runner copy/export/download
  bind("copyRunDoneBtn",()=>copyText(runDone().join("\n"),"QR đã chạy"));
  bind("copyErrorBtn",()=>copyText(runErr().join("\n"),"QR lỗi"));
  bind("exportRunTxtBtn",()=>downloadText("qr-da-chay.txt",runDone().join("\n")));
  bind("exportRunCsvBtn",()=>downloadText("qr-da-chay.csv",[csvLine(["STT","Code"])].concat(runDone().map((x,i)=>csvLine([i+1,x]))).join("\n"),"text/csv"));
  bind("downloadCurrentBtn",()=>{const c=$("currentCodeCanvas"),s=$("currentBarcodeSvg"),code=currentCode();if(c){const a=document.createElement("a");a.download="qr-"+code+".png";a.href=c.toDataURL("image/png");a.click()}else if(s){downloadText("barcode-"+code+".svg",new XMLSerializer().serializeToString(s),"image/svg+xml")}else toast("Chưa có mã để tải.",false)});

  // Normal scan state
  window.tkNormalScan91=window.tkNormalScan91||{latest:"",rows:JSON.parse(localStorage.getItem("tk_normal_scan_rows91")||"[]")};
  function normalRender(){const box=$("normalScanResultBox"),latest=$("normalLatestCode"),list=$("normalScannedList");if(box)box.classList.remove("hidden");if(latest)latest.textContent=window.tkNormalScan91.latest||"---";if(list){const counts={};window.tkNormalScan91.rows.forEach(x=>counts[x]=(counts[x]||0)+1);const keys=Object.keys(counts);list.innerHTML=keys.length?keys.map((code,i)=>`<div class="normal-row"><b>${i+1}</b><span>${esc(code)}</span><em>SL: ${counts[code]}</em></div>`).join(""):"Chưa có mã đã ghi nhận."}}
  function normalAddLatest(code){code=String(code||"").trim();if(!code)return;const now=Date.now();if(window.tkNormalScan91.latest===code&&now-(window.tkNormalScan91.lastAt||0)<1200)return;window.tkNormalScan91.latest=code;window.tkNormalScan91.lastAt=now;normalRender()}
  function normalCommit(){const code=window.tkNormalScan91.latest;if(!code){toast("Chưa có mã vừa quét để ghi nhận.",false);return}window.tkNormalScan91.rows.unshift(code);localStorage.setItem("tk_normal_scan_rows91",JSON.stringify(window.tkNormalScan91.rows.slice(0,3000)));normalRender();toast("Đã ghi nhận mã quét.")}
  function normalText(){const counts={};window.tkNormalScan91.rows.forEach(x=>counts[x]=(counts[x]||0)+1);return Object.keys(counts).map((code,i)=>`${i+1}\t${code}\t${counts[code]}`).join("\n")}
  function normalCsv(){const counts={};window.tkNormalScan91.rows.forEach(x=>counts[x]=(counts[x]||0)+1);return [csvLine(["STT","Ma QR","So luong"])].concat(Object.keys(counts).map((code,i)=>csvLine([i+1,code,counts[code]]))).join("\n")}
  bind("addNormalLatestBtn",normalCommit);bind("copyNormalLatestBtn",()=>copyText(window.tkNormalScan91.latest,"mã vừa quét"));bind("copyNormalAllBtn",()=>copyText(normalText(),"danh sách đã quét"));bind("exportNormalTxtBtn",()=>downloadText("danh-sach-da-quet.txt",normalText()));bind("exportNormalCsvBtn",()=>downloadText("danh-sach-da-quet.csv",normalCsv(),"text/csv"));

  // Inventory robust state
  window.tkInv91=window.tkInv91||{rows:[],map:{},filter:"all"};
  function invParse(){return ($("inventoryInput")?.value||"").split(/\r?\n/).map((line,i)=>{line=line.trim();if(!line)return null;const m=line.match(/^(\S+)\s*(.*)$/);if(!m)return null;return{code:norm(m[1]),name:(m[2]||"").trim(),count:0,order:i+1}}).filter(Boolean)}
  function invSet(rows){window.tkInv91.rows=rows;window.tkInv91.map={};rows.forEach((r,i)=>window.tkInv91.map[norm(r.code)]=i);invRender()}
  function invRender(active){const rows=window.tkInv91.rows||[];const total=rows.length,done=rows.filter(r=>+r.count>0).length,missing=total-done,totalCount=rows.reduce((s,r)=>s+(+r.count||0),0);[["invTotal",total],["invDone",done],["invMissing",missing],["invTotalCount",totalCount]].forEach(([id,v])=>{if($(id))$(id).textContent=v});const body=$("inventoryTableBody");if(body){body.innerHTML=rows.length?rows.map((r,i)=>`<tr class="${(+r.count>0)?"inv-ok":"inv-missing"}" data-code="${esc(r.code)}"><td>${i+1}</td><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td><span class="badge">${(+r.count>0)?(r.count===1?"OK":r.count):"0"}</span></td></tr>`).join(""):'<tr><td colspan="4">Chưa có dữ liệu kiểm kê.</td></tr>';if(active){const row=body.querySelector(`[data-code="${CSS.escape(active)}"]`);if(row)row.scrollIntoView({block:"center",behavior:"smooth"})}}invPreview()}
  function invLoad(){const rows=invParse();if(!rows.length){toast("Chưa có dữ liệu để nạp.",false);return}invSet(rows);const p=$("inventoryPanel");if(p)p.classList.add("collapsed");$$('[id="collapseInventoryBtn"]').forEach(b=>b.textContent="Mở rộng");toast("Đã nạp "+rows.length+" mã kiểm kê.")}
  function invClear(){if(!confirm("Xóa toàn bộ bảng kiểm kê?"))return;invSet([]);if($("inventoryInput"))$("inventoryInput").value="";toast("Đã xóa bảng kiểm kê.")}
  function invToggle(){const p=$("inventoryPanel");if(!p)return;p.classList.toggle("collapsed");$$('[id="collapseInventoryBtn"]').forEach(b=>b.textContent=p.classList.contains("collapsed")?"Mở rộng":"Thu gọn")}
  function invRecord(raw){const code=norm(raw);if(!code)return;const idx=window.tkInv91.map?.[code];if(idx===undefined){toast("Mã ngoài bảng: "+code,false);return}const now=Date.now();if(window.tkInv91.lastCode===code&&now-(window.tkInv91.lastAt||0)<1200)return;window.tkInv91.lastCode=code;window.tkInv91.lastAt=now;window.tkInv91.rows[idx].count=(+window.tkInv91.rows[idx].count||0)+1;invRender(code);try{if(navigator.vibrate)navigator.vibrate([120,60,120])}catch(e){}}
  function invRows(){const f=window.tkInv91.filter||"all",rows=window.tkInv91.rows||[];if(f==="missing")return rows.filter(r=>!(+r.count));if(f==="done")return rows.filter(r=>+r.count>0);return rows}
  function invText(){return invRows().map((r,i)=>`${i+1}\t${r.code}\t${r.name||""}\t${+r.count||0}`).join("\n")}
  function invCsv(){return [csvLine(["STT","Ma code","Ten san pham","SL"])].concat(invRows().map((r,i)=>csvLine([i+1,r.code,r.name||"",+r.count||0]))).join("\n")}
  function invPreview(){const box=$("exportPreview");if(!box)return;const t=invText();if(!t){box.classList.add("hidden");box.textContent="";return}box.classList.remove("hidden");box.textContent=t.split("\n").slice(0,30).join("\n")}
  bind("loadInventoryBtn",invLoad);bind("clearInventoryBtn",invClear);bind("collapseInventoryBtn",invToggle);bind("manualScanBtn",()=>{const v=$("manualScanInput")?.value||"";invRecord(v);if($("manualScanInput"))$("manualScanInput").value=""});$("manualScanInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("manualScanBtn")?.click()}},true);bind("finishInventoryInlineBtn",()=>toast("Đã chốt lượt kiểm kê hiện tại."));bind("copySelectedExportBtn",()=>copyText(invText(),"dữ liệu kiểm kê"));bind("exportSelectedTxtBtn",()=>downloadText("kiem-ke.txt",invText()));bind("exportSelectedCsvBtn",()=>downloadText("kiem-ke.csv",invCsv(),"text/csv"));$$(".filter-btn").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();window.tkInv91.filter=btn.dataset.exportFilter||"all";$$(".filter-btn").forEach(x=>x.classList.toggle("active",x===btn));invPreview()},true));
  const oldHandle=window.handleDetected;if(typeof oldHandle==="function"){window.handleDetected=function(values){const v=Array.isArray(values)?values[0]:values;if(!window.inventoryMode)normalAddLatest(v);return oldHandle.apply(this,arguments)}}window.inventoryRecordScan=invRecord;
  window.downloadText=downloadText;window.copyText=copyText;window.tkButtonAudit91={copyText,downloadText,normalText,normalCsv,invText,invCsv,invLoad,invClear,invRecord};
  const must=["generateBtn","downloadCodeBtn","clearCreateBtn","playRunnerBtn","pauseRunnerBtn","resetRunnerBtn","downloadCurrentBtn","copyErrorBtn","copyRunDoneBtn","exportRunTxtBtn","exportRunCsvBtn","clearRunStateBtn","startBtn","stopBtn","imageBtn","copyNormalLatestBtn","addNormalLatestBtn","copyNormalAllBtn","exportNormalTxtBtn","exportNormalCsvBtn","loadInventoryBtn","clearInventoryBtn","collapseInventoryBtn","manualScanBtn","finishInventoryInlineBtn","copySelectedExportBtn","exportSelectedTxtBtn","exportSelectedCsvBtn"];const missing=must.filter(id=>!$(id));if(missing.length)console.warn("TKver9.1 missing buttons:",missing);normalRender();invRender();
})();
