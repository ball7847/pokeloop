import {StatLabel} from './StatIcon.jsx';
import React,{useMemo} from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {visibleBasicStats,formatBasicStat} from '../core/dittoStats.js';
import {HealthBar} from './CombatPanel.jsx';
import {effectiveDittoStats} from '../core/shopSystem.js';
const TOP_STATS=[
  {key:'hp',label:'HP'},{key:'attack',label:'공격'},
  {key:'specialAttack',label:'특수공격'},{key:'speed',label:'스피드'},
  {key:'defense',label:'방어'},{key:'specialDefense',label:'특수방어'}
];
export function StatsPanel(){
  // Combat ticks replace game/combat, but these inputs only change on rewards or purchases.
  const dittoStats=useGameStore(s=>s.game.dittoStats);
  const energyUpgrades=useGameStore(s=>s.game.energyUpgrades);
  const stats=useMemo(()=>effectiveDittoStats({dittoStats,energyUpgrades}),[dittoStats,energyUpgrades]);
  const visible=new Set(visibleBasicStats(stats).map(x=>x.key));
  return <div className="top-stats" aria-label="메타몽 기본 능력치">
    <div className="ditto-avatar"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png" alt="메타몽" width="64" height="64"/></div>
    <div className="stat-grid">{TOP_STATS.map(x=>visible.has(x.key)
      ? <div className="stat-box" key={x.key}><StatLabel stat={x.key} label={x.label}/><strong>{formatBasicStat(x.key,stats[x.key])}</strong></div>
      : <div className="stat-slot-empty" key={x.key} aria-hidden="true"/>)}</div>
  </div>;
}
function MiniBattle(){
  const combat=useGameStore(s=>s.game.combat);
  const dispatch=useGameStore(s=>s.dispatch);
  if(!combat.active||!combat.enemy)return null;
  const enemy=combat.enemy;
  return <section className="mini-combat" aria-label="간이전투 영역">
    <div className="mini-combat-main">
      <div className="combat-portrait">{enemy.imageUrl?<img src={enemy.imageUrl} alt={enemy.name}/>:<span aria-hidden="true">?</span>}</div>
      <div className="combat-bars">
        <div className="combat-unit enemy"><HealthBar name={enemy.name} hp={enemy.hp} compact/></div>
        <div className="combat-unit ditto"><HealthBar name="메타몽" hp={combat.dittoHp} compact/></div>
      </div>
    </div>
    <button type="button" className="run-away" onClick={()=>dispatch({type:'FLEE'})}>도망가기</button>
  </section>;
}
export function TopBar(){
  return <header className="topbar new-topbar"><StatsPanel/><MiniBattle/></header>;
}
