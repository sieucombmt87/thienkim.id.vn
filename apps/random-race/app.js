const $=id=>document.getElementById(id);
const assets={duck:"duck.svg",boat:"boat.svg",horse:"horse.svg",dog:"dog.svg",car:"car.svg",fish:"fish.svg",vip:"vip.svg"};
let config={},players=[],winners=[],winnerIndexes=[],sessionId="",raceTimer=null,countTimer=null,remaining=0,positions=[],running=false,paused=false;

document.addEventListener("DOMContentLoaded",()=>{loadConfig();bind();});

function bind(){
  $("previewBtn").onclick=previewRace;$("backSetupBtn").onclick=()=>show("setup");$("startRaceBtn").onclick=startRace;
  $("pauseBtn").onclick=togglePause;$("clearBtn").onclick=clearRace;$("settingBtn").onclick=()=>show("setup");
  $("raceAgainBtn").onclick=raceAgain;$("raceAgainBtn2").onclick=raceAgain;$("newRaceBtn").onclick=()=>show("setup");
  $("closeAgainBtn").onclick=()=>$("raceAgainPopup").classList.add("hidden");$("showResultBtn").onclick=showWinnerScreen;
  $("copyResultBtn").onclick=copyResult;$("dedupeBtn").onclick=dedupe;$("shuffleBtn").onclick=shufflePlayers;$("numberBtn").onclick=numberPlayers;
  $("openHistoryBtn").onclick=openHistory;$("closeHistoryBtn").onclick=()=>$("historyModal").classList.add("hidden");
  $("clearHistoryBtn").onclick=()=>{if(confirm("Xóa toàn bộ lịch sử?")){TKRaceHistory.clear();openHistory();}};
  $("bgUpload").onchange=uploadBg;$("clearBgBtn").onclick=()=>{localStorage.removeItem("tk_race_bg");alert("Đã xóa nền.");};$("defaultBgBtn").onclick=()=>alert("Đã dùng nền mặc định.");
}

function show(view){$("setupView").classList.toggle("hidden",view!=="setup");$("raceView").classList.toggle("hidden",view!=="race");$("winnerView").classList.toggle("hidden",view!=="winner");}
function parsePlayers(){return $("playersInput").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
function dedupe(){$("playersInput").value=[...new Set(parsePlayers())].join("\n");}
function rand(max){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%max;}
function shuffleArray(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function shufflePlayers(){$("playersInput").value=shuffleArray(parsePlayers()).join("\n");}
function numberPlayers(){$("playersInput").value=parsePlayers().map((x,i)=>`${i+1}. ${x}`).join("\n");}
function saveConfig(){config={title:$("eventTitle").value.trim()||"MINIGAME THIÊN KIM",desc:$("eventDesc").value.trim(),prize:$("eventPrize").value.trim(),theme:$("raceTheme").value,winnerCount:Number($("winnerCount").value),duration:Number($("raceDuration").value),mode:$("raceMode").value};localStorage.setItem("tk_random_race_config",JSON.stringify(config));}
function loadConfig(){try{config=JSON.parse(localStorage.getItem("tk_random_race_config")||"{}")}catch(e){config={}};const map={eventTitle:"title",eventDesc:"desc",eventPrize:"prize",raceTheme:"theme",winnerCount:"winnerCount",raceDuration:"duration",raceMode:"mode"};Object.entries(map).forEach(([id,k])=>{if(config[k]&&$(id))$(id).value=config[k];});}

function previewRace(){
  players=parsePlayers();
  if(players.length<2)return alert("Cần ít nhất 2 người chơi.");
  saveConfig();$("stageTitle").textContent=config.title;$("stageDesc").textContent=config.desc;
  const bg=localStorage.getItem("tk_race_bg");$("raceView").style.setProperty("--custom-bg",bg?`url(${bg})`:"none");
  renderRace();show("race");
}

function selectWinners(){
  const count=Math.min(config.winnerCount,players.length);
  winners=shuffleArray(players).slice(0,count);
  winnerIndexes=winners.map(w=>players.indexOf(w));
  sessionId="TK-RACE-"+new Date().toISOString().replace(/[-:.TZ]/g,"").slice(0,14)+"-"+rand(9999);
}

function renderRace(){
  clearInterval(raceTimer);clearInterval(countTimer);running=false;paused=false;selectWinners();
  remaining=Math.ceil(config.duration/1000);updateTimer(remaining);
  const track=$("waterTrack");track.innerHTML='<div class="finish-line" id="finishLine"></div>';
  const count=players.length;const laneH=Math.max(58,Math.floor((track.clientHeight-10)/Math.min(count,12)));
  positions=players.map((_,i)=>4+rand(5));
  players.forEach((name,i)=>{
    const lane=document.createElement("div");lane.className="lane";lane.style.top=(i*laneH+10)+"px";lane.style.height=(laneH-4)+"px";
    const racer=document.createElement("div");racer.className="duck-racer";racer.id="racer-"+i;
    racer.innerHTML=`<div class="racer-name-bubble">${escapeHtml(shortName(name))}</div><img src="./assets/racers/${assets[config.theme]||"duck.svg"}" alt=""><span class="racer-number">${i+1}</span>`;
    lane.appendChild(racer);track.appendChild(lane);
  });
  layoutFinish();paintRacers();$("raceAgainPopup").classList.add("hidden");
}

function layoutFinish(){
  const track=$("waterTrack");const finish=$("finishLine");const x=Math.max(180,track.clientWidth*0.78);finish.style.left=x+"px";
}

function paintRacers(){
  const track=$("waterTrack");const finish=$("finishLine");const finishX=parseFloat(finish.style.left||track.clientWidth*.78);
  positions.forEach((p,i)=>{const el=$("racer-"+i);if(el)el.style.left=(p/100*finishX)+"px";});
}

function startRace(){
  if(running && paused){paused=false;$("pauseBtn").textContent="Pause";return;}
  selectWinners();running=true;paused=false;$("pauseBtn").textContent="Pause";remaining=Math.ceil(config.duration/1000);updateTimer(remaining);
  const start=performance.now();const duration=config.duration;const track=$("waterTrack");const finishX=parseFloat($("finishLine").style.left||track.clientWidth*.78);
  positions=players.map((_,i)=>4+rand(8));
  countTimer=setInterval(()=>{if(paused)return;remaining=Math.max(0,remaining-1);updateTimer(remaining);},1000);
  raceTimer=setInterval(()=>{
    if(paused)return;
    const t=Math.min(1,(performance.now()-start)/duration);
    players.forEach((p,i)=>{
      const rank=winnerIndexes.indexOf(i);
      const isWinner=rank>=0;
      let target;
      if(t<.72){
        target=10+t*(isWinner?54:rand(20)+42)+(Math.sin((t*18)+(i*1.3))*4);
      }else{
        const sprint=(t-.72)/.28;
        target=isWinner?(72+sprint*(27-rank*3)):(58+sprint*(20+rand(9)));
      }
      const jitter=(rand(100)/100-.5)*1.8;
      positions[i]=Math.max(positions[i],Math.min(99,target+jitter));
      const el=$("racer-"+i);if(el)el.style.left=(positions[i]/100*finishX)+"px";
    });
    if(t>=1)finishRace();
  },90);
}

function finishRace(){
  clearInterval(raceTimer);clearInterval(countTimer);running=false;remaining=0;updateTimer(0);
  const track=$("waterTrack");const finishX=parseFloat($("finishLine").style.left||track.clientWidth*.78);
  winnerIndexes.forEach((idx,rank)=>{const el=$("racer-"+idx);if(el){el.classList.add("winner");el.style.left=(Math.min(99,103-rank*8)/100*finishX)+"px";}});
  if(config.winnerCount===1){const winnerEl=$("racer-"+winnerIndexes[0]);if(winnerEl)winnerEl.style.zIndex=10;}
  setTimeout(()=>{$("raceAgainPopup").classList.remove("hidden");saveHistory();},650);
}

function raceAgain(){
  if($("removeWinnerToggle").checked && winners.length){players=players.filter(p=>!winners.includes(p));$("playersInput").value=players.join("\n");}
  if(players.length<2)return showWinnerScreen();
  renderRace();setTimeout(startRace,300);
}
function clearRace(){clearInterval(raceTimer);clearInterval(countTimer);running=false;paused=false;renderRace();}
function togglePause(){if(!running)return;paused=!paused;$("pauseBtn").textContent=paused?"Resume":"Pause";}
function updateTimer(sec){const s=String(sec%60).padStart(2,"0");const m=String(Math.floor(sec/60)).padStart(2,"0");$("timerBox").textContent=`00:${m}:${s}`;}
function showWinnerScreen(){if(!winners.length) return alert("Chưa có kết quả.");$("winnerTitle").textContent=winners[0];$("winnerList").innerHTML=winners.map((w,i)=>`<div class="winner-row">Giải ${i+1}: ${escapeHtml(w)}</div>`).join("");$("sessionInfo").textContent=`${config.title} • ${new Date().toLocaleString("vi-VN")} • ${sessionId}`;makeFireworks();show("winner");}
function saveHistory(){TKRaceHistory.save({sessionId,time:new Date().toLocaleString("vi-VN"),eventTitle:config.title,raceTheme:config.theme,playerCount:players.length,winners,prize:config.prize,note:config.desc});}
function copyResult(){const text=`${config.title}\n${winners.map((w,i)=>`Giải ${i+1}: ${w}`).join("\n")}\nMã phiên: ${sessionId}`;navigator.clipboard.writeText(text).then(()=>alert("Đã copy kết quả."));}
function openHistory(){const list=TKRaceHistory.list();$("historyList").innerHTML=list.length?list.map(item=>`<div class="history-item"><b>${escapeHtml(item.eventTitle)}</b><br>${item.time}<br>${item.winners.map((w,i)=>`Giải ${i+1}: ${escapeHtml(w)}`).join("<br>")}<br><small>${item.sessionId}</small></div>`).join(""):"Chưa có lịch sử.";$("historyModal").classList.remove("hidden");}
function uploadBg(e){const file=e.target.files[0];if(!file)return;if(!/^image\//.test(file.type))return alert("Chỉ hỗ trợ hình ảnh.");const r=new FileReader();r.onload=()=>{localStorage.setItem("tk_race_bg",r.result);alert("Đã lưu hình nền.");};r.readAsDataURL(file);}
function makeFireworks(){const box=$("fireworks");box.innerHTML="";["🎉","✨","👑","💎","⭐","🔥"].forEach((c)=>{});for(let i=0;i<90;i++){const s=document.createElement("span");s.textContent=["🎉","✨","👑","💎","⭐","🔥"][rand(6)];s.style.left=rand(100)+"vw";s.style.animationDelay=(rand(1000)/1000)+"s";box.appendChild(s);}}
function shortName(n){return n.length>13?n.slice(0,12)+"…":n;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
window.addEventListener("resize",()=>{if(!$("raceView").classList.contains("hidden")){layoutFinish();paintRacers();}});
