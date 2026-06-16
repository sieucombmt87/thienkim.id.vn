const $=id=>document.getElementById(id);
const icons={duck:"🦆",boat:"⛵",horse:"🐎",dog:"🐕",car:"🏎️",fish:"🐟",vip:"👑"};
let config={}, players=[], winners=[], sessionId="", raceTimer=null, progress=[];

document.addEventListener("DOMContentLoaded",()=>{
  loadSavedConfig();
  bind();
});

function bind(){
  $("previewBtn").onclick=previewRace;
  $("backSetupBtn").onclick=()=>show("setup");
  $("startRaceBtn").onclick=startRace;
  $("raceAgainBtn").onclick=()=>{show("stage");renderTrack();};
  $("newRaceBtn").onclick=()=>show("setup");
  $("copyResultBtn").onclick=copyResult;
  $("dedupeBtn").onclick=dedupePlayers;
  $("shuffleBtn").onclick=shufflePlayers;
  $("numberBtn").onclick=numberPlayers;
  $("openHistoryBtn").onclick=openHistory;
  $("closeHistoryBtn").onclick=()=>$("historyModal").classList.add("hidden");
  $("clearHistoryBtn").onclick=()=>{if(confirm("Xóa toàn bộ lịch sử?")){TKRaceHistory.clear();openHistory();}};
  $("bgUpload").onchange=uploadBackground;
  $("clearBgBtn").onclick=()=>{localStorage.removeItem("tk_race_bg");document.documentElement.style.removeProperty("--race-bg");};
  $("defaultBgBtn").onclick=()=>{localStorage.removeItem("tk_race_bg");alert("Đã dùng nền mặc định.");};
}

function show(view){
  $("setupView").classList.toggle("hidden",view!=="setup");
  $("stageView").classList.toggle("hidden",view!=="stage");
  $("winnerView").classList.toggle("hidden",view!=="winner");
}

function parsePlayers(){
  return $("playersInput").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
}

function dedupePlayers(){
  $("playersInput").value=[...new Set(parsePlayers())].join("\n");
}

function randomInt(max){
  const arr=new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0]%max;
}

function shuffleArray(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=randomInt(i+1);
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function shufflePlayers(){
  $("playersInput").value=shuffleArray(parsePlayers()).join("\n");
}

function numberPlayers(){
  $("playersInput").value=parsePlayers().map((x,i)=>`${i+1}. ${x}`).join("\n");
}

function saveConfig(){
  config={
    appName:"TK-RANDOM-RACE",
    version:"TKver5.1",
    eventTitle:$("eventTitle").value.trim()||"MINIGAME THIÊN KIM",
    eventDescription:$("eventDesc").value.trim(),
    eventPrize:$("eventPrize").value.trim(),
    eventHash:$("eventHash").value.trim(),
    raceTheme:$("raceTheme").value,
    winnerCount:Number($("winnerCount").value),
    raceDuration:Number($("raceDuration").value),
    displayMode:$("displayMode").value,
    soundEnabled:$("soundToggle").checked,
    historyEnabled:$("historyToggle").checked
  };
  localStorage.setItem("tk_random_race_config",JSON.stringify(config));
}

function loadSavedConfig(){
  try{config=JSON.parse(localStorage.getItem("tk_random_race_config")||"{}")}catch(e){config={}};
  for(const [id,key] of [["eventTitle","eventTitle"],["eventDesc","eventDescription"],["eventPrize","eventPrize"],["eventHash","eventHash"],["raceTheme","raceTheme"],["winnerCount","winnerCount"],["raceDuration","raceDuration"],["displayMode","displayMode"]]){
    if(config[key] && $(id)) $(id).value=config[key];
  }
  const bg=localStorage.getItem("tk_race_bg");
  if(bg) document.documentElement.style.setProperty("--race-bg",`url(${bg})`);
}

function previewRace(){
  players=parsePlayers();
  if(players.length<2) return alert("Cần ít nhất 2 người chơi.");
  saveConfig();
  $("stageEventTitle").textContent=config.eventTitle;
  $("stageEventDesc").textContent=config.eventDescription;
  const bg=localStorage.getItem("tk_race_bg");
  if(bg) $("stageView").style.setProperty("--race-bg",`url(${bg})`);
  else $("stageView").style.removeProperty("--race-bg");
  renderTrack();
  show("stage");
}

function renderTrack(){
  const icon=icons[config.raceTheme]||"🦆";
  progress=players.map(()=>0);
  $("raceTrack").innerHTML=players.map((name,i)=>`
    <div class="lane" data-i="${i}">
      <div class="racer" id="racer-${i}" style="left:8px">
        <span class="racer-icon">${icon}</span>
        <span class="racer-name">${escapeHtml(name)}</span>
      </div>
    </div>`).join("");
}

function generateFairRandomWinners(){
  const count=Math.min(config.winnerCount,players.length);
  return shuffleArray(players).slice(0,count);
}

function startRace(){
  winners=generateFairRandomWinners();
  sessionId="TK-RACE-"+new Date().toISOString().replace(/[-:.TZ]/g,"").slice(0,14)+"-"+randomInt(9999);
  const winnerIndexMap=winners.map(w=>players.indexOf(w));
  const start=Date.now();
  const duration=config.raceDuration;
  clearInterval(raceTimer);
  raceTimer=setInterval(()=>{
    const elapsed=Date.now()-start;
    const t=Math.min(1,elapsed/duration);
    players.forEach((p,i)=>{
      const isWinner=winnerIndexMap.includes(i);
      const boost=isWinner && t>.76 ? (t-.76)*1.8 : 0;
      const noise=(randomInt(100)/100)*0.045;
      const base=t*(isWinner?0.90:0.76);
      progress[i]=Math.min(0.94,Math.max(progress[i],base+boost+noise));
      const racer=$(`racer-${i}`);
      if(racer) racer.style.left=`calc(${progress[i]*100}% - 40px)`;
    });
    if(t>=1){
      clearInterval(raceTimer);
      finishRace(winnerIndexMap);
    }
  },120);
}

function finishRace(winnerIndexes){
  winnerIndexes.forEach((idx,rank)=>{
    const lane=document.querySelector(`.lane[data-i="${idx}"]`);
    if(lane) lane.classList.add("winner");
    const racer=$(`racer-${idx}`);
    if(racer) racer.style.left=`calc(${(0.96-rank*.025)*100}% - 40px)`;
  });
  setTimeout(showWinnerScreen,900);
}

function showWinnerScreen(){
  $("winnerTitle").textContent=config.winnerCount>1?"TOP WINNERS":winners[0];
  $("winnerList").innerHTML=winners.map((w,i)=>`<div class="winner-row">Giải ${i+1}: ${escapeHtml(w)}</div>`).join("");
  $("sessionInfo").textContent=`${config.eventTitle} • ${new Date().toLocaleString("vi-VN")} • ${sessionId}`;
  if(config.historyEnabled) saveRaceHistory();
  makeConfetti();
  show("winner");
}

function saveRaceHistory(){
  TKRaceHistory.save({
    sessionId,
    time:new Date().toLocaleString("vi-VN"),
    eventTitle:config.eventTitle,
    raceTheme:config.raceTheme,
    playerCount:players.length,
    winners,
    prize:config.eventPrize,
    note:config.eventDescription
  });
}

function copyResult(){
  const text=`${config.eventTitle}\n${winners.map((w,i)=>`Giải ${i+1}: ${w}`).join("\n")}\nMã phiên: ${sessionId}`;
  navigator.clipboard.writeText(text).then(()=>alert("Đã copy kết quả."));
}

function openHistory(){
  const list=TKRaceHistory.list();
  $("historyList").innerHTML=list.length?list.map(item=>`<div class="history-item"><b>${escapeHtml(item.eventTitle)}</b><br>${item.time}<br>${item.winners.map((w,i)=>`Giải ${i+1}: ${escapeHtml(w)}`).join("<br>")}<br><small>${item.sessionId}</small></div>`).join(""):"Chưa có lịch sử.";
  $("historyModal").classList.remove("hidden");
}

function uploadBackground(e){
  const file=e.target.files[0];
  if(!file) return;
  if(!/^image\//.test(file.type)) return alert("Chỉ hỗ trợ hình ảnh.");
  const reader=new FileReader();
  reader.onload=()=>{localStorage.setItem("tk_race_bg",reader.result);alert("Đã lưu hình nền sự kiện.");};
  reader.readAsDataURL(file);
}

function makeConfetti(){
  const box=$("confetti");
  box.innerHTML="";
  const chars=["🎉","✨","👑","💎","⭐","🔥"];
  for(let i=0;i<80;i++){
    const s=document.createElement("span");
    s.textContent=chars[randomInt(chars.length)];
    s.style.left=randomInt(100)+"vw";
    s.style.animationDelay=(randomInt(1000)/1000)+"s";
    box.appendChild(s);
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
