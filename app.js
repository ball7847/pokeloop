const randomIV = () => Math.floor(Math.random() * 32);

const SPECIES = {
  rattata: {
    id: "rattata", name: "꼬렛", mark: "꼬", types: ["노말"],
    bs: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 },
    affinity: { quick: "매우 쉬움", tail: "쉬움", meteor: "극악" }
  },
  pidgey: {
    id: "pidgey", name: "구구", mark: "구", types: ["노말", "비행"],
    bs: { hp: 40, atk: 45, def: 40, spa: 35, spd: 35, spe: 56 },
    affinity: { quick: "매우 쉬움", tail: "어려움", meteor: "극악" }
  },
  mankey: {
    id: "mankey", name: "망키", mark: "망", types: ["격투"],
    bs: { hp: 40, atk: 80, def: 35, spa: 35, spd: 45, spe: 70 },
    affinity: { quick: "쉬움", tail: "보통", meteor: "극악" }
  },
  abra: {
    id: "abra", name: "캐이시", mark: "캐", types: ["에스퍼"],
    bs: { hp: 25, atk: 20, def: 15, spa: 105, spd: 55, spe: 90 },
    affinity: { quick: "어려움", tail: "극악", meteor: "어려움" }
  },
  chimchar: {
    id: "chimchar", name: "파이숭이", mark: "파", types: ["불꽃"],
    bs: { hp: 44, atk: 58, def: 44, spa: 58, spd: 44, spe: 61 },
    affinity: { quick: "쉬움", tail: "보통", meteor: "극악" }
  }
};

const speciesIds = Object.keys(SPECIES);
let currentSpeciesId = "rattata";
const currentSpecies = () => SPECIES[currentSpeciesId];

const stats = {
  hp:  { label: "HP",     bs: currentSpecies().bs.hp,  iv: randomIV(), ev: 0, color: "#6ea675" },
  atk: { label: "공격",   bs: currentSpecies().bs.atk, iv: randomIV(), ev: 0, color: "#d07b55" },
  def: { label: "방어",   bs: currentSpecies().bs.def, iv: randomIV(), ev: 0, color: "#c5a34f" },
  spa: { label: "특공",   bs: currentSpecies().bs.spa, iv: randomIV(), ev: 0, color: "#8a73b5" },
  spd: { label: "특방",   bs: currentSpecies().bs.spd, iv: randomIV(), ev: 0, color: "#58999a" },
  spe: { label: "스피드", bs: currentSpecies().bs.spe, iv: randomIV(), ev: 0, color: "#5b8fbd" }
};

function applySpecies(id) {
  currentSpeciesId = SPECIES[id] ? id : "rattata";
  const species = currentSpecies();
  Object.keys(species.bs).forEach((key) => {
    stats[key].bs = species.bs[key];
  });
}

function rollNextSpecies() {
  const candidates = speciesIds.filter((id) => id !== currentSpeciesId);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const statKeys = Object.keys(stats);

let life = 1;
let ageMonths = 0;
let money = 0;
let tab = "training";
let action = { kind: "idle" };
let battle = null;

let moves = [
  { id: "quick",  name: "전광석화",   stars: 0, progress: 0, affinity: "매우 쉬움", power: 40,  accuracy: 100, priority: 1, type: "노말",   soul: 0, stat: "atk", category: "물리" },
  { id: "tail",   name: "아이언테일", stars: 0, progress: 0, affinity: "쉬움",      power: 100, accuracy: 75,  priority: 0, type: "강철",   soul: 0, stat: "atk", category: "물리" },
  { id: "meteor", name: "용성군",     stars: 0, progress: 0, affinity: "극악",      power: 130, accuracy: 90,  priority: 0, type: "드래곤", soul: 0, stat: "spa", category: "특수" }
];

const areas = [
  {
    id: "luoyang",
    name: "낙양 외곽",
    danger: "낮음",
    desc: "초심자가 야생 포켓몬과 실전을 익히는 평야 지대",
    reward: 24,
    enemies: [
      { name: "야생 꼬렛", types: ["노말"], hp: 180, atk: 56, def: 35, spa: 25, spd: 35, spe: 72,
        moves: [{ name: "몸통박치기", type: "노말", category: "물리", power: 40, accuracy: 100, priority: 0 }] },
      { name: "야생 구구", types: ["노말","비행"], hp: 165, atk: 45, def: 40, spa: 35, spd: 35, spe: 56,
        moves: [{ name: "바람일으키기", type: "비행", category: "특수", power: 40, accuracy: 100, priority: 0 }] }
    ]
  },
  {
    id: "songshan",
    name: "숭산 산길",
    danger: "보통",
    desc: "격투계 야생 포켓몬이 자주 나타나는 소림 인근 산길",
    reward: 58,
    enemies: [
      { name: "망키", types: ["격투"], hp: 290, atk: 80, def: 35, spa: 35, spd: 45, spe: 70,
        moves: [{ name: "태권당수", type: "격투", category: "물리", power: 50, accuracy: 100, priority: 0 }] },
      { name: "알통몬", types: ["격투"], hp: 330, atk: 80, def: 50, spa: 35, spd: 35, spe: 35,
        moves: [{ name: "안다리걸기", type: "격투", category: "물리", power: 50, accuracy: 100, priority: 0 }] }
    ]
  },
  {
    id: "wudang",
    name: "무당산",
    danger: "높음",
    desc: "에스퍼와 격투의 기운이 뒤섞인 고지대",
    reward: 110,
    enemies: [
      { name: "비구술", types: ["에스퍼"], hp: 400, atk: 35, def: 30, spa: 105, spd: 65, spe: 120,
        moves: [{ name: "염동력", type: "에스퍼", category: "특수", power: 50, accuracy: 100, priority: 0 }] },
      { name: "요가랑", types: ["격투","에스퍼"], hp: 440, atk: 40, def: 55, spa: 40, spd: 55, spe: 60,
        moves: [{ name: "발경", type: "격투", category: "물리", power: 60, accuracy: 100, priority: 0 }] },
      { name: "비구술", types: ["에스퍼"], hp: 400, atk: 35, def: 30, spa: 105, spd: 65, spe: 120,
        moves: [{ name: "사이코빔", type: "에스퍼", category: "특수", power: 65, accuracy: 100, priority: 0 }] }
    ]
  },
  {
    id: "huashan",
    name: "화산",
    danger: "매우 높음",
    desc: "불꽃과 비행 포켓몬이 몰려드는 험준한 고산 지대",
    reward: 220,
    enemies: [
      { name: "파이숭이", types: ["불꽃"], hp: 600, atk: 58, def: 44, spa: 58, spd: 44, spe: 61,
        moves: [{ name: "불꽃세례", type: "불꽃", category: "특수", power: 40, accuracy: 100, priority: 0 }] },
      { name: "불화살빈", types: ["불꽃","비행"], hp: 560, atk: 73, def: 55, spa: 56, spd: 52, spe: 84,
        moves: [{ name: "날개치기", type: "비행", category: "물리", power: 60, accuracy: 100, priority: 0 }] },
      { name: "파이숭이", types: ["불꽃"], hp: 600, atk: 58, def: 44, spa: 58, spd: 44, spe: 61,
        moves: [{ name: "불꽃세례", type: "불꽃", category: "특수", power: 40, accuracy: 100, priority: 0 }] },
      { name: "불화살빈", types: ["불꽃","비행"], hp: 560, atk: 73, def: 55, spa: 56, spd: 52, spe: 84,
        moves: [{ name: "전광석화", type: "노말", category: "물리", power: 40, accuracy: 100, priority: 1 }] }
    ]
  }
];

let logs = ["0세 0개월 · 제1생이 시작되었습니다."];

const SAVE_KEY = "pokeloop-save-v1";
let lastSaveAt = 0;

function saveGame() {
  try {
    const payload = {
      version: 1,
      savedAt: Date.now(),
      life,
      ageMonths,
      money,
      currentSpeciesId,
      tab,
      action,
      battle,
      stats: Object.fromEntries(
        statKeys.map((key) => [key, { iv: stats[key].iv, ev: stats[key].ev }])
      ),
      moves,
      logs
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    lastSaveAt = payload.savedAt;
  } catch (error) {
    console.warn("PokeLoop save failed", error);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const payload = JSON.parse(raw);
    if (!payload || payload.version !== 1) return false;

    if (Number.isFinite(payload.life) && payload.life >= 1) life = payload.life;
    if (Number.isFinite(payload.ageMonths) && payload.ageMonths >= 0) ageMonths = payload.ageMonths;
    if (Number.isFinite(payload.money) && payload.money >= 0) money = payload.money;
    if (typeof payload.currentSpeciesId === "string" && SPECIES[payload.currentSpeciesId]) {
      applySpecies(payload.currentSpeciesId);
    } else {
      applySpecies("rattata");
    }

    if (payload.stats && typeof payload.stats === "object") {
      statKeys.forEach((key) => {
        const saved = payload.stats[key];
        if (!saved) return;
        if (Number.isFinite(saved.iv)) stats[key].iv = Math.max(0, Math.min(31, saved.iv));
        if (Number.isFinite(saved.ev)) stats[key].ev = Math.max(0, saved.ev);
      });
    }

    if (Array.isArray(payload.moves) && payload.moves.length === moves.length) {
      moves = payload.moves.map((savedMove, index) => ({
        ...moves[index],
        stars: Number.isFinite(savedMove.stars) ? savedMove.stars : moves[index].stars,
        progress: Number.isFinite(savedMove.progress) ? savedMove.progress : moves[index].progress,
        soul: Number.isFinite(savedMove.soul) ? savedMove.soul : moves[index].soul
      }));
    }

    if (payload.action && typeof payload.action.kind === "string") {
      action = payload.action;
    }

    if (payload.battle && typeof payload.battle === "object") {
      const compatibleEnemies =
        Array.isArray(payload.battle.enemies) &&
        payload.battle.enemies.every((enemy) =>
          Array.isArray(enemy.types) &&
          Array.isArray(enemy.moves) &&
          Number.isFinite(enemy.spe) &&
          Number.isFinite(enemy.spd)
        );

      if (compatibleEnemies) {
        battle = payload.battle;
        if (!Array.isArray(battle.battleLog)) battle.battleLog = ["전투를 이어서 시작합니다."];
      } else {
        battle = null;
        action = { kind: "idle" };
        if (tab === "combat") tab = "explore";
        logs.unshift("이전 버전의 전투는 종료되었습니다. 새 전투 규칙으로 다시 탐험하세요.");
      }
    }

    if (typeof payload.tab === "string") {
      tab = payload.tab;
    }

    if (Array.isArray(payload.logs)) {
      logs = payload.logs.slice(0, 40);
    }

    lastSaveAt = Number.isFinite(payload.savedAt) ? payload.savedAt : Date.now();
    addLog("자동저장 데이터를 불러왔습니다.");
    return true;
  } catch (error) {
    console.warn("PokeLoop load failed", error);
    return false;
  }
}

const TICKS_PER_SECOND = 20;
const TICK_MS = 1000 / TICKS_PER_SECOND;
const DT = 1 / TICKS_PER_SECOND;
let ageTickProgress = 0;
let combatTickProgress = 0;
let renderAccumulator = 0;
const RENDER_FPS = 10;
const RENDER_INTERVAL = 1 / RENDER_FPS;
let pointerActive = false;

document.addEventListener("pointerdown", () => {
  pointerActive = true;
}, true);

document.addEventListener("pointerup", () => {
  window.setTimeout(() => {
    pointerActive = false;
  }, 120);
}, true);

document.addEventListener("pointercancel", () => {
  pointerActive = false;
}, true);

const formatNumber = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return Math.floor(n).toLocaleString("ko-KR");
};

const years = () => Math.floor(ageMonths / 12);
const months = () => ageMonths % 12;
const trainingSpeed = (key) => 1 + stats[key].iv / 100;
const trainingInterval = (key) => 10 / trainingSpeed(key);
const totalEV = () => statKeys.reduce((sum, key) => sum + stats[key].ev, 0);
const finalStat = (key) => stats[key].bs + stats[key].iv + stats[key].ev;
const moveAffinity = (move) => currentSpecies().affinity[move.id] || move.affinity;
const affinityMultiplier = (affinity) => ({
  "매우 쉬움": 1.00,
  "쉬움": 0.75,
  "보통": 0.50,
  "어려움": 0.32,
  "극악": 0.18
}[affinity] || 0.50);
const moveTrainingSpeed = (move) =>
  (1 + stats[move.stat].iv / 100) *
  (1 + move.soul / 100) *
  affinityMultiplier(moveAffinity(move));
const movePowerMultiplier = (move) => 1 + move.stars * 0.12;
const moveCombatPower = (move) => Math.floor(move.power * movePowerMultiplier(move));
const learnedMoves = () => moves.filter((move) => move.stars > 0);
const TYPE_CHART = {
  "노말":   { "바위": 0.5, "강철": 0.5, "고스트": 0 },
  "격투":   { "노말": 2, "바위": 2, "강철": 2, "악": 2, "얼음": 2, "비행": 0.5, "에스퍼": 0.5, "페어리": 0.5, "고스트": 0 },
  "비행":   { "격투": 2, "벌레": 2, "풀": 2, "바위": 0.5, "강철": 0.5, "전기": 0.5 },
  "에스퍼": { "격투": 2, "독": 2, "에스퍼": 0.5, "강철": 0.5, "악": 0 },
  "불꽃":   { "풀": 2, "얼음": 2, "벌레": 2, "강철": 2, "불꽃": 0.5, "물": 0.5, "바위": 0.5, "드래곤": 0.5 },
  "강철":   { "바위": 2, "얼음": 2, "페어리": 2, "불꽃": 0.5, "물": 0.5, "전기": 0.5, "강철": 0.5 },
  "드래곤": { "드래곤": 2, "강철": 0.5, "페어리": 0 }
};

function typeEffectiveness(moveType, targetTypes) {
  return targetTypes.reduce((mult, type) => {
    const chart = TYPE_CHART[moveType];
    return mult * (chart && chart[type] !== undefined ? chart[type] : 1);
  }, 1);
}

function combatDamage({ attackerStat, defenderStat, power, stab, effectiveness }) {
  const ratio = Math.max(0.15, attackerStat / Math.max(1, defenderStat));
  const base = Math.max(1, (power * ratio) / 2.5);
  const random = 0.85 + Math.random() * 0.15;
  return Math.max(1, Math.floor(base * stab * effectiveness * random));
}

function effectivenessText(mult) {
  if (mult === 0) return "효과가 없다";
  if (mult >= 2) return "효과가 굉장했다";
  if (mult < 1) return "효과가 별로였다";
  return "";
}

function pickBattleMove() {
  const learned = learnedMoves();
  if (learned.length === 0) {
    return {
      id: "tackle",
      name: "몸통박치기",
      stars: 0,
      power: 40,
      stat: "atk",
      category: "물리",
      accuracy: 100,
      priority: 0,
      type: "노말",
      system: true
    };
  }
  return learned[(battle.turn - 1) % learned.length];
}

function addLog(message) {
  logs.unshift(years() + "세 " + months() + "개월 · " + message);
  logs = logs.slice(0, 40);
}

function setTab(nextTab) {
  if (action.kind === "combat") return;
  tab = nextTab;
  saveGame();
  render();
}

function train(key) {
  if (action.kind === "combat") return;
  action = { kind: "training", stat: key, progress: 0 };
  addLog(stats[key].label + " 수련을 시작했습니다.");
  saveGame();
  render();
}

function trainMove(id) {
  if (action.kind === "combat") return;
  const move = moves.find((item) => item.id === id);
  action = { kind: "move", id };
  addLog(move.name + " 수련을 시작했습니다.");
  saveGame();
  render();
}

function explore(id) {
  if (action.kind === "combat") return;
  const area = areas.find((item) => item.id === id);
  action = { kind: "explore", id, progress: 0 };
  addLog(area.name + " 탐색을 시작했습니다.");
  saveGame();
  render();
}

function stopAction() {
  if (action.kind === "combat") return;
  action = { kind: "idle" };
  saveGame();
  render();
}

function startBattle(area) {
  const playerMaxHP = Math.max(60, Math.floor(finalStat("hp") * 4));
  battle = {
    areaId: area.id,
    areaName: area.name,
    reward: area.reward,
    playerHP: playerMaxHP,
    playerMaxHP,
    enemies: area.enemies.map((enemy, index) => ({
      ...enemy,
      id: area.id + "-" + index,
      currentHP: enemy.hp
    })),
    turn: 0,
    result: null,
    lastAction: "전투 준비",
    totalDamage: 0,
    battleLog: ["야생 포켓몬 무리가 나타났다!"]
  };
  action = { kind: "combat" };
  tab = "combat";
  addLog(area.name + "에서 적 무리와 조우했습니다.");
  saveGame();
}

function pushBattleLog(message) {
  if (!battle) return;
  battle.battleLog.unshift(message);
  battle.battleLog = battle.battleLog.slice(0, 24);
}

function combatTick() {
  if (!battle || battle.result) return;

  const target = battle.enemies.find((enemy) => enemy.currentHP > 0);
  if (!target) {
    finishBattle(true);
    return;
  }

  battle.turn += 1;
  const playerMove = pickBattleMove();
  const enemyMoveUsers = battle.enemies
    .filter((enemy) => enemy.currentHP > 0)
    .map((enemy) => ({
      enemy,
      move: enemy.moves[Math.floor(Math.random() * enemy.moves.length)]
    }));

  const actions = [
    {
      side: "player",
      priority: playerMove.priority || 0,
      speed: finalStat("spe"),
      move: playerMove
    },
    ...enemyMoveUsers.map(({ enemy, move }) => ({
      side: "enemy",
      enemy,
      priority: move.priority || 0,
      speed: enemy.spe,
      move
    }))
  ].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (b.speed !== a.speed) return b.speed - a.speed;
    return Math.random() < 0.5 ? -1 : 1;
  });

  pushBattleLog("— " + battle.turn + "턴 —");

  for (const act of actions) {
    if (battle.result || battle.playerHP <= 0) break;

    if (act.side === "player") {
      const currentTarget = battle.enemies.find((enemy) => enemy.currentHP > 0);
      if (!currentTarget) break;

      if (Math.random() * 100 > act.move.accuracy) {
        battle.lastAction = act.move.name + " → 빗나감";
        pushBattleLog(currentSpecies().name + "의 " + act.move.name + "! 그러나 빗나갔다.");
        continue;
      }

      const attackStat = act.move.category === "특수" ? finalStat("spa") : finalStat("atk");
      const defenseStat = act.move.category === "특수" ? currentTarget.spd : currentTarget.def;
      const power = act.move.system ? act.move.power : moveCombatPower(act.move);
      const stab = currentSpecies().types.includes(act.move.type) ? 1.5 : 1;
      const effectiveness = typeEffectiveness(act.move.type, currentTarget.types);
      const damage = effectiveness === 0 ? 0 : combatDamage({
        attackerStat: attackStat,
        defenderStat: defenseStat,
        power,
        stab,
        effectiveness
      });

      currentTarget.currentHP = Math.max(0, currentTarget.currentHP - damage);
      battle.totalDamage += damage;
      battle.lastAction =
        act.move.name + (act.move.system ? "" : " " + act.move.stars + "성") +
        " → " + currentTarget.name + " · " + formatNumber(damage) + " 피해";

      pushBattleLog(currentSpecies().name + "의 " + act.move.name + "! " + currentTarget.name + "에게 " + formatNumber(damage) + " 피해.");
      const effText = effectivenessText(effectiveness);
      if (effText) pushBattleLog(effText + "!");

      if (currentTarget.currentHP <= 0) {
        pushBattleLog(currentTarget.name + "은(는) 쓰러졌다.");
        addLog(act.move.name + "으로 " + currentTarget.name + "을(를) 쓰러뜨렸습니다.");
      }
    } else {
      if (act.enemy.currentHP <= 0) continue;

      if (Math.random() * 100 > act.move.accuracy) {
        pushBattleLog(act.enemy.name + "의 " + act.move.name + "! 그러나 빗나갔다.");
        continue;
      }

      const attackStat = act.move.category === "특수" ? act.enemy.spa : act.enemy.atk;
      const defenseStat = act.move.category === "특수" ? finalStat("spd") : finalStat("def");
      const stab = act.enemy.types.includes(act.move.type) ? 1.5 : 1;
      const effectiveness = typeEffectiveness(act.move.type, currentSpecies().types);
      const damage = effectiveness === 0 ? 0 : combatDamage({
        attackerStat: attackStat,
        defenderStat: defenseStat,
        power: act.move.power,
        stab,
        effectiveness
      });

      battle.playerHP = Math.max(0, battle.playerHP - damage);
      pushBattleLog(act.enemy.name + "의 " + act.move.name + "! " + currentSpecies().name + "에게 " + formatNumber(damage) + " 피해.");
      const effText = effectivenessText(effectiveness);
      if (effText) pushBattleLog(effText + "!");

      if (battle.playerHP <= 0) {
        pushBattleLog(currentSpecies().name + "은(는) 쓰러졌다.");
        finishBattle(false);
        break;
      }
    }

    if (battle.enemies.every((enemy) => enemy.currentHP <= 0)) {
      finishBattle(true);
      break;
    }
  }
}
function finishBattle(victory) {
  if (!battle) return;

  battle.result = victory ? "victory" : "defeat";
  action = { kind: "idle" };

  if (victory) {
    money += battle.reward;
    addLog(battle.areaName + " 전투 승리 · 은전 +" + battle.reward);
  } else {
    addLog(battle.areaName + "에서 패배했습니다. 보상 없이 귀환합니다.");
  }

  saveGame();
  render();
}

function leaveBattle() {
  battle = null;
  tab = "explore";
  action = { kind: "idle" };
  saveGame();
  render();
}

function rebirth() {
  life += 1;
  ageMonths = 0;
  money = 0;

  applySpecies(rollNextSpecies());

  statKeys.forEach((key) => {
    stats[key].iv = randomIV();
    stats[key].ev = 0;
  });

  moves = moves.map((move) => ({
    ...move,
    stars: 0,
    progress: 0,
    soul: Math.min(75, move.soul + move.stars * 0.7)
  }));

  battle = null;
  action = { kind: "idle" };
  tab = "training";
  logs = ["0세 0개월 · 제" + life + "생이 시작되었습니다. " + currentSpecies().name + "의 몸으로 태어났습니다. 전생의 기술 경험이 영혼에 남아 있습니다."];
  saveGame();
  render();
}

function currentActionTitle() {
  if (action.kind === "training") return stats[action.stat].label + " 수련";
  if (action.kind === "move") return moves.find((item) => item.id === action.id).name;
  if (action.kind === "explore") return areas.find((item) => item.id === action.id).name + " 탐색";
  if (action.kind === "combat") return "전투 중";
  return "휴식";
}

function trainingView() {
  return `
    <div class="heading">
      <div><p class="eyebrow">육체 수련</p><h2>노력치 수련</h2></div>
      <p class="muted">EV에는 상한이 없습니다. 일정 시간이 지나면 EV +1을 획득하고 같은 수련을 자동 반복합니다.</p>
    </div>
    <div class="table">
      <div class="tr th"><span>능력</span><span>EV</span><span>IV</span><span>획득 주기</span><span></span></div>
      ${statKeys.map((key) => `
        <div class="tr ${action.kind === "training" && action.stat === key ? "selected" : ""}">
          <strong>${stats[key].label}</strong>
          <span>${formatNumber(stats[key].ev)}</span>
          <span>${stats[key].iv}</span>
          <span>${trainingInterval(key).toFixed(2)}초마다 +1</span>
          <button class="action" onclick="train('${key}')">수련</button>
        </div>
      `).join("")}
    </div>
  `;
}

function movesView() {
  return `
    <div class="heading">
      <div><p class="eyebrow">무공 수련</p><h2>기술</h2></div>
      <p class="muted">10성은 완성, 12성은 대성. 전생 숙련은 다음 생의 수련을 가속합니다.</p>
    </div>
    <div class="cards">
      ${moves.map((move) => `
        <article class="card">
          <div class="cardtop">
            <div><h3>${move.name}</h3><span class="muted">${moveAffinity(move)}</span></div>
            <strong>${move.stars ? move.stars + "성" : "미습득"}</strong>
          </div>
          <div class="progress move"><i style="width:${move.progress}%"></i></div>
          <dl>
            <div><dt>타입</dt><dd>${move.type}</dd></div>
            <div><dt>분류</dt><dd>${move.category}</dd></div>
            <div><dt>기본 위력</dt><dd>${move.power}</dd></div>
            <div><dt>명중</dt><dd>${move.accuracy}</dd></div>
            <div><dt>우선도</dt><dd>${move.priority > 0 ? "+" + move.priority : move.priority}</dd></div>
            <div><dt>현재 실전 위력</dt><dd>${move.stars ? moveCombatPower(move) : "-"}</dd></div>
            <div><dt>연동 IV</dt><dd>${stats[move.stat].label} IV ${stats[move.stat].iv}</dd></div>
            <div><dt>적합도 배율</dt><dd>×${affinityMultiplier(moveAffinity(move)).toFixed(2)}</dd></div>
            <div><dt>수련 속도</dt><dd>×${moveTrainingSpeed(move).toFixed(2)}</dd></div>
            <div><dt>전생 숙련</dt><dd>+${move.soul.toFixed(1)}%</dd></div>
          </dl>
          <button class="action" onclick="trainMove('${move.id}')">${move.stars ? "수련" : "습득 수련"}</button>
        </article>
      `).join("")}
    </div>
  `;
}

function exploreView() {
  return `
    <div class="heading">
      <div><p class="eyebrow">중원</p><h2>탐험</h2></div>
      <p class="muted">탐색 완료 시 적 무리와 조우합니다. 강해질수록 같은 지역의 전투가 빨라집니다.</p>
    </div>
    <div class="areas">
      ${areas.map((area) => `
        <article class="area">
          <div>
            <span class="danger-tag">${area.danger}</span>
            <h3>${area.name}</h3>
            <p>${area.desc}</p>
            <small>적 최대 ${area.enemies.length}마리 · 승리 보상 은전 ${area.reward}</small>
          </div>
          <button class="action" onclick="explore('${area.id}')">탐색 시작</button>
        </article>
      `).join("")}
    </div>
  `;
}

function battleView() {
  if (!battle) return exploreView();

  const hpRate = Math.max(0, battle.playerHP / battle.playerMaxHP * 100);

  return `
    <div class="heading battle-heading">
      <div>
        <p class="eyebrow">실전</p>
        <h2>${battle.areaName}</h2>
      </div>
      <p class="muted">${battle.result ? "전투 종료" : "자동전투 진행 중 · 1초마다 1턴"}</p>
    </div>

    <div class="battlefield">
      <section class="fighter player-fighter">
        <div class="fighter-head">
          <div class="battle-avatar player-avatar">${currentSpecies().mark}</div>
          <div>
            <span class="side-label">PLAYER</span>
            <h3>${currentSpecies().name}</h3>
          </div>
        </div>
        <div class="hp-label"><span>HP</span><strong>${Math.ceil(battle.playerHP)} / ${battle.playerMaxHP}</strong></div>
        <div class="hpbar"><i style="width:${hpRate}%"></i></div>
        <div class="battle-stats">
          <span>공격 ${formatNumber(finalStat("atk"))}</span>
          <span>특공 ${formatNumber(finalStat("spa"))}</span>
          <span>방어 ${formatNumber(finalStat("def"))}</span>
        </div>
        <div class="used-moves">
          <span>사용 가능 기술</span>
          <strong>${learnedMoves().length ? learnedMoves().map((move) => move.name + " " + move.stars + "성").join(" · ") : "몸통박치기(기본기)"}</strong>
        </div>
      </section>

      <div class="versus">VS</div>

      <section class="enemy-party">
        ${battle.enemies.map((enemy) => {
          const enemyRate = Math.max(0, enemy.currentHP / enemy.hp * 100);
          return `
            <article class="enemy ${enemy.currentHP <= 0 ? "down" : ""}">
              <div class="enemy-top">
                <strong>${enemy.name} <small class="type-line">${enemy.types.join(" / ")}</small></strong>
                <span>${enemy.currentHP <= 0 ? "격파" : Math.ceil(enemy.currentHP) + " / " + enemy.hp}</span>
              </div>
              <div class="hpbar enemy-hp"><i style="width:${enemyRate}%"></i></div>
            </article>
          `;
        }).join("")}
      </section>
    </div>

    <section class="combat-log-panel">
      <div class="combat-log-title">
        <strong>전투 로그</strong>
        <span>우선도 → 스피드 → 명중 → 피해 판정</span>
      </div>
      <div class="combat-log-list">
        ${battle.battleLog.map((line) => '<p>' + line + '</p>').join("")}
      </div>
    </section>

    <div class="battle-footer">
      <div>
        <span class="muted">전투 턴</span>
        <strong>${battle.turn}</strong>
      </div>
      <div>
        <span class="muted">승리 보상</span>
        <strong>은전 ${battle.reward}</strong>
      </div>
      <div>
        <span class="muted">누적 피해</span>
        <strong>${formatNumber(battle.totalDamage)}</strong>
      </div>
      <div class="last-action">
        <span class="muted">최근 행동</span>
        <strong>${battle.lastAction}</strong>
      </div>
      ${battle.result ? `
        <div class="battle-result ${battle.result}">
          <strong>${battle.result === "victory" ? "승리" : "패배"}</strong>
          <button class="action" onclick="leaveBattle()">탐험으로 돌아가기</button>
        </div>
      ` : ""}
    </div>
  `;
}

function rebirthView() {
  return `
    <div class="rebirth">
      <p class="eyebrow">윤회</p>
      <h2>제${life}생의 기록</h2>
      <p class="muted">현재 육신의 성장은 사라지지만, 기술을 익힌 경험은 영혼에 남습니다.</p>

      <div class="rebirthgrid">
        <div><span>현재 종족</span><strong>${currentSpecies().name}</strong></div>
        <div><span>현재 나이</span><strong>${years()}세 ${months()}개월</strong></div>
        <div><span>총 EV</span><strong>${formatNumber(totalEV())}</strong></div>
        <div><span>최고 기술</span><strong>${Math.max(...moves.map((move) => move.stars))}성</strong></div>
      </div>

      <div class="inherit">
        ${moves.map((move) => `
          <div>
            <span>${move.name}</span>
            <span>${move.stars}성</span>
            <strong>다음 생 +${Math.min(75, move.soul + move.stars * 0.7).toFixed(1)}%</strong>
          </div>
        `).join("")}
      </div>

      <button class="danger" onclick="rebirth()">현재 생을 끝내고 환생</button>
    </div>
  `;
}

function centerView() {
  if (tab === "combat") return battleView();
  if (tab === "training") return trainingView();
  if (tab === "moves") return movesView();
  if (tab === "explore") return exploreView();
  return rebirthView();
}

function actionPanel() {
  if (action.kind === "training") {
    return `
      <div class="progress"><i style="width:${action.progress}%"></i></div>
      <div class="metric"><span>다음 EV +1</span><strong>${action.progress.toFixed(0)}%</strong></div>
      <div class="breakdown">
        <div><span>기본 주기</span><strong>10.00초</strong></div>
        <div><span>IV ${stats[action.stat].iv}</span><strong>×${trainingSpeed(action.stat).toFixed(2)}</strong></div>
        <div><span>현재 획득 주기</span><strong>${trainingInterval(action.stat).toFixed(2)}초</strong></div>
        <div><span>반복</span><strong>무한 반복</strong></div>
      </div>
      <button class="ghost full" onclick="stopAction()">중단</button>
    `;
  }

  if (action.kind === "move") {
    const move = moves.find((item) => item.id === action.id);
    return `
      <div class="progress move"><i style="width:${move.progress}%"></i></div>
      <div class="metric"><span>현재 숙련</span><strong>${move.stars}성 · ${move.progress.toFixed(0)}%</strong></div>
      <div class="breakdown">
        <div><span>${stats[move.stat].label} IV</span><strong>×${(1 + stats[move.stat].iv / 100).toFixed(2)}</strong></div>
        <div><span>적합도</span><strong>×${affinityMultiplier(moveAffinity(move)).toFixed(2)}</strong></div>
        <div><span>전생 숙련</span><strong>×${(1 + move.soul / 100).toFixed(2)}</strong></div>
        <div><span>최종 수련 속도</span><strong>×${moveTrainingSpeed(move).toFixed(2)}</strong></div>
        <div><span>현재 실전 위력</span><strong>${move.stars ? moveCombatPower(move) : "미습득"}</strong></div>
      </div>
      <button class="ghost full" onclick="stopAction()">중단</button>
    `;
  }

  if (action.kind === "explore") {
    return `
      <div class="progress explore"><i style="width:${action.progress}%"></i></div>
      <div class="metric"><span>탐색 진행</span><strong>${action.progress}%</strong></div>
      <p class="muted">탐색이 끝나면 지역의 적과 자동전투가 시작됩니다.</p>
      <button class="ghost full" onclick="stopAction()">중단</button>
    `;
  }

  if (action.kind === "combat" && battle) {
    const alive = battle.enemies.filter((enemy) => enemy.currentHP > 0).length;
    return `
      <div class="metric"><span>남은 적</span><strong>${alive} / ${battle.enemies.length}</strong></div>
      <div class="metric"><span>전투 턴</span><strong>${battle.turn}</strong></div>
      <p class="muted">전투 중에는 다른 행동으로 전환할 수 없습니다.</p>
    `;
  }

  return '<p class="muted">수련, 기술, 탐험 중 하나를 선택하세요.</p>';
}

function render() {
  const highestMastery = Math.max(...moves.map((move) => move.stars));

  document.getElementById("app").innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand"><strong>PokeLoop</strong><span class="badge">PROTOTYPE</span></div>
        <div class="topstats">
          <span>제${life}생</span>
          <span>${years()}세 ${months()}개월</span>
          <span>은전 ${formatNumber(money)}</span>
          <span>${battle && tab === "combat" ? battle.areaName : "낙양"}</span>
        </div>
        <span class="save-status">자동저장</span>
      </header>

      <main class="workspace">
        <aside class="side panel">
          <div class="portrait">
            <div class="orb">${currentSpecies().mark}</div>
            <div>
              <p class="eyebrow">현재 육신</p>
              <h1>${currentSpecies().name}</h1>
              <p class="muted">제${life}생 · ${currentSpecies().types.join(" / ")}</p>
            </div>
          </div>

          <div class="agecard">
            <span>나이</span>
            <strong>${years()}세 ${months()}개월</strong>
            <small>수련·기술 수련·탐험 중에만 시간이 흐릅니다. 전투 중에는 나이가 멈춥니다.</small>
          </div>

          ${statKeys.map((key) => `
            <div class="statrow" style="--c:${stats[key].color}" title="BS ${stats[key].bs} + IV ${stats[key].iv} + EV ${Math.floor(stats[key].ev)}">
              <span>${stats[key].label}</span>
              <strong>${formatNumber(finalStat(key))}</strong>
            </div>
          `).join("")}

          <div class="summary">
            <div><span>총 EV</span><strong>${formatNumber(totalEV())}</strong></div>
            <div><span>대성 기술</span><strong>${moves.filter((move) => move.stars >= 12).length}</strong></div>
            <div><span>최고 숙련</span><strong>${highestMastery}성</strong></div>
          </div>
        </aside>

        <section class="main panel">
          <nav class="tabs">
            ${[
              ["training", "수련"],
              ["moves", "기술"],
              ["explore", "탐험"],
              ["rebirth", "환생"]
            ].map(([key, label]) => `
              <button
                class="${tab === key ? "active" : ""}"
                ${action.kind === "combat" ? "disabled" : ""}
                onclick="setTab('${key}')"
              >${label}</button>
            `).join("")}
            ${tab === "combat" ? '<button class="active combat-tab" disabled>전투</button>' : ""}
          </nav>

          <div class="content">${centerView()}</div>
        </section>

        <aside class="side panel">
          <p class="eyebrow">현재 행동</p>
          <h2 class="actiontitle">${currentActionTitle()}</h2>
          <div class="symbol ${action.kind === "combat" ? "combat-symbol" : ""}">${action.kind === "combat" ? "戰" : action.kind === "idle" ? "靜" : "修"}</div>
          ${actionPanel()}
        </aside>
      </main>

      <section class="log panel">
        <div class="loghead">
          <strong>생애 기록 · 로그</strong>
          <span class="muted">20 tick/s · 1초 = 게임 내 1개월</span>
        </div>
        <div class="logs">${logs.map((line) => '<p>' + line + '</p>').join("")}</div>
      </section>
    </div>
  `;
}

loadGame();
render();

window.addEventListener("beforeunload", saveGame);

setInterval(() => {
  if (action.kind === "training" || action.kind === "move" || action.kind === "explore") {
    ageTickProgress += DT;
    while (ageTickProgress >= 1) {
      ageTickProgress -= 1;
      ageMonths += 1;
    }
  } else {
    ageTickProgress = 0;
  }

  if (action.kind === "training") {
    const key = action.stat;
    action.progress += (100 / trainingInterval(key)) * DT;

    while (action.progress >= 100) {
      action.progress -= 100;
      stats[key].ev += 1;
    }
  } else if (action.kind === "move") {
    const move = moves.find((item) => item.id === action.id);
    if (move.stars >= 12) {
      move.progress = 100;
      action = { kind: "idle" };
    } else {
      move.progress += 4 * moveTrainingSpeed(move) * DT;

      while (move.progress >= 100 && move.stars < 12) {
        move.progress -= 100;
        move.stars += 1;
        addLog(move.name + " 숙련이 " + move.stars + "성에 도달했습니다.");

        if (move.stars >= 12) {
          move.stars = 12;
          move.progress = 100;
          action = { kind: "idle" };
          addLog(move.name + "이(가) 12성 대성에 도달했습니다.");
        }
      }
    }
  } else if (action.kind === "explore") {
    action.progress += 10 * DT;

    if (action.progress >= 100) {
      const area = areas.find((item) => item.id === action.id);
      startBattle(area);
    }
  } else if (action.kind === "combat") {
    combatTickProgress += DT;
    while (combatTickProgress >= 1 && action.kind === "combat") {
      combatTickProgress -= 1;
      combatTick();
    }
  } else {
    combatTickProgress = 0;
  }

  if (Date.now() - lastSaveAt >= 1000) {
    saveGame();
  }

  renderAccumulator += DT;
  if (renderAccumulator >= RENDER_INTERVAL) {
    renderAccumulator = 0;
    if (!pointerActive) render();
  }
}, TICK_MS);