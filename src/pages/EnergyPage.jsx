import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {LAYERS,particleRates,particleMilestoneThreshold,POINT_CIRCULATION} from '../core/energySystem.js';
import {formatAmount,compareAmount} from '../core/bigNumber.js';
import {EnergyTypeIcon} from '../components/EnergyTypeIcon.jsx';
import {OuterStellarWorld} from '../components/energy/StellarMap.jsx';
import {EnergyShop} from '../components/energy/EnergyShop.jsx';
export {stellarTypeColors,stellarUpgradeRows} from '../components/energy/StellarMap.jsx';


export function EnergyPage(){
  const systemTab=useGameStore(s=>s.energySystemTab);
  const setSystemTab=useGameStore(s=>s.setEnergySystemTab);
  const energyTab=useGameStore(s=>s.energySectionTab);
  const setEnergyTab=useGameStore(s=>s.setEnergySectionTab);
  const game=useGameStore(s=>systemTab==='middle'?s.game:null);
  const dispatch=useGameStore(s=>s.dispatch);
  // Combat state updates are frequent; production rates depend only on the
  // balances, milestones and unlocked layer, not combat events or shop UI.
  const rates=React.useMemo(()=>game?particleRates(game):null,
    [game?.particleBalances,game?.particleMilestones,game?.unlockedLayer]);
  return <div className="energy-overview">
    <div className="ditto-info-tabs energy-system-tabs" role="tablist" aria-label="에너지 체계">
      {[['micro','미시체계'],['middle','중간체계'],['outer','외체계']].map(([id,label])=><button key={id} type="button" role="tab"
        aria-selected={systemTab===id} className={'ditto-info-tab '+(systemTab===id?'is-active':'')}
        onClick={()=>setSystemTab(id)}>{label}</button>)}
    </div>
    {systemTab==='micro'&&<div className="ditto-info-tabs energy-section-tabs" role="tablist" aria-label="미시체계 분류">
      {[['stats','강화'],['abilities','특성']].map(([id,label])=><button key={id} type="button" role="tab"
        aria-selected={energyTab===id} className={'ditto-info-tab '+(energyTab===id?'is-active':'')}
        onClick={()=>setEnergyTab(id)}>{label}</button>)}
    </div>}
    {systemTab==='middle'?<div className="energy-world-content" role="tabpanel" aria-label="중간체계">
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
                <span className="world-type-name"><EnergyTypeIcon type={t}/>{t}</span>
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
      <p>노말 입자가 성층권에 스텔라 입자를 생산합니다. 대기 스텔라에너지 1 SE 이상일 때 행성 이동할 수 있으며, 이동 시 이를 흡수해 스텔라에너지를 획득합니다.</p>
      <button type="button" disabled={game.combat.active||game.recoveryMs>0||game.phase!=='running'||compareAmount(game.pendingStellar??0,1)<0}
        onClick={()=>{if(window.confirm('행성을 이동하시겠습니까? 타입 에너지·입자·일반 능력치가 초기화되고 대기 스텔라에너지를 흡수합니다.'))dispatch({type:'MOVE_PLANET'});}}>행성 이동</button>
    </section>
    </aside>
    </div>:systemTab==='outer'?<OuterStellarWorld/>:<EnergyShop energyTab={energyTab}/>}
  </div>;
}
