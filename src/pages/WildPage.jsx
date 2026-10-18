import {StatLabel} from '../components/StatIcon.jsx';
import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {REGION,WILD_POKEMON,spriteUrl,isPokemonUnlocked,rewardMultiplier} from '../core/wildData.js';
import {formatBasicStat,DEFAULT_MIN_DAMAGE_PERCENT} from '../core/dittoStats.js';

// The first six basic stats match the order of Ditto's compact top bar.
export const WILD_BASIC_FIELDS=Object.freeze([
  {key:'hp',label:'HP'},
  {key:'attack',label:'공격'},
  {key:'specialAttack',label:'특수공격'},
  {key:'speed',label:'스피드'},
  {key:'defense',label:'방어'},
  {key:'specialDefense',label:'특수방어'}
]);
const EXTRA_LABELS=Object.freeze({
  minDamagePercent:'최소 피해량'
});
const REWARD_LABELS=Object.freeze({attack:'공격',hp:'HP'});
const format=n=>Number(n.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4});

export function visibleWildBasicStats(pokemon){
  return WILD_BASIC_FIELDS.filter(({key})=>Number.isFinite(pokemon[key])&&pokemon[key]!==0);
}
export function visibleWildExtraStats(pokemon){
  const extras={minDamagePercent:pokemon.minDamagePercent??DEFAULT_MIN_DAMAGE_PERCENT,...(pokemon.extraStats??{})};
  return Object.entries(extras).filter(([,value])=>Number.isFinite(value)&&value!==0&&!(key==='minDamagePercent'&&value===DEFAULT_MIN_DAMAGE_PERCENT));
}
function WildCard({pokemon,index,count,unlocked,capped,fighting,disabled,onSelect}){
  const basic=visibleWildBasicStats(pokemon);
  const extras=visibleWildExtraStats(pokemon);
  const gain=Object.entries(pokemon.rewards).filter(([,v])=>Number.isFinite(v)&&v!==0)
    .map(([stat,val])=>({stat,label:REWARD_LABELS[stat]??stat,value:val*rewardMultiplier(count)}));
  return <button type="button" disabled={disabled}
    className={'wild-card '+(fighting?'is-fighting':!unlocked?'is-locked':'')}
    aria-label={pokemon.name+' 선택'} onClick={onSelect}>
    <div className="wild-card-upper">
      <div className="wild-card-portrait">
        <span className="wild-order">{index+1}</span>
        <img src={spriteUrl(pokemon.number)} alt={pokemon.name} width="64" height="64"/>
      </div>
      <div className="wild-card-info">
        <strong className="wild-name">{pokemon.name}</strong>
        <div className="wild-basic-stats">
          {basic.map(({key,label})=><div key={key} className="wild-stat-box">
            <StatLabel stat={key} label={label} compact/><strong>{formatBasicStat(key,pokemon[key])}</strong>
          </div>)}
        </div>
      </div>
    </div>
    <div className="wild-extra-stats" aria-label="추가 능력치">
      {extras.map(([key,value])=><div key={key} className="wild-stat-box">
        <span>{EXTRA_LABELS[key]??key}</span><strong>{key==='minDamagePercent'?value+'%':format(value)}</strong>
      </div>)}
    </div>
    <div className="wild-rewards" aria-label="처치 보상">
      {gain.map(({stat,label,value})=><span className="wild-reward" key={stat}><StatLabel stat={stat} label={label} compact/> +{format(value)}</span>)}
    </div>
    <div className="wild-card-footer">
      <span className="wild-kills">{count} / {REGION.defaultKillLimit}회</span>
      <span className="wild-state">{fighting?'전투 중':capped?'완료':!unlocked?'잠김':'전투 시작'}</span>
    </div>
  </button>;
}
export function WildPage(){
  const killCounts=useGameStore(s=>s.game.killCounts);
  const combatActive=useGameStore(s=>s.game.combat.active);
  const fightingId=useGameStore(s=>s.game.combat.pokemonId);
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
        const fighting=combatActive&&fightingId===p.id;
        const disabled=!unlocked||capped||combatActive||phase==='paused'||phase==='finished';
        return <WildCard key={p.id} pokemon={p} index={i} count={count} unlocked={unlocked}
          capped={capped} fighting={fighting} disabled={disabled}
          onSelect={()=>dispatch({type:'SELECT_WILD',pokemonId:p.id})}/>;
      })}
      {Array.from({length:REGION.capacity-WILD_POKEMON.length},(_,i)=>
        <div key={'empty-'+i} className="wild-empty-cell" aria-hidden="true"/>)}
    </div>
    <p className="wild-footnote">포켓몬을 선택하면 자동 전투가 시작됩니다. 각 포켓몬은 이전 순서의 포켓몬을 1회 처치하면 해금됩니다. 보상은 처치 횟수에 따라 감소합니다.</p>
  </section>;
}
