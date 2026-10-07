const randomIV = () => Math.floor(Math.random() * 32);

const SPECIES = {
  rattata: {
    id: "rattata", name: "꼬렛", mark: "꼬", types: ["노말"],
    bs: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 },
    affinity: { quick: "매우 쉬움", bite: "쉬움", tail: "쉬움", thunderbolt: "보통", meteor: "극악" }
  },
  pidgey: {
    id: "pidgey", name: "구구", mark: "구", types: ["노말", "비행"],
    bs: { hp: 40, atk: 45, def: 40, spa: 35, spd: 35, spe: 56 },
    affinity: { quick: "매우 쉬움", aerial: "쉬움", bite: "보통", tail: "어려움", meteor: "극악" }
  },
  mankey: {
    id: "mankey", name: "망키", mark: "망", types: ["격투"],
    bs: { hp: 40, atk: 80, def: 35, spa: 35, spd: 45, spe: 70 },
    affinity: { rocksmash: "매우 쉬움", quick: "쉬움", tail: "보통", aura: "어려움", meteor: "극악" }
  },
  abra: {
    id: "abra", name: "캐이시", mark: "캐", types: ["에스퍼"],
    bs: { hp: 25, atk: 20, def: 15, spa: 105, spd: 55, spe: 90 },
    affinity: { confusion: "매우 쉬움", shadowball: "쉬움", aura: "보통", quick: "어려움", tail: "극악" }
  },
  chimchar: {
    id: "chimchar", name: "파이숭이", mark: "파", types: ["불꽃"],
    bs: { hp: 44, atk: 58, def: 44, spa: 58, spd: 44, spe: 61 },
    affinity: { ember: "매우 쉬움", rocksmash: "쉬움", quick: "쉬움", tail: "보통", meteor: "극악" }
  },
  pikachu: {
    id: "pikachu", name: "피카츄", mark: "피", types: ["전기"],
    bs: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
    affinity: { shock: "매우 쉬움", thunderbolt: "매우 쉬움", quick: "쉬움", tail: "보통", meteor: "극악" }
  },
  eevee: {
    id: "eevee", name: "이브이", mark: "이", types: ["노말"],
    bs: { hp: 55, atk: 55, def: 50, spa: 45, spd: 65, spe: 55 },
    affinity: { quick: "쉬움", bite: "쉬움", tail: "보통", shadowball: "보통", meteor: "극악" }
  },
  gastly: {
    id: "gastly", name: "고오스", mark: "고", types: ["고스트", "독"],
    bs: { hp: 30, atk: 35, def: 30, spa: 100, spd: 35, spe: 80 },
    affinity: { shadowball: "매우 쉬움", confusion: "쉬움", thunderbolt: "보통", quick: "극악", tail: "극악" }
  },
  zubat: {
    id: "zubat", name: "주뱃", mark: "주", types: ["독", "비행"],
    bs: { hp: 40, atk: 45, def: 35, spa: 30, spd: 40, spe: 55 },
    affinity: { aerial: "쉬움", bite: "쉬움", quick: "보통", shadowball: "어려움", meteor: "극악" }
  },
  dratini: {
    id: "dratini", name: "미뇽", mark: "미", types: ["드래곤"],
    bs: { hp: 41, atk: 64, def: 45, spa: 50, spd: 50, spe: 50 },
    affinity: { meteor: "쉬움", icebeam: "보통", watergun: "보통", tail: "보통", quick: "쉬움" }
  },
  riolu: {
    id: "riolu", name: "리오르", mark: "리", types: ["격투"],
    bs: { hp: 40, atk: 70, def: 40, spa: 35, spd: 40, spe: 60 },
    affinity: { rocksmash: "매우 쉬움", aura: "쉬움", quick: "쉬움", tail: "보통", meteor: "극악" }
  },
  magikarp: {
    id: "magikarp", name: "잉어킹", mark: "잉", types: ["물"],
    bs: { hp: 20, atk: 10, def: 55, spa: 15, spd: 20, spe: 80 },
    affinity: { watergun: "쉬움", quick: "어려움", bite: "극악", tail: "극악", meteor: "극악" }
  }
}

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

const WEEKS_PER_MONTH = 4;
const MONTHS_PER_YEAR = 12;
const WEEKS_PER_YEAR = WEEKS_PER_MONTH * MONTHS_PER_YEAR;
const REAL_SECONDS_PER_WEEK = 20;
const TRAINING_WEEKS = 4;
const MOVE_TRAINING_WEEKS = 4;
const EXPLORE_TRAVEL_WEEKS = 2;
const LIFESPAN_YEARS = 80;
const LIFESPAN_WEEKS = LIFESPAN_YEARS * WEEKS_PER_YEAR;

let life = 1;
let ageWeeks = 0;
let money = 0;
let tab = "training";
let action = { kind: "idle" };
let battle = null;

let moves = [
  { id: "quick",       name: "전광석화",   stars: 0, progress: 0, affinity: "보통", power: 40,  accuracy: 100, priority: 1, type: "노말",   soul: 0, stat: "atk", category: "물리" },
  { id: "bite",        name: "물기",       stars: 0, progress: 0, affinity: "보통", power: 60,  accuracy: 100, priority: 0, type: "악",     soul: 0, stat: "atk", category: "물리" },
  { id: "tail",        name: "아이언테일", stars: 0, progress: 0, affinity: "보통", power: 100, accuracy: 75,  priority: 0, type: "강철",   soul: 0, stat: "atk", category: "물리", effect: { kind: "defDown", chance: 30 } },
  { id: "rocksmash",   name: "바위깨기",   stars: 0, progress: 0, affinity: "보통", power: 40,  accuracy: 100, priority: 0, type: "격투",   soul: 0, stat: "atk", category: "물리", effect: { kind: "defDown", chance: 50 } },
  { id: "aerial",      name: "제비반환",   stars: 0, progress: 0, affinity: "보통", power: 60,  accuracy: 100, priority: 0, type: "비행",   soul: 0, stat: "atk", category: "물리" },
  { id: "watergun",    name: "물대포",     stars: 0, progress: 0, affinity: "보통", power: 40,  accuracy: 100, priority: 0, type: "물",     soul: 0, stat: "spa", category: "특수" },
  { id: "ember",       name: "불꽃세례",   stars: 0, progress: 0, affinity: "보통", power: 40,  accuracy: 100, priority: 0, type: "불꽃",   soul: 0, stat: "spa", category: "특수", effect: { kind: "burn", chance: 10 } },
  { id: "shock",       name: "전기쇼크",   stars: 0, progress: 0, affinity: "보통", power: 40,  accuracy: 100, priority: 0, type: "전기",   soul: 0, stat: "spa", category: "특수", effect: { kind: "paralysis", chance: 10 } },
  { id: "confusion",   name: "염동력",     stars: 0, progress: 0, affinity: "보통", power: 50,  accuracy: 100, priority: 0, type: "에스퍼", soul: 0, stat: "spa", category: "특수" },
  { id: "shadowball",  name: "섀도볼",     stars: 0, progress: 0, affinity: "보통", power: 80,  accuracy: 100, priority: 0, type: "고스트", soul: 0, stat: "spa", category: "특수", effect: { kind: "spdDown", chance: 20 } },
  { id: "thunderbolt", name: "10만볼트",   stars: 0, progress: 0, affinity: "어려움", power: 90, accuracy: 100, priority: 0, type: "전기",   soul: 0, stat: "spa", category: "특수", effect: { kind: "paralysis", chance: 10 } },
  { id: "icebeam",     name: "냉동빔",     stars: 0, progress: 0, affinity: "어려움", power: 90, accuracy: 100, priority: 0, type: "얼음",   soul: 0, stat: "spa", category: "특수" },
  { id: "aura",        name: "파동탄",     stars: 0, progress: 0, affinity: "어려움", power: 80, accuracy: 100, priority: 0, type: "격투",   soul: 0, stat: "spa", category: "특수" },
  { id: "meteor",      name: "용성군",     stars: 0, progress: 0, affinity: "극악", power: 130, accuracy: 90,  priority: 0, type: "드래곤", soul: 0, stat: "spa", category: "특수", effect: { kind: "selfSpaDown", chance: 100 } }
];

const ITEMS = {
  healthFeather: { id: "healthFeather", name: "체력깃털", desc: "HP EV를 즉시 +10 올립니다.", kind: "ev", stat: "hp", amount: 10 },
  muscleFeather: { id: "muscleFeather", name: "근력깃털", desc: "공격 EV를 즉시 +10 올립니다.", kind: "ev", stat: "atk", amount: 10 },
  resistFeather: { id: "resistFeather", name: "저항력깃털", desc: "방어 EV를 즉시 +10 올립니다.", kind: "ev", stat: "def", amount: 10 },
  geniusFeather: { id: "geniusFeather", name: "지력깃털", desc: "특공 EV를 즉시 +10 올립니다.", kind: "ev", stat: "spa", amount: 10 },
  cleverFeather: { id: "cleverFeather", name: "정신력깃털", desc: "특방 EV를 즉시 +10 올립니다.", kind: "ev", stat: "spd", amount: 10 },
  swiftFeather:  { id: "swiftFeather",  name: "순발력깃털", desc: "스피드 EV를 즉시 +10 올립니다.", kind: "ev", stat: "spe", amount: 10 },
  revive:        { id: "revive", name: "기력의조각", desc: "전투에서 HP가 0이 될 때 자동으로 1개 사용해 HP 50%로 한 번 부활합니다.", kind: "revive" }
};
const itemIds = Object.keys(ITEMS);
let inventory = Object.fromEntries(itemIds.map((id) => [id, 0]));
let moveLoadout = [];
const MAX_MOVE_SLOTS = 4;
const areas = [
  {
    id: "luoyang",
    faction: "alliance",
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
    faction: "shaolin",
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
    faction: "wudang",
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
    faction: "huashan",
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

const FACTIONS = {
  alliance: {
    id: "alliance", name: "무림맹", region: "낙양",
    desc: "중원의 질서와 교류를 관장하는 정파 연합.",
    stats: ["hp"],
    specialty: "기초 체력 수련"
  },
  shaolin: {
    id: "shaolin", name: "소림사", region: "숭산",
    desc: "강건한 육체와 정면 승부를 중시하는 문파.",
    stats: ["atk", "def"],
    specialty: "공격·방어 수련"
  },
  wudang: {
    id: "wudang", name: "무당파", region: "무당산",
    desc: "내공과 균형, 기의 흐름을 중시하는 문파.",
    stats: ["spa", "spd"],
    specialty: "특공·특방 수련"
  },
  huashan: {
    id: "huashan", name: "화산파", region: "화산",
    desc: "날카로운 공세와 빠른 움직임을 중시하는 문파.",
    stats: ["atk", "spe"],
    specialty: "공격·스피드 수련"
  }
};

const factionIds = Object.keys(FACTIONS);
let reputation = Object.fromEntries(factionIds.map((id) => [id, 0]));

function factionTier(rep) {
  if (rep >= 300) return { name: "신뢰", bonus: 0.15 };
  if (rep >= 100) return { name: "우호", bonus: 0.10 };
  if (rep >= 25) return { name: "호감", bonus: 0.05 };
  return { name: "중립", bonus: 0 };
}

function statFactionBonus(key) {
  return factionIds.reduce((sum, id) => {
    const faction = FACTIONS[id];
    return faction.stats.includes(key) ? sum + factionTier(reputation[id]).bonus : sum;
  }, 0);
}

let logs = ["0년 0개월 0주 · 제1생이 시작되었습니다."];

const SAVE_KEY = "pokeloop-save-v1";
let lastSaveAt = 0;

function saveGame() {
  try {
    const payload = {
      version: 1,
      savedAt: Date.now(),
      life,
      ageWeeks,
      money,
      currentSpeciesId,
      reputation,
      inventory,
      moveLoadout,
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
    if (Number.isFinite(payload.ageWeeks) && payload.ageWeeks >= 0) {
      ageWeeks = payload.ageWeeks;
    } else if (Number.isFinite(payload.ageMonths) && payload.ageMonths >= 0) {
      ageWeeks = Math.floor(payload.ageMonths * WEEKS_PER_MONTH);
    }
    if (Number.isFinite(payload.money) && payload.money >= 0) money = payload.money;
    if (typeof payload.currentSpeciesId === "string" && SPECIES[payload.currentSpeciesId]) {
      applySpecies(payload.currentSpeciesId);
    } else {
      applySpecies("rattata");
    }

    if (payload.reputation && typeof payload.reputation === "object") {
      factionIds.forEach((id) => {
        if (Number.isFinite(payload.reputation[id])) {
          reputation[id] = Math.max(-1000, Math.min(1000, payload.reputation[id]));
        }
      });
    }

    if (payload.inventory && typeof payload.inventory === "object") {
      itemIds.forEach((id) => {
        if (Number.isFinite(payload.inventory[id])) {
          inventory[id] = Math.max(0, Math.floor(payload.inventory[id]));
        }
      });
    }

    if (payload.stats && typeof payload.stats === "object") {
      statKeys.forEach((key) => {
        const saved = payload.stats[key];
        if (!saved) return;
        if (Number.isFinite(saved.iv)) stats[key].iv = Math.max(0, Math.min(31, saved.iv));
        if (Number.isFinite(saved.ev)) stats[key].ev = Math.max(0, saved.ev);
      });
    }

    if (Array.isArray(payload.moves)) {
      const savedById = Object.fromEntries(payload.moves.map((move) => [move.id, move]));
      moves = moves.map((move) => {
        const savedMove = savedById[move.id];
        if (!savedMove) return move;
        return {
          ...move,
          stars: Number.isFinite(savedMove.stars) ? savedMove.stars : move.stars,
          progress: Number.isFinite(savedMove.progress) ? savedMove.progress : move.progress,
          soul: Number.isFinite(savedMove.soul) ? savedMove.soul : move.soul
        };
      });
    }

    if (Array.isArray(payload.moveLoadout)) {
      moveLoadout = payload.moveLoadout
        .filter((id) => moves.some((move) => move.id === id && move.stars > 0))
        .slice(0, MAX_MOVE_SLOTS);
    }

    if (payload.action && typeof payload.action.kind === "string") {
      action = payload.action;
      if (["training", "move", "explore"].includes(action.kind) && !Number.isFinite(action.weeks)) {
        action.weeks = 0;
        action.progress = 0;
      }
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
        if (!battle.playerStatus) battle.playerStatus = { burn: false, paralysis: false, spaMod: 1 };
        battle.enemies.forEach((enemy) => {
          if (!enemy.status) enemy.status = { burn: false, paralysis: false, defMod: 1, spdMod: 1 };
        });
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

const years = () => Math.floor(ageWeeks / WEEKS_PER_YEAR);
const months = () => Math.floor((ageWeeks % WEEKS_PER_YEAR) / WEEKS_PER_MONTH);
const weeks = () => Math.floor(ageWeeks % WEEKS_PER_MONTH);
const ageText = () => years() + "년 " + months() + "개월 " + weeks() + "주";
const remainingLifeWeeks = () => Math.max(0, LIFESPAN_WEEKS - ageWeeks);
const remainingLifeText = () => {
  const remain = remainingLifeWeeks();
  const y = Math.floor(remain / WEEKS_PER_YEAR);
  const m = Math.floor((remain % WEEKS_PER_YEAR) / WEEKS_PER_MONTH);
  const w = remain % WEEKS_PER_MONTH;
  return y + "년 " + m + "개월 " + w + "주";
};
const lifespanProgress = () => Math.min(100, ageWeeks / LIFESPAN_WEEKS * 100);
const trainingSpeed = (key) => (1 + stats[key].iv / 100) * (1 + statFactionBonus(key));
const roundWeeks = (value) => Math.round(value * 100) / 100;
const actionTiming = (baseWeeks, speed) => {
  const rawWeeks = baseWeeks / Math.max(0.0001, speed);
  if (rawWeeks >= 1) {
    return { weeks: Math.max(1, roundWeeks(rawWeeks)), efficiency: 1 };
  }
  return { weeks: 1, efficiency: speed / baseWeeks };
};
const trainingTiming = (key) => actionTiming(TRAINING_WEEKS, trainingSpeed(key));
const moveTrainingTiming = (move) => actionTiming(MOVE_TRAINING_WEEKS, moveTrainingSpeed(move));
const trainingInterval = (key) => trainingTiming(key).weeks;
const moveTrainingInterval = (move) => moveTrainingTiming(move).weeks;
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
  affinityMultiplier(moveAffinity(move)) *
  (1 + statFactionBonus(move.stat));
const movePowerMultiplier = (move) => 1 + move.stars * 0.12;
const moveCombatPower = (move) => Math.floor(move.power * movePowerMultiplier(move));
const learnedMoves = () => moves.filter((move) => move.stars > 0);
const equippedMoves = () =>
  moveLoadout
    .map((id) => moves.find((move) => move.id === id))
    .filter((move) => move && move.stars > 0);

function toggleMoveEquip(id) {
  if (action.kind === "combat") return;
  const move = moves.find((item) => item.id === id);
  if (!move || move.stars <= 0) return;

  if (moveLoadout.includes(id)) {
    moveLoadout = moveLoadout.filter((moveId) => moveId !== id);
    addLog(move.name + "을(를) 전투 기술에서 해제했습니다.");
  } else {
    if (moveLoadout.length >= MAX_MOVE_SLOTS) {
      addLog("전투 기술은 최대 " + MAX_MOVE_SLOTS + "개까지 장착할 수 있습니다.");
      render();
      return;
    }
    moveLoadout.push(id);
    addLog(move.name + "을(를) 전투 기술로 장착했습니다.");
  }

  saveGame();
  render();
}
const TYPE_CHART = {
  "노말":   { "바위": 0.5, "강철": 0.5, "고스트": 0 },
  "불꽃":   { "풀": 2, "얼음": 2, "벌레": 2, "강철": 2, "불꽃": 0.5, "물": 0.5, "바위": 0.5, "드래곤": 0.5 },
  "물":     { "불꽃": 2, "땅": 2, "바위": 2, "물": 0.5, "풀": 0.5, "드래곤": 0.5 },
  "전기":   { "물": 2, "비행": 2, "전기": 0.5, "풀": 0.5, "드래곤": 0.5, "땅": 0 },
  "풀":     { "물": 2, "땅": 2, "바위": 2, "불꽃": 0.5, "풀": 0.5, "독": 0.5, "비행": 0.5, "벌레": 0.5, "드래곤": 0.5, "강철": 0.5 },
  "얼음":   { "풀": 2, "땅": 2, "비행": 2, "드래곤": 2, "불꽃": 0.5, "물": 0.5, "얼음": 0.5, "강철": 0.5 },
  "격투":   { "노말": 2, "얼음": 2, "바위": 2, "악": 2, "강철": 2, "독": 0.5, "비행": 0.5, "에스퍼": 0.5, "벌레": 0.5, "페어리": 0.5, "고스트": 0 },
  "독":     { "풀": 2, "페어리": 2, "독": 0.5, "땅": 0.5, "바위": 0.5, "고스트": 0.5, "강철": 0 },
  "땅":     { "불꽃": 2, "전기": 2, "독": 2, "바위": 2, "강철": 2, "풀": 0.5, "벌레": 0.5, "비행": 0 },
  "비행":   { "풀": 2, "격투": 2, "벌레": 2, "전기": 0.5, "바위": 0.5, "강철": 0.5 },
  "에스퍼": { "격투": 2, "독": 2, "에스퍼": 0.5, "강철": 0.5, "악": 0 },
  "벌레":   { "풀": 2, "에스퍼": 2, "악": 2, "불꽃": 0.5, "격투": 0.5, "독": 0.5, "비행": 0.5, "고스트": 0.5, "강철": 0.5, "페어리": 0.5 },
  "바위":   { "불꽃": 2, "얼음": 2, "비행": 2, "벌레": 2, "격투": 0.5, "땅": 0.5, "강철": 0.5 },
  "고스트": { "에스퍼": 2, "고스트": 2, "악": 0.5, "노말": 0 },
  "드래곤": { "드래곤": 2, "강철": 0.5, "페어리": 0 },
  "악":     { "에스퍼": 2, "고스트": 2, "격투": 0.5, "악": 0.5, "페어리": 0.5 },
  "강철":   { "얼음": 2, "바위": 2, "페어리": 2, "불꽃": 0.5, "물": 0.5, "전기": 0.5, "강철": 0.5 },
  "페어리": { "격투": 2, "드래곤": 2, "악": 2, "불꽃": 0.5, "독": 0.5, "강철": 0.5 }
}

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
  const learned = equippedMoves();
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
  logs.unshift(ageText() + " · " + message);
  logs = logs.slice(0, 40);
}

function useItem(id) {
  if (action.kind === "combat") return;
  const item = ITEMS[id];
  if (!item || inventory[id] <= 0) return;

  if (item.kind === "ev") {
    inventory[id] -= 1;
    stats[item.stat].ev += item.amount;
    addLog(item.name + " 사용 · " + stats[item.stat].label + " EV +" + item.amount);
    saveGame();
    render();
  }
}

function rollBattleDrop() {
  const roll = Math.random();

  if (roll < 0.08) {
    inventory.revive += 1;
    return ITEMS.revive.name;
  }

  if (roll < 0.48) {
    const featherIds = itemIds.filter((id) => ITEMS[id].kind === "ev");
    const id = featherIds[Math.floor(Math.random() * featherIds.length)];
    inventory[id] += 1;
    return ITEMS[id].name;
  }

  return null;
}

function setTab(nextTab) {
  if (action.kind === "combat") return;
  tab = nextTab;
  saveGame();
  render();
}

function train(key) {
  if (action.kind === "combat") return;
  action = { kind: "training", stat: key, weeks: 0, progress: 0 };
  addLog(stats[key].label + " 수련을 시작했습니다.");
  saveGame();
  render();
}

function trainMove(id) {
  if (action.kind === "combat") return;
  const move = moves.find((item) => item.id === id);
  action = { kind: "move", id, weeks: 0 };
  addLog(move.name + " 수련을 시작했습니다.");
  saveGame();
  render();
}

function explore(id, repeat = false) {
  if (action.kind === "combat") return;
  const area = areas.find((item) => item.id === id);
  action = { kind: "explore", id, weeks: 0, progress: 0, repeat };
  addLog(area.name + (repeat ? " 반복 탐험을 시작했습니다." : " 탐색을 시작했습니다."));
  saveGame();
  render();
}

function stopRepeat() {
  if (battle) {
    battle.repeat = false;
    if (action.kind === "repeatWait") {
      action = { kind: "idle" };
    }
    addLog("반복 탐험 예약을 중지했습니다.");
    saveGame();
    render();
    return;
  }

  if (action.kind === "explore" && action.repeat) {
    action.repeat = false;
    addLog("반복 탐험 예약을 중지했습니다.");
    saveGame();
    render();
  }
}

function stopAction() {
  if (action.kind === "combat") return;
  action = { kind: "idle" };
  saveGame();
  render();
}

function startBattle(area) {
  const repeat = Boolean(action.repeat);
  const playerMaxHP = Math.max(60, Math.floor(finalStat("hp") * 4));
  battle = {
    areaId: area.id,
    areaName: area.name,
    factionId: area.faction,
    reward: area.reward,
    repeat,
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
    battleLog: ["야생 포켓몬 무리가 나타났다!"],
    revived: false
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

function applyMoveEffect(move, target, isPlayerTarget = false) {
  if (!move.effect || Math.random() * 100 > move.effect.chance) return;

  if (move.effect.kind === "burn") {
    const status = isPlayerTarget ? battle.playerStatus : target.status;
    if (!status.burn) {
      status.burn = true;
      pushBattleLog((isPlayerTarget ? currentSpecies().name : target.name) + "은(는) 화상을 입었다!");
    }
  } else if (move.effect.kind === "paralysis") {
    const status = isPlayerTarget ? battle.playerStatus : target.status;
    if (!status.paralysis) {
      status.paralysis = true;
      pushBattleLog((isPlayerTarget ? currentSpecies().name : target.name) + "은(는) 마비되었다!");
    }
  } else if (move.effect.kind === "defDown" && !isPlayerTarget) {
    target.status.defMod = Math.max(0.5, target.status.defMod * 0.8);
    pushBattleLog(target.name + "의 방어가 떨어졌다!");
  } else if (move.effect.kind === "spdDown" && !isPlayerTarget) {
    target.status.spdMod = Math.max(0.5, target.status.spdMod * 0.8);
    pushBattleLog(target.name + "의 특방이 떨어졌다!");
  } else if (move.effect.kind === "selfSpaDown") {
    battle.playerStatus.spaMod = Math.max(0.4, battle.playerStatus.spaMod * 0.67);
    pushBattleLog(currentSpecies().name + "의 특공이 크게 떨어졌다!");
  }
}

function statusSpeed(baseSpeed, status) {
  return status && status.paralysis ? Math.max(1, Math.floor(baseSpeed * 0.5)) : baseSpeed;
}

function statusPhysicalAttack(baseAttack, status) {
  return status && status.burn ? Math.max(1, Math.floor(baseAttack * 0.5)) : baseAttack;
}

function processEndTurnStatus() {
  if (!battle || battle.result) return;

  if (battle.playerStatus && battle.playerStatus.burn && battle.playerHP > 0) {
    const damage = Math.max(1, Math.floor(battle.playerMaxHP / 16));
    battle.playerHP = Math.max(0, battle.playerHP - damage);
    pushBattleLog(currentSpecies().name + "은(는) 화상으로 " + damage + " 피해를 입었다.");
  }

  battle.enemies.forEach((enemy) => {
    if (enemy.currentHP > 0 && enemy.status && enemy.status.burn) {
      const damage = Math.max(1, Math.floor(enemy.hp / 16));
      enemy.currentHP = Math.max(0, enemy.currentHP - damage);
      pushBattleLog(enemy.name + "은(는) 화상으로 " + damage + " 피해를 입었다.");
      if (enemy.currentHP <= 0) {
        pushBattleLog(enemy.name + "은(는) 화상 피해로 쓰러졌다.");
      }
    }
  });

  if (battle.playerHP <= 0) {
    if (!battle.revived && inventory.revive > 0) {
      inventory.revive -= 1;
      battle.revived = true;
      battle.playerHP = Math.max(1, Math.floor(battle.playerMaxHP * 0.5));
      pushBattleLog("기력의조각이 빛났다! " + currentSpecies().name + "은(는) HP 50%로 다시 일어섰다.");
      saveGame();
    } else {
      finishBattle(false);
      return;
    }
  }

  if (battle.enemies.every((enemy) => enemy.currentHP <= 0)) {
    finishBattle(true);
  }
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
      speed: statusSpeed(finalStat("spe"), battle.playerStatus),
      move: playerMove
    },
    ...enemyMoveUsers.map(({ enemy, move }) => ({
      side: "enemy",
      enemy,
      priority: move.priority || 0,
      speed: statusSpeed(enemy.spe, enemy.status),
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

      if (battle.playerStatus.paralysis && Math.random() < 0.25) {
        pushBattleLog(currentSpecies().name + "은(는) 몸이 저려 움직일 수 없다!");
        continue;
      }

      if (Math.random() * 100 > act.move.accuracy) {
        battle.lastAction = act.move.name + " → 빗나감";
        pushBattleLog(currentSpecies().name + "의 " + act.move.name + "! 그러나 빗나갔다.");
        continue;
      }

      const attackStat = act.move.category === "특수"
        ? Math.max(1, Math.floor(finalStat("spa") * battle.playerStatus.spaMod))
        : statusPhysicalAttack(finalStat("atk"), battle.playerStatus);
      const defenseStat = act.move.category === "특수"
        ? currentTarget.spd * currentTarget.status.spdMod
        : currentTarget.def * currentTarget.status.defMod;
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

      if (damage > 0 && currentTarget.currentHP > 0) {
        applyMoveEffect(act.move, currentTarget, false);
      } else if (act.move.effect && act.move.effect.kind === "selfSpaDown") {
        applyMoveEffect(act.move, currentTarget, false);
      }

      if (currentTarget.currentHP <= 0) {
        pushBattleLog(currentTarget.name + "은(는) 쓰러졌다.");
        addLog(act.move.name + "으로 " + currentTarget.name + "을(를) 쓰러뜨렸습니다.");
      }
    } else {
      if (act.enemy.currentHP <= 0) continue;

      if (act.enemy.status.paralysis && Math.random() < 0.25) {
        pushBattleLog(act.enemy.name + "은(는) 몸이 저려 움직일 수 없다!");
        continue;
      }

      if (Math.random() * 100 > act.move.accuracy) {
        pushBattleLog(act.enemy.name + "의 " + act.move.name + "! 그러나 빗나갔다.");
        continue;
      }

      const attackStat = act.move.category === "특수"
        ? act.enemy.spa
        : statusPhysicalAttack(act.enemy.atk, act.enemy.status);
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
        if (!battle.revived && inventory.revive > 0) {
          inventory.revive -= 1;
          battle.revived = true;
          battle.playerHP = Math.max(1, Math.floor(battle.playerMaxHP * 0.5));
          pushBattleLog("기력의조각이 빛났다! " + currentSpecies().name + "은(는) HP 50%로 다시 일어섰다.");
          addLog("기력의조각 자동 사용 · 전투 사망 1회 방지");
          saveGame();
        } else {
          pushBattleLog(currentSpecies().name + "은(는) 쓰러졌다.");
          finishBattle(false);
          break;
        }
      }
    }

    if (battle.enemies.every((enemy) => enemy.currentHP <= 0)) {
      finishBattle(true);
      break;
    }
  }

  if (battle && !battle.result) {
    processEndTurnStatus();
  }
}
function finishBattle(victory) {
  if (!battle) return;

  if (!victory) {
    addLog(battle.areaName + " 전투에서 사망했습니다.");
    rebirth("combatDeath");
    return;
  }

  battle.result = "victory";

  money += battle.reward;
  const factionId = battle.factionId;
  if (factionId && FACTIONS[factionId]) {
    reputation[factionId] = Math.min(1000, reputation[factionId] + 5);
    addLog(battle.areaName + " 전투 승리 · 은전 +" + battle.reward + " · " + FACTIONS[factionId].name + " 평판 +5");
  } else {
    addLog(battle.areaName + " 전투 승리 · 은전 +" + battle.reward);
  }

  const drop = rollBattleDrop();
  if (drop) {
    addLog("전리품 획득 · " + drop);
    pushBattleLog("전리품으로 " + drop + "을(를) 얻었다.");
  }

  if (battle.repeat) {
    action = {
      kind: "repeatWait",
      areaId: battle.areaId,
      until: Date.now() + 1500
    };
    addLog(battle.areaName + " 반복 탐험을 계속합니다.");
  } else {
    action = { kind: "idle" };
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

function rebirth(reason = "manual") {
  const previousLife = life;
  const previousSpecies = currentSpecies().name;
  const previousAgeText = ageText();

  life += 1;
  ageWeeks = 0;
   combatTickProgress = 0;
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

  reputation = Object.fromEntries(factionIds.map((id) => [id, 0]));
  inventory = Object.fromEntries(itemIds.map((id) => [id, 0]));
  moveLoadout = [];

  battle = null;
  action = { kind: "idle" };
  tab = "training";

  let ending;
  if (reason === "lifespan") {
    ending = "제" + previousLife + "생의 " + previousSpecies + "은(는) " + previousAgeText + "에 천수를 다했습니다. 세력 평판은 새 생에 계승되지 않습니다.";
  } else if (reason === "combatDeath") {
    ending = "제" + previousLife + "생의 " + previousSpecies + "은(는) 전투에서 생을 마쳤습니다. 세력 평판은 새 생에 계승되지 않습니다.";
  } else {
    ending = "제" + previousLife + "생을 스스로 마쳤습니다. 세력 평판은 새 생에 계승되지 않습니다.";
  }

  logs = [
    "0년 0개월 0주 · " + ending,
    "0세 0개월 · 제" + life + "생이 시작되었습니다. " + currentSpecies().name + "의 몸으로 태어났습니다. 전생의 기술 경험이 영혼에 남아 있습니다."
  ];

  saveGame();
  render();
}

function currentActionTitle() {
  if (action.kind === "training") return stats[action.stat].label + " 수련";
  if (action.kind === "move") return moves.find((item) => item.id === action.id).name;
  if (action.kind === "explore") return areas.find((item) => item.id === action.id).name + " 탐색";
  if (action.kind === "combat") return "전투 중";
  if (action.kind === "repeatWait") return "재탐색 준비";
  return "휴식";
}

function trainingView() {
  return `
    <div class="heading">
      <div><p class="eyebrow">육체 수련</p><h2>노력치 수련</h2></div>
      <p class="muted">EV에는 상한이 없습니다. 기본 수련 1회는 4주이며, 수련속도가 높을수록 실제 소요 주가 소수점 단위로 짧아집니다.</p>
    </div>
    <div class="table">
      <div class="tr th"><span>능력</span><span>EV</span><span>IV</span><span>획득 주기</span><span></span></div>
      ${statKeys.map((key) => `
        <div class="tr ${action.kind === "training" && action.stat === key ? "selected" : ""}">
          <strong>${stats[key].label}</strong>
          <span>${formatNumber(stats[key].ev)}</span>
          <span>${stats[key].iv}</span>
          <span>${trainingInterval(key).toFixed(2)}주마다 EV +${trainingTiming(key).efficiency.toFixed(2)}</span>
          <button class="action" onclick="train('${key}')">수련</button>
        </div>
      `).join("")}
    </div>
  `;
}

function moveEffectText(move) {
  if (!move.effect) return "없음";
  if (move.effect.kind === "burn") return "화상 " + move.effect.chance + "%";
  if (move.effect.kind === "paralysis") return "마비 " + move.effect.chance + "%";
  if (move.effect.kind === "defDown") return "방어 하락 " + move.effect.chance + "%";
  if (move.effect.kind === "spdDown") return "특방 하락 " + move.effect.chance + "%";
  if (move.effect.kind === "selfSpaDown") return "사용 후 특공 크게 하락";
  return "없음";
}

function movesView() {
  return `
    <div class="heading">
      <div><p class="eyebrow">무공 수련</p><h2>기술</h2></div>
      <p class="muted">10성은 완성, 12성은 대성. 기본 기술 수련 세션은 4주이며 재능·적합도·전생 숙련·세력 보너스가 실제 소요 시간을 단축합니다.</p>
    </div>
    <section class="move-loadout">
      <div class="move-loadout-head">
        <div>
          <strong>전투 기술</strong>
          <span>최대 ${MAX_MOVE_SLOTS}개 · 자동전투에서 왼쪽부터 순환 사용</span>
        </div>
        <b>${moveLoadout.length} / ${MAX_MOVE_SLOTS}</b>
      </div>
      <div class="move-slots">
        ${Array.from({ length: MAX_MOVE_SLOTS }, (_, index) => {
          const move = moves.find((item) => item.id === moveLoadout[index]);
          return move
            ? '<div class="move-slot filled"><span>' + (index + 1) + '</span><strong>' + move.name + '</strong><small>' + move.stars + '성 · ' + move.type + '</small></div>'
            : '<div class="move-slot"><span>' + (index + 1) + '</span><strong>비어 있음</strong><small>습득한 기술을 장착하세요</small></div>';
        }).join("")}
      </div>
    </section>
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
            <div><dt>부가 효과</dt><dd>${moveEffectText(move)}</dd></div>
            <div><dt>현재 실전 위력</dt><dd>${move.stars ? moveCombatPower(move) : "-"}</dd></div>
            <div><dt>연동 IV</dt><dd>${stats[move.stat].label} IV ${stats[move.stat].iv}</dd></div>
            <div><dt>적합도 배율</dt><dd>×${affinityMultiplier(moveAffinity(move)).toFixed(2)}</dd></div>
            <div><dt>수련 속도</dt><dd>×${moveTrainingSpeed(move).toFixed(2)}</dd></div>
            <div><dt>전생 숙련</dt><dd>+${move.soul.toFixed(1)}%</dd></div>
          </dl>
          <div class="move-card-actions">
            <button class="action" onclick="trainMove('${move.id}')">${move.stars ? "수련" : "습득 수련"}</button>
            <button
              class="ghost ${moveLoadout.includes(move.id) ? "equipped" : ""}"
              ${move.stars <= 0 ? "disabled" : ""}
              onclick="toggleMoveEquip('${move.id}')"
            >${moveLoadout.includes(move.id) ? "장착 해제" : "전투 장착"}</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function exploreView() {
  return `
    <div class="heading">
      <div><p class="eyebrow">중원</p><h2>탐험</h2></div>
      <p class="muted">각 지역으로 이동하는 데 2주가 걸립니다. 1회 탐험은 전투 1회 후 종료되고, 반복 탐험은 이동 → 전투 → 승리 → 재이동을 반복합니다.</p>
    </div>
    <div class="areas">
      ${areas.map((area) => `
        <article class="area">
          <div>
            <span class="danger-tag">${area.danger}</span>
            <h3>${area.name}</h3>
            <p>${area.desc}</p>
            <small>${FACTIONS[area.faction].name} 영향권 · 이동 2주 · 적 최대 ${area.enemies.length}마리 · 승리 보상 은전 ${area.reward} · 평판 +5</small>
          </div>
          <div class="area-actions">
            <button class="ghost" onclick="explore('${area.id}', false)">1회 탐험</button>
            <button class="action" onclick="explore('${area.id}', true)">반복 탐험</button>
          </div>
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
          <span>기력의조각 ${inventory.revive}</span>
        </div>
        <div class="status-line">
          ${battle.playerStatus.burn ? '<span class="status-badge burn">화상</span>' : ""}
          ${battle.playerStatus.paralysis ? '<span class="status-badge paralysis">마비</span>' : ""}
          ${battle.playerStatus.spaMod < 1 ? '<span class="status-badge debuff">특공↓</span>' : ""}
        </div>
        <div class="used-moves">
          <span>장착 전투 기술</span>
          <strong>${equippedMoves().length ? equippedMoves().map((move) => move.name + " " + move.stars + "성").join(" · ") : "몸통박치기(기본기)"}</strong>
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
              <div class="status-line enemy-status">
                ${enemy.status.burn ? '<span class="status-badge burn">화상</span>' : ""}
                ${enemy.status.paralysis ? '<span class="status-badge paralysis">마비</span>' : ""}
                ${enemy.status.defMod < 1 ? '<span class="status-badge debuff">방어↓</span>' : ""}
                ${enemy.status.spdMod < 1 ? '<span class="status-badge debuff">특방↓</span>' : ""}
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
      <p class="muted">수명은 현재 ${LIFESPAN_YEARS}년입니다. 천수를 다하거나 조기 환생하면 육신의 EV와 IV는 사라지고 기술 경험은 영혼에 남습니다.</p>

      <div class="rebirthgrid">
        <div><span>현재 종족</span><strong>${currentSpecies().name}</strong></div>
        <div><span>현재 나이</span><strong>${ageText()}</strong></div>
        <div><span>남은 수명</span><strong>${remainingLifeText()}</strong></div>
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

      <button class="danger" onclick="rebirth('manual')">현재 생을 끝내고 조기 환생</button>
    </div>
  `;
}

function itemsView() {
  const owned = itemIds.reduce((sum, id) => sum + inventory[id], 0);

  return `
    <div class="heading">
      <div><p class="eyebrow">소지품</p><h2>아이템</h2></div>
      <p class="muted">탐험 전투에서 아이템이 확률적으로 드롭됩니다. 깃털은 EV를 즉시 올리고, 기력의조각은 전투 사망을 한 번 막습니다.</p>
    </div>
    <div class="inventory-summary">
      <span>총 보유 수량</span><strong>${formatNumber(owned)}</strong>
    </div>
    <div class="item-grid">
      ${itemIds.map((id) => {
        const item = ITEMS[id];
        const count = inventory[id];
        const usable = item.kind === "ev" && count > 0 && action.kind !== "combat";
        return `
          <article class="item-card ${count > 0 ? "owned" : ""}">
            <div class="item-top">
              <div>
                <span class="item-kind">${item.kind === "ev" ? "능력 강화" : "전투 자동사용"}</span>
                <h3>${item.name}</h3>
              </div>
              <strong>×${count}</strong>
            </div>
            <p>${item.desc}</p>
            ${item.kind === "ev"
              ? '<button class="action" ' + (usable ? '' : 'disabled') + ' onclick="useItem(\'' + id + '\')">사용</button>'
              : '<small>보유 중이면 치명상 시 자동으로 사용됩니다. 전투당 1회.</small>'}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function factionsView() {
  return `
    <div class="heading">
      <div><p class="eyebrow">강호 인연</p><h2>세력 평판</h2></div>
      <p class="muted">해당 세력의 영향권에서 전투에 승리하면 평판이 오릅니다. 평판 단계가 오르면 관련 능력 수련이 빨라집니다.</p>
    </div>
    <div class="faction-grid">
      ${factionIds.map((id) => {
        const faction = FACTIONS[id];
        const rep = reputation[id];
        const tier = factionTier(rep);
        const next = rep < 25 ? 25 : rep < 100 ? 100 : rep < 300 ? 300 : 1000;
        const progress = Math.min(100, rep / next * 100);
        return `
          <article class="faction-card">
            <div class="faction-head">
              <div>
                <span class="muted">${faction.region}</span>
                <h3>${faction.name}</h3>
              </div>
              <strong>${tier.name}</strong>
            </div>
            <p>${faction.desc}</p>
            <div class="rep-row"><span>평판</span><strong>${rep} / 1000</strong></div>
            <div class="progress faction-progress"><i style="width:${progress}%"></i></div>
            <div class="faction-bonus">
              <span>${faction.specialty}</span>
              <strong>+${(tier.bonus * 100).toFixed(0)}%</strong>
            </div>
            <small>25 호감 · 100 우호 · 300 신뢰</small>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function centerView() {
  if (tab === "combat") return battleView();
  if (tab === "training") return trainingView();
  if (tab === "moves") return movesView();
  if (tab === "explore") return exploreView();
  if (tab === "items") return itemsView();
  if (tab === "factions") return factionsView();
  return rebirthView();
}

function actionPanel() {
  if (action.kind === "training") {
    return `
      <div class="progress"><i style="width:${action.progress}%"></i></div>
      <div class="metric"><span>수련 진행</span><strong>${(action.weeks || 0).toFixed(2)} / ${trainingInterval(action.stat).toFixed(2)}주</strong></div>
      <div class="breakdown">
        <div><span>기본 소요</span><strong>${TRAINING_WEEKS}주</strong></div>
        <div><span>IV ${stats[action.stat].iv}</span><strong>×${(1 + stats[action.stat].iv / 100).toFixed(2)}</strong></div>
        <div><span>세력 보너스</span><strong>+${(statFactionBonus(action.stat) * 100).toFixed(0)}%</strong></div>
        <div><span>최종 수련속도</span><strong>×${trainingSpeed(action.stat).toFixed(2)}</strong></div>
        <div><span>실제 소요</span><strong>${trainingInterval(action.stat).toFixed(2)}주</strong></div>
        <div><span>효율 배율</span><strong>×${trainingTiming(action.stat).efficiency.toFixed(2)}</strong></div>
        <div><span>완료 보상</span><strong>EV +${trainingTiming(action.stat).efficiency.toFixed(2)}</strong></div>
      </div>
      <button class="ghost full" onclick="stopAction()">중단</button>
    `;
  }

  if (action.kind === "move") {
    const move = moves.find((item) => item.id === action.id);
    return `
      <div class="progress move"><i style="width:${move.progress}%"></i></div>
      <div class="metric"><span>현재 숙련</span><strong>${move.stars}성 · ${move.progress.toFixed(0)}%</strong></div>
      <div class="metric"><span>수련 세션</span><strong>${(action.weeks || 0).toFixed(2)} / ${moveTrainingInterval(move).toFixed(2)}주</strong></div>
      <div class="breakdown">
        <div><span>${stats[move.stat].label} IV</span><strong>×${(1 + stats[move.stat].iv / 100).toFixed(2)}</strong></div>
        <div><span>적합도</span><strong>×${affinityMultiplier(moveAffinity(move)).toFixed(2)}</strong></div>
        <div><span>전생 숙련</span><strong>×${(1 + move.soul / 100).toFixed(2)}</strong></div>
        <div><span>세력 보너스</span><strong>+${(statFactionBonus(move.stat) * 100).toFixed(0)}%</strong></div>
        <div><span>최종 습득속도</span><strong>×${moveTrainingSpeed(move).toFixed(2)}</strong></div>
        <div><span>실제 세션 소요</span><strong>${moveTrainingInterval(move).toFixed(2)}주</strong></div>
        <div><span>효율 배율</span><strong>×${moveTrainingTiming(move).efficiency.toFixed(2)}</strong></div>
        <div><span>세션 완료</span><strong>숙련 +${(25 * moveTrainingTiming(move).efficiency).toFixed(1)}%</strong></div>
        <div><span>현재 실전 위력</span><strong>${move.stars ? moveCombatPower(move) : "미습득"}</strong></div>
      </div>
      <button class="ghost full" onclick="stopAction()">중단</button>
    `;
  }

  if (action.kind === "explore") {
    return `
      <div class="progress explore"><i style="width:${action.progress}%"></i></div>
      <div class="metric"><span>이동 진행</span><strong>${(action.weeks || 0).toFixed(2)} / ${EXPLORE_TRAVEL_WEEKS.toFixed(2)}주</strong></div>
      <p class="muted">목적지까지 2주 이동한 뒤 자동전투가 시작됩니다.</p>
      <button class="ghost full" onclick="stopAction()">중단</button>
    `;
  }

  if (action.kind === "combat" && battle) {
    const alive = battle.enemies.filter((enemy) => enemy.currentHP > 0).length;
    return `
      <div class="metric"><span>남은 적</span><strong>${alive} / ${battle.enemies.length}</strong></div>
      <div class="metric"><span>전투 턴</span><strong>${battle.turn}</strong></div>
      <div class="metric"><span>탐험 방식</span><strong>${battle.repeat ? "반복" : "1회"}</strong></div>
      <p class="muted">전투 중에는 다른 행동으로 전환할 수 없습니다.</p>
      ${battle.repeat ? '<button class="ghost full" onclick="stopRepeat()">반복 중지</button>' : ""}
    `;
  }

  if (action.kind === "repeatWait" && battle) {
    return `
      <div class="metric"><span>탐험 방식</span><strong>반복</strong></div>
      <p class="muted">승리 결과를 표시한 뒤 같은 지역 탐험을 다시 시작합니다.</p>
      <button class="ghost full" onclick="stopRepeat()">반복 중지</button>
    `;
  }

  return '<p class="muted">수련, 기술, 탐험 중 하나를 선택하세요.</p>';
}

function processActionTime(deltaWeeks) {
  if (action.kind === "training") {
    const key = action.stat;
    action.weeks = (action.weeks || 0) + deltaWeeks;
    const duration = trainingInterval(key);
    action.progress = Math.min(100, action.weeks / duration * 100);

    while (action.kind === "training" && action.weeks >= duration) {
      action.weeks -= duration;
      const efficiency = trainingTiming(key).efficiency;
      stats[key].ev += efficiency;
      addLog(stats[key].label + " 수련 완료 · " + duration.toFixed(2) + "주 소요 · EV +" + efficiency.toFixed(2));
      action.progress = Math.min(100, action.weeks / duration * 100);
    }
  } else if (action.kind === "move") {
    const move = moves.find((item) => item.id === action.id);
    if (!move) return;

    action.weeks = (action.weeks || 0) + deltaWeeks;
    const duration = moveTrainingInterval(move);

    while (action.kind === "move" && action.weeks >= duration) {
      action.weeks -= duration;

      if (move.stars >= 12) {
        move.progress = 100;
        action = { kind: "idle" };
        return;
      }

      move.progress += 25 * moveTrainingTiming(move).efficiency;

      while (move.progress >= 100 && move.stars < 12) {
        move.progress -= 100;
        move.stars += 1;

        if (move.stars === 1 && moveLoadout.length < MAX_MOVE_SLOTS && !moveLoadout.includes(move.id)) {
          moveLoadout.push(move.id);
          addLog(move.name + "을(를) 습득해 전투 기술에 자동 장착했습니다.");
        }

        addLog(move.name + " 숙련이 " + move.stars + "성에 도달했습니다.");

        if (move.stars >= 12) {
          move.stars = 12;
          move.progress = 100;
          action = { kind: "idle" };
          addLog(move.name + "이(가) 12성 대성에 도달했습니다.");
          return;
        }
      }
    }
  } else if (action.kind === "explore") {
    action.weeks = (action.weeks || 0) + deltaWeeks;
    action.progress = Math.min(100, action.weeks / EXPLORE_TRAVEL_WEEKS * 100);

    if (action.weeks >= EXPLORE_TRAVEL_WEEKS) {
      const area = areas.find((item) => item.id === action.id);
      addLog(area.name + "에 도착했습니다. 이동에 " + EXPLORE_TRAVEL_WEEKS.toFixed(2) + "주가 소요되었습니다.");
      startBattle(area);
    }
  }
}

function render() {
  const highestMastery = Math.max(...moves.map((move) => move.stars));
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  document.getElementById("app").innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand"><strong>PokeLoop</strong><span class="badge">PROTOTYPE</span></div>
        <div class="topstats">
          <span>제${life}생</span>
          <span>${ageText()}</span>
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

          <div class="agecard ${remainingLifeWeeks() <= 10 * WEEKS_PER_YEAR ? "late-life" : ""}">
            <span>나이 / 수명</span>
            <strong>${ageText()} <em>/ ${LIFESPAN_YEARS}년</em></strong>
            <div class="lifespan-bar"><i style="width:${lifespanProgress()}%"></i></div>
            <small>남은 수명 ${remainingLifeText()} · 수련·기술 수련·탐험 중에만 나이가 흐릅니다. 전투 중에는 멈춥니다.</small>
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
              ["items", "아이템"],
              ["factions", "세력"],
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
          <span class="muted">실제 20초 = 게임 1주 · 행동시간 최소 1주 · 1주 미만 속도는 효율로 전환 · 80년 활동시간 = 21시간 20분</span>
        </div>
        <div class="logs">${logs.map((line) => '<p>' + line + '</p>').join("")}</div>
      </section>
    </div>
  `;

  if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
    window.scrollTo(scrollX, scrollY);
  }
}

loadGame();
if (ageWeeks >= LIFESPAN_WEEKS) {
  rebirth("lifespan");
} else {
  render();
}

window.addEventListener("beforeunload", saveGame);

setInterval(() => {
  if (action.kind === "training" || action.kind === "move" || action.kind === "explore") {
    const deltaWeeks = DT / REAL_SECONDS_PER_WEEK;
    ageWeeks += deltaWeeks;
    processActionTime(deltaWeeks);
  } 

  if (ageWeeks >= LIFESPAN_WEEKS) {
    rebirth("lifespan");
    return;
  }

  if (action.kind === "combat") {
    combatTickProgress += DT;
    while (combatTickProgress >= 1 && action.kind === "combat") {
      combatTickProgress -= 1;
      combatTick();
    }
  } else if (action.kind === "repeatWait") {
    combatTickProgress = 0;
    if (battle && battle.repeat && Date.now() >= action.until) {
      const area = areas.find((item) => item.id === action.areaId);
      battle = null;
      tab = "explore";
      action = { kind: "explore", id: area.id, weeks: 0, progress: 0, repeat: true };
      addLog(area.name + " 재탐색을 시작했습니다.");
      saveGame();
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