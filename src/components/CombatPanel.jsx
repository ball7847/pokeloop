import React from 'react';
import {StatLabel} from './StatIcon.jsx';
import {formatStatValue} from '../core/dittoStats.js';
import {formatAmount,isAmount,decimal,compareAmount} from '../core/bigNumber.js';
import {useGameStore} from '../store/useGameStore.js';
const fmt=formatAmount;
const percent=(current,max)=>isAmount(current)&&isAmount(max)&&compareAmount(max,0)>0?Math.max(0,Math.min(100,decimal(current).div(decimal(max)).mul(100).toNumber())):0;
export function HealthBar({name,hp,compact=false}){
  const available=hp && isAmount(hp.current)&&isAmount(hp.max)&&compareAmount(hp.max,0)>0;
  const value=available?percent(hp.current,hp.max):0;
  return compact?<><div className="combat-unit-line"><strong>{name}</strong><span>{available?fmt(hp.current)+' / '+fmt(hp.max):'— / —'}</span></div>
    <div className="combat-health" role="progressbar" aria-label={name+' HP'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={available?value:undefined} aria-valuetext={available?undefined:'미설정'}>
      <div className="combat-health-fill" style={{width:value+'%'}}/></div></>
    :<><div className="battle-health-caption"><strong>{name}</strong><span>{available?fmt(hp.current)+' / '+fmt(hp.max):'— / —'}</span></div>
      <div className="battle-health-track" role="progressbar" aria-label={name+' 체력'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={available?value:undefined} aria-valuetext={available?undefined:'미설정'}>
        <div className="battle-health-fill" style={{width:value+'%'}}/></div></>;
}
function Cooldown({name,value,kind}){
  const available=value&&Number.isFinite(value.elapsed)&&Number.isFinite(value.duration)&&value.duration>0;
  // Visual progress is animated outside React; combat timing remains store-driven.
  const progress=available?percent(value.elapsed,value.duration):0;
  return <div className={'battle-cooldown '+kind}><span>{name}</span>
    <div className="battle-cooldown-track" role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={available?progress:undefined} aria-valuetext={available?undefined:'미설정'}>
      <div className="battle-cooldown-fill"/>
    </div></div>;
}
const COMBAT_STAT_KEYS=Object.freeze({HP:'hp',공격:'attack',방어:'defense',특수공격:'specialAttack',특수방어:'specialDefense',스피드:'speed',독:'poison',해독:'antidote',마비:'paralysis',명중:'accuracy',회피:'dodge','최소 피해량':'minDamagePercent','최대 피해량':'maxDamagePercent'});
const COMBAT_REWARD_LABELS=Object.freeze({attack:'공격',hp:'HP',speed:'스피드',defense:'방어',specialAttack:'특수공격',specialDefense:'특수방어',paralysis:'마비',poison:'독',antidote:'해독'});
export function DittoBattle(){
  const combat=useGameStore(s=>s.game.combat);
  const dispatch=useGameStore(s=>s.dispatch);
  if(!combat.active||!combat.enemy)return <section className="ditto-battle-region" aria-label="전투 영역"/>;
  const enemy=combat.enemy;
  return <section className="ditto-battle-region" aria-label="전투 영역">
    <div className="battle-opponent">
      <div className="battle-stats-panel"><h3>적 능력치</h3><div className="battle-enemy-stats">
        {Object.entries(enemy.stats||{}).filter(([,v])=>isAmount(v)).map(([key,value])=>
          <div key={key}><StatLabel stat={COMBAT_STAT_KEYS[key]??key} label={key}/><strong>{formatStatValue(COMBAT_STAT_KEYS[key]??key,value)}</strong></div>)}
      </div></div>
      <div className="battle-enemy-image"><strong>{enemy.name}</strong>
        {enemy.imageUrl?<img src={enemy.imageUrl} alt={enemy.name}/>:<div className="battle-image-placeholder" aria-hidden="true">?</div>}</div>
      <div className="battle-side-panel"><div className="battle-rewards"><h3>보상</h3><div className="battle-reward-items">
        {Object.entries(enemy.rewards||{}).map(([key,value])=>
          <span key={key}><StatLabel stat={key} label={COMBAT_REWARD_LABELS[key]??key}/>
            <strong>{value<0?'−':'+'}{formatStatValue(key,Math.abs(value))}</strong></span>)}</div></div>
        <button type="button" className="battle-escape" onClick={()=>dispatch({type:'FLEE'})}>도망가기</button></div>
    </div>
    <div className="combat-debuffs" aria-label="전투 상태이상">
      <span>적: 마비 {fmt(combat.enemyStatus?.paralysis??0)} · 독 {fmt(combat.enemyStatus?.poison??0)}</span>
      <span>메타몽: 마비 {fmt(combat.playerStatus?.paralysis??0)} · 독 {fmt(combat.playerStatus?.poison??0)}</span>
    </div>
    <div className="battle-vitals">
      <Cooldown name="적 공격" value={enemy.attackCooldown} kind="enemy"/>
      <div className="battle-health enemy"><HealthBar name={enemy.name} hp={enemy.hp}/></div>
      <div className="battle-health ditto"><HealthBar name="메타몽" hp={combat.dittoHp}/></div>
      <Cooldown name="메타몽 공격" value={combat.dittoAttackCooldown} kind="ditto"/>
    </div>
  </section>;
}
