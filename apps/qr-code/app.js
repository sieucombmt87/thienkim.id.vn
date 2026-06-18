/* TKver7.0 QR Scanner Engine Rewrite */
const $ = (s)=>document.querySelector(s);
const video=$("#video"), canvas=$("#scanCanvas"), ctx=canvas.getContext("2d",{willReadFrequently:true});
let stream=null, scanTimer=null, zxingReader=null, lastValue="", scanPool=[], scanned=[], inventoryMode=false;
let inventoryRows=[], inventoryMap={}, inventoryExtra=[];

const dbg = {
  https: $("#dbgHttps"), perm: $("#dbgPerm"), engine: $("#dbgEngine"), camera: $("#dbgCamera"),
  status: $("#cameraStatus")
};

function setStatus(t){ if(dbg.status) dbg.status.textContent=t; }
function setDebug(k,v){ const el=dbg[k]; if(el) el.textContent=v; }
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function normalizeCode(v){return String(v||"").trim().replace(/\s+/g,"").toUpperCase();}
function unique(arr){return [...new Set(arr.map(x=>String(x||"").trim()).filter(Boolean))];}
function codeType(v){
  const s=String(v).toUpperCase();
  if(/IMEI/.test(s)||/^\d{14,17}$/.test(s)) return "IMEI";
  if(/^RT[0-9A-Z-]{8,}$/.test(s)||s.includes("S/N")) return "S/N";
  if(/^SN/.test(s)||s.includes("SERIAL")) return "SN";
  if(/^\d{12,13}$/.test(s)) return "EAN";
  return "CODE";
}
function sortCodes(arr){
  const rank={IMEI:0,"S/N":1,SN:2,EAN:3,CODE:4};
  return unique(arr).sort((a,b)=>(rank[codeType(a)]??9)-(rank[codeType(b)]??9)||String(a).localeCompare(String(b)));
}
function downloadText(filename,text,type="text/plain"){
  const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),800);
}
async function copyText(t){ await navigator.clipboard.writeText(t); }

async function initDebug(){
  setDebug("https",(window.isSecureContext||location.hostname==="localhost")?"OK":"NO HTTPS");
  setDebug("engine","ZXING + jsQR");
  try{
    if(navigator.permissions?.query){
      const p=await navigator.permissions.query({name:"camera"});
      setDebug("perm",p.state);
      p.onchange=()=>setDebug("perm",p.state);
    }else setDebug("perm","unknown");
  }catch(e){setDebug("perm","unknown");}
}
initDebug();

async function openCamera(){
  if(!window.isSecureContext && location.hostname!=="localhost"){
    throw new Error("Trang chưa chạy HTTPS nên trình duyệt chặn camera.");
  }
  if(!navigator.mediaDevices?.getUserMedia){
    throw new Error("Trình duyệt không hỗ trợ camera.");
  }
  const devices=await navigator.mediaDevices.enumerateDevices().catch(()=>[]);
  const cams=devices.filter(d=>d.kind==="videoinput");
  setDebug("camera",cams.length?`${cams.length} camera`:"đang xin quyền");

  const back = cams.find(d=>/back|rear|environment|sau/i.test(d.label));
  const attempts = [];
  if(back?.deviceId) attempts.push({video:{deviceId:{exact:back.deviceId},width:{ideal:1280},height:{ideal:720}},audio:false});
  attempts.push({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});
  attempts.push({video:{facingMode:"environment"},audio:false});
  attempts.push({video:{width:{ideal:1280},height:{ideal:720}},audio:false});
  attempts.push({video:true,audio:false});

  let lastErr;
  for(const opt of attempts){
    try{
      const s=await navigator.mediaDevices.getUserMedia(opt);
      const track=s.getVideoTracks()[0];
      setDebug("camera",track?.label||"camera opened");
      return s;
    }catch(e){ lastErr=e; }
  }
  throw lastErr || new Error("Không mở được camera.");
}

async function startScan(){
  await stopScan(false);
  setStatus("Đang xin quyền camera...");
  try{
    stream=await openCamera();
    video.srcObject=stream;
    await video.play();

    setStatus("Camera đang chạy. Đưa mã vào vùng khung.");
    if(window.ZXing){
      try{
        zxingReader = new ZXing.BrowserMultiFormatReader();
        setDebug("engine","ZXING + jsQR");
      }catch(e){ zxingReader=null; setDebug("engine","jsQR only"); }
    }

    scanTimer=setInterval(scanFrame,380);
  }catch(e){
    const msg=(e && (e.name||e.message)) ? `${e.name||""} ${e.message||""}`.trim() : "Không rõ lỗi";
    setStatus("Không mở được camera: "+msg);
    setDebug("camera",msg);
  }
}
async function stopScan(clearStatus=true){
  if(scanTimer){clearInterval(scanTimer);scanTimer=null;}
  if(zxingReader){try{zxingReader.reset()}catch(e){} zxingReader=null;}
  if(stream){stream.getTracks().forEach(t=>t.stop()); stream=null;}
  video.srcObject=null;
  if(clearStatus)setStatus("Đã dừng camera.");
}

async function scanFrame(){
  if(!video.videoWidth) return;
  canvas.width=video.videoWidth; canvas.height=video.videoHeight;
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const values=[];
  if(zxingReader){
    try{
      const result=await zxingReader.decodeFromCanvas(canvas);
      if(result?.text) values.push(result.text);
    }catch(e){}
  }
  if(window.jsQR){
    try{
      const data=ctx.getImageData(0,0,canvas.width,canvas.height);
      const qr=jsQR(data.data,data.width,data.height,{inversionAttempts:"attemptBoth"});
      if(qr?.data) values.push(qr.data);
    }catch(e){}
  }
  if(values.length) handleDetected(values);
}

function handleDetected(values){
  scanPool=sortCodes(scanPool.concat(values)).slice(0,10);
  if(scanPool.length===1){
    lastValue=scanPool[0];
    $("#lastScan").textContent=lastValue;
    addScanned(lastValue);
    scanPool=[];
    renderCandidates([]);
    return;
  }
  renderCandidates(scanPool);
}
function renderCandidates(list){
  const card=$("#candidateCard"), box=$("#candidateList");
  if(!list.length){card.classList.add("hidden"); box.innerHTML=""; return;}
  card.classList.remove("hidden");
  box.innerHTML=list.map(v=>`<div class="candidate-item" data-code="${escapeHtml(v)}"><span class="candidate-type">${codeType(v)}</span><span>${escapeHtml(v)}</span><span class="candidate-pick">CHỌN</span></div>`).join("");
}
function chooseCode(v){
  lastValue=v;
  $("#lastScan").textContent=v;
  addScanned(v);
  scanPool=[];
  renderCandidates([]);
}
function addScanned(v){
  v=String(v||"").trim(); if(!v)return;
  scanned=scanned.filter(x=>x.value!==v);
  scanned.unshift({value:v,deleted:false});
  if(inventoryMode) inventoryRecordScan(v);
  renderScanned();
}
function renderScanned(){
  const box=$("#scannedList");
  box.innerHTML=scanned.length?scanned.map((x,i)=>`<div class="scan-row ${x.deleted?"deleted":""}" data-value="${escapeHtml(x.value)}"><span>${i+1}</span><span>${escapeHtml(x.value)}</span><span>${x.deleted?"DEL":"OK"}</span></div>`).join(""):"Chưa có mã.";
}
function activeScanned(){return scanned.filter(x=>!x.deleted).map(x=>x.value);}

function parseInventoryText(text){
  return String(text||"").split(/\r?\n/).map((line,i)=>{
    const raw=line.trim(); if(!raw)return null;
    const parts=raw.split(/\s+/); const code=normalizeCode(parts.shift()); const name=parts.join(" ").trim();
    return code?{code,name,count:0,order:i+1}:null;
  }).filter(Boolean);
}
function setInventoryRows(rows){
  inventoryRows=rows; inventoryMap={}; inventoryExtra=[];
  inventoryRows.forEach((r,i)=>inventoryMap[normalizeCode(r.code)]=i);
  renderInventory();
}
function inventoryRecordScan(raw){
  const code=normalizeCode(raw); if(!code||!inventoryRows.length)return;
  const idx=inventoryMap[code];
  if(idx!==undefined){inventoryRows[idx].count=(inventoryRows[idx].count||0)+1; renderInventory(code);}
  else{
    const ex=inventoryExtra.find(x=>x.code===code);
    if(ex)ex.count++; else inventoryExtra.unshift({code,count:1});
  }
}
function inventoryDeleteOne(code){
  const idx=inventoryMap[normalizeCode(code)];
  if(idx!==undefined&&inventoryRows[idx].count>0){inventoryRows[idx].count--;renderInventory(code);}
}
function renderInventory(active=""){
  $("#invTotal").textContent=inventoryRows.length;
  const done=inventoryRows.filter(x=>(x.count||0)>0).length;
  const missing=inventoryRows.filter(x=>(x.count||0)===0).length;
  const totalCount=inventoryRows.reduce((s,x)=>s+(x.count||0),0);
  $("#invDone").textContent=done; $("#invMissing").textContent=missing; $("#invTotalCount").textContent=totalCount;
  const body=$("#inventoryTableBody");
  body.innerHTML=inventoryRows.length?inventoryRows.map((r,i)=>{
    const c=r.count||0, cls=c>0?"inv-ok":"inv-missing", badge=`<span class="badge">${c===0?"0":c===1?"OK":c}</span>`;
    return `<tr class="${cls}" data-code="${escapeHtml(r.code)}"><td>${i+1}</td><td>${escapeHtml(r.code)}</td><td>${escapeHtml(r.name)}</td><td>${badge}</td></tr>`;
  }).join(""):`<tr><td colspan="4">Chưa có dữ liệu kiểm kê.</td></tr>`;
  if(active){
    const row=body.querySelector(`[data-code="${CSS.escape(normalizeCode(active))}"]`);
    if(row)row.scrollIntoView({block:"center",behavior:"smooth"});
  }
}
function missingText(){return inventoryRows.filter(x=>(x.count||0)===0).map(x=>x.name?`${x.code} ${x.name}`:x.code).join("\n");}

$("#startBtn").onclick=startScan;
$("#stopBtn").onclick=()=>stopScan(true);
$("#imageBtn").onclick=()=>$("#imageInput").click();
$("#normalModeBtn").onclick=()=>{inventoryMode=false;$("#normalModeBtn").classList.add("active");$("#inventoryModeBtn").classList.remove("active");$("#inventoryPanel").classList.add("hidden");};
$("#inventoryModeBtn").onclick=()=>{inventoryMode=true;$("#inventoryModeBtn").classList.add("active");$("#normalModeBtn").classList.remove("active");$("#inventoryPanel").classList.remove("hidden");setTimeout(()=>$("#inventoryPanel").scrollIntoView({block:"start",behavior:"smooth"}),50);};
$("#candidateList").onclick=e=>{const item=e.target.closest(".candidate-item"); if(item)chooseCode(item.dataset.code);};
$("#loadInventoryBtn").onclick=()=>setInventoryRows(parseInventoryText($("#inventoryInput").value));
$("#clearInventoryBtn").onclick=()=>{if(confirm("Xóa bảng kiểm kê?"))setInventoryRows([]);};
$("#manualScanBtn").onclick=()=>{inventoryRecordScan($("#manualScanInput").value);$("#manualScanInput").value="";};
$("#manualScanInput").addEventListener("keydown",e=>{if(e.key==="Enter"){$("#manualScanBtn").click();}});
$("#finishInventoryBtn").onclick=()=>alert(`Chưa bắn ${inventoryRows.filter(x=>(x.count||0)===0).length} mã. Tổng SL IMEI đã đếm: ${inventoryRows.reduce((s,x)=>s+(x.count||0),0)}`);
$("#copyMissingBtn").onclick=()=>copyText(missingText());
$("#exportMissingTxtBtn").onclick=()=>downloadText("imei-chua-ban.txt",missingText(),"text/plain");
$("#exportMissingCsvBtn").onclick=()=>downloadText("imei-chua-ban.csv","STT,Code,Ten san pham\n"+inventoryRows.filter(x=>(x.count||0)===0).map((x,i)=>`${i+1},"${x.code}","${String(x.name).replace(/"/g,'""')}"`).join("\n"),"text/csv");
$("#copyScannedBtn").onclick=()=>copyText(activeScanned().join("\n"));
$("#exportTxtBtn").onclick=()=>downloadText("qr-da-quet.txt",activeScanned().join("\n"));
$("#exportCsvBtn").onclick=()=>downloadText("qr-da-quet.csv","STT,QR\n"+activeScanned().map((x,i)=>`${i+1},"${String(x).replace(/"/g,'""')}"`).join("\n"),"text/csv");
$("#clearScannedBtn").onclick=()=>{if(confirm("Xóa danh sách đã quét?")){scanned=[];renderScanned();}};
$("#scannedList").addEventListener("dblclick",e=>{const row=e.target.closest(".scan-row"); if(row){const x=scanned.find(a=>a.value===row.dataset.value); if(x){x.deleted=!x.deleted;renderScanned();}}});
$("#inventoryTableBody").addEventListener("dblclick",e=>{const row=e.target.closest("tr[data-code]"); if(row)inventoryDeleteOne(row.dataset.code);});
$("#lastScan").addEventListener("pointerdown",()=>{if(lastValue)copyText(lastValue);});
$("#cameraWrap").addEventListener("pointerdown",e=>{
  const dot=$("#focusDot"), r=$("#cameraWrap").getBoundingClientRect();
  dot.style.left=(e.clientX-r.left)+"px"; dot.style.top=(e.clientY-r.top)+"px"; dot.classList.remove("hidden");
  setTimeout(()=>dot.classList.add("hidden"),700);
});
$("#imageInput").addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  setStatus("Đã nhận ảnh. Engine đọc ảnh sẽ được nâng tiếp nếu cần.");
});

renderScanned(); renderInventory();
