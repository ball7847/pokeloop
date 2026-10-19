import {StatLabel} from '../components/StatIcon.jsx';
import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {visibleBasicStats,formatBasicStat} from '../core/dittoStats.js';
import {DittoBattle} from '../components/CombatPanel.jsx';
import {effectiveDittoStats,AUTOMATIONS} from '../core/shopSystem.js';
export const INFO_TABS=[
  ['basic','기본 능력치'],['special','특수 능력치'],['bonus','보너스'],
  ['automation','자동화'],['assimilation','동화도']
];
const PENDING={
  special:'특수 능력치 시스템은 추후 연결됩니다.',
  bonus:'보너스 효과 시스템은 추후 연결됩니다.',

  assimilation:'타입별 동화도 시스템은 추후 연결됩니다.'
};
export function DittoPage({infoTab,setInfoTab}){
  const game=useGameStore(s=>s.game);
  const stats=effectiveDittoStats(game);
  const dispatch=useGameStore(s=>s.dispatch);
  return <div className="ditto-page">
    <section className="ditto-info-region" aria-label="메타몽 정보 영역">
      <div className="ditto-info-tabs" role="tablist" aria-label="메타몽 정보 분류">
        {INFO_TABS.map(([id,label])=><button key={id} type="button" role="tab"
          aria-selected={infoTab===id} className={'ditto-info-tab '+(infoTab===id?'is-active':'')}
          onClick={()=>setInfoTab(id)}>{label}</button>)}</div>
      <div className="ditto-info-body" role="tabpanel">
        {infoTab==='basic'?<div className="ditto-detail-stats">
          {visibleBasicStats(stats).map(({key,label,description})=>
            <div key={key} className="ditto-detail-stat" title={description}><StatLabel stat={key} label={label}/>
              <strong>{formatBasicStat(key,stats[key])}</strong></div>)}
        </div>:infoTab==='automation'?<div className="ditto-automation-options">
          {AUTOMATIONS.map(item=><div key={item.id} className="ditto-automation-row"><strong>{item.name}</strong>
            <small>{item.description}</small><button type="button" disabled={!game.qolUnlocks.includes(item.id)}
              aria-pressed={!!game.automation?.[item.id]} onClick={()=>dispatch({type:'TOGGLE_AUTOMATION',id:item.id})}>
              {!game.qolUnlocks.includes(item.id)?'미해금':game.automation[item.id]?'켜짐':'꺼짐'}</button></div>)}
        </div>:<div className="ditto-info-pending">{PENDING[infoTab]}</div>}
      </div>
    </section>
    <DittoBattle/>
  </div>;
}
