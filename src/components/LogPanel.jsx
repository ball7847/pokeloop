import React from 'react';
import {useGameStore} from '../store/useGameStore.js';
export function LogPanel(){
  const logs=useGameStore(s=>s.logs);
  return <aside className="logs" aria-label="이벤트 로그">
    <div className="logs-header"><div><small>HISTORY</small><h2>로그</h2></div>
      <span className="log-count">{logs.length}</span></div>
    <div className="log-body" role="log" aria-live="polite">
      {logs.length?logs.map((log,i)=><div key={logs.length+'-'+i} className="log"><small>시스템</small><p>{log}</p></div>):
        <p className="log-empty">표시할 이벤트가 없습니다.</p>}
    </div>
  </aside>;
}
