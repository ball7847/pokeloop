import React,{useEffect,useState,memo} from 'react';
import {useGameStore} from './store/useGameStore.js';
import {TopBar} from './components/TopBar.jsx';
import {DittoPage} from './pages/DittoPage.jsx';
import {WildPage} from './pages/WildPage.jsx';
const TABS=[['ditto','메타몽'],['wild','야생'],['dex','도감'],['settings','설정']];
const phaseLabels={ready:'대기 중',running:'진행 중',paused:'일시정지',finished:'완료'};
export const Sidebar=memo(function Sidebar({activeTab,onTabChange}){
  return <nav className="sidebar" aria-label="메인 메뉴"><small>MENU</small>
    {TABS.map(([id,label])=><button key={id} className={'tab '+(activeTab===id?'selected':'')}
      type="button" aria-current={activeTab===id?'page':undefined}
      onClick={()=>onTabChange(id)}>{label}<span>›</span></button>)}
  </nav>;
});
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
function DexPage(){return <><div className="intro"><span>COLLECTION</span><h2>도감</h2>
  <p>발견한 포켓몬을 확인하는 화면입니다.</p></div>
  <div className="panel empty"><div className="symbol">▤</div><h3>도감 준비 중</h3>
    <p>도감 데이터는 이후 추가합니다.</p></div></>}
function SettingsPage(){
  const phase=useGameStore(s=>s.game.phase),dispatch=useGameStore(s=>s.dispatch);
  const actions=[['시작','START',phase!=='ready'],['일시정지','PAUSE',phase!=='running'],
    ['재개','RESUME',phase!=='paused'],['초기화','RESET',false]];
  return <><div className="intro"><span>OPTIONS</span><h2>설정</h2><p>기본 게임 상태를 제어할 수 있습니다.</p></div>
    <div className="panel"><h3>게임 상태: {phaseLabels[phase]}</h3><div className="actions">
      {actions.map(([label,type,disabled])=><button key={type} type="button" disabled={disabled}
        onClick={()=>dispatch({type})}>{label}</button>)}</div></div></>;
}
// The clock is mounted once above all pages. Tab switches do not affect combat.
export function CombatClock(){
  useEffect(()=>{
    let last=performance.now();
    const id=setInterval(()=>{
      const now=performance.now(),deltaMs=Math.max(0,now-last);
      last=now;
      const {game,dispatch}=useGameStore.getState();
      if(game.combat.active&&game.phase==='running')dispatch({type:'COMBAT_TICK',deltaMs});
    },100);
    return ()=>clearInterval(id);
  },[]);
  return null;
}
export function App(){
  const [activeTab,setActiveTab]=useState('ditto');
  const [infoTab,setInfoTab]=useState('basic');
  return <div className="shell"><CombatClock/><TopBar/>
    <div className="workspace">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab}/>
      <main className="main" id="main-content">
        {activeTab==='ditto'?<DittoPage infoTab={infoTab} setInfoTab={setInfoTab}/>:
          activeTab==='wild'?<WildPage/>:activeTab==='dex'?<DexPage/>:<SettingsPage/>}
      </main>
      <LogPanel/>
    </div>
  </div>;
}
