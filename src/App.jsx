import { useEffect, useMemo, useState } from "react";

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"];

const INITIAL_STATS = {
  hp:  { label: "HP",     bs: 30, iv: 18, ev: 1204 },
  atk: { label: "공격",   bs: 56, iv: 27, ev: 8247 },
  def: { label: "방어",   bs: 35, iv: 11, ev: 2110 },
  spa: { label: "특공",   bs: 25, iv: 4,  ev: 322 },
  spd: { label: "특방",   bs: 35, iv: 15, ev: 681 },
  spe: { label: "스피드", bs: 72, iv: 29, ev: 4932 }
};

const INITIAL_MOVES = [
  { id: "quick", name: "전광석화", stars: 8, progress: 72, affinity: "매우 쉬움", power: 61, soul: 8.4 },
  { id: "tail", name: "아이언테일", stars: 10, progress: 18, affinity: "쉬움", power: 100, soul: 5.1 },
  { id: "meteor", name: "용성군", stars: 0, progress: 0, affinity: "극악", power: 130, soul: 2.7 }
];

const AREAS = [
  { id: "luoyang", name: "낙양", danger: "낮음", desc: "상인과 유랑 무인이 모이는 중원 도시" },
  { id: "songshan", name: "숭산", danger: "보통", desc: "소림의 영향력이 강한 산악 지대" },
  { id: "wudang", name: "무당산", danger: "높음", desc: "물과 기를 다루는 수행자가 모이는 곳" },
  { id: "huashan", name: "화산", danger: "높음", desc: "검술과 고화력 무공으로 유명한 험지" }
];

function fmt(value) {
  if (value >= 1000000000) return (value / 1000000000).toFixed(2) + "B";
  if (value >= 1000000) return (value / 1000000).toFixed(2) + "M";
  if (value >= 1000) return (value / 1000).toFixed(2) + "K";
  return Math.floor(value).toLocaleString("ko-KR");
}

function randomIv() {
  return Math.floor(Math.random() * 32);
}

export default function App() {
  const [life, setLife] = useState(7);
  const [ageMonths, setAgeMonths] = useState(43 * 12 + 2);
  const [money, setMoney] = useState(12400);
  const [tab, setTab] = useState("training");
  const [stats, setStats] = useState(INITIAL_STATS);
  const [moves, setMoves] = useState(INITIAL_MOVES);
  const [action, setAction] = useState({ kind: "idle" });
  const [logs, setLogs] = useState([
    "43세 2개월 · 공격 EV가 8,000을 돌파했습니다.",
    "43세 1개월 · 전광석화 숙련이 8성에 도달했습니다.",
    "42세 11개월 · 낙양으로 이동했습니다."
  ]);

  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  const totalEv = useMemo(function () {
    return STAT_KEYS.reduce(function (sum, key) {
      return sum + stats[key].ev;
    }, 0);
  }, [stats]);

  function trainingSpeed(key) {
    return 1 + stats[key].iv / 100;
  }

  function finalStat(key) {
    return stats[key].bs + stats[key].iv + stats[key].ev;
  }

  function pushLog(message) {
    setLogs(function (prev) {
      return [(years + "세 " + months + "개월 · " + message)].concat(prev).slice(0, 30);
    });
  }

  useEffect(function () {
    const timer = window.setInterval(function () {
      setAgeMonths(function (value) { return value + 1; });

      setAction(function (current) {
        if (current.kind === "training") {
          const key = current.stat;
          const speed = 1 + stats[key].iv / 100;
          setStats(function (prev) {
            return {
              ...prev,
              [key]: { ...prev[key], ev: prev[key].ev + speed }
            };
          });
          return current;
        }

        if (current.kind === "move") {
          setMoves(function (prev) {
            return prev.map(function (move) {
              if (move.id !== current.moveId) return move;
              let progress = move.progress + 4 + move.soul * 0.08;
              let stars = move.stars;
              if (progress >= 100) {
                progress -= 100;
                stars = Math.min(12, stars + 1);
              }
              return { ...move, progress: progress, stars: stars };
            });
          });
          return current;
        }

        if (current.kind === "explore") {
          const next = current.progress + 8;
          if (next >= 100) {
            const area = AREAS.find(function (item) { return item.id === current.areaId; });
            setMoney(function (value) { return value + 320; });
            setLogs(function (prev) {
              const line = ((area ? area.name : "지역") + " 탐색 완료 · 은전 +320");
              return [line].concat(prev).slice(0, 30);
            });
            return { kind: "idle" };
          }
          return { ...current, progress: next };
        }

        return current;
      });
    }, 1000);

    return function () { window.clearInterval(timer); };
  }, [stats]);

  function startTraining(key) {
    setAction({ kind: "training", stat: key });
    pushLog(stats[key].label + " 수련을 시작했습니다.");
  }

  function startMove(moveId) {
    const move = moves.find(function (item) { return item.id === moveId; });
    setAction({ kind: "move", moveId: moveId });
    if (move) pushLog(move.name + " 수련을 시작했습니다.");
  }

  function startExplore(areaId) {
    const area = AREAS.find(function (item) { return item.id === areaId; });
    setAction({ kind: "explore", areaId: areaId, progress: 0 });
    if (area) pushLog(area.name + " 탐색을 시작했습니다.");
  }

  function rebirth() {
    setLife(function (value) { return value + 1; });
    setAgeMonths(0);
    setMoney(0);
    setStats(function (prev) {
      const next = {};
      STAT_KEYS.forEach(function (key) {
        next[key] = { ...prev[key], iv: randomIv(), ev: 0 };
      });
      return next;
    });
    setMoves(function (prev) {
      return prev.map(function (move) {
        return {
          ...move,
          stars: 0,
          progress: 0,
          soul: Math.min(75, move.soul + move.stars * 0.7)
        };
      });
    });
    setAction({ kind: "idle" });
    setTab("training");
    setLogs(["0세 0개월 · 새로운 몸으로 환생했습니다. 전생의 기술 경험이 영혼에 남아 있습니다."]);
  }

  function actionTitle() {
    if (action.kind === "training") return stats[action.stat].label + " 수련";
    if (action.kind === "move") {
      const move = moves.find(function (item) { return item.id === action.moveId; });
      return move ? move.name : "기술 수련";
    }
    if (action.kind === "explore") {
      const area = AREAS.find(function (item) { return item.id === action.areaId; });
      return (area ? area.name : "지역") + " 탐색";
    }
    return "휴식";
  }

  return (
    <div className="game-shell">
      <header className="topbar">
        <div className="brand"><strong>PokeLoop</strong><span className="badge">PROTOTYPE</span></div>
        <div className="top-stats">
          <span>제{life}생</span>
          <span>{years}세 {months}개월</span>
          <span>은전 {fmt(money)}</span>
          <span>낙양</span>
        </div>
        <button className="ghost-button">자동저장</button>
      </header>

      <main className="workspace">
        <aside className="character-panel panel">
          <div className="portrait">
            <div className="portrait-orb">꼬</div>
            <div>
              <p className="eyebrow">현재 육신</p>
              <h1>꼬렛</h1>
              <p className="muted">별명 · 자운 · ♂</p>
            </div>
          </div>

          <div className="age-card">
            <span>나이</span>
            <strong>{years}세 {months}개월</strong>
            <small>이번 생의 시간은 모든 행동으로 흐릅니다.</small>
          </div>

          <div className="stat-list">
            {STAT_KEYS.map(function (key) {
              const item = stats[key];
              const title = "BS " + item.bs + " + IV " + item.iv + " + EV " + Math.floor(item.ev);
              return (
                <div className={"stat-row stat-" + key} key={key} title={title}>
                  <span>{item.label}</span>
                  <strong>{fmt(finalStat(key))}</strong>
                </div>
              );
            })}
          </div>

          <div className="life-summary">
            <div><span>총 EV</span><strong>{fmt(totalEv)}</strong></div>
            <div><span>대성 기술</span><strong>{moves.filter(function (move) { return move.stars >= 12; }).length}</strong></div>
            <div><span>최고 숙련</span><strong>{Math.max.apply(null, moves.map(function (move) { return move.stars; }))}성</strong></div>
          </div>
        </aside>

        <section className="main-panel panel">
          <nav className="tabs">
            <button className={tab === "training" ? "active" : ""} onClick={function () { setTab("training"); }}>수련</button>
            <button className={tab === "moves" ? "active" : ""} onClick={function () { setTab("moves"); }}>기술</button>
            <button className={tab === "explore" ? "active" : ""} onClick={function () { setTab("explore"); }}>탐험</button>
            <button className={tab === "rebirth" ? "active" : ""} onClick={function () { setTab("rebirth"); }}>환생</button>
          </nav>

          <div className="content">
            {tab === "training" && (
              <>
                <div className="section-heading">
                  <div><p className="eyebrow">육체 수련</p><h2>노력치 수련</h2></div>
                  <p className="muted">EV에는 상한이 없습니다. IV는 수련 속도에만 영향을 줍니다.</p>
                </div>

                <div className="training-table">
                  <div className="table-head"><span>능력</span><span>EV</span><span>IV</span><span>속도</span><span></span></div>
                  {STAT_KEYS.map(function (key) {
                    const selected = action.kind === "training" && action.stat === key;
                    return (
                      <div className={"table-row " + (selected ? "selected" : "")} key={key}>
                        <strong>{stats[key].label}</strong>
                        <span>{fmt(stats[key].ev)}</span>
                        <span>{stats[key].iv}</span>
                        <span>+{trainingSpeed(key).toFixed(2)} EV/s</span>
                        <button onClick={function () { startTraining(key); }}>수련</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {tab === "moves" && (
              <>
                <div className="section-heading">
                  <div><p className="eyebrow">무공 수련</p><h2>기술</h2></div>
                  <p className="muted">10성은 완성, 12성은 대성. 전생 숙련은 다음 생의 수련을 가속합니다.</p>
                </div>

                <div className="move-grid">
                  {moves.map(function (move) {
                    return (
                      <article className="move-card" key={move.id}>
                        <div className="card-title">
                          <div><h3>{move.name}</h3><span className="affinity">{move.affinity}</span></div>
                          <strong>{move.stars === 0 ? "미습득" : move.stars + "성"}</strong>
                        </div>
                        <div className="progress progress-move"><i style={{ width: move.progress + "%" }} /></div>
                        <dl>
                          <div><dt>위력</dt><dd>{move.power}</dd></div>
                          <div><dt>전생 숙련</dt><dd>+{move.soul.toFixed(1)}%</dd></div>
                        </dl>
                        <button onClick={function () { startMove(move.id); }}>{move.stars === 0 ? "습득 수련" : "수련"}</button>
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            {tab === "explore" && (
              <>
                <div className="section-heading">
                  <div><p className="eyebrow">중원</p><h2>탐험</h2></div>
                  <p className="muted">지역을 선택하면 시간이 흐르며 사건, 전투, 보상을 만납니다.</p>
                </div>
                <div className="area-list">
                  {AREAS.map(function (area) {
                    return (
                      <article key={area.id} className="area-card">
                        <div><span className="danger">{area.danger}</span><h3>{area.name}</h3><p>{area.desc}</p></div>
                        <button onClick={function () { startExplore(area.id); }}>탐색 시작</button>
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            {tab === "rebirth" && (
              <div className="rebirth-view">
                <p className="eyebrow">윤회</p>
                <h2>제{life}생의 기록</h2>
                <p className="lead">현재 육신의 성장은 사라지지만, 기술을 익힌 경험은 영혼에 남습니다.</p>

                <div className="rebirth-summary">
                  <div><span>현재 종족</span><strong>꼬렛</strong></div>
                  <div><span>현재 나이</span><strong>{years}세 {months}개월</strong></div>
                  <div><span>총 EV</span><strong>{fmt(totalEv)}</strong></div>
                  <div><span>최고 기술</span><strong>{Math.max.apply(null, moves.map(function (move) { return move.stars; }))}성</strong></div>
                </div>

                <div className="inherit-list">
                  {moves.map(function (move) {
                    const nextSoul = Math.min(75, move.soul + move.stars * 0.7);
                    return (
                      <div key={move.id}>
                        <span>{move.name}</span>
                        <span>{move.stars}성</span>
                        <strong>다음 생 +{nextSoul.toFixed(1)}%</strong>
                      </div>
                    );
                  })}
                </div>

                <button className="danger-button" onClick={rebirth}>현재 생을 끝내고 환생</button>
              </div>
            )}
          </div>
        </section>

        <aside className="action-panel panel">
          <p className="eyebrow">현재 행동</p>
          <h2>{actionTitle()}</h2>
          <div className={"action-symbol action-" + action.kind}>{action.kind === "idle" ? "靜" : "修"}</div>

          {action.kind === "training" && (
            <>
              <div className="action-metric"><span>수련 속도</span><strong>+{trainingSpeed(action.stat).toFixed(2)} EV/s</strong></div>
              <div className="breakdown">
                <div><span>기본</span><strong>1.00</strong></div>
                <div><span>IV {stats[action.stat].iv}</span><strong>×{(1 + stats[action.stat].iv / 100).toFixed(2)}</strong></div>
              </div>
            </>
          )}

          {action.kind === "move" && (function () {
            const move = moves.find(function (item) { return item.id === action.moveId; });
            if (!move) return null;
            return (
              <>
                <div className="progress large progress-move"><i style={{ width: move.progress + "%" }} /></div>
                <div className="action-metric"><span>현재 숙련</span><strong>{move.stars}성 · {move.progress.toFixed(0)}%</strong></div>
                <div className="breakdown">
                  <div><span>전생 숙련</span><strong>+{move.soul.toFixed(1)}%</strong></div>
                  <div><span>목표</span><strong>12성 대성</strong></div>
                </div>
              </>
            );
          })()}

          {action.kind === "explore" && (
            <>
              <div className="progress large progress-explore"><i style={{ width: action.progress + "%" }} /></div>
              <div className="action-metric"><span>탐색 진행</span><strong>{action.progress}%</strong></div>
              <p className="muted">탐색 완료 시 은전과 사건 보상을 획득합니다.</p>
            </>
          )}

          {action.kind === "idle" && <p className="muted">수련, 기술, 탐험 중 하나를 선택하세요.</p>}

          {action.kind !== "idle" && (
            <button className="ghost-button full" onClick={function () { setAction({ kind: "idle" }); }}>중단</button>
          )}
        </aside>
      </main>

      <section className="log-panel panel">
        <div className="log-header">
          <div><span className="eyebrow">생애 기록</span><strong>로그</strong></div>
          <span className="muted">1초 = 게임 내 1개월 · 프로토타입 배율</span>
        </div>
        <div className="logs">
          {logs.map(function (log, index) { return <p key={log + index}>{log}</p>; })}
        </div>
      </section>
    </div>
  );
}