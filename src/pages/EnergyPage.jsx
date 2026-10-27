import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {LAYERS,particleRates,particleMilestoneThreshold,POINT_CIRCULATION} from '../core/energySystem.js';
import {formatAmount,compareAmount} from '../core/bigNumber.js';
import {UPGRADES,AUTOMATIONS,upgradeCosts} from '../core/shopSystem.js';
import {EnergyTypeIcon} from '../components/EnergyTypeIcon.jsx';

const OUTER_LAYERS=LAYERS.map(layer=>({...layer,types:layer.level===2?['풀','불꽃','물']:layer.types}));
const STELLAR_NODES={}; // Type -> indexed physical slots. No upgrades have been defined yet.
export function stellarUpgradeRows(nodes=STELLAR_NODES){
  let row=0;
  return OUTER_LAYERS.map(layer=>({...layer,rows:layer.types.map(type=>{
    row++;
    let number=0;
    const slots=Array.from({length:row%2?9:8},(_,slot)=>{
      const node=nodes[type]?.[slot]??null;
      return {slot,node,id:node?'SU'+String(row).padStart(2,'0')+(++number):null};
    });
    return {type,row,slots};
  })}));
}
const HEX_R=24,HEX_W=Math.sqrt(3)*HEX_R,HEX_STEP=1.5*HEX_R;
const HEX_POINTS=Array.from({length:6},(_,i)=>{
  const angle=(60*i-90)*Math.PI/180;
  return [Math.cos(angle)*HEX_R,Math.sin(angle)*HEX_R].join(',');
}).join(' ');
function OuterStellarWorld(){
  const layers=stellarUpgradeRows();
  return <section className="panel energy-outer-panel" role="tabpanel" aria-label="외체계">
    <h3>외체계 · SU 영구 강화</h3>
    <p>스텔라에너지 업그레이드(SU) · 10계층 · 18타입 · 육각형 벌집 배치(9칸/8칸 교대).</p>
    <div className="energy-outer-scroll" role="region" aria-label="외체계 육각형 강화 격자" tabIndex={0}>
      <svg className="energy-outer-honeycomb" viewBox="0 0 570 730" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="10계층 18타입 153개 육각형 슬롯">
        {layers.map(layer=><g key={layer.level}>
          <text x="6" y={34+((layer.rows[0].row+layer.rows[layer.rows.length-1].row)/2-1)*HEX_STEP+4} className="energy-outer-layer-label">{layer.level}계층</text>
          {layer.rows.map(({type,row,slots})=><g key={type}>
            <text x="76" y={34+(row-1)*HEX_STEP+4} className="energy-outer-type-text">{type}</text>
            {slots.map(({slot,node,id})=><g key={slot} transform={`translate(${164+(slot+(row%2===0?.5:0))*HEX_W},${34+(row-1)*HEX_STEP})`}>
              <polygon points={HEX_POINTS} className={node?'energy-outer-hex is-node':'energy-outer-hex is-empty'}/>
              {node&&<text y="3" textAnchor="middle" className="energy-outer-node-id">{id}</text>}
            </g>)}
          </g>)}
        </g>)}
      </svg>
    </div>
    <p className="energy-outer-footnote">현재 등록된 SU 노드는 없습니다. SU 번호는 각 타입 줄의 실제 노드만 왼쪽부터 세며 빈칸은 건너뜁니다. 효과·비용은 추후 설계됩니다.</p>
  </section>;
}

export function EnergyPage(){
  const systemTab=useGameStore(s=>s.energySystemTab);
  const setSystemTab=useGameStore(s=>s.setEnergySystemTab);
  const energyTab=useGameStore(s=>s.energySectionTab);
  const setEnergyTab=useGameStore(s=>s.setEnergySectionTab);
  const game=useGameStore(s=>s.game);
  const dispatch=useGameStore(s=>s.dispatch);
  const rates=particleRates(game);
  return <div className="energy-overview">
    <div className="ditto-info-tabs energy-system-tabs" role="tablist" aria-label="에너지 체계">
      {[['micro','미시체계'],['middle','중간체계'],['outer','외체계']].map(([id,label])=><button key={id} type="button" role="tab"
        aria-selected={systemTab===id} className={'ditto-info-tab '+(systemTab===id?'is-active':'')}
        onClick={()=>setSystemTab(id)}>{label}</button>)}
    </div>
    {systemTab==='micro'&&<div className="ditto-info-tabs energy-section-tabs" role="tablist" aria-label="미시체계 분류">
      {[['stats','강화'],['circulation','생산'],['automation','자동화']].map(([id,label])=><button key={id} type="button" role="tab"
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
      <p>노말 입자가 성층권에 스텔라 입자를 생산합니다. 메타몽이 행성 이동 시 이를 흡수해 스텔라에너지를 획득합니다.</p>
      <button type="button" disabled={game.combat.active||game.phase==='paused'||compareAmount(game.pendingStellar??0,0)<=0}
        onClick={()=>{if(window.confirm('행성을 이동하시겠습니까? 타입 에너지·입자·일반 능력치가 초기화되고 대기 스텔라에너지를 흡수합니다.'))dispatch({type:'MOVE_PLANET'});}}>행성 이동</button>
    </section>
    </aside>
    </div>:systemTab==='outer'?<OuterStellarWorld/>:<section className="panel energy-purchase-panel" role="tabpanel">
      <div className="energy-shop-list">
        {energyTab==='circulation'?<div className="energy-shop-item">
          <div><strong>{POINT_CIRCULATION.name}</strong><small>노말 에너지 +0.5/초</small></div>
          {game.pointCirculationUnlocked?<button type="button" disabled>구매 완료</button>:
            <button type="button" disabled={game.phase!=='running'||Object.entries(POINT_CIRCULATION.costs).some(([type,cost])=>compareAmount(game.energyBalances[type]??0,cost)<0)}
              onClick={()=>dispatch({type:'BUY_CIRCULATION',id:POINT_CIRCULATION.id})}>{Object.entries(POINT_CIRCULATION.costs).map(([type,cost],index)=><React.Fragment key={type}>{index>0?' + ':''}<EnergyTypeIcon type={type}/>{type} 에너지 {formatAmount(cost)}</React.Fragment>)} 구매</button>}
        </div>:energyTab==='stats'?UPGRADES.map(item=>{
          const level=game.energyUpgrades?.[item.id]??0;
          const costs=upgradeCosts(item.id,level);
          const affordable=costs!==null&&Object.entries(costs).every(([type,cost])=>compareAmount(game.energyBalances[type]??0,cost)>=0);
          return <div className="energy-shop-item" key={item.id}>
            <div><strong>{item.name} Lv. {level} ({item.stat} {item.unit==='ms'?'-':'+'}{formatAmount(level*item.bonus*(item.unit==='flat'||item.unit==='ms'?1:100))}{item.unit==='flat'?'':item.unit==='ms'?'ms':'%'})</strong></div>
            <button type="button" disabled={!affordable||game.phase!=='running'}
              onClick={()=>dispatch({type:'BUY_UPGRADE',id:item.id})}>{costs===null?'최대 레벨':<>{Object.entries(costs).map(([type,cost],index)=><React.Fragment key={type}>{index>0?' + ':''}<EnergyTypeIcon type={type}/>{type} 에너지 {formatAmount(cost)}</React.Fragment>)} 구매</>}</button>
          </div>;
        }):AUTOMATIONS.map(item=>{
          const owned=game.qolUnlocks?.includes(item.id);
          const active=game.automation?.[item.id]??false;
          return <div className="energy-shop-item" key={item.id}>
            <div><strong>{item.name}</strong><small>{item.description}</small></div>
            {owned?<button type="button" aria-pressed={active} onClick={()=>dispatch({type:'TOGGLE_AUTOMATION',id:item.id})}>
              {active?'활성화 · 끄기':'비활성화 · 켜기'}</button>:
              <button type="button" disabled={compareAmount(game.energyBalances[item.type]??0,item.cost)<0||game.phase==='paused'}
                onClick={()=>dispatch({type:'BUY_AUTOMATION',id:item.id})}><EnergyTypeIcon type={item.type}/>{item.type} 에너지 {item.cost} 해금</button>}
          </div>;
        })}
        <small>구매 시 소비한 타입 에너지와 동일한 수량의 입자가 생성됩니다. 미해금 계층의 입자는 보관됩니다.</small>
      </div>
    </section>}
  </div>;
}
