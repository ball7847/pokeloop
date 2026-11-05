import React from 'react';
import {useShallow} from 'zustand/react/shallow';
import {useGameStore} from '../../store/useGameStore.js';
import {UPGRADES,AUTOMATIONS,upgradeCosts} from '../../core/shopSystem.js';
import {POINT_CIRCULATION} from '../../core/energySystem.js';
import {formatAmount,compareAmount} from '../../core/bigNumber.js';
import {EnergyTypeIcon} from '../EnergyTypeIcon.jsx';

export function EnergyShop({energyTab}){
  // A combat-only state update cannot change any of these shop inputs.
  const game=useGameStore(useShallow(s=>({
    energyUpgrades:s.game.energyUpgrades,energyBalances:s.game.energyBalances,
    phase:s.game.phase,pointCirculationUnlocked:s.game.pointCirculationUnlocked,
    qolUnlocks:s.game.qolUnlocks,automation:s.game.automation,
    autoBuySelection:s.game.autoBuySelection
  })));
  const dispatch=useGameStore(s=>s.dispatch);
  return <section className="panel energy-purchase-panel" role="tabpanel">
      <div className="energy-shop-list">
        {energyTab==='stats'&&UPGRADES.map(item=>{
          const level=game.energyUpgrades?.[item.id]??0;
          const costs=upgradeCosts(item.id,level);
          const affordable=costs!==null&&Object.entries(costs).every(([type,cost])=>compareAmount(game.energyBalances[type]??0,cost)>=0);
          return <div className="energy-shop-item" key={item.id}>
            <div><strong>{item.name} Lv. {level} ({item.stat} {item.unit==='ms'?'-':'+'}{formatAmount(level*item.bonus*(item.unit==='flat'||item.unit==='ms'?1:100))}{item.unit==='flat'?'':item.unit==='ms'?'ms':'%'})</strong></div>
            <button type="button" disabled={!affordable||game.phase!=='running'}
              onClick={()=>dispatch({type:'BUY_UPGRADE',id:item.id})}>{costs===null?'최대 레벨':<>{Object.entries(costs).map(([type,cost],index)=><React.Fragment key={type}>{index>0?' + ':''}<EnergyTypeIcon type={type}/>{type} 에너지 {formatAmount(cost)}</React.Fragment>)} 구매</>}</button>
          </div>;
        })}
        {energyTab==='abilities'&&<>
          <div className="energy-shop-item">
            <div><strong>{POINT_CIRCULATION.abilityId} · {POINT_CIRCULATION.name}</strong><small>노말 에너지 +0.5/초</small></div>
            {game.pointCirculationUnlocked?<button type="button" disabled>구매 완료</button>:
              <button type="button" disabled={game.phase!=='running'||Object.entries(POINT_CIRCULATION.costs).some(([type,cost])=>compareAmount(game.energyBalances[type]??0,cost)<0)}
                onClick={()=>dispatch({type:'BUY_CIRCULATION',id:POINT_CIRCULATION.id})}>{Object.entries(POINT_CIRCULATION.costs).map(([type,cost],index)=><React.Fragment key={type}>{index>0?' + ':''}<EnergyTypeIcon type={type}/>{type} 에너지 {formatAmount(cost)}</React.Fragment>)} 구매</button>}
          </div>
          {AUTOMATIONS.map(item=>{
            const owned=game.qolUnlocks?.includes(item.id);
            const active=game.automation?.[item.id]??false;
            return <div className="energy-shop-item" key={item.id}>
              <div><strong>{item.abilityId} · {item.name}</strong><small>{item.description}</small></div>
              {owned?<button type="button" aria-pressed={active} onClick={()=>dispatch({type:'TOGGLE_AUTOMATION',id:item.id})}>
                {active?'활성화 · 끄기':'비활성화 · 켜기'}</button>:
                <button type="button" disabled={compareAmount(game.energyBalances[item.type]??0,item.cost)<0||game.phase==='paused'}
                  onClick={()=>dispatch({type:'BUY_AUTOMATION',id:item.id})}><EnergyTypeIcon type={item.type}/>{item.type} 에너지 {item.cost} 해금</button>}
              {item.id==='download'&&owned&&<div className="energy-auto-buy-options" aria-label="다운로드 자동 구매 항목 설정">
                {UPGRADES.map(upgrade=><label key={upgrade.id} className="energy-auto-buy-option"><input type="checkbox" checked={game.autoBuySelection?.[upgrade.id]??true} onChange={()=>dispatch({type:'TOGGLE_AUTO_BUY_ITEM',id:upgrade.id})}/> {upgrade.name}</label>)}
              </div>}
            </div>;
          })}
        </>}
        <small>구매 시 소비한 타입 에너지와 동일한 수량의 입자가 생성됩니다. 미해금 계층의 입자는 보관됩니다.</small>
      </div>
    </section>;
}
