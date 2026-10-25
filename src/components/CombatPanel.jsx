import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {StatLabel} from './StatIcon.jsx';
import {EnergyTypeIcon} from './EnergyTypeIcon.jsx';
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
// Rejected Draft-style transient numbers, anchored to existing artwork / HP bar.
// The layer outlives an individual battle so killing blows stay visible.
export function DamagePopupLayer({active=false}){
  const events=useGameStore(s=>s.damagePopups);
  const prune=useGameStore(s=>s.pruneDamagePopups);
  const layerRef=useRef(null);
  const cached=useRef({enemy:null,player:null});
  const [positions,setPositions]=useState({enemy:null,player:null});
  useEffect(()=>{
    const id=setInterval(prune,200);
    return ()=>clearInterval(id);
  },[prune]);
  useLayoutEffect(()=>{
    if(typeof document==='undefined'||!layerRef.current)return;
    const region=layerRef.current.closest('.ditto-battle-region');
    if(!region)return;
    const box=region.getBoundingClientRect();
    const next={...cached.current};
    for(const [target,anchor] of [['enemy','battle-enemy-hit-anchor'],['player','battle-player-hit-anchor']]){
      const element=document.getElementById(anchor);
      if(!element)continue;
      const rect=element.getBoundingClientRect();
      next[target]={x:rect.left+rect.width/2-box.left,y:rect.top+rect.height/2-box.top};
    }
    if(next.enemy!==cached.current.enemy||next.player!==cached.current.player){
      cached.current=next;setPositions(next);
    }
  },[active,events.length]);
  return <div className="battle-damage-layer" ref={layerRef} aria-hidden="true">
    {events.map(effect=>{
      const seed=(effect.id*37)%101;
      const offsetX=(seed-50)*.52;
      const offsetY=((effect.id*19)%37)-18;
      const pos=positions[effect.target];
      return <span key={effect.id} className={'battle-damage-number is-'+effect.kind+(effect.target==='player'?' on-player':' on-enemy')}
        style={{left:pos?pos.x+offsetX+'px':effect.target==='enemy'?'50%':'50%',
          top:pos?pos.y+offsetY+'px':effect.target==='enemy'?'31%':'83%'}}>
        {effect.kind==='miss'?'MISS':effect.kind==='blocked'?'0':'−'+fmt(effect.value)}
      </span>;
    })}
  </div>;
}
export function DittoBattle(){
  const combat=useGameStore(s=>s.game.combat);
  const dispatch=useGameStore(s=>s.dispatch);
  if(!combat.active||!combat.enemy)return <section className="ditto-battle-region" aria-label="전투 영역"><DamagePopupLayer/></section>;
  const enemy=combat.enemy;
  return <section className="ditto-battle-region" aria-label="전투 영역">
    <div className="battle-opponent">
      <div className="battle-stats-panel"><h3>적 능력치</h3><div className="battle-enemy-stats">
        {Object.entries(enemy.stats||{}).filter(([,v])=>isAmount(v)).map(([key,value])=>
          <div key={key}><StatLabel stat={COMBAT_STAT_KEYS[key]??key} label={key}/><strong>{formatStatValue(COMBAT_STAT_KEYS[key]??key,value)}</strong></div>)}
      </div></div>
      <div className="battle-enemy-image" id="battle-enemy-hit-anchor"><strong>{enemy.name}</strong>
        {enemy.imageUrl?<img src={enemy.imageUrl} alt={enemy.name}/>:<div className="battle-image-placeholder" aria-hidden="true">?</div>}</div>
      <div className="battle-side-panel"><div className="battle-rewards"><h3>보상</h3><div className="battle-reward-items">
        {Object.entries(enemy.rewards||{}).map(([key,value])=>
          <span key={key}><StatLabel stat={key} label={COMBAT_REWARD_LABELS[key]??key}/>
            <strong>{value<0?'−':'+'}{formatStatValue(key,Math.abs(value))}</strong></span>)}
        {Object.entries(enemy.energyRewards??{}).map(([type,amount])=><span key={'energy-'+type}>
          <EnergyTypeIcon type={type}/><span>{type} 에너지</span><strong>+{formatAmount(amount)}</strong></span>)}
        </div></div>
        <button type="button" className="battle-escape" onClick={()=>dispatch({type:'FLEE'})}>도망가기</button></div>
    </div>
    <div className="combat-debuffs" aria-label="전투 상태이상">
      <span>적: 마비 {fmt(combat.enemyStatus?.paralysis??0)} · 독 {fmt(combat.enemyStatus?.poison??0)}</span>
      <span>메타몽: 마비 {fmt(combat.playerStatus?.paralysis??0)} · 독 {fmt(combat.playerStatus?.poison??0)}</span>
    </div>
    <div className="battle-vitals">
      <Cooldown name="적 공격" value={enemy.attackCooldown} kind="enemy"/>
      <div className="battle-health enemy"><HealthBar name={enemy.name} hp={enemy.hp}/></div>
      <div className="battle-health ditto" id="battle-player-hit-anchor"><HealthBar name="메타몽" hp={combat.dittoHp}/></div>
      <Cooldown name="메타몽 공격" value={combat.dittoAttackCooldown} kind="ditto"/>
    </div>
    <DamagePopupLayer active/>
  </section>;
}
