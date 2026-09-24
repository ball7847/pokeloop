window.POKELOOP_DATA = {
  pokemon: [
    { id:"001", name:"이상해씨", type:["풀","독"], level:5, hp:72, atk:15, def:12, quick:"덩굴채찍", strong:"씨폭탄", item:null, icon:"001" },
    { id:"004", name:"파이리", type:["불꽃"], level:5, hp:64, atk:18, def:9, quick:"불꽃세례", strong:"화염바퀴", item:null, icon:"004" },
    { id:"007", name:"꼬부기", type:["물"], level:5, hp:80, atk:13, def:16, quick:"물대포", strong:"아쿠아테일", item:null, icon:"007" },
    { id:"019", name:"꼬렛", type:["노말"], level:4, hp:58, atk:16, def:8, quick:"전광석화", strong:"필살앞니", item:null, icon:"019" },
    { id:"016", name:"구구", type:["노말","비행"], level:4, hp:60, atk:14, def:9, quick:"바람일으키기", strong:"날개치기", item:null, icon:"016" }
  ],

  moves: [
    { id:"AS001", name:"덩굴채찍", kind:"속공", type:"풀", power:10, ppGain:20, description:"덩굴을 휘둘러 공격하고 PP를 획득한다." },
    { id:"SS001", name:"씨폭탄", kind:"강공", type:"풀", power:42, ppCost:100, description:"커다란 씨앗을 폭발시켜 강한 피해를 준다." },
    { id:"AS002", name:"불꽃세례", kind:"속공", type:"불꽃", power:11, ppGain:20, description:"작은 불꽃으로 공격하고 PP를 획득한다." },
    { id:"SS002", name:"화염바퀴", kind:"강공", type:"불꽃", power:46, ppCost:100, description:"불꽃을 두르고 강하게 돌진한다." },
    { id:"AS003", name:"물대포", kind:"속공", type:"물", power:9, ppGain:25, description:"물을 발사해 공격하고 PP를 획득한다." },
    { id:"SS003", name:"아쿠아테일", kind:"강공", type:"물", power:40, ppCost:100, description:"물의 힘을 두른 꼬리로 강하게 공격한다." },
    { id:"AS004", name:"전광석화", kind:"속공", type:"노말", power:10, ppGain:25, description:"빠르게 접근해 공격한다." },
    { id:"SS004", name:"필살앞니", kind:"강공", type:"노말", power:38, ppCost:100, description:"강한 앞니로 상대를 물어뜯는다." },
    { id:"AS005", name:"바람일으키기", kind:"속공", type:"비행", power:10, ppGain:20, description:"날개로 바람을 일으켜 공격한다." },
    { id:"SS005", name:"날개치기", kind:"강공", type:"비행", power:40, ppCost:100, description:"날개를 크게 휘둘러 공격한다." }
  ],

  items: [
    { id:"berry_green", name:"초록열매", category:"berry", count:12, icon:"열", price:12, description:"풀 타입 포켓몬이 좋아하는 향을 가진 열매." },
    { id:"berry_red", name:"붉은열매", category:"berry", count:12, icon:"열", price:12, description:"불꽃 타입 포켓몬이 좋아하는 향을 가진 열매." },
    { id:"berry_blue", name:"푸른열매", category:"berry", count:12, icon:"열", price:12, description:"물 타입 포켓몬이 좋아하는 향을 가진 열매." },
    { id:"wood", name:"나무", category:"material", count:18, icon:"목", price:6, description:"제작에 널리 사용하는 기본 재료." },
    { id:"stone", name:"돌", category:"material", count:14, icon:"석", price:7, description:"단단한 도구 제작에 사용하는 재료." },
    { id:"fiber", name:"식물섬유", category:"material", count:10, icon:"섬", price:8, description:"끈이나 천 계열 제작에 사용하는 재료." },
    { id:"rockyHelmet", name:"울퉁불퉁멧", category:"held", count:1, icon:"멧", price:180, description:"접촉 공격을 받을 때 공격자에게 반사 피해를 준다." },
    { id:"clearAmulet", name:"클리어참", category:"held", count:1, icon:"참", price:180, description:"상대가 유발하는 능력치 하락을 막는다." },
    { id:"focusSash", name:"기합의띠", category:"held", count:1, icon:"띠", price:220, description:"HP가 가득 찬 상태에서 치명적인 피해를 한 번 버틴다." }
  ],

  recipes: [
    { id:"rope", name:"튼튼한 끈", result:{ item:"fiber", amount:1 }, ingredients:[{item:"fiber",amount:2}], seconds:15, description:"간단한 제작 재료." },
    { id:"rockyHelmet", name:"울퉁불퉁멧", result:{ item:"rockyHelmet", amount:1 }, ingredients:[{item:"stone",amount:6},{item:"fiber",amount:4}], seconds:60, description:"접촉 공격을 되돌려주는 도구." },
    { id:"clearAmulet", name:"클리어참", result:{ item:"clearAmulet", amount:1 }, ingredients:[{item:"stone",amount:4},{item:"wood",amount:4}], seconds:90, description:"능력치 하락을 막는 도구." }
  ],

  merchantStock: [
    { item:"berry_green", buy:18, sell:7 },
    { item:"berry_red", buy:18, sell:7 },
    { item:"berry_blue", buy:18, sell:7 },
    { item:"fiber", buy:14, sell:6 },
    { item:"rockyHelmet", buy:260, sell:110 }
  ],

  regions: [
    {
      id:"meadow", name:"새싹 들판", difficulty:"쉬움",
      description:"초기 포켓몬이 자주 출현하는 평온한 지역.",
      recommended:"Lv. 1~6", unlocked:true,
      encounters:["꼬렛","구구","캐터피","뿔충이"],
      drops:["나무","식물섬유","초록열매"],
      depthRequirement:"누적 30구역 탐험"
    },
    {
      id:"forest", name:"깊은 초록 숲", difficulty:"보통",
      description:"숲 포켓몬과 독 타입 포켓몬이 자주 등장하는 지역.",
      recommended:"Lv. 5~12", unlocked:true,
      encounters:["파라스","뚜벅쵸","아보","스라크"],
      drops:["나무","식물섬유","초록열매"],
      depthRequirement:"누적 60구역 탐험"
    },
    {
      id:"cliff", name:"바람 깎인 절벽", difficulty:"어려움",
      description:"비행과 바위 포켓몬이 출현하는 험준한 지역.",
      recommended:"Lv. 10~18", unlocked:true,
      encounters:["깨비참","꼬마돌","롱스톤","골뱃"],
      drops:["돌","푸른열매","붉은열매"],
      depthRequirement:"누적 100구역 탐험"
    }
  ],

  depths: [
    {
      id:"meadow_depth", region:"meadow", name:"새싹 들판 심층부",
      boss:"큰꼬렛", requirement:30, reward:"포켓 250 P + 희귀 재료",
      description:"들판 안쪽에 자리 잡은 강력한 무리의 우두머리."
    },
    {
      id:"forest_depth", region:"forest", name:"깊은 초록 숲 심층부",
      boss:"스라크", requirement:60, reward:"포켓 450 P + 희귀 재료",
      description:"울창한 숲 가장 깊은 곳. 적의 공격력이 크게 상승한다."
    },
    {
      id:"cliff_depth", region:"cliff", name:"바람 깎인 절벽 심층부",
      boss:"프테라", requirement:100, reward:"포켓 800 P + 희귀 재료",
      description:"절벽 최심부. 매우 강한 적과 전투한다."
    }
  ]
};