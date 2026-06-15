let type="qr";
const input=document.getElementById("contentInput"), preview=document.getElementById("preview");
function makeUrl(text){
 const v=encodeURIComponent(text||"");
 if(type==="barcode") return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${v}&scale=3&height=12&includetext`;
 return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${v}`;
}
function render(){
 const text=input.value.trim();
 if(!text){preview.innerHTML="<span>Mã sẽ hiện ở đây...</span>";return;}
 preview.innerHTML=`<img id="codeImg" crossorigin="anonymous" src="${makeUrl(text)}" alt="code">`;
}
document.querySelectorAll("[data-type]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-type]").forEach(x=>x.classList.remove("active"));b.classList.add("active");type=b.dataset.type;render();});
input.addEventListener("input",render);
document.getElementById("downloadBtn").onclick=()=>{
 const img=document.getElementById("codeImg"); if(!img){alert("Nhập nội dung để tạo mã trước.");return;}
 const a=document.createElement("a"); a.href=img.src; a.download=(type==="qr"?"qr-code":"barcode")+".png"; a.click();
};
document.getElementById("scanTab").onclick=async()=>{
 document.getElementById("scanBox").classList.toggle("hidden");
 if(!("BarcodeDetector" in window)){document.getElementById("scanResult").textContent="Trình duyệt chưa hỗ trợ quét mã trực tiếp.";return;}
 try{
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
  const video=document.getElementById("video"); video.srcObject=stream; await video.play();
  const detector=new BarcodeDetector({formats:["qr_code","code_128"]});
  const timer=setInterval(async()=>{const codes=await detector.detect(video); if(codes.length){input.value=codes[0].rawValue;render();document.getElementById("scanResult").textContent="Đã quét: "+codes[0].rawValue;clearInterval(timer);stream.getTracks().forEach(t=>t.stop());}},800);
 }catch(e){document.getElementById("scanResult").textContent="Không mở được camera.";}
};
document.getElementById("createTab").onclick=()=>document.getElementById("scanBox").classList.add("hidden");