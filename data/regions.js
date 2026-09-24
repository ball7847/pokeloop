window.POKELOOP_DATA_PARTS = window.POKELOOP_DATA_PARTS || {};
window.POKELOOP_DATA_PARTS.regions = [
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
];
