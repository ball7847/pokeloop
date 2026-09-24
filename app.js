(() => {
  "use strict";

  const DATA = window.POKELOOP_DATA;
  const SAVE_KEY = "pokeloop_save_v1";
  const SOUP_INTERVAL_MS = 4 * 60 * 60 * 1000;
  const MERCHANT_STAY_MS = 3 * 60 * 60 * 1000;
  const MERCHANT_AWAY_MS = 3 * 60 * 60 * 1000;
  const EXPLORE_STEP_MS = 3000;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const clone = (v) => JSON.parse(JSON.stringify(v));

  function dateKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function createInitialState() {
    return {
      version: 1,
      money: 500,
      items: clone(DATA.items),
      pokemon: clone(DATA.pokemon),
      selectedBerry: "berry_green",
      soup: { active:false, berryId:null, nextVisitAt:null, visitor:null },
      craftQueue: [],
      merchant: { present:true, nextChangeAt:Date.now() + MERCHANT_STAY_MS },
      expeditions: {},
      regionProgress: Object.fromEntries(DATA.regions.map(r => [r.id, 0])),
      depthDaily: { date:dateKey(), cleared:{} },
      logs: [],
      selectedStorageItem: null,
      selectedPokemon: "001",
      selectedRegion: "meadow",
      selectedRegionParty: [],
      selectedDexPokemon: null,
      storageFilter: "all",
      settings: { fontSize:"M", autosave:true, battleLog:true },
      stats: {
        saveCreatedAt: Date.now(),
        totalExplorationSteps: 0,
        totalExpeditionsStarted: 0,
        totalPokemonRecruited: 0,
        totalCrafted: 0,
        totalMoneyEarned: 0
      }
    };
  }

  function escapeHtml(value){
    return String(value??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function normalizeGender(value,id){
    if(value==="수컷"||value==="암컷"||value==="무성")return value;
    const key=String(id||"");
    let score=0;
    for(let i=0;i<key.length;i++)score+=key.charCodeAt(i);
    return score%2===0?"수컷":"암컷";
  }

  function genderIcon(gender){
    if(gender==="수컷")return '<span class="gender-icon male" title="수컷" aria-label="수컷">♂</span>';
    if(gender==="암컷")return '<span class="gender-icon female" title="암컷" aria-label="암컷">♀</span>';
    return "";
  }

  function normalizePokemonData(p){
    const level=Number(p.level)||1;
    return {
      ...p,
      nickname:typeof p.nickname==="string"?p.nickname:"",
      tier:Number(p.tier)||1,
      nature:p.nature||"온순",
      gender:normalizeGender(p.gender,p.id),
      exp:Number.isFinite(Number(p.exp))?Number(p.exp):0,
      expRequired:Number(p.expRequired)||Math.max(40,level*20),
      hp:Number(p.hp)||1,
      atk:Number(p.atk)||1,
      def:Number(p.def)||1,
      spatk:Number(p.spatk)||Number(p.atk)||1,
      spdef:Number(p.spdef)||Number(p.def)||1,
      speed:Number(p.speed)||10,
      abilities:Array.isArray(p.abilities)?p.abilities.slice(0,2):[],
      quick:p.quick||"없음",
      strong1:p.strong1||p.strong||null,
      strong2:p.strong2||null
    };
  }

  function loadState() {
    const fresh = createInitialState();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) { fresh.pokemon=fresh.pokemon.map(normalizePokemonData); return fresh; }
      const saved = JSON.parse(raw);
      const loaded = {
        ...fresh,
        ...saved,
        settings:{...fresh.settings,...(saved.settings||{})},
        stats:{...fresh.stats,...(saved.stats||{})},
        soup:{...fresh.soup,...(saved.soup||{})},
        merchant:{...fresh.merchant,...(saved.merchant||{})},
        depthDaily:{...fresh.depthDaily,...(saved.depthDaily||{})},
        items:Array.isArray(saved.items)?saved.items:fresh.items,
        pokemon:(Array.isArray(saved.pokemon)?saved.pokemon:fresh.pokemon).map(normalizePokemonData),
        craftQueue:Array.isArray(saved.craftQueue)?saved.craftQueue:[],
        logs:Array.isArray(saved.logs)?saved.logs:[],
        expeditions:saved.expeditions||{},
        regionProgress:{...fresh.regionProgress,...(saved.regionProgress||{})}
      };
      loaded.selectedRegionParty = [];
      if(!loaded.selectedPokemon&&loaded.pokemon.length)loaded.selectedPokemon=loaded.pokemon[0].id;
      return loaded;
    } catch (error) {
      console.error("Save load failed", error);
      return fresh;
    }
  }

  let state = loadState();
  let lastAutosaveAt = Date.now();

  function resetDailyIfNeeded() {
    const today = dateKey();
    if (state.depthDaily.date !== today) {
      state.depthDaily = { date:today, cleared:{} };
      log("시스템","심층부 일일 클리어 횟수가 초기화되었습니다.");
    }
  }

  function itemById(id){ return state.items.find(x=>x.id===id); }
  function baseItemById(id){ return DATA.items.find(x=>x.id===id); }
  function pokemonById(id){ return state.pokemon.find(x=>x.id===id); }
  function regionById(id){ return DATA.regions.find(x=>x.id===id); }
  function expeditionForPokemon(id){ return Object.values(state.expeditions).find(e=>e.party.some(p=>p.id===id))||null; }

  function formatNumber(value) {
    return Math.floor(value).toLocaleString("ko-KR");
  }

  function formatDuration(ms){
    if(ms<=0)return"0초";
    const total=Math.ceil(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    if(h>0)return h+"시간 "+m+"분";
    if(m>0)return m+"분 "+s+"초";
    return s+"초";
  }

  function timeText(ts){
    return new Date(ts).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
  }

  function toast(message){
    const el=document.createElement("div");
    el.className="toast";
    el.textContent=message;
    $("#toastContainer").appendChild(el);
    setTimeout(()=>el.remove(),2600);
  }

  function log(category,message){
    state.logs.push({time:Date.now(),category,message});
    if(state.logs.length>200)state.logs.splice(0,state.logs.length-200);
    renderRecords();
  }

  function save(showToast=false){
    localStorage.setItem(SAVE_KEY,JSON.stringify(state));
    lastAutosaveAt=Date.now();
    if(showToast)toast("저장했습니다.");
    renderSaveStats();
  }

  function switchView(viewName){
    $$(".view").forEach(v=>v.classList.remove("active"));
    const target=$("#view-"+viewName);
    if(target)target.classList.add("active");

    const groupMap={
      soup:"camp",storage:"camp",craft:"camp",merchant:"camp",
      pokemon:"pokemon",
      regions:"exploration",depths:"exploration",
      pokemonDex:"dex",moveDex:"dex",explorationDex:"dex",itemDex:"dex",
      records:"settings",system:"settings"
    };
    const groupName=groupMap[viewName];
    $$(".nav-main").forEach(b=>b.classList.toggle("active",b.dataset.main===groupName));
    $$(".subnav").forEach(s=>s.classList.toggle("open",s.closest(".nav-group")?.dataset.group===groupName&&groupName!=="pokemon"));
    $$(".nav-sub").forEach(b=>b.classList.toggle("active",b.dataset.view===viewName));
    renderAll();
  }

  function toggleGroup(mainButton){
    const group=mainButton.closest(".nav-group");
    const sub=group.querySelector(".subnav");
    if(!sub){
      $$(".subnav").forEach(s=>s.classList.remove("open"));
      if(mainButton.dataset.view)switchView(mainButton.dataset.view);
      return;
    }
    const open=!sub.classList.contains("open");
    $$(".subnav").forEach(s=>s.classList.remove("open"));
    $$(".nav-main").forEach(b=>b.classList.remove("active"));
    if(open)sub.classList.add("open");
    mainButton.classList.add("active");
  }

  function categoryName(c){ return({berry:"열매",material:"재료",held:"도구"})[c]||c; }

  function renderMoney(){
    $("#moneyText").textContent=formatNumber(state.money)+" P";
  }

  function renderSoup(){
    $("#berryPicker").innerHTML=DATA.items.filter(i=>i.category==="berry").map(berry=>{
      const owned=itemById(berry.id)?.count||0;
      return '<button class="berry-button '+(state.selectedBerry===berry.id?"active":"")+'" data-berry="'+berry.id+'"><b>'+berry.name+'</b><span>보유 '+owned+'개</span></button>';
    }).join("");

    const badge=$("#soupStatusBadge"),title=$("#soupTitle"),desc=$("#soupDescription"),timer=$("#soupTimerText"),cook=$("#cookSoupBtn");
    if(state.soup.active){
      const berry=baseItemById(state.soup.berryId);
      badge.textContent=state.soup.visitor?"방문 중":"조리 완료";
      title.textContent=berry?berry.name+" 수프":"포켓수프";
      desc.textContent=state.soup.visitor?"포켓몬이 수프 냄새를 맡고 캠프에 찾아왔습니다.":"수프 향이 퍼지고 있습니다.";
      timer.textContent=state.soup.visitor?"방문 중":formatDuration(state.soup.nextVisitAt-Date.now());
      cook.textContent="수프 교체";
    }else{
      badge.textContent="대기 중";
      title.textContent="빈 냄비";
      desc.textContent="열매를 선택해 수프를 만들어보세요.";
      timer.textContent="-";
      cook.textContent="수프 만들기";
    }

    const visitorArea=$("#visitorArea");
    if(!state.soup.visitor){
      visitorArea.className="empty-state";
      visitorArea.innerHTML="아직 방문한 포켓몬이 없습니다.";
    }else{
      const v=state.soup.visitor;
      visitorArea.className="visitor-card";
      visitorArea.innerHTML='<span class="eyebrow">VISITOR</span><h3>'+v.name+'</h3><p>'+v.type.join(" / ")+' · Lv.'+v.level+'</p><div class="detail-stats" style="margin-top:12px"><div><span>HP</span><b>'+v.hp+'</b></div><div><span>공격</span><b>'+v.atk+'</b></div><div><span>방어</span><b>'+v.def+'</b></div></div><div class="visitor-actions"><button class="primary-button" id="recruitVisitorBtn">영입</button><button class="secondary-button" id="dismissVisitorBtn">보내기</button></div>';
      $("#recruitVisitorBtn").onclick=recruitVisitor;
      $("#dismissVisitorBtn").onclick=dismissVisitor;
    }

    $$(".berry-button").forEach(btn=>btn.onclick=()=>{state.selectedBerry=btn.dataset.berry;renderSoup();});
  }

  function cookSoup(){
    const item=itemById(state.selectedBerry);
    if(!item||item.count<=0){toast("선택한 열매가 없습니다.");return;}
    item.count-=1;
    state.soup={active:true,berryId:state.selectedBerry,nextVisitAt:Date.now()+SOUP_INTERVAL_MS,visitor:null};
    log("포켓수프",item.name+"를 넣어 수프를 만들었습니다.");
    toast("수프를 만들었습니다.");
    renderAll();
  }

  function generateVisitor(){
    const base=clone(DATA.pokemon[Math.floor(Math.random()*DATA.pokemon.length)]);
    base.id=base.id+"_visitor_"+Date.now();
    base.level=Math.max(1,base.level+Math.floor(Math.random()*3)-1);
    return base;
  }

  function recruitVisitor(){
    if(!state.soup.visitor)return;
    state.pokemon.push(clone(state.soup.visitor));
    state.stats.totalPokemonRecruited+=1;
    log("포켓수프",state.soup.visitor.name+"을(를) 영입했습니다.");
    state.soup.visitor=null;
    state.soup.nextVisitAt=Date.now()+SOUP_INTERVAL_MS;
    toast("포켓몬을 영입했습니다.");
    renderAll();
  }

  function dismissVisitor(){
    if(!state.soup.visitor)return;
    log("포켓수프",state.soup.visitor.name+"을(를) 돌려보냈습니다.");
    state.soup.visitor=null;
    state.soup.nextVisitAt=Date.now()+SOUP_INTERVAL_MS;
    renderAll();
  }

  function renderStorage(){
    const list=state.items.filter(i=>state.storageFilter==="all"||i.category===state.storageFilter);
    $("#storageGrid").innerHTML=list.map(item=>'<button class="icon-card '+(state.selectedStorageItem===item.id?"active":"")+'" data-item="'+item.id+'"><div class="item-icon">'+item.icon+'</div><span class="count-badge">×'+item.count+'</span><strong>'+item.name+'</strong><small>'+categoryName(item.category)+'</small></button>').join("");
    $$(".icon-card[data-item]").forEach(btn=>btn.onclick=()=>{state.selectedStorageItem=btn.dataset.item;renderStorage();});

    const detail=$("#storageDetail"),item=itemById(state.selectedStorageItem);
    if(!item){detail.innerHTML='<div class="empty-state">아이템을 선택하세요.</div>';return;}
    detail.innerHTML='<div class="detail-title"><div class="detail-icon">'+item.icon+'</div><div><h2>'+item.name+'</h2><p>'+categoryName(item.category)+' · 보유 '+item.count+'개</p></div></div><div class="detail-section"><h3>설명</h3><p>'+item.description+'</p></div><div class="detail-section"><h3>기본 가치</h3><div class="detail-stats"><div><span>판매 기준가</span><b>'+item.price+' P</b></div><div><span>보유 수량</span><b>'+item.count+'</b></div><div><span>분류</span><b>'+categoryName(item.category)+'</b></div></div></div><div class="detail-actions"><button id="goCraftBtn">제작으로</button><button id="goMerchantBtn">판매로</button></div>';
    $("#goCraftBtn").onclick=()=>switchView("craft");
    $("#goMerchantBtn").onclick=()=>switchView("merchant");
  }

  function canCraft(recipe){
    return recipe.ingredients.every(req=>(itemById(req.item)?.count||0)>=req.amount);
  }

  function renderCrafting(){
    $("#recipeList").innerHTML=DATA.recipes.map(recipe=>{
      const can=canCraft(recipe);
      const mats=recipe.ingredients.map(x=>(baseItemById(x.item)?.name||x.item)+" "+x.amount+"개").join(" · ");
      return '<div class="list-row"><div><h3>'+recipe.name+'</h3><p>'+mats+' / '+recipe.seconds+'초</p></div><aside><span>'+recipe.description+'</span><button data-recipe="'+recipe.id+'" '+(can?"":"disabled")+'>제작</button></aside></div>';
    }).join("");
    $$("#recipeList [data-recipe]").forEach(btn=>btn.onclick=()=>startCraft(btn.dataset.recipe));

    $("#craftQueue").innerHTML=state.craftQueue.length?state.craftQueue.map(job=>{
      const recipe=DATA.recipes.find(r=>r.id===job.recipeId);
      return '<div class="list-row"><div><h3>'+(recipe?.name||job.recipeId)+'</h3><p>제작 진행 중</p></div><aside><b>'+formatDuration(job.endsAt-Date.now())+'</b></aside></div>';
    }).join(""):'<div class="empty-state">진행 중인 제작이 없습니다.</div>';
  }

  function startCraft(recipeId){
    const recipe=DATA.recipes.find(r=>r.id===recipeId);
    if(!recipe||!canCraft(recipe)){toast("재료가 부족합니다.");return;}
    recipe.ingredients.forEach(req=>itemById(req.item).count-=req.amount);
    state.craftQueue.push({id:"craft_"+Date.now(),recipeId,endsAt:Date.now()+recipe.seconds*1000});
    log("제작",recipe.name+" 제작을 시작했습니다.");
    renderAll();
  }

  function finishCrafts(){
    const now=Date.now(),completed=state.craftQueue.filter(j=>j.endsAt<=now);
    if(!completed.length)return false;
    completed.forEach(job=>{
      const recipe=DATA.recipes.find(r=>r.id===job.recipeId);
      if(!recipe)return;
      let item=itemById(recipe.result.item);
      if(!item){
        const base=baseItemById(recipe.result.item);
        if(base){item={...clone(base),count:0};state.items.push(item);}
      }
      if(item)item.count+=recipe.result.amount;
      state.stats.totalCrafted+=recipe.result.amount;
      log("제작",recipe.name+" 제작이 완료되었습니다.");
    });
    state.craftQueue=state.craftQueue.filter(j=>j.endsAt>now);
    return true;
  }

  function renderMerchant(){
    const remaining=state.merchant.nextChangeAt-Date.now();
    $("#merchantStatus").textContent=state.merchant.present?"체류 중 · "+formatDuration(remaining)+" 후 출발":"부재 중 · "+formatDuration(remaining)+" 후 방문";

    if(!state.merchant.present){
      $("#merchantBuyList").innerHTML='<div class="empty-state">유랑상인이 캠프에 없습니다.</div>';
      $("#merchantSellList").innerHTML='<div class="empty-state">상인이 돌아오면 거래할 수 있습니다.</div>';
      return;
    }

    $("#merchantBuyList").innerHTML=DATA.merchantStock.map(stock=>{
      const base=baseItemById(stock.item);
      return '<div class="list-row"><div><h3>'+base.name+'</h3><p>'+base.description+'</p></div><aside><b>'+stock.buy+' P</b><button data-buy="'+stock.item+'">구매</button></aside></div>';
    }).join("");

    $("#merchantSellList").innerHTML=state.items.filter(i=>i.count>0).map(item=>{
      const stock=DATA.merchantStock.find(s=>s.item===item.id);
      const sell=stock?stock.sell:Math.max(1,Math.floor(item.price*.4));
      return '<div class="list-row"><div><h3>'+item.name+'</h3><p>보유 '+item.count+'개</p></div><aside><b>'+sell+' P</b><button data-sell="'+item.id+'">1개 판매</button></aside></div>';
    }).join("");

    $$("[data-buy]").forEach(btn=>btn.onclick=()=>buyItem(btn.dataset.buy));
    $$("[data-sell]").forEach(btn=>btn.onclick=()=>sellItem(btn.dataset.sell));
  }

  function buyItem(id){
    const stock=DATA.merchantStock.find(s=>s.item===id);
    if(!stock||state.money<stock.buy){toast("포켓이 부족합니다.");return;}
    state.money-=stock.buy;
    let item=itemById(id);
    if(!item){item={...clone(baseItemById(id)),count:0};state.items.push(item);}
    item.count+=1;
    log("유랑상인",item.name+" 1개를 구매했습니다.");
    renderAll();
  }

  function sellItem(id){
    const item=itemById(id);
    if(!item||item.count<=0)return;
    const stock=DATA.merchantStock.find(s=>s.item===id);
    const sell=stock?stock.sell:Math.max(1,Math.floor(item.price*.4));
    item.count-=1;state.money+=sell;state.stats.totalMoneyEarned+=sell;
    log("유랑상인",item.name+" 1개를 "+sell+" P에 판매했습니다.");
    renderAll();
  }

  function advanceMerchant(){
    if(Date.now()<state.merchant.nextChangeAt)return false;
    state.merchant.present=!state.merchant.present;
    state.merchant.nextChangeAt=Date.now()+(state.merchant.present?MERCHANT_STAY_MS:MERCHANT_AWAY_MS);
    log("유랑상인",state.merchant.present?"유랑상인이 캠프에 방문했습니다.":"유랑상인이 캠프를 떠났습니다.");
    return true;
  }

  function displayPokemonName(p){
    return p.nickname&&p.nickname.trim()?p.nickname.trim():p.name;
  }

  let nicknameTargetPokemonId=null;

  function renderPokemon(){
    $("#pokemonGrid").innerHTML=state.pokemon.map(p=>{
      const exp=expeditionForPokemon(p.id);
      const displayName=escapeHtml(displayPokemonName(p));
      return '<button class="pokemon-card '+(state.selectedPokemon===p.id?"active":"")+'" data-pokemon="'+escapeHtml(p.id)+'"><div class="pokemon-icon">'+escapeHtml(p.icon||"PK")+'</div><strong>'+displayName+'</strong><small>'+p.tier+'T · Lv.'+p.level+' · '+escapeHtml(p.type.join("/"))+(exp?" · 탐험 중":"")+'</small></button>';
    }).join("");

    $$(".pokemon-card").forEach(btn=>btn.onclick=()=>{
      state.selectedPokemon=btn.dataset.pokemon;
      renderPokemon();
    });

    const p=pokemonById(state.selectedPokemon),detail=$("#pokemonDetail");
    if(!p){
      detail.innerHTML='<div class="empty-state">포켓몬을 선택하세요.</div>';
      return;
    }

    const exp=expeditionForPokemon(p.id);
    const displayName=escapeHtml(displayPokemonName(p));
    const abilityHtml=p.abilities.length
      ? p.abilities.map((a,i)=>'<div class="profile-value-row"><span>특성 '+(i+1)+'</span><b>'+escapeHtml(a)+'</b></div>').join("")
      : '<div class="profile-value-row"><span>특성</span><b>없음</b></div>';
    const itemName=escapeHtml(p.item?(baseItemById(p.item)?.name||p.item):"장착 없음");
    const status=escapeHtml(exp?regionById(exp.regionId).name+" 탐험 중":"캠프 대기 중");
    const types=escapeHtml(p.type.join(" / "));

    detail.innerHTML=
      '<div class="pokemon-profile">'+
        '<div class="pokemon-profile-head">'+
          '<div class="detail-icon">'+escapeHtml(p.icon||"PK")+'</div>'+
          '<div class="pokemon-profile-title">'+
            '<div class="pokemon-name-line">'+
              '<span class="tier-badge">'+p.tier+'T</span>'+
              '<h2 title="'+displayName+'">'+displayName+'</h2>'+
              genderIcon(p.gender)+
              '<button class="nickname-icon-button" id="nicknameBtn" type="button" title="별명 설정" aria-label="별명 설정">✎</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="profile-info-grid compact-profile-info">'+
          '<div><span>성격</span><b>'+escapeHtml(p.nature)+'</b></div>'+
          '<div><span>레벨</span><b>Lv.'+p.level+'</b></div>'+
          '<div><span>경험치</span><b>'+p.exp+' / '+p.expRequired+'</b></div>'+
          '<div><span>타입</span><b>'+types+'</b></div>'+
        '</div>'+
        '<div class="detail-section"><h3>능력치</h3><div class="pokemon-stat-grid">'+
          '<div><span>HP</span><b>'+p.hp+'</b></div>'+
          '<div><span>공격</span><b>'+p.atk+'</b></div>'+
          '<div><span>방어</span><b>'+p.def+'</b></div>'+
          '<div><span>특수공격</span><b>'+p.spatk+'</b></div>'+
          '<div><span>특수방어</span><b>'+p.spdef+'</b></div>'+
          '<div><span>스피드</span><b>'+p.speed+'</b></div>'+
        '</div></div>'+
        '<div class="profile-columns">'+
          '<div class="detail-section"><h3>특성</h3><div class="profile-value-list">'+abilityHtml+'</div></div>'+
          '<div class="detail-section"><h3>도구</h3><div class="profile-value-row"><span>장착 도구</span><b>'+itemName+'</b></div></div>'+
        '</div>'+
        '<div class="detail-section"><h3>기술</h3><div class="move-slot-list">'+
          '<div class="move-slot"><span>속공</span><b>'+escapeHtml(p.quick)+'</b></div>'+
          '<div class="move-slot"><span>강공 1</span><b>'+escapeHtml(p.strong1||"없음")+'</b></div>'+
          '<div class="move-slot"><span>강공 2</span><b>'+escapeHtml(p.strong2||"없음")+'</b></div>'+
        '</div></div>'+
        '<div class="detail-section"><h3>현재 상태</h3><div class="current-status">'+status+'</div></div>'+
      '</div>';

    $("#nicknameBtn").onclick=()=>openNicknameModal(p.id);
  }

  function openNicknameModal(pokemonId){
    const p=pokemonById(pokemonId);
    if(!p)return;
    nicknameTargetPokemonId=pokemonId;
    const modal=$("#nicknameModal");
    const input=$("#nicknameInput");
    input.value=p.nickname||"";
    $("#nicknameCount").textContent=input.value.length+" / 12";
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden","false");
    requestAnimationFrame(()=>{
      input.focus();
      input.select();
    });
  }

  function closeNicknameModal(){
    nicknameTargetPokemonId=null;
    const modal=$("#nicknameModal");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden","true");
  }

  function saveNicknameFromModal(){
    const p=pokemonById(nicknameTargetPokemonId);
    if(!p){closeNicknameModal();return;}
    const nickname=$("#nicknameInput").value.trim();
    if(nickname.length>12){
      toast("별명은 최대 12글자까지 설정할 수 있습니다.");
      return;
    }
    p.nickname=nickname;
    log("포켓몬",p.name+"의 별명을 "+(nickname?nickname:"원래 이름")+"(으)로 설정했습니다.");
    closeNicknameModal();
    renderPokemon();
  }

  function renderRegions(){
    $("#regionList").innerHTML=DATA.regions.map(region=>{
      const exp=state.expeditions[region.id];
      return '<button class="region-card '+(state.selectedRegion===region.id?"active":"")+' '+(exp?"running":"")+'" data-region="'+region.id+'"><strong>'+region.name+'</strong><p>'+region.description+'</p><div class="region-meta"><span>'+region.difficulty+'</span><span>'+region.recommended+'</span>'+(exp?"<span>탐험 중</span>":"")+'</div></button>';
    }).join("");
    $$(".region-card").forEach(btn=>btn.onclick=()=>{state.selectedRegion=btn.dataset.region;state.selectedRegionParty=[];renderRegions();});
    renderRegionDetail();
  }

  function renderRegionDetail(){
    const region=regionById(state.selectedRegion),detail=$("#regionDetail");
    if(!region){detail.innerHTML='<div class="empty-state">지역을 선택하세요.</div>';return;}
    const exp=state.expeditions[region.id];
    if(exp){
      detail.innerHTML=expeditionDetailHtml(region,exp);
      $("#returnExpeditionBtn").onclick=()=>returnExpedition(region.id);
      return;
    }
    const available=state.pokemon.filter(p=>!expeditionForPokemon(p.id));
    detail.innerHTML='<div class="detail-title"><div class="detail-icon">◆</div><div><h2>'+region.name+'</h2><p>'+region.difficulty+' · 권장 '+region.recommended+'</p></div></div><div class="detail-section"><h3>지역 정보</h3><p>'+region.description+'</p></div><div class="detail-section"><h3>출현 포켓몬</h3><p>'+region.encounters.join(" · ")+'</p></div><div class="detail-section"><h3>주요 획득물</h3><p>'+region.drops.join(" · ")+'</p></div><div class="detail-section"><h3>탐험대 편성 · '+state.selectedRegionParty.length+'/3</h3><div class="region-party-picker">'+available.map(p=>'<button class="region-party-option '+(state.selectedRegionParty.includes(p.id)?"active":"")+'" data-party="'+p.id+'"><strong>'+p.name+'</strong><small>Lv.'+p.level+'</small></button>').join("")+'</div></div><div class="detail-actions"><button id="startExpeditionBtn" '+(state.selectedRegionParty.length<1?"disabled":"")+'>탐험 시작</button></div>';
    $$("[data-party]").forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.party,index=state.selectedRegionParty.indexOf(id);
      if(index>=0)state.selectedRegionParty.splice(index,1);else if(state.selectedRegionParty.length<3)state.selectedRegionParty.push(id);
      renderRegionDetail();
    });
    $("#startExpeditionBtn").onclick=startExpedition;
  }

  function startExpedition(){
    const region=regionById(state.selectedRegion);
    if(!region||state.expeditions[region.id]||!state.selectedRegionParty.length)return;
    const party=state.selectedRegionParty.map(id=>{
      const p=pokemonById(id);
      return{id:p.id,name:p.name,maxHp:p.hp,hp:p.hp,pp:0};
    });
    state.expeditions[region.id]={regionId:region.id,party,startedAt:Date.now(),steps:0,wins:0,nextStepAt:Date.now()+EXPLORE_STEP_MS,lastEvent:"탐험을 시작했습니다."};
    state.selectedRegionParty=[];state.stats.totalExpeditionsStarted+=1;
    log("탐험",region.name+" 탐험을 시작했습니다.");
    renderAll();
  }

  function returnExpedition(regionId){
    const region=regionById(regionId);
    if(!state.expeditions[regionId])return;
    delete state.expeditions[regionId];
    log("탐험",region.name+"에서 귀환했습니다.");
    renderAll();
  }

  function expeditionDetailHtml(region,exp){
    const progress=Math.min(100,(exp.steps%20)/20*100);
    return '<div class="detail-title"><div class="detail-icon">◆</div><div><h2>'+region.name+'</h2><p>탐험 진행 중 · '+exp.party.length+'마리</p></div></div><div class="detail-section"><h3>진행 상황</h3><div class="progress-block"><div class="progress-label"><span>현재 구간</span><b>'+exp.steps+' 구역</b></div><div class="progress-bar"><i style="width:'+progress+'%"></i></div></div><p style="margin-top:8px">'+exp.lastEvent+'</p></div><div class="detail-section"><h3>탐험대</h3><div class="expedition-party">'+exp.party.map(m=>'<div class="expedition-member"><div class="member-line"><strong>'+m.name+'</strong><span>탐험 중</span></div><div class="member-bars"><span>HP</span><div class="mini-bar hp"><i style="width:'+Math.max(0,m.hp/m.maxHp*100)+'%"></i></div><b>'+m.hp+' / '+m.maxHp+'</b></div><div class="member-bars"><span>PP</span><div class="mini-bar pp"><i style="width:'+Math.min(100,m.pp)+'%"></i></div><b>'+m.pp+' / 100</b></div></div>').join("")+'</div></div><div class="detail-section"><h3>통계</h3><div class="detail-stats"><div><span>탐험 구역</span><b>'+exp.steps+'</b></div><div><span>승리</span><b>'+exp.wins+'</b></div><div><span>다음 행동</span><b>'+formatDuration(exp.nextStepAt-Date.now())+'</b></div></div></div><div class="detail-actions"><button id="returnExpeditionBtn">귀환</button></div>';
  }

  function advanceExpeditions(){
    let changed=false;const now=Date.now();
    for(const [regionId,exp] of Object.entries(state.expeditions)){
      if(now<exp.nextStepAt)continue;
      const region=regionById(regionId);
      exp.steps+=1;state.regionProgress[regionId]=(state.regionProgress[regionId]||0)+1;state.stats.totalExplorationSteps+=1;
      if(Math.random()<.62){
        exp.wins+=1;
        const money=2+Math.floor(Math.random()*5);
        state.money+=money;state.stats.totalMoneyEarned+=money;
        exp.party.forEach(m=>{m.pp=Math.min(150,m.pp+20);if(Math.random()<.42)m.hp=Math.max(1,m.hp-(1+Math.floor(Math.random()*5)));});
        const enemy=region.encounters[Math.floor(Math.random()*region.encounters.length)];
        exp.lastEvent=enemy+"과(와) 전투해 승리했습니다. +"+money+" P";
        if(state.settings.battleLog)log("탐험",region.name+": "+exp.lastEvent);
      }else exp.lastEvent="아무 일 없이 다음 구역으로 이동했습니다.";
      exp.nextStepAt=now+EXPLORE_STEP_MS;changed=true;
    }
    return changed;
  }

  function renderDepths(){
    resetDailyIfNeeded();
    $("#depthList").innerHTML=DATA.depths.map(depth=>{
      const progress=state.regionProgress[depth.region]||0,unlocked=progress>=depth.requirement,cleared=!!state.depthDaily.cleared[depth.id];
      return '<article class="depth-card '+(unlocked?"":"locked")+'"><h2>'+depth.name+'</h2><p>'+depth.description+'</p><div class="depth-meta"><div><span>보스</span><b>'+depth.boss+'</b></div><div><span>해금</span><b>'+progress+' / '+depth.requirement+' 구역</b></div><div><span>보상</span><b>'+depth.reward+'</b></div><div><span>오늘</span><b>'+(cleared?"클리어 완료":"도전 가능")+'</b></div></div><button data-depth="'+depth.id+'" '+(!unlocked||cleared?"disabled":"")+'>'+(cleared?"오늘 클리어 완료":unlocked?"도전":"잠김")+'</button></article>';
    }).join("");
    $$("[data-depth]").forEach(btn=>btn.onclick=()=>clearDepth(btn.dataset.depth));
  }

  function clearDepth(id){
    const depth=DATA.depths.find(d=>d.id===id);
    if(!depth)return;
    resetDailyIfNeeded();
    if((state.regionProgress[depth.region]||0)<depth.requirement||state.depthDaily.cleared[id])return;
    const rewards={meadow_depth:250,forest_depth:450,cliff_depth:800},reward=rewards[id]||250;
    state.money+=reward;state.stats.totalMoneyEarned+=reward;state.depthDaily.cleared[id]=true;
    log("심층부",depth.name+"을(를) 클리어했습니다. +"+reward+" P");toast("심층부 클리어!");renderAll();
  }

  function renderDexes(){
    $("#pokemonDexGrid").innerHTML=DATA.pokemon.map(p=>'<button class="pokemon-card '+(state.selectedDexPokemon===p.id?"active":"")+'" data-dex-pokemon="'+p.id+'"><div class="pokemon-icon">'+p.icon+'</div><strong>'+p.name+'</strong><small>'+p.type.join("/")+'</small></button>').join("");
    $$("[data-dex-pokemon]").forEach(btn=>btn.onclick=()=>{state.selectedDexPokemon=btn.dataset.dexPokemon;renderDexes();});
    const p=DATA.pokemon.find(x=>x.id===state.selectedDexPokemon);
    $("#pokemonDexDetail").innerHTML=p?'<div class="detail-title"><div class="detail-icon">'+p.icon+'</div><div><h2>'+p.name+'</h2><p>'+p.type.join(" / ")+'</p></div></div><div class="detail-section"><h3>기본 데이터</h3><div class="detail-stats"><div><span>HP</span><b>'+p.hp+'</b></div><div><span>공격</span><b>'+p.atk+'</b></div><div><span>방어</span><b>'+p.def+'</b></div></div></div><div class="detail-section"><h3>기술</h3><p>'+p.quick+' / '+(p.strong1||p.strong||"없음")+'</p></div>':'<div class="empty-state">포켓몬을 선택하세요.</div>';
    $("#moveDexList").innerHTML='<div class="table-row header"><span>ID</span><span>기술</span><span>구분</span><span>효과</span></div>'+DATA.moves.map(m=>'<div class="table-row"><span>'+m.id+'</span><span>'+m.name+'</span><span>'+m.kind+' · '+m.type+'</span><span>'+m.description+'</span></div>').join("");
    $("#explorationDexList").innerHTML='<div class="table-row header"><span>지역</span><span>난이도</span><span>권장</span><span>정보</span></div>'+DATA.regions.map(r=>'<div class="table-row"><span>'+r.name+'</span><span>'+r.difficulty+'</span><span>'+r.recommended+'</span><span>'+r.encounters.join(", ")+' / '+r.drops.join(", ")+'</span></div>').join("");
    $("#itemDexList").innerHTML='<div class="table-row header"><span>아이템</span><span>분류</span><span>기준가</span><span>설명</span></div>'+DATA.items.map(i=>'<div class="table-row"><span>'+i.name+'</span><span>'+categoryName(i.category)+'</span><span>'+i.price+' P</span><span>'+i.description+'</span></div>').join("");
  }

  function renderSaveStats(){
    $("#saveStats").innerHTML=[
      ["세이브 버전","v"+state.version],
      ["게임 시작",new Date(state.stats.saveCreatedAt).toLocaleString("ko-KR")],
      ["보유 포켓몬",state.pokemon.length+"마리"],
      ["보유 아이템 종류",state.items.filter(i=>i.count>0).length+"종"],
      ["총 탐험 구역",formatNumber(state.stats.totalExplorationSteps)],
      ["총 영입",formatNumber(state.stats.totalPokemonRecruited)],
      ["총 제작",formatNumber(state.stats.totalCrafted)],
      ["총 획득 포켓",formatNumber(state.stats.totalMoneyEarned)+" P"]
    ].map(x=>'<div class="stat-list-row"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join("");
  }

  function renderRecords(){
    renderSaveStats();
  }

  function exportSave(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="pokeloop-save-"+dateKey()+".json";a.click();URL.revokeObjectURL(url);toast("세이브 데이터를 내보냈습니다.");
  }

  function applyFontSize(){
    const size=["S","M","L","XL"].includes(state.settings.fontSize)?state.settings.fontSize:"M";
    state.settings.fontSize=size;
    document.documentElement.dataset.fontSize=size;
    $$("#fontSizeControl button").forEach(btn=>btn.classList.toggle("active",btn.dataset.fontSize===size));
  }

  function renderSettings(){
    applyFontSize();
    $("#autosaveToggle").checked=state.settings.autosave;
    $("#battleLogToggle").checked=state.settings.battleLog;
  }

  function renderAll(){
    renderMoney();renderSoup();renderStorage();renderCrafting();renderMerchant();renderPokemon();renderRegions();renderDepths();renderDexes();renderRecords();renderSettings();
  }

  function tick(){
    let changed=false;const now=Date.now();
    if(state.soup.active&&!state.soup.visitor&&state.soup.nextVisitAt&&now>=state.soup.nextVisitAt){
      state.soup.visitor=generateVisitor();log("포켓수프",state.soup.visitor.name+"이(가) 캠프를 방문했습니다.");changed=true;
    }
    if(finishCrafts())changed=true;
    if(advanceMerchant())changed=true;
    if(advanceExpeditions())changed=true;
    resetDailyIfNeeded();
    if(state.settings.autosave&&now-lastAutosaveAt>=30000)save(false);
    if(changed)renderAll();else{renderSoup();renderCrafting();renderMerchant();if($("#view-regions").classList.contains("active"))renderRegions();}
  }

  function bindStaticEvents(){
    $("#mainNav").addEventListener("click",(event)=>{
      const subButton=event.target.closest(".nav-sub");
      if(subButton){
        switchView(subButton.dataset.view);
        return;
      }
      const mainButton=event.target.closest(".nav-main");
      if(mainButton)toggleGroup(mainButton);
    });

    $("#cookSoupBtn").onclick=cookSoup;

    $$("#storageFilter button").forEach(btn=>btn.onclick=()=>{
      state.storageFilter=btn.dataset.filter;
      $$("#storageFilter button").forEach(b=>b.classList.toggle("active",b===btn));
      renderStorage();
    });

    $$("#fontSizeControl button").forEach(btn=>btn.onclick=()=>{
      state.settings.fontSize=btn.dataset.fontSize;
      applyFontSize();
      toast("글자 크기를 "+btn.dataset.fontSize+"로 변경했습니다.");
    });

    $("#nicknameModalCancel").onclick=closeNicknameModal;
    $("#nicknameModalSave").onclick=saveNicknameFromModal;
    $("#nicknameInput").addEventListener("input",e=>{
      $("#nicknameCount").textContent=e.target.value.length+" / 12";
    });
    $("#nicknameInput").addEventListener("keydown",e=>{
      if(e.key==="Enter")saveNicknameFromModal();
      if(e.key==="Escape")closeNicknameModal();
    });
    $("#nicknameModal").addEventListener("mousedown",e=>{
      if(e.target===$("#nicknameModal"))closeNicknameModal();
    });

    $("#saveNowBtn").onclick=()=>save(true);
    $("#exportSaveBtn").onclick=exportSave;
    $("#autosaveToggle").onchange=e=>{state.settings.autosave=e.target.checked;toast("자동 저장 설정을 변경했습니다.");};
    $("#battleLogToggle").onchange=e=>{state.settings.battleLog=e.target.checked;};
    window.addEventListener("beforeunload",()=>save(false));
  }
  bindStaticEvents();
  renderAll();
  setInterval(tick,1000);
})();