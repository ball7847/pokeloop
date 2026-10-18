import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {REGION,WILD_POKEMON,spriteUrl,isPokemonUnlocked,rewardMultiplier} from '../core/wildData.js';
const names={attack:'공격',hp:'HP'};
const format=n=>Number(n.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4});
export function WildPage(){
  const killCounts=useGameStore(s=>s.game.killCounts);
  const combat=useGameStore(s=>s.game.combat);
  const phase=useGameStore(s=>s.game.phase);
  const dispatch=useGameStore(s=>s.dispatch);
  const total=WILD_POKEMON.reduce((sum,p)=>sum+(killCounts[p.id]||0),0);
  return <section className="wild-page">
    <div className="wild-header"><div><small>REGION 01</small><h2>{REGION.name}</h2></div>
      <div className="wild-progress">{total} / {WILD_POKEMON.length*REGION.defaultKillLimit}회 처치</div></div>
    <div className="wild-grid">
      {WILD_POKEMON.map((p,i)=>{
        const count=killCounts[p.id]||0;
        const unlocked=isPokemonUnlocked(killCounts,p.id);
        const capped=count>=REGION.defaultKillLimit;
        const fighting=combat.active&&combat.pokemonId===p.id;
        const disabled=!unlocked||capped||combat.active||phase==='paused'||phase==='finished';
        const gain=Object.entries(p.rewards).map(([stat,val])=>names[stat]+' +'+format(val*rewardMultiplier(count))).join(' · ');
        return <button key={p.id} type="button" disabled={disabled}
          className={'wild-card '+(fighting?'is-fighting':!unlocked?'is-locked':'')}
          aria-label={p.name+' 선택'} onClick={()=>dispatch({type:'SELECT_WILD',pokemonId:p.id})}>
          <span className="wild-order">{i+1}</span>
          <img src={spriteUrl(p.number)} alt={p.name} width="64" height="64"/>
          <strong>{p.name}</strong><span className="wild-kills">{count} / {REGION.defaultKillLimit}회</span>
          <span className="wild-reward">{gain}</span>
          <span className="wild-state">{fighting?'전투 중':capped?'완료':!unlocked?'이전 포켓몬 처치 필요':'전투 시작'}</span>
        </button>;
      })}
      {Array.from({length:REGION.capacity-WILD_POKEMON.length},(_,i)=>
        <div key={'empty-'+i} className="wild-empty-cell" aria-hidden="true"/>)}
    </div>
    <p className="wild-footnote">포켓몬을 선택하면 자동 전투가 시작됩니다. 각 포켓몬은 이전 순서의 포켓몬을 1회 처치하면 해금됩니다. 보상은 처치 횟수에 따라 감소합니다.</p>
  </section>;
}
