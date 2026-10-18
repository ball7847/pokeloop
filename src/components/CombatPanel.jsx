import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
const fmt=n=>Number.isFinite(n)?Number(n.toFixed(2)).toLocaleString('en-US',{maximumFractionDigits:2}):'—';
const percent=(current,max)=>Number.isFinite(current)&&Number.isFinite(max)&&max>0?Math.max(0,Math.min(100,current/max*100)):0;
export function HealthBar({name,hp,compact=false}){
  const available=hp && Number.isFinite(hp.current)&&Number.isFinite(hp.max)&&hp.max>0;
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
  const progress=available?percent(value.elapsed,value.duration):0;
  return <div className={'battle-cooldown '+kind}><span>{name}</span>
    <div className="battle-cooldown-track" role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={available?progress:undefined} aria-valuetext={available?undefined:'미설정'}>
      <div className="battle-cooldown-fill" style={{width:progress+'%'}}/>
    </div></div>;
}
export function DittoBattle(){
  const combat=useGameStore(s=>s.game.combat);
  const dispatch=useGameStore(s=>s.dispatch);
  if(!combat.active||!combat.enemy)return <section className="ditto-battle-region" aria-label="전투 영역"/>;
  const enemy=combat.enemy;
  return <section className="ditto-battle-region" aria-label="전투 영역">
    <div className="battle-opponent">
      <div className="battle-stats-panel"><h3>적 능력치</h3><div className="battle-enemy-stats">
        {Object.entries(enemy.stats||{}).filter(([,v])=>Number.isFinite(v)).map(([key,value])=>
          <div key={key}><span>{key}</span><strong>{fmt(value)}</strong></div>)}
      </div></div>
      <div className="battle-enemy-image"><strong>{enemy.name}</strong>
        {enemy.imageUrl?<img src={enemy.imageUrl} alt={enemy.name}/>:<div className="battle-image-placeholder" aria-hidden="true">?</div>}</div>
      <div className="battle-side-panel"><div className="battle-rewards"><h3>보상</h3><div className="battle-reward-items">
        {Object.entries(enemy.rewards||{}).map(([key,value])=>
          <span key={key}><b>{({attack:'공격',hp:'HP'})[key]??key}</b> +{fmt(value)}</span>)}</div></div>
        <button type="button" className="battle-escape" onClick={()=>dispatch({type:'FLEE'})}>도망가기</button></div>
    </div>
    <div className="battle-vitals">
      <Cooldown name="적 공격" value={enemy.attackCooldown} kind="enemy"/>
      <div className="battle-health enemy"><HealthBar name={enemy.name} hp={enemy.hp}/></div>
      <div className="battle-health ditto"><HealthBar name="메타몽" hp={combat.dittoHp}/></div>
      <Cooldown name="메타몽 공격" value={combat.dittoAttackCooldown} kind="ditto"/>
    </div>
  </section>;
}
