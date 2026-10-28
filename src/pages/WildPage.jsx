import {StatIcon} from '../components/StatIcon.jsx';
import {EnergyTypeIcon} from '../components/EnergyTypeIcon.jsx';
import {formatAmount,isAmount,compareAmount} from '../core/bigNumber.js';
import React,{useMemo} from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {REGION,REGIONS,appearedInRegion,isRegionUnlocked,isPokemonUnlockedInState,spriteUrl,scaledReward,battleEnergyRewards} from '../core/wildData.js';
import {formatBasicStat,formatStatValue,isDefaultStat,resolveStats,BASIC_STAT_KEYS,SPECIAL_STAT_KEYS,statLabel} from '../core/dittoStats.js';

// Row-major positions in a 2-column, 4-row grid: six core stats and damage range.
export const WILD_BASIC_FIELDS=Object.freeze([
  {key:'hp',label:'HP'},
  {key:'speed',label:'스피드'},
  {key:'attack',label:'공격'},
  {key:'defense',label:'방어'},
  {key:'specialAttack',label:'특수공격'},
  {key:'specialDefense',label:'특수방어'},
  {key:'minDamagePercent',label:'최소 피해량'},
  {key:'maxDamagePercent',label:'최대 피해량'}
]);
const EXTRA_LABELS=Object.freeze({
  minDamagePercent:'최소 피해량',maxDamagePercent:'최대 피해량',paralysis:'마비',poison:'독',multiStrike:'연타',accuracy:'명중',dodge:'회피'
});
const rewardText=(stat,value)=>(value<0?'−':'+')+formatStatValue(stat,Math.abs(value));
const format=formatAmount;

export function visibleWildBasicStats(pokemon){
  return WILD_BASIC_FIELDS.filter(({key})=>!isDefaultStat(key,resolveStats(pokemon)[key]));
}
export function visibleWildExtraStats(pokemon){
  const resolved=resolveStats(pokemon);
  const extras={...Object.fromEntries(SPECIAL_STAT_KEYS.map(key=>[key,resolved[key]])),...(pokemon.extraStats??{})};
  return Object.entries(extras).filter(([key,value])=>!BASIC_STAT_KEYS.includes(key)&&!isDefaultStat(key,value));
}
function WildCard({pokemon,count,unlocked,capped,fighting,disabled,onSelect}){
  const basic=new Set(visibleWildBasicStats(pokemon).map(({key})=>key));
  const extras=visibleWildExtraStats(pokemon);
  const gain=Object.entries(pokemon.rewards).filter(([,v])=>typeof v==='number'?v!==0:isAmount(v)&&compareAmount(v,0)!==0)
    .map(([stat,val])=>({stat,label:statLabel(stat),value:scaledReward(stat,val,count)}));
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
            ? <div key={key} className="wild-stat-box" title={label+' '+formatBasicStat(key,pokemon[key])} aria-label={label+' '+formatBasicStat(key,pokemon[key])}><StatIcon stat={key} fallback/><strong>{formatBasicStat(key,pokemon[key])}</strong></div>
            : <div key={key} className="wild-stat-slot-empty" aria-hidden="true"/>)}
        </div>
      </div>
    </div>
    <div className="wild-extra-stats" aria-label="특별 능력치">
      {extras.map(([key,value])=><div key={key} className="wild-stat-box" title={(EXTRA_LABELS[key]??statLabel(key))+" "+formatStatValue(key,value)} aria-label={(EXTRA_LABELS[key]??statLabel(key))+" "+formatStatValue(key,value)}>
        <StatIcon stat={key} fallback/><strong>{formatStatValue(key,value)}</strong>
      </div>)}
    </div>
    <div className="wild-rewards" aria-label="처치 보상">
      {gain.map(({stat,label,value})=><span className="wild-reward" key={stat} title={label+" "+rewardText(stat,value)} aria-label={label+" "+rewardText(stat,value)}><StatIcon stat={stat} fallback/> {rewardText(stat,value)}</span>)}
      {Object.keys(battleEnergyRewards(pokemon,count)).length===0?<span className="wild-reward">타입 에너지 보상 미설정</span>:
       Object.entries(battleEnergyRewards(pokemon,count)).map(([type,amount])=>
         <span className="wild-reward" key={'energy-'+type} title={type+' 에너지 +'+formatAmount(amount)} aria-label={type+' 에너지 +'+formatAmount(amount)}><EnergyTypeIcon type={type}/>+{formatAmount(amount)}</span>)}
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
  const raritySlotResults=useGameStore(s=>s.game.raritySlotResults);
  const uncommonStarterId=useGameStore(s=>s.game.uncommonStarterId);
  const evolutionResults=useGameStore(s=>s.game.evolutionResults);
  const hideCompleted=useGameStore(s=>s.game.automation?.intimidate&&s.game.qolUnlocks?.includes('intimidate'));
  const game=useMemo(()=>({killCounts,activeRegionId,berryRareAppeared,uncommonStarterId,raritySlotResults,evolutionResults}),
    [killCounts,activeRegionId,berryRareAppeared,uncommonStarterId,raritySlotResults,evolutionResults]);
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
  const allPokemon=visiblePokemonForRegion(game,regionFilter);
  const pokemon=hideCompleted?allPokemon.filter(p=>(killCounts[p.id]??0)<REGION.defaultKillLimit):allPokemon;
  const selectPokemon=p=>{
    if(allRegions){
      const home=REGIONS.find(r=>appearedInRegion(game,r.id).some(x=>x.id===p.id));
      if(!home||!isRegionUnlocked(game,home.id))return;
      if(home.id!==game.activeRegionId)dispatch({type:'SELECT_REGION',regionId:home.id});
    }
    dispatch({type:'SELECT_WILD',pokemonId:p.id});
  };
  const total=allPokemon.reduce((sum,p)=>sum+(killCounts[p.id]||0),0);
  return <section className="wild-page">
    <div className="wild-region-tabs" role="tablist" aria-label="지역 선택">
      <button key="all" role="tab" type="button" aria-selected={allRegions}
        disabled={combatActive} onClick={()=>setRegionFilter('all')}>모두</button>
      {REGIONS.map(r=><button key={r.id} role="tab" type="button" aria-selected={regionFilter===r.id}
        disabled={!isRegionUnlocked(game,r.id)||combatActive} onClick={()=>{setRegionFilter(r.id);dispatch({type:'SELECT_REGION',regionId:r.id});}}>
        {r.name}</button>)}
    </div>
    <div className="wild-region-summary"><span className="wild-progress">{total} / {allPokemon.length*REGION.defaultKillLimit}회 처치</span></div>
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
