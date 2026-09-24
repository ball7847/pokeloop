(() => {
  const STORAGE_KEY = "pokeloop_idle_v1";

  const pokemonTemplate = [
    {
      id: "bulbasaur", name: "이상해씨", type: "풀", level: 5,
      maxHp: 72, hp: 72, attack: 15, defense: 12, pp: 0,
      quick: { name: "덩굴채찍", power: 10, ppGain: 20 },
      strong: { name: "씨폭탄", power: 42, ppCost: 100 },
      ability: "심록", item: "없음"
    },
    {
      id: "charmander", name: "파이리", type: "불꽃", level: 5,
      maxHp: 64, hp: 64, attack: 18, defense: 9, pp: 0,
      quick: { name: "불꽃세례", power: 11, ppGain: 20 },
      strong: { name: "화염바퀴", power: 46, ppCost: 100 },
      ability: "맹화", item: "없음"
    },
    {
      id: "squirtle", name: "꼬부기", type: "물", level: 5,
      maxHp: 80, hp: 80, attack: 13, defense: 16, pp: 0,
      quick: { name: "물대포", power: 9, ppGain: 25 },
      strong: { name: "아쿠아테일", power: 40, ppCost: 100 },
      ability: "급류", item: "없음"
    }
  ];

  const encounterTable = [
    { chance: 0.20, name: "꼬렛", icon: "N", hp: 52, attack: 6, reward: { coin: [2, 4], food: [0, 1] } },
    { chance: 0.16, name: "구구", icon: "F", hp: 45, attack: 7, reward: { coin: [2, 5], wood: [0, 1] } },
    { chance: 0.10, name: "캐터피", icon: "B", hp: 62, attack: 4, reward: { coin: [2, 4], food: [1, 2] } },
    { chance: 0.04, name: "깨비참", icon: "R", hp: 92, attack: 10, reward: { coin: [6, 10], stone: [0, 1] } }
  ];
  const noEncounterChance = 0.50;

  const initialState = () => ({
    resources: { coin: 0, food: 0, wood: 0, stone: 0 },
    party: structuredClone(pokemonTemplate),
    area: { name: "새싹 들판", progress: 0, goal: 25 },
    totalRuns: 0,
    totalWins: 0,
    totalCoins: 0,
    battleWins: 0,
    speed: 1,
    enemy: null,
    log: [],
    loot: [],
    savedAt: Date.now()
  });

  let state = loadState();
  let actionRemaining = 3000;
  let lastFrame = performance.now();

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function roll(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function nowTime() { return new Date().toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  function format(n) { return Math.floor(n).toLocaleString("ko-KR"); }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialState();
      const parsed = JSON.parse(raw);
      const fresh = initialState();
      return {
        ...fresh,
        ...parsed,
        resources: { ...fresh.resources, ...(parsed.resources || {}) },
        area: { ...fresh.area, ...(parsed.area || {}) },
        party: Array.isArray(parsed.party) && parsed.party.length ? parsed.party : fresh.party,
        enemy: null
      };
    } catch {
      return initialState();
    }
  }

  function saveState(showLog = false) {
    state.savedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, enemy: null }));
    if (showLog) addLog("게임을 저장했습니다.", "good");
    renderMeta();
  }

  function resetState() {
    if (!confirm("저장 데이터를 초기화할까요?")) return;
    state = initialState();
    actionRemaining = 3000;
    localStorage.removeItem(STORAGE_KEY);
    addLog("새로운 탐험을 시작합니다.", "good");
    renderAll();
  }

  function addLog(text, kind = "") {
    state.log.push({ time: nowTime(), text, kind });
    if (state.log.length > 120) state.log.splice(0, state.log.length - 120);
    renderLog();
  }

  function addLoot(name, amount) {
    if (!amount) return;
    const existing = state.loot.find(x => x.name === name);
    if (existing) existing.amount += amount;
    else state.loot.unshift({ name, amount });
    state.loot = state.loot.slice(0, 8);
  }

  function spawnEncounter() {
    state.totalRuns += 1;
    if (Math.random() < noEncounterChance) {
      state.enemy = null;
      addLog("주변을 탐색했지만 아무것도 만나지 않았다.");
      state.area.progress = Math.min(state.area.goal, state.area.progress + 1);
      if (Math.random() < 0.18) {
        const wood = roll(1, 2);
        state.resources.wood += wood;
        addLoot("나무", wood);
        addLog("탐색 중 나무 +" + wood + " 획득.", "loot");
      }
      return;
    }

    let pick = Math.random() * (1 - noEncounterChance);
    let selected = encounterTable[0];
    for (const entry of encounterTable) {
      if (pick < entry.chance) { selected = entry; break; }
      pick -= entry.chance;
    }

    state.enemy = {
      ...selected,
      maxHp: selected.hp,
      hp: selected.hp
    };
    addLog(selected.name + "이(가) 나타났다.");
  }

  function aliveParty() {
    return state.party.filter(p => p.hp > 0);
  }

  function playerTurn() {
    if (!state.enemy) return;
    const alive = aliveParty();
    if (!alive.length) {
      returnToTown(true);
      return;
    }

    for (const p of alive) {
      if (!state.enemy || state.enemy.hp <= 0) break;
      const useStrong = p.pp >= p.strong.ppCost;
      const move = useStrong ? p.strong : p.quick;
      const base = Math.max(1, Math.round((p.attack * 0.55) + move.power));
      const damage = Math.max(1, Math.round(base * (0.90 + Math.random() * 0.20)));

      if (useStrong) p.pp -= p.strong.ppCost;
      else p.pp = Math.min(200, p.pp + p.quick.ppGain);

      state.enemy.hp -= damage;
      addLog(
        p.name + "의 " + move.name + "! " + state.enemy.name + "에게 " + damage + " 피해." +
        (useStrong ? " [강공]" : ""),
        useStrong ? "good" : ""
      );
    }

    if (state.enemy && state.enemy.hp <= 0) {
      winBattle();
      return;
    }

    enemyTurn();
  }

  function enemyTurn() {
    if (!state.enemy) return;
    const targets = aliveParty();
    if (!targets.length) returnToTown(true);
    const target = targets[roll(0, targets.length - 1)];
    const mitigated = Math.max(1, state.enemy.attack - Math.floor(target.defense * 0.22));
    const damage = Math.max(1, Math.round(mitigated * (0.85 + Math.random() * 0.3)));
    target.hp = Math.max(0, target.hp - damage);
    addLog(state.enemy.name + "의 공격! " + target.name + "에게 " + damage + " 피해.", "bad");
    if (target.hp <= 0) addLog(target.name + "이(가) 쓰러졌다.", "bad");
    if (!aliveParty().length) returnToTown(true);
  }

  function winBattle() {
    const e = state.enemy;
    state.totalWins += 1;
    state.battleWins += 1;
    state.area.progress = Math.min(state.area.goal, state.area.progress + 1);

    const coin = roll(e.reward.coin[0], e.reward.coin[1]);
    state.resources.coin += coin;
    state.totalCoins += coin;
    addLoot("코인", coin);

    ["food", "wood", "stone"].forEach(key => {
      if (!e.reward[key]) return;
      const amount = roll(e.reward[key][0], e.reward[key][1]);
      if (amount > 0) {
        state.resources[key] += amount;
        addLoot({ food: "식량", wood: "나무", stone: "돌" }[key], amount);
      }
    });

    addLog(e.name + "을(를) 쓰러뜨렸다. 코인 +" + coin, "loot");
    state.enemy = null;

    if (state.area.progress >= state.area.goal) {
      addLog("새싹 들판의 지역 진행도를 모두 채웠다. 다음 지역 확장용 자리 확보.", "good");
    }
  }

  function returnToTown(auto = false) {
    state.enemy = null;
    state.party.forEach(p => {
      p.hp = p.maxHp;
      p.pp = 0;
    });
    state.battleWins = 0;
    addLog(auto ? "탐험대가 전멸하여 자동으로 귀환했다. 전원 회복." : "마을로 귀환했다. 전원 회복.", auto ? "bad" : "good");
    actionRemaining = 3000;
    saveState(false);
  }

  function actionTick() {
    if (!state.enemy) spawnEncounter();
    else playerTurn();
    renderAll();
    if (state.totalRuns % 10 === 0) saveState(false);
  }

  function renderParty() {
    $("#partyList").innerHTML = state.party.map(p => {
      const hpPct = clamp((p.hp / p.maxHp) * 100, 0, 100);
      const ppPct = clamp((p.pp / 100) * 100, 0, 100);
      return '<article class="member">' +
        '<div class="member-top">' +
          '<div class="portrait">' + p.type.slice(0,1) + '</div>' +
          '<div><strong>' + p.name + '</strong><small>' + p.quick.name + ' · ' + p.strong.name + '</small></div>' +
          '<span class="level">Lv.' + p.level + '</span>' +
        '</div>' +
        '<div class="statline"><span>HP</span><div class="bar hp"><i style="width:' + hpPct + '%"></i></div><b>' + p.hp + '/' + p.maxHp + '</b></div>' +
        '<div class="statline"><span>PP</span><div class="bar pp"><i style="width:' + ppPct + '%"></i></div><b>' + p.pp + '/100</b></div>' +
      '</article>';
    }).join("");
  }

  function renderEncounter() {
    const e = state.enemy;
    $("#battleState").textContent = e ? "전투 중" : "탐색 중";
    $("#enemyCard").classList.toggle("idle", !e);
    $("#enemyHpRow").classList.toggle("hidden", !e);
    if (!e) {
      $("#enemyIcon").textContent = "?";
      $("#enemyName").textContent = "주변을 탐색 중...";
      $("#enemyMeta").textContent = "다음 조우를 기다립니다.";
      return;
    }
    $("#enemyIcon").textContent = e.icon;
    $("#enemyName").textContent = e.name;
    $("#enemyMeta").textContent = "새싹 들판 · 야생 포켓몬";
    const pct = clamp((e.hp / e.maxHp) * 100, 0, 100);
    $("#enemyHpBar").style.width = pct + "%";
    $("#enemyHpText").textContent = Math.max(0, e.hp) + " / " + e.maxHp;
  }

  function renderResources() {
    $("#coinValue").textContent = format(state.resources.coin);
    $("#foodValue").textContent = format(state.resources.food);
    $("#woodValue").textContent = format(state.resources.wood);
    $("#stoneValue").textContent = format(state.resources.stone);
  }

  function renderArea() {
    $("#areaName").textContent = state.area.name;
    $("#areaProgressText").textContent = state.area.progress + " / " + state.area.goal;
    $("#areaProgressBar").style.width = clamp((state.area.progress / state.area.goal) * 100, 0, 100) + "%";
    $("#battleWins").textContent = state.battleWins;
  }

  function renderLog() {
    const box = $("#battleLog");
    if (!state.log.length) {
      box.innerHTML = '<div class="empty">아직 기록이 없습니다.</div>';
      return;
    }
    box.innerHTML = state.log.slice(-60).map(x =>
      '<div class="log-line ' + (x.kind || "") + '"><time>' + x.time + '</time><span>' + x.text + '</span></div>'
    ).join("");
    box.scrollTop = box.scrollHeight;
  }

  function renderLoot() {
    $("#lootList").innerHTML = state.loot.length
      ? state.loot.map(x => '<div class="loot-entry"><span>' + x.name + '</span><b>× ' + format(x.amount) + '</b></div>').join("")
      : '<div class="empty">아직 획득한 보상이 없습니다.</div>';
  }

  function renderMeta() {
    $("#totalRuns").textContent = format(state.totalRuns);
    $("#totalWins").textContent = format(state.totalWins);
    $("#totalCoins").textContent = format(state.totalCoins);
    const sec = Math.max(0, Math.floor((Date.now() - state.savedAt) / 1000));
    $("#lastSaveText").textContent = sec < 5 ? "방금 전" : sec < 60 ? sec + "초 전" : Math.floor(sec / 60) + "분 전";
  }

  function renderRoster() {
    $("#rosterGrid").innerHTML = state.party.map(p =>
      '<article class="roster-card"><h3>' + p.name + ' · Lv.' + p.level + '</h3>' +
      '<p>HP ' + p.maxHp + ' · 공격 ' + p.attack + ' · 방어 ' + p.defense + '<br>' +
      '특성: ' + p.ability + '<br>속공: ' + p.quick.name + ' / 강공: ' + p.strong.name + '<br>도구: ' + p.item + '</p></article>'
    ).join("");
    $("#itemGrid").innerHTML = [
      ["울퉁불퉁멧", "접촉 피해를 받을 때 공격자에게 반사 피해."],
      ["클리어참", "능력치 하락 계열 방해를 막는 방어형 도구."],
      ["속임수주사위", "연속 공격 계열의 기대 성능을 안정화."],
      ["기합의띠", "가득 찬 HP에서 치명적인 피해를 1회 버팀."]
    ].map(x => '<article class="item-card"><h3>' + x[0] + '</h3><p>' + x[1] + '</p></article>').join("");
  }

  function renderAll() {
    renderResources();
    renderParty();
    renderEncounter();
    renderArea();
    renderLog();
    renderLoot();
    renderMeta();
    renderRoster();
  }

  function bindUI() {
    $$(".nav-btn").forEach(btn => btn.addEventListener("click", () => {
      $$(".nav-btn").forEach(x => x.classList.remove("active"));
      $$(".view").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      $("#view-" + btn.dataset.view).classList.add("active");
    }));

    $$(".speed").forEach(btn => btn.addEventListener("click", () => {
      $$(".speed").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      state.speed = Number(btn.dataset.speed);
    }));

    $("#saveBtn").addEventListener("click", () => saveState(true));
    $("#resetBtn").addEventListener("click", resetState);
    $("#returnBtn").addEventListener("click", () => returnToTown(false));
    $("#clearLogBtn").addEventListener("click", () => {
      state.log = [];
      renderLog();
    });
  }

  function loop(now) {
    const delta = Math.min(100, now - lastFrame);
    lastFrame = now;
    actionRemaining -= delta * state.speed;
    if (actionRemaining <= 0) {
      actionTick();
      actionRemaining += 3000;
    }
    $("#turnTimer").textContent = (Math.max(0, actionRemaining) / 1000).toFixed(1) + "초";
    renderMeta();
    requestAnimationFrame(loop);
  }

  bindUI();
  if (!state.log.length) addLog("새싹 들판 탐험을 시작합니다.", "good");
  renderAll();
  requestAnimationFrame(loop);
  window.addEventListener("beforeunload", () => saveState(false));
})();