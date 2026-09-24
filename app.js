(() => {
const KEY="pokeloop_multi_exp_v3";
const MOVES={
  bulba:{quick:["덩굴채찍","몸통박치기"],strong:["씨폭탄","잎날가르기"]},
  char:{quick:["불꽃세례","할퀴기"],strong:["화염바퀴","불꽃펀치"]},
  squirt:{quick:["물대포","몸통박치기"],strong:["아쿠아테일","거품광선"]},
  rattata:{quick:["전광석화","몸통박치기"],strong:["필살앞니","깨물어부수기"]},
  pidgey:{quick:["바람일으키기","전광석화"],strong:["날개치기","에어커터"]}
};
const moveData={
 "덩굴채찍":{pow:10,gain:20},"몸통박치기":{pow:10,gain:20},"씨폭탄":{pow:42,cost:100},"잎날가르기":{pow:38,cost:90},
 "불꽃세례":{pow:11,gain:20},"할퀴기":{pow:9,gain:25},"화염바퀴":{pow:46,cost:100},"불꽃펀치":{pow:43,cost:95},
 "물대포":{pow:9,gain:25},"아쿠아테일":{pow:40,cost:100},"거품광선":{pow:36,cost:85},
 "전광석화":{pow:10,gain:25},"필살앞니":{pow:38,cost:100},"깨물어부수기":{pow:44,cost:110},
 "바람일으키기":{pow:10,gain:20},"날개치기":{pow:40,cost:100},"에어커터":{pow:37,cost:90}
};
const rosterBase=[
{id:"bulba",name:"이상해씨",type:"풀",lv:5,maxHp:72,atk:15,def:12,quick:"덩굴채찍",strong:"씨폭탄",item:null},
{id:"char",name:"파이리",type:"불꽃",lv:5,maxHp:64,atk:18,def:9,quick:"불꽃세례",strong:"화염바퀴",item:null},
{id:"squirt",name:"꼬부기",type:"물",lv:5,maxHp:80,atk:13,def:16,quick:"물대포",strong:"아쿠아테일",item:null},
{id:"rattata",name:"꼬렛",type:"노말",lv:4,maxHp:58,atk:16,def:8,quick:"전광석화",strong:"필살앞니",item:null},
{id:"pidgey",name:"구구",type:"비행",lv:4,maxHp:60,atk:14,def:9,quick:"바람일으키기",strong:"날개치기",item:null}
];
const itemsBase=[
{id:"rocky",name:"울퉁불퉁멧",type:"held",count:1,icon:"HM",desc:"접촉 공격을 받을 때 공격자에게 반사 피해를 주는 도구."},
{id:"clear",name:"클리어참",type:"held",count:1,icon:"CT",desc:"능력치 하락 계열 방해를 막는 방어형 도구."},
{id:"dice",name:"속임수주사위",type:"held",count:1,icon:"DD",desc:"연속 공격 계열 기술의 기대 성능을 안정화하는 도구."},
{id:"sash",name:"기합의띠",type:"held",count:1,icon:"FS",desc:"HP가 가득 찬 상태에서 치명적인 피해를 1회 버티게 하는 도구."},
{id:"wood",name:"나무",type:"material",count:12,icon:"W",desc:"공방 제작에 사용하는 기본 재료."},
{id:"stone",name:"돌",type:"material",count:8,icon:"S",desc:"공방 제작에 사용하는 단단한 재료."},
{id:"herb",name:"약초",type:"material",count:6,icon:"H",desc:"회복 계열 제작에 사용하는 재료."}
];
const areas=[
{id:"meadow",name:"새싹 들판",difficulty:"쉬움",desc:"초기 포켓몬이 자주 출현하는 평온한 지역.",enemies:[
{name:"꼬렛",icon:"N",hp:52,atk:6,w:28,reward:[2,4]},{name:"구구",icon:"F",hp:46,atk:7,w:24,reward:[2,5]},{name:"캐터피",icon:"B",hp:64,atk:4,w:18,reward:[2,4]},{name:"뿔충이",icon:"B",hp:60,atk:5,w:16,reward:[2,4]},{name:"깨비참",icon:"R",hp:92,atk:10,w:8,reward:[6,10]},{name:"피카츄",icon:"E",hp:110,atk:12,w:6,reward:[8,13]}]},
{id:"forest",name:"깊은 초록 숲",difficulty:"보통",desc:"다수 조우가 늘어나며 탐험대 유지력이 중요해지는 지역.",enemies:[
{name:"파라스",icon:"B",hp:88,atk:9,w:24,reward:[4,7]},{name:"뚜벅쵸",icon:"G",hp:100,atk:8,w:24,reward:[4,7]},{name:"아보",icon:"P",hp:110,atk:11,w:20,reward:[5,8]},{name:"니드런",icon:"P",hp:125,atk:12,w:18,reward:[5,9]},{name:"스라크",icon:"B",hp:180,atk:18,w:8,reward:[12,18]},{name:"피카츄",icon:"E",hp:135,atk:16,w:6,reward:[10,15]}]},
{id:"cliff",name:"바람 깎인 절벽",difficulty:"어려움",desc:"공격적인 비행·바위 포켓몬이 등장하는 상위 지역.",enemies:[
{name:"깨비참",icon:"R",hp:130,atk:16,w:25,reward:[6,10]},{name:"꼬마돌",icon:"R",hp:180,atk:14,w:25,reward:[7,11]},{name:"롱스톤",icon:"R",hp:260,atk:20,w:18,reward:[10,16]},{name:"골뱃",icon:"P",hp:210,atk:22,w:18,reward:[10,16]},{name:"프테라",icon:"R",hp:320,atk:28,w:8,reward:[18,28]},{name:"망나뇽",icon:"D",hp:520,atk:38,w:6,reward:[35,50]}]}
];
const fresh=()=>({
 resources:{coin:0,food:0,wood:12,stone:8},
 roster:structuredClone(rosterBase),
 items:structuredClone(itemsBase),
 selectedArea:"meadow",
 selectedParty:[],
 expeditions:{},
 log:[],
 selectedPokemon:"bulba",
 selectedItem:"rocky",
 pokeFilter:"owned",
 itemFilter:"all",
 expSubtab:"areas"
});
let state=load();
let last=performance.now();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function load(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY));
  if(!x)return fresh();
  const f=fresh();
  return {...f,...x,
   resources:{...f.resources,...(x.resources||{})},
   roster:Array.isArray(x.roster)?x.roster:f.roster,
   items:Array.isArray(x.items)?x.items:f.items,
   selectedParty:Array.isArray(x.selectedParty)?x.selectedParty.slice(0,3):[],
   expeditions:{}
  };
 }catch{return fresh();}
}
function save(show=false){localStorage.setItem(KEY,JSON.stringify({...state,expeditions:{}}));if(show)addLog("SYSTEM","게임을 저장했습니다.","good");render();}
function now(){return new Date().toLocaleTimeString("ko-KR",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});}
function addLog(src,msg,kind=""){state.log.push({t:now(),src,msg,kind});if(state.log.length>160)state.log.shift();renderLog();}
function areaBy(id){return areas.find(a=>a.id===id);}
function pokeBy(id){return state.roster.find(p=>p.id===id);}
function itemBy(id){return state.items.find(i=>i.id===id);}
function assignedAreaFor(pokeId){for(const [areaId,exp] of Object.entries(state.expeditions)){if(exp.party.some(p=>p.id===pokeId))return areaId;}return null;}
function roll(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function pickEnemy(a){let total=a.enemies.reduce((s,e)=>s+e.w,0),r=Math.random()*total;for(const e of a.enemies){if(r<e.w)return e;r-=e.w;}return a.enemies[0];}
function createPartyMember(base){return {...structuredClone(base),hp:base.maxHp,pp:0};}
function startExpedition(){
 const id=state.selectedArea;
 if(state.expeditions[id]||!state.selectedParty.length)return;
 const party=state.selectedParty.map(pokeBy).filter(Boolean).map(createPartyMember);
 state.expeditions[id]={areaId:id,party,room:0,wins:0,coins:0,enemies:[],remaining:3000,speed:1};
 addLog(areaBy(id).name,"탐험을 시작했습니다.","good");
 state.selectedParty=[];
 render();
}
function returnExpedition(id,wipe=false){
 const exp=state.expeditions[id];if(!exp)return;
 addLog(areaBy(id).name,wipe?"탐험대가 전멸하여 귀환했습니다.":"탐험대가 귀환했습니다.",wipe?"bad":"good");
 delete state.expeditions[id];
 render();
}
function spawnRoom(exp){
 const a=areaBy(exp.areaId);exp.room++;
 if(Math.random()<.42){
  addLog(a.name,"구역 "+exp.room+": 특별한 조우 없이 통과했습니다.");
  if(Math.random()<.16){state.resources.wood++;const wood=itemBy("wood");if(wood)wood.count++;addLog(a.name,"나무 +1 획득.","loot");}
  return;
 }
 let count=1;if(exp.room>5&&Math.random()<.3)count=2;if(exp.room>12&&Math.random()<.18)count=3;
 exp.enemies=[];
 for(let i=0;i<count;i++){const base=pickEnemy(a);exp.enemies.push({...base,maxHp:base.hp,hp:base.hp});}
 addLog(a.name,"구역 "+exp.room+": "+exp.enemies.map(e=>e.name).join(", ")+" 조우.");
}
function aliveParty(exp){return exp.party.filter(p=>p.hp>0);}
function aliveEnemies(exp){return exp.enemies.filter(e=>e.hp>0);}
function resolveTurn(exp){
 if(!exp.enemies.length){spawnRoom(exp);return;}
 const allies=aliveParty(exp);if(!allies.length){returnExpedition(exp.areaId,true);return;}
 for(const p of allies){
  const targets=aliveEnemies(exp);if(!targets.length)break;
  const e=targets[Math.floor(Math.random()*targets.length)];
  const q=moveData[p.quick], s=moveData[p.strong], strong=p.pp>=s.cost, move=strong?s:q, name=strong?p.strong:p.quick;
  const dmg=Math.max(1,Math.round((p.atk*.55+move.pow)*(.9+Math.random()*.2)));
  if(strong)p.pp=Math.max(0,p.pp-s.cost); else p.pp=Math.min(200,p.pp+q.gain);
  e.hp=Math.max(0,e.hp-dmg);
  addLog(areaBy(exp.areaId).name,p.name+"의 "+name+"! "+e.name+"에게 "+dmg+" 피해."+ (strong?" [강공]":""),strong?"good":"");
 }
 if(!aliveEnemies(exp).length){
  let coins=0;exp.enemies.forEach(e=>coins+=roll(e.reward[0],e.reward[1]));
  state.resources.coin+=coins;exp.coins+=coins;exp.wins++;exp.enemies=[];
  addLog(areaBy(exp.areaId).name,"전투 승리. 코인 +"+coins,"loot");
  return;
 }
 for(const e of aliveEnemies(exp)){
  const targets=aliveParty(exp);if(!targets.length)break;
  const p=targets[Math.floor(Math.random()*targets.length)];
  const dmg=Math.max(1,Math.round(Math.max(1,e.atk-p.def*.2)*(.85+Math.random()*.3)));
  p.hp=Math.max(0,p.hp-dmg);
  addLog(areaBy(exp.areaId).name,e.name+"의 공격! "+p.name+"에게 "+dmg+" 피해.","bad");
  if(p.hp<=0)addLog(areaBy(exp.areaId).name,p.name+"이(가) 쓰러졌습니다.","bad");
 }
 if(!aliveParty(exp).length)returnExpedition(exp.areaId,true);
}
function renderResources(){
 $("#coin").textContent=state.resources.coin;$("#food").textContent=state.resources.food;$("#wood").textContent=state.resources.wood;$("#stone").textContent=state.resources.stone;
 $("#activeExpeditionCount").textContent=Object.keys(state.expeditions).length;
 $("#areaRunningBadge").textContent=Object.keys(state.expeditions).length+" RUNNING";
}
function renderAreas(){
 const selected=state.selectedArea;
 $("#areaList").innerHTML=areas.map(a=>{
  const running=!!state.expeditions[a.id];
  return '<article class="area-card '+(selected===a.id?"active ":"")+(running?"running":"")+'" data-area="'+a.id+'"><strong>'+a.name+'</strong><p>'+a.desc+'</p><div class="area-meta"><span>'+a.difficulty+'</span><span>출현 '+a.enemies.length+'종</span></div></article>';
 }).join("");
 $$(".area-card").forEach(el=>el.onclick=()=>{state.selectedArea=el.dataset.area;state.selectedParty=[];render();});
 const a=areaBy(selected),exp=state.expeditions[selected];
 $("#selectedAreaStatus").textContent=exp?"RUNNING":"IDLE";
 $("#areaDetail").innerHTML='<small>SELECTED AREA</small><h3>'+a.name+'</h3><p>'+a.desc+'</p><div class="encounter-tags">'+a.enemies.map(e=>'<span>'+e.name+'</span>').join("")+'</div><div class="area-visual"></div>';
 renderPartyPicker();
}
function renderPartyPicker(){
 const exp=state.expeditions[state.selectedArea], sel=state.selectedParty;
 $("#partyCount").textContent=(exp?exp.party.length:sel.length)+" / 3";
 if(exp){
  $("#partyPicker").innerHTML=exp.party.map(p=>'<article class="pick-card selected"><strong>'+p.name+'</strong><small>Lv.'+p.lv+' · '+p.type+' · 원정 중</small></article>').join("");
  $("#selectedExpeditionSummary").innerHTML='구역 <b>'+exp.room+'</b> · 승리 <b>'+exp.wins+'</b> · 획득 코인 <b>'+exp.coins+'</b>';
  $("#startExpeditionBtn").classList.add("hidden");$("#returnSelectedBtn").classList.remove("hidden");return;
 }
 $("#startExpeditionBtn").classList.remove("hidden");$("#returnSelectedBtn").classList.add("hidden");
 $("#partyPicker").innerHTML=state.roster.map(p=>{
  const assigned=assignedAreaFor(p.id),on=sel.includes(p.id),disabled=!!assigned||(!on&&sel.length>=3);
  const note=assigned?" · "+areaBy(assigned).name+" 원정 중":" · HP "+p.maxHp;
  return '<article class="pick-card '+(on?"selected ":"")+(disabled?"disabled":"")+'" data-poke="'+p.id+'"><strong>'+p.name+'</strong><small>Lv.'+p.lv+' · '+p.type+note+'</small></article>';
 }).join("");
 $$(".pick-card[data-poke]").forEach(el=>el.onclick=()=>{
  if(el.classList.contains("disabled"))return;
  const id=el.dataset.poke,idx=state.selectedParty.indexOf(id);
  if(idx>=0)state.selectedParty.splice(idx,1);else if(state.selectedParty.length<3)state.selectedParty.push(id);
  renderPartyPicker();
 });
 $("#selectedExpeditionSummary").textContent=sel.length?"선택한 포켓몬 "+sel.length+"마리":"탐험에 보낼 포켓몬을 선택하세요.";
 $("#startExpeditionBtn").disabled=!sel.length;
}
function memberHtml(p){
 const hp=Math.max(0,Math.round(p.hp/p.maxHp*100)),pp=Math.min(100,p.pp);
 return '<div class="exp-member"><div class="exp-member-head"><strong>'+p.name+'</strong><span>Lv.'+p.lv+'</span></div>'+
 '<div class="stat-row"><span>HP</span><div class="bar hp"><i style="width:'+hp+'%"></i></div><b>'+p.hp+' / '+p.maxHp+'</b></div>'+
 '<div class="stat-row"><span>PP</span><div class="bar pp"><i style="width:'+pp+'%"></i></div><b>'+p.pp+' / 100</b></div></div>';
}
function renderExpeditions(){
 const exps=Object.values(state.expeditions);
 $("#expeditionCards").innerHTML=exps.length?exps.map(exp=>{
  const a=areaBy(exp.areaId), enemies=aliveEnemies(exp);
  return '<article class="panel exp-card"><div class="exp-card-top"><div><small>ACTIVE EXPEDITION</small><h2>'+a.name+'</h2></div><button class="ui-btn tiny exp-return" data-area="'+a.id+'">귀환</button></div>'+
  '<div class="exp-stats"><div><span>구역</span><b>'+exp.room+'</b></div><div><span>승리</span><b>'+exp.wins+'</b></div><div><span>코인</span><b>'+exp.coins+'</b></div></div>'+
  '<div class="exp-party">'+exp.party.map(memberHtml).join("")+'</div>'+
  '<div class="exp-enemies">'+(enemies.length?enemies.map(e=>'<div class="enemy-chip"><strong>'+e.name+'</strong><small>HP '+e.hp+' / '+e.maxHp+'</small><div class="bar hp"><i style="width:'+(e.hp/e.maxHp*100)+'%"></i></div></div>').join(""):'<div class="selected-expedition-summary">다음 구역 탐색 중</div>')+'</div>'+
  '<div class="exp-actions"><span class="timer">'+(exp.remaining/1000).toFixed(1)+'초</span><div class="speed-mini">'+[1,1.5,2,3].map(s=>'<button class="'+(exp.speed===s?"active":"")+'" data-area="'+a.id+'" data-speed="'+s+'">'+s+'x</button>').join("")+'</div></div></article>';
 }).join(""):'<div class="panel placeholder">진행 중인 원정이 없습니다.</div>';
 $$(".exp-return").forEach(b=>b.onclick=()=>returnExpedition(b.dataset.area,false));
 $$(".speed-mini button").forEach(b=>b.onclick=()=>{const exp=state.expeditions[b.dataset.area];if(exp){exp.speed=Number(b.dataset.speed);renderExpeditions();}});
}
function renderLog(){
 $("#log").innerHTML=state.log.length?state.log.slice(-80).map(x=>'<div class="log-line '+x.kind+'"><time>'+x.t+'</time><em>'+x.src+'</em><span>'+x.msg+'</span></div>').join(""):'<div class="empty-detail">기록 없음</div>';
 $("#log").scrollTop=$("#log").scrollHeight;
}
function renderPokemonGrid(){
 const assignedOnly=state.pokeFilter==="assigned";
 const list=state.roster.filter(p=>!assignedOnly||assignedAreaFor(p.id));
 $("#pokemonGrid").innerHTML=list.map(p=>'<article class="poke-icon-card '+(state.selectedPokemon===p.id?"active":"")+'" data-poke="'+p.id+'"><div class="sprite-box">'+p.type.slice(0,1)+'</div><strong>'+p.name+'</strong><small>Lv.'+p.lv+' · '+p.type+'</small></article>').join("");
 $$(".poke-icon-card").forEach(el=>el.onclick=()=>{state.selectedPokemon=el.dataset.poke;renderPokemonGrid();renderPokemonDetail();});
}
function renderPokemonDetail(){
 const p=pokeBy(state.selectedPokemon);if(!p){$("#pokemonDetail").innerHTML='<div class="empty-detail">포켓몬을 선택하세요.</div>';return;}
 const assigned=assignedAreaFor(p.id),moves=MOVES[p.id],heldItems=state.items.filter(i=>i.type==="held");
 $("#pokemonDetail").innerHTML='<div class="detail-card"><small>POKEMON DETAIL</small><h2>'+p.name+'</h2><div class="meta">Lv.'+p.lv+' · '+p.type+(assigned?' · '+areaBy(assigned).name+' 원정 중':'')+'</div>'+
 '<div class="detail-block"><h3>기본 능력치</h3><div class="detail-stats"><div><span>HP</span><b>'+p.maxHp+'</b></div><div><span>공격</span><b>'+p.atk+'</b></div><div><span>방어</span><b>'+p.def+'</b></div></div></div>'+
 '<div class="detail-block"><h3>기술 / 도구</h3>'+
 '<div class="field-row"><label>속공</label><select id="quickSelect">'+moves.quick.map(m=>'<option '+(m===p.quick?"selected":"")+'>'+m+'</option>').join("")+'</select></div>'+
 '<div class="field-row"><label>강공</label><select id="strongSelect">'+moves.strong.map(m=>'<option '+(m===p.strong?"selected":"")+'>'+m+'</option>').join("")+'</select></div>'+
 '<div class="field-row"><label>도구</label><select id="itemSelect"><option value="">없음</option>'+heldItems.map(i=>'<option value="'+i.id+'" '+(p.item===i.id?"selected":"")+'>'+i.name+'</option>').join("")+'</select></div></div>'+
 (assigned?'<div class="assignment-note">원정 중인 포켓몬의 세팅 변경은 다음 탐험부터 적용됩니다.</div>':'')+'</div>';
 $("#quickSelect").onchange=e=>{p.quick=e.target.value;};
 $("#strongSelect").onchange=e=>{p.strong=e.target.value;};
 $("#itemSelect").onchange=e=>{p.item=e.target.value||null;};
}
function renderItems(){
 const f=state.itemFilter;
 const list=state.items.filter(i=>f==="all"||i.type===f);
 $("#itemGrid").innerHTML=list.map(i=>'<article class="item-icon-card '+(state.selectedItem===i.id?"active":"")+'" data-item="'+i.id+'"><div class="item-sprite">'+i.icon+'</div><span class="item-count">×'+i.count+'</span><strong>'+i.name+'</strong><small>'+(i.type==="held"?"도구":"재료")+'</small></article>').join("");
 $$(".item-icon-card").forEach(el=>el.onclick=()=>{state.selectedItem=el.dataset.item;renderItems();renderItemDetail();});
}
function renderItemDetail(){
 const i=itemBy(state.selectedItem);if(!i){$("#itemDetail").innerHTML='<div class="empty-detail">아이템을 선택하세요.</div>';return;}
 const holders=state.roster.filter(p=>p.item===i.id).map(p=>p.name);
 $("#itemDetail").innerHTML='<div class="detail-card"><small>ITEM DETAIL</small><div class="item-detail-title"><div class="item-detail-icon">'+i.icon+'</div><div><h2>'+i.name+'</h2><p>'+(i.type==="held"?"도구":"재료")+' · 보유 '+i.count+'개</p></div></div>'+
 '<div class="detail-block"><h3>설명</h3><p class="meta">'+i.desc+'</p></div>'+
 '<div class="detail-block"><h3>사용 현황</h3><div class="assignment-note">'+(holders.length?holders.join(", ")+" 장착 중":"현재 장착한 포켓몬 없음")+'</div></div></div>';
}
function render(){
 renderResources();renderAreas();renderExpeditions();renderLog();renderPokemonGrid();renderPokemonDetail();renderItems();renderItemDetail();
 $("#expAreasPanel").classList.toggle("hidden",state.expSubtab!=="areas");$("#expRunningPanel").classList.toggle("hidden",state.expSubtab!=="running");
}
function bind(){
 $$(".nav").forEach(b=>b.onclick=()=>{$$(".nav").forEach(x=>x.classList.remove("active"));$$(".view").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#view-"+b.dataset.view).classList.add("active");});
 $$("#view-expedition .subtab").forEach(b=>b.onclick=()=>{state.expSubtab=b.dataset.expSubtab;$$("[data-exp-subtab]").forEach(x=>x.classList.toggle("active",x===b));render();});
 $$("#view-pokemon .subtab").forEach(b=>b.onclick=()=>{state.pokeFilter=b.dataset.pokeSubtab;$$("[data-poke-subtab]").forEach(x=>x.classList.toggle("active",x===b));renderPokemonGrid();});
 $$("#view-items .subtab").forEach(b=>b.onclick=()=>{state.itemFilter=b.dataset.itemFilter;$$("[data-item-filter]").forEach(x=>x.classList.toggle("active",x===b));renderItems();});
 $("#startExpeditionBtn").onclick=startExpedition;$("#returnSelectedBtn").onclick=()=>returnExpedition(state.selectedArea,false);
 $("#saveBtn").onclick=()=>save(true);$("#resetBtn").onclick=()=>{if(confirm("모든 저장 데이터를 초기화할까요?")){localStorage.removeItem(KEY);state=fresh();render();}};
 $("#clearLogBtn").onclick=()=>{state.log=[];renderLog();};
}
function loop(t){
 const delta=Math.min(100,t-last);last=t;
 let changed=false;
 for(const exp of Object.values(state.expeditions)){
  exp.remaining-=delta*exp.speed;
  if(exp.remaining<=0){resolveTurn(exp);if(state.expeditions[exp.areaId])exp.remaining+=3000;changed=true;}
 }
 if(changed)render();
 else if(state.expSubtab==="running")renderExpeditions();
 requestAnimationFrame(loop);
}
bind();render();requestAnimationFrame(loop);window.addEventListener("beforeunload",()=>save(false));
})();