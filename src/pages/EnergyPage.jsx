import React,{useState} from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {LAYERS,particleRates,particleMilestoneThreshold} from '../core/energySystem.js';
import {formatAmount,compareAmount} from '../core/bigNumber.js';
import {UPGRADES,AUTOMATIONS,upgradeCost} from '../core/shopSystem.js';
export function EnergyPage(){
  const [energyTab,setEnergyTab]=useState('stats');
  const game=useGameStore(s=>s.game);
  const dispatch=useGameStore(s=>s.dispatch);
  const rates=particleRates(game);
  return <div className="energy-overview">
    <div className="ditto-info-tabs energy-section-tabs" role="tablist" aria-label="에너지 분류">
      {[['stats','강화'],['automation','자동화'],['world','내부세계']].map(([id,label])=><button key={id} type="button" role="tab"
        aria-selected={energyTab===id} className={'ditto-info-tab '+(energyTab===id?'is-active':'')}
        onClick={()=>setEnergyTab(id)}>{label}</button>)}
    </div>
    {energyTab==='world'?<div className="energy-world-content" role="tabpanel">
    <div className="energy-world-layers">
    <section className="panel energy-page-balances"><h3>10계층 입자 생산 현황 <small>{game.unlockedLayer}/10계층 해금</small></h3>
      <div className="world-layer-table" role="table" aria-label="10계층 입자 생산 현황">
        <div className="world-layer-head" role="row"><span>계층</span><span>타입별 입자 · 보유량 · 생산량</span></div>
        {LAYERS.map(layer=>{
          const unlocked=layer.level<=game.unlockedLayer;
          return <div key={layer.level} className={'world-layer-row '+(!unlocked?'is-locked':'')} role="row">
            <div className="world-layer-title"><strong>{layer.level}계층 · {layer.name}</strong><small>{unlocked?'해금':'잠김'}</small></div>
            <div className="world-layer-types">
              {layer.types.map(t=><div className="world-type-line" key={t}>
                <span className="world-type-name">{t}</span>
                <strong>{unlocked?formatAmount(game.particleBalances[t]??0):'보관 '+formatAmount(game.particleBank[t]??0)}</strong>
                <span>{unlocked?formatAmount(rates[t]??0)+'/s':'잠김'}</span>
                <small>누적 {unlocked?formatAmount(game.particleEarned[t]??0):'—'} · 이정표 {game.particleMilestones[t]??0}{unlocked?' · 다음 '+formatAmount(particleMilestoneThreshold(game.particleMilestones[t]??0)):''}</small>
              </div>)}
            </div>
          </div>;
        })}
      </div>
      <p>미해금 계층에도 타입 에너지는 정상 지급됩니다. 에너지 구매로 생성된 입자는 100% 보관하고 계층 해금 시 지급됩니다.</p>
    </section>
    </div>
    <aside className="energy-world-stellar" aria-label="스텔라에너지 영역">
    <section className="panel"><h3>성층권 · 대기 스텔라에너지</h3>
      <div className="energy-balance-grid">
        <div className="energy-balance-item"><span>대기 스텔라에너지</span><strong>{formatAmount(game.pendingStellar??0)}</strong></div>
        <div className="energy-balance-item"><span>보유 스텔라에너지</span><strong>{formatAmount(game.stellar??0)}</strong></div>
        <div className="energy-balance-item"><span>행성 이동 횟수</span><strong>{game.planetMoves??0}</strong></div>
      </div>
      <p>노말 입자가 성층권에 스텔라 입자를 생산합니다. 메타몽이 행성 이동 시 이를 흡수해 스텔라에너지를 획득합니다.</p>
      <button type="button" disabled={game.combat.active||game.phase==='paused'||compareAmount(game.pendingStellar??0,0)<=0}
        onClick={()=>{if(window.confirm('행성을 이동하시겠습니까? 타입 에너지·입자·일반 능력치가 초기화되고 대기 스텔라에너지를 흡수합니다.'))dispatch({type:'MOVE_PLANET'});}}>행성 이동</button>
    </section>
    </aside>
    </div>:<section className="panel energy-purchase-panel" role="tabpanel">
      <div className="energy-shop-list">
        {energyTab==='stats'?UPGRADES.map(item=>{
          const level=game.energyUpgrades?.[item.id]??0;
          const cost=upgradeCost(item.id,level);
          const affordable=compareAmount(game.energyBalances[item.type]??0,cost)>=0;
          return <div className="energy-shop-item" key={item.id}>
            <div><strong>{item.name}</strong><small>Lv. {level} · 레벨당 +{item.unit==='flat'?item.bonus:item.bonus*100}{item.unit==='flat'?'':'%'} {item.stat}</small>
              <span className="energy-upgrade-effect">현재 적용: {item.stat} +{formatAmount(level*item.bonus*(item.unit==='flat'?1:100))}{item.unit==='flat'?'':'%'}</span></div>
            <button type="button" disabled={!affordable||game.phase!=='running'}
              onClick={()=>dispatch({type:'BUY_UPGRADE',id:item.id})}>{item.type} 에너지 {formatAmount(cost)} 구매</button>
          </div>;
        }):AUTOMATIONS.map(item=>{
          const owned=game.qolUnlocks?.includes(item.id);
          const active=game.automation?.[item.id]??false;
          return <div className="energy-shop-item" key={item.id}>
            <div><strong>{item.name}</strong><small>{item.description}</small></div>
            {owned?<button type="button" aria-pressed={active} onClick={()=>dispatch({type:'TOGGLE_AUTOMATION',id:item.id})}>
              {active?'활성화 · 끄기':'비활성화 · 켜기'}</button>:
              <button type="button" disabled={compareAmount(game.energyBalances[item.type]??0,item.cost)<0||game.phase==='paused'}
                onClick={()=>dispatch({type:'BUY_AUTOMATION',id:item.id})}>{item.type} 에너지 {item.cost} 해금</button>}
          </div>;
        })}
        <small>구매 시 소비한 타입 에너지와 동일한 수량의 입자가 생성됩니다. 미해금 계층의 입자는 보관됩니다.</small>
      </div>
    </section>}
  </div>;
}
