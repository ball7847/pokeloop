import {StatLabel} from '../components/StatIcon.jsx';
import {formatAmount,divideAmount,isAmount,compareAmount} from '../core/bigNumber.js';
import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {REGION,BERRY_REGION,REGIONS,appearedInRegion,isRegionUnlocked,isPokemonUnlockedInState,regionUnlockRequirement,spriteUrl,scaledReward,battleEnergyRewards} from '../core/wildData.js';
import {formatBasicStat,isDefaultStat,resolveStats} from '../core/dittoStats.js';

// Row-major positions in a 2-column, 3-row grid: HP/Speed, Attack/Defense, Sp.Atk/Sp.Def.
export const WILD_BASIC_FIELDS=Object.freeze([
  {key:'hp',label:'HP'},
  {key:'speed',label:'스피드'},
  {key:'attack',label:'공격'},
  {key:'defense',label:'방어'},
  {key:'specialAttack',label:'특수공격'},
  {key:'specialDefense',label:'특수방어'}
]);
const EXTRA_LABELS=Object.freeze({
  minDamagePercent:'최소 피해량',paralysis:'마비',poison:'독',accuracy:'명중',dodge:'회피'
});
const REWARD_LABELS=Object.freeze({attack:'공격',hp:'HP',speed:'스피드',defense:'방어',specialAttack:'특수공격',paralysis:'마비',poison:'독'});
const rewardText=(stat,value)=>(value<0?'−':'+')+(stat==='speed'?Number(Math.abs(value).toFixed(3)).toLocaleString('en-US',{maximumFractionDigits:3}):formatAmount(Math.abs(value)))+(stat==='speed'?'ms':'');
const format=formatAmount;

export function visibleWildBasicStats(pokemon){
  return WILD_BASIC_FIELDS.filter(({key})=>!isDefaultStat(key,resolveStats(pokemon)[key]));
}
export function visibleWildExtraStats(pokemon){
  const resolved=resolveStats(pokemon);
  const extras={minDamagePercent:resolved.minDamagePercent,paralysis:resolved.paralysis,poison:resolved.poison,
    accuracy:resolved.accuracy,dodge:resolved.dodge,...(pokemon.extraStats??{})};
  return Object.entries(extras).filter(([key,value])=>!isDefaultStat(key,value));
}
function WildCard({pokemon,count,unlocked,capped,fighting,disabled,onSelect}){
  const basic=new Set(visibleWildBasicStats(pokemon).map(({key})=>key));
  const extras=visibleWildExtraStats(pokemon);
  const gain=Object.entries(pokemon.rewards).filter(([,v])=>typeof v==='number'?v!==0:isAmount(v)&&compareAmount(v,0)!==0)
    .map(([stat,val])=>({stat,label:REWARD_LABELS[stat]??stat,value:scaledReward(stat,val,count)}));
  return <button type="button" disabled={disabled}
    className={'wild-card '+(fighting?'is-fighting':capped?'is-exhausted':!unlocked?'is-locked':'')}
    aria-label={pokemon.name+(capped?' 처치 완료':' 선택')} onClick={onSelect}>
    <div className="wild-card-upper">
      <div className="wild-card-portrait">
        <img src={spriteUrl(pokemon.number)} alt={pokemon.name} width="64" height="64"/>
      </div>
      <div className="wild-card-info">
        <strong className="wild-name">{pokemon.name}</strong>
        <div className="wild-basic-stats">
          {WILD_BASIC_FIELDS.map(({key,label})=>basic.has(key)
            ? <div key={key} className="wild-stat-box"><StatLabel stat={key} label={label} compact/><strong>{formatBasicStat(key,pokemon[key])}</strong></div>
            : <div key={key} className="wild-stat-slot-empty" aria-hidden="true"/>)}
        </div>
      </div>
    </div>
    <div className="wild-extra-stats" aria-label="추가 능력치">
      {extras.map(([key,value])=><div key={key} className="wild-stat-box">
        <span>{EXTRA_LABELS[key]??key}</span><strong>{['minDamagePercent','accuracy','dodge'].includes(key)?value+'%':format(value)}</strong>
      </div>)}
    </div>
    <div className="wild-rewards" aria-label="처치 보상">
      {gain.map(({stat,label,value})=><span className="wild-reward" key={stat}><StatLabel stat={stat} label={label} compact/> {rewardText(stat,value)}</span>)}
      {Object.keys(battleEnergyRewards(pokemon,count)).length===0?<span className="wild-reward">타입 에너지 보상 미설정</span>:
       Object.entries(battleEnergyRewards(pokemon,count)).map(([type,amount])=>
         <span className="wild-reward" key={'energy-'+type}>{type} 에너지 +{formatAmount(amount)}</span>)}
    </div>
    <div className="wild-card-footer">
      <span className="wild-kills">{count} / {REGION.defaultKillLimit}회</span>
      <span className="wild-state">{fighting?'전투 중':capped?'완료':!unlocked?'잠김':'전투 시작'}</span>
    </div>
  </button>;
}
export function WildPage(){
  const game=useGameStore(s=>s.game);
  const killCounts=game.killCounts;
  const combatActive=useGameStore(s=>s.game.combat.active);
  const fightingId=useGameStore(s=>s.game.combat.pokemonId);
  const phase=useGameStore(s=>s.game.phase);
  const recoveryMs=useGameStore(s=>s.game.recoveryMs);
  const dispatch=useGameStore(s=>s.dispatch);
  const region=REGIONS.find(r=>r.id===game.activeRegionId)??REGION;
  const pokemon=appearedInRegion(game,region.id);
  const cleared=appearedInRegion(game,REGION.id).filter(p=>(killCounts[p.id]??0)>0).length;
  const need=regionUnlockRequirement(game);
  const total=pokemon.reduce((sum,p)=>sum+(killCounts[p.id]||0),0);
  return <section className="wild-page">
    <div className="wild-region-tabs" role="tablist" aria-label="지역 선택">
      {REGIONS.map(r=><button key={r.id} role="tab" type="button" aria-selected={region.id===r.id}
        disabled={!isRegionUnlocked(game,r.id)||combatActive} onClick={()=>dispatch({type:'SELECT_REGION',regionId:r.id})}>
        {r.name}{isRegionUnlocked(game,r.id)?'':' (잠김)'}</button>)}
    </div>
    {!isRegionUnlocked(game,BERRY_REGION.id)&&<p className="wild-region-progress">베리숲 해금: 1지역 서로 다른 포켓몬 {cleared}/{need}종 첫 처치 (등장 종의 70%)</p>}
    <div className="wild-region-summary"><span className="wild-progress">{total} / {pokemon.length*REGION.defaultKillLimit}회 처치</span></div>
    {recoveryMs>0&&<p className="wild-recovery" role="status">메타몽 회복 중 · {(recoveryMs/1000).toFixed(1)}초</p>}
    <div className="wild-grid">
      {pokemon.map(p=>{
        const count=killCounts[p.id]||0;
        const unlocked=isPokemonUnlockedInState(game,p.id);
        const capped=count>=REGION.defaultKillLimit;
        const fighting=combatActive&&fightingId===p.id;
        const disabled=!unlocked||capped||combatActive||recoveryMs>0||phase==='paused'||phase==='finished';
        return <React.Fragment key={p.id}>
          {region.id===BERRY_REGION.id&&!game.berryRareAppeared&&p.id==='jigglypuff'&&
            <div className="wild-empty-cell wild-rare-empty" aria-label="5번 슬롯 피카츄: 안흔함 포켓몬 미등장"><strong>피카츄 · 안흔함</strong><small>이번 환생 미등장</small></div>}
          <WildCard pokemon={p} count={count} unlocked={unlocked} capped={capped}
            fighting={fighting} disabled={disabled} onSelect={()=>dispatch({type:'SELECT_WILD',pokemonId:p.id})}/>
        </React.Fragment>;
      })}
      {region.id===REGION.id&&!game.uncommonStarterId&&<div className="wild-empty-cell wild-rare-empty" aria-label="6번 슬롯: 안흔함 포켓몬 미등장"><strong>안흔함</strong><small>미등장</small></div>}
      {Array.from({length:Math.max(0,region.capacity-pokemon.length-(region.id===REGION.id&&!game.uncommonStarterId?1:0)-(region.id===BERRY_REGION.id&&!game.berryRareAppeared?1:0))},(_,i)=>
        <div key={'empty-'+i} className="wild-empty-cell" aria-hidden="true"/>)}
    </div>
    <p className="wild-footnote">포켓몬을 선택하면 자동 전투가 시작됩니다. 처음 3마리가 해금되며, 서로 다른 포켓몬을 처음 처치할 때마다 다음 포켓몬이 1마리씩 해금됩니다. 반복 처치는 추가 해금되지 않습니다. 보상은 처치 횟수에 따라 감소합니다.</p>
  </section>;
}
