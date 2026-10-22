import React,{memo} from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {TYPES} from '../core/energySystem.js';
import {formatAmount,compareAmount} from '../core/bigNumber.js';
const TABS=[['settings','설정'],['ditto','메타몽'],['wild','야생'],['dex','도감'],['energy','에너지']];
export function discoveredEnergyItems(game){
  const amounts=game?.energyBalances??{};
  return TYPES.filter(type=>compareAmount(amounts[type]??0,0)>0||compareAmount(game?.particleBalances?.[type]??0,0)>0||compareAmount(game?.particleEarned?.[type]??0,0)>0||compareAmount(game?.particleBank?.[type]??0,0)>0)
    .map(type=>({id:type,name:type+' 에너지',amount:amounts[type]??0}));
}
export const Sidebar=memo(function Sidebar({activeTab,onTabChange}){
  const game=useGameStore(s=>s.game);
  const items=discoveredEnergyItems(game);
  return <nav className="sidebar" aria-label="메인 메뉴"><small>MENU</small>
    {TABS.map(([id,label])=><button key={id} className={'tab '+(activeTab===id?'selected':'')}
      type="button" aria-current={activeTab===id?'page':undefined}
      onClick={()=>onTabChange(id)}>{label}<span>›</span></button>)}
    <section className="sidebar-energies" aria-label="보유 에너지"><div className="sidebar-energy-title"><strong>보유 에너지</strong><small>{items.length}/18</small></div>
      {items.length? <div className="sidebar-energy-list">{items.map(item=><div className="sidebar-energy-item" key={item.id}><span>{item.name}</span><strong>{formatAmount(item.amount)}</strong></div>)}</div>:
        <p className="sidebar-energy-empty">발견한 에너지가 없습니다.</p>}
    </section>
  </nav>;
});
