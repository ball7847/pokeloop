import {StatLabel} from '../components/StatIcon.jsx';
import {EnergyTypeIcon} from '../components/EnergyTypeIcon.jsx';
import {formatAmount,isAmount,compareAmount} from '../core/bigNumber.js';
import React,{useMemo} from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {REGION,REGIONS,appearedInRegion,isRegionUnlocked,isPokemonUnlockedInState,spriteUrl,scaledReward,battleEnergyRewards} from '../core/wildData.js';
import {formatBasicStat,formatStatValue,isDefaultStat,resolveStats} from '../core/dittoStats.js';

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
  minDamagePercent:'최소 피해량',maxDamagePercent:'최대 피해량',paralysis:'마비',poison:'독',accuracy:'명중',dodge:'회피'
});
const REWARD_LABELS=Object.freeze({attack:'공격',hp:'HP',speed:'스피드',defense:'방어',specialAttack:'특수공격',maxDamagePercent:'최대 피해량',paralysis:'마비',poison:'독'});
const rewardText=(stat,value)=>(value<0?'−':'+')+formatStatValue(stat,Math.abs(value));
const format=formatAmount;

export function visibleWildBasicStats(pokemon){
  return WILD_BASIC_FIELDS.filter(({key})=>!isDefaultStat(key,resolveStats(pokemon)[key]));
}
export function visibleWildExtraStats(pokemon){
  const resolved=resolveStats(pokemon);
  const extras={minDamagePercent:resolved.minDamagePercent,maxDamagePercent:resolved.maxDamagePercent,paralysis:resolved.paralysis,poison:resolved.poison,
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
        <StatLabel stat={key} label={EXTRA_LABELS[key]??key}/><strong>{formatStatValue(key,value)}</strong>
      </div>)}
    </div>
    <div className="wild-rewards" aria-label="처치 보상">
      {gain.map(({stat,label,value})=><span className="wild-reward" key={stat}><StatLabel stat={stat} label={label} compact/> {rewardText(stat,value)}</span>)}
      {Object.keys(battleEnergyRewards(pokemon,count)).length===0?<span className="wild-reward">타입 에너지 보상 미설정</span>:
       Object.entries(battleEnergyRewards(pokemon,count)).map(([type,amount])=>
         <span className="wild-reward" key={'energy-'+type}><EnergyTypeIcon type={type}/>{type} 에너지 +{formatAmount(amount)}</span>)}
    </div>
    <div className="wild-card-footer">
      <span className="wild-kills">{count} / {REGION.defaultKillLimit}회</span>
      <span className="wild-state">{fighting?'전투 중':capped?'완료':!unlocked?'잠김':'전투 시작'}</span>
    </div>
  </button>;
}
// Filters only Pokémon that actually appeared this planet; never fabricates slots.
export function visiblePokemonForRegion(game,filter){
  return filter==='all'
    ? REGIONS.flatMap(region=>appearedInRegion(game,region.id))
    : appearedInRegion(game,filter);
}
export function WildPage(){
  // Enemy cards depend on encounter/unlock state, not particle production or HP animation ticks.
  const killCounts=useGameStore(s=>s.game.killCounts);
  const activeRegionId=useGameStore(s=>s.game.activeRegionId);
  const berryRareAppeared=useGameStore(s=>s.game.berryRareAppeared);
  const uncommonStarterId=useGameStore(s=>s.game.uncommonStarterId);
  const evolutionResults=useGameStore(s=>s.game.evolutionResults);
  const game=useMemo(()=>({killCounts,activeRegionId,berryRareAppeared,uncommonStarterId,evolutionResults}),
    [killCounts,activeRegionId,berryRareAppeared,uncommonStarterId,evolutionResults]);
  const combatActive=useGameStore(s=>s.game.combat.active);
  const fightingId=useGameStore(s=>s.game.combat.pokemonId);
  const phase=useGameStore(s=>s.game.phase);
  const recoveryMs=useGameStore(s=>s.game.recoveryMs);
  const dispatch=useGameStore(s=>s.dispatch);
  // This is a view filter only. The game keeps a real active region for combat.
  const storedFilter=useGameStore(s=>s.wildRegionFilter);
  const setRegionFilter=useGameStore(s=>s.setWildRegionFilter);
  const regionFilter=storedFilter??activeRegionId;
  const allRegions=regionFilter==='all';
  const pokemon=visiblePokemonForRegion(game,regionFilter);
  const selectPokemon=p=>{
    if(allRegions){
      const home=REGIONS.find(r=>appearedInRegion(game,r.id).some(x=>x.id===p.id));
      if(!home||!isRegionUnlocked(game,home.id))return;
      if(home.id!==game.activeRegionId)dispatch({type:'SELECT_REGION',regionId:home.id});
    }
    dispatch({type:'SELECT_WILD',pokemonId:p.id});
  };
  const total=pokemon.reduce((sum,p)=>sum+(killCounts[p.id]||0),0);
  return <section className="wild-page">
    <div className="wild-region-tabs" role="tablist" aria-label="지역 선택">
      <button key="all" role="tab" type="button" aria-selected={allRegions}
        disabled={combatActive} onClick={()=>setRegionFilter('all')}>모두</button>
      {REGIONS.map(r=><button key={r.id} role="tab" type="button" aria-selected={regionFilter===r.id}
        disabled={!isRegionUnlocked(game,r.id)||combatActive} onClick={()=>{setRegionFilter(r.id);dispatch({type:'SELECT_REGION',regionId:r.id});}}>
        {r.name}</button>)}
    </div>
    <div className="wild-region-summary"><span className="wild-progress">{total} / {pokemon.length*REGION.defaultKillLimit}회 처치</span></div>
    {recoveryMs>0&&<p className="wild-recovery" role="status">메타몽 회복 중 · {(recoveryMs/1000).toFixed(1)}초</p>}
    <div className="wild-grid">
      {pokemon.map(p=>{
        const count=killCounts[p.id]||0;
        const unlocked=isPokemonUnlockedInState(game,p.id);
        const capped=count>=REGION.defaultKillLimit;
        const fighting=combatActive&&fightingId===p.id;
        const disabled=!unlocked||capped||combatActive||recoveryMs>0||phase==='paused'||phase==='finished';
        return <WildCard key={p.id} pokemon={p} count={count} unlocked={unlocked} capped={capped}
          fighting={fighting} disabled={disabled} onSelect={()=>selectPokemon(p)}/>;
      })}
    </div>
    <p className="wild-footnote">포켓몬을 선택하면 자동 전투가 시작됩니다. 처음 3마리가 해금되며, 서로 다른 포켓몬을 처음 처치할 때마다 다음 포켓몬이 1마리씩 해금됩니다. 반복 처치는 추가 해금되지 않습니다. 보상은 처치 횟수에 따라 감소합니다.</p>
  </section>;
}
