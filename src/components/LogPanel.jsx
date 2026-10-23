import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
import {EnergyTypeIcon,TYPE_ICON_FILES} from './EnergyTypeIcon.jsx';

// Preserve the existing plain-text logs; decorate only recognised energy gains.
const energyRewardPattern=/((?:노말|불꽃|물|풀|전기|얼음|격투|독|땅|비행|에스퍼|벌레|바위|고스트|드래곤|악|강철|페어리) 에너지 \\+[^,\\s]+)/g;
export function renderLogMessage(message){
  if(typeof message!=='string')return message;
  return message.split(energyRewardPattern).map((part,index)=>{
    const type=part.split(' 에너지 +')[0];
    return Object.hasOwn(TYPE_ICON_FILES,type)&&part.includes(' 에너지 +')
      ?<span key={index} className="log-energy-gain"><EnergyTypeIcon type={type}/>{part}</span>
      :part;
  });
}
export function LogPanel(){
  const logs=useGameStore(s=>s.logs);
  return <aside className="logs" aria-label="이벤트 로그">
    <div className="logs-header"><div><small>HISTORY</small><h2>로그</h2></div>
      <span className="log-count">{logs.length}</span></div>
    <div className="log-body" role="log" aria-live="polite">
      {logs.length?logs.map((log,i)=><div key={logs.length+'-'+i} className="log"><small>시스템</small><p>{renderLogMessage(log)}</p></div>):
        <p className="log-empty">표시할 이벤트가 없습니다.</p>}
    </div>
  </aside>;
}
