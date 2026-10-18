import React,{useEffect,useState,useRef,memo} from 'react';
import {encodeSave,decodeSave,AUTOSAVE_INTERVAL_MS} from './core/saveSystem.js';
import {useGameStore} from './store/useGameStore.js';
import {TopBar} from './components/TopBar.jsx';
import {DittoPage} from './pages/DittoPage.jsx';
import {WildPage} from './pages/WildPage.jsx';
const TABS=[['ditto','메타몽'],['wild','야생'],['dex','도감'],['settings','설정']];
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
  return <><div className="intro"><span>OPTIONS</span><h2>설정</h2><p>저장 데이터를 관리합니다.</p></div>
    <SaveSettings/>
  </>;
}
function SaveSettings(){
  const autoSaveEnabled=useGameStore(s=>s.autoSaveEnabled);
  const lastSavedAt=useGameStore(s=>s.lastSavedAt);
  const saveError=useGameStore(s=>s.saveError);
  const [feedback,setFeedback]=useState('');
  const [pasteOpen,setPasteOpen]=useState(false);
  const [pasteText,setPasteText]=useState('');
  const fileRef=useRef(null);
  const notify=(action,success)=>{
    try{success(action());}catch(error){setFeedback('오류: '+error.message);}
  };
  const importEncoded=encoded=>notify(()=>decodeSave(encoded),({game})=>{
    if(!window.confirm('현재 진행 상황을 불러온 데이터로 덮어쓸까요?'))return;
    useGameStore.getState().restoreGame(game);
    setPasteOpen(false);setPasteText('');setFeedback('저장 데이터를 불러왔습니다. 로컬에도 저장하려면 로컬 저장을 누르세요.');
  });
  const exportEncoded=()=>encodeSave(useGameStore.getState().game);
  const saveFile=()=>notify(exportEncoded,encoded=>{
    const blob=new Blob([encoded+'\n'],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='pokeloop-save-'+new Date().toISOString().slice(0,10)+'.txt';
    document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
    setFeedback('TXT 파일로 저장했습니다.');
  });
  const copySave=async()=>{
    try{await navigator.clipboard.writeText(exportEncoded());setFeedback('클립보드에 Base64 저장 데이터를 복사했습니다.');}
    catch(e){setFeedback('클립보드 복사가 차단되었습니다: '+e.message);}
  };
  const pasteSave=async()=>{
    try{importEncoded(await navigator.clipboard.readText());}
    catch{setPasteOpen(true);setFeedback('클립보드 접근이 제한되었습니다. 아래 입력란에 붙여넣으세요.');}
  };
  const readFile=async(event)=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    if(file.size>1000000){setFeedback('오류: 저장 파일이 너무 큽니다.');return;}
    try{importEncoded(await file.text());}
    catch(e){setFeedback('오류: '+e.message);}
  };
  const reset=()=>{
    if(!window.confirm('모든 로컬 저장 데이터를 삭제하고 게임 진행 상황을 초기화할까요? 이 작업은 되돌릴 수 없습니다.'))return;
    notify(()=>useGameStore.getState().resetSavedGame(),()=>{
      setPasteOpen(false);setPasteText('');setFeedback('로컬 데이터를 삭제하고 게임을 초기화했습니다.');
    });
  };
  return <section className="panel save-panel" aria-label="저장 관리">
    <h3>저장 관리</h3>
    <div className="save-last"><small>최근 로컬 저장 시점</small><strong>{lastSavedAt?new Date(lastSavedAt).toLocaleString('ko-KR'):'저장 기록 없음'}</strong></div>
    <div className="save-toggle"><span>자동 저장 <small>30초마다 로컬에 저장</small></span>
      <button type="button" aria-pressed={autoSaveEnabled} onClick={()=>notify(()=>useGameStore.getState().setAutoSaveEnabled(!autoSaveEnabled),()=>setFeedback('자동 저장 '+(!autoSaveEnabled?'ON':'OFF')))}>
        {autoSaveEnabled?'자동 저장 ON':'자동 저장 OFF'}
      </button>
    </div>
    <div className="save-actions">
      <button type="button" onClick={()=>notify(()=>useGameStore.getState().saveLocal(),()=>setFeedback('로컬에 저장했습니다.'))}>로컬 저장</button>
      <button type="button" className="save-danger" onClick={reset}>초기화</button>
      <button type="button" onClick={saveFile}>파일로 저장</button>
      <button type="button" onClick={copySave}>클립보드로 저장</button>
      <button type="button" onClick={()=>fileRef.current?.click()}>파일로 불러오기</button>
      <button type="button" onClick={pasteSave}>클립보드로 불러오기</button>
    </div>
    <input ref={fileRef} type="file" accept=".txt,text/plain" hidden onChange={readFile} aria-label="저장 파일 선택"/>
    {pasteOpen&&<div className="save-paste"><label htmlFor="save-paste-text">Base64 저장 문자열 붙여넣기</label>
      <textarea id="save-paste-text" value={pasteText} onChange={e=>setPasteText(e.target.value)} rows={4}/>
      <button type="button" onClick={()=>importEncoded(pasteText)}>붙여넣은 데이터 불러오기</button>
    </div>}
    {(feedback||saveError)&&<p className="save-feedback" role="status">{feedback||saveError}</p>}
  </section>;
}
function AutoSaveClock(){
  useEffect(()=>{
    const id=setInterval(()=>{
      const state=useGameStore.getState();
      if(!state.autoSaveEnabled)return;
      try{state.saveLocal();}
      catch(e){useGameStore.setState({saveError:'자동 저장 실패: '+e.message});}
    },AUTOSAVE_INTERVAL_MS);
    return ()=>clearInterval(id);
  },[]);
  return null;
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
  return <div className="shell"><CombatClock/><AutoSaveClock/><TopBar/>
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
