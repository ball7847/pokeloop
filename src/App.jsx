import React,{useEffect,useState,useRef,memo} from 'react';
import {encodeSave,decodeSave,AUTOSAVE_INTERVAL_MS} from './core/saveSystem.js';
import {useGameStore} from './store/useGameStore.js';
import {TopBar} from './components/TopBar.jsx';
import {DittoPage} from './pages/DittoPage.jsx';
import {WildPage} from './pages/WildPage.jsx';
import {CombatBarAnimator} from './components/CombatBarAnimator.jsx';
const TABS=[['settings','설정'],['ditto','메타몽'],['wild','야생'],['dex','도감'],['energy','에너지']];
const ENERGY_IDS=Array.from({length:18},(_,i)=>'energy-'+String(i+1).padStart(2,'0'));
export function discoveredEnergyItems(game){
  const discovered=Array.isArray(game?.discoveredEnergies)?game.discoveredEnergies:[];
  const amounts=game?.energyBalances??{};
  return ENERGY_IDS.filter(id=>discovered.includes(id)).map(id=>({id,name:'에너지 '+Number(id.slice(-2)),amount:amounts[id]??0}));
}
export const Sidebar=memo(function Sidebar({activeTab,onTabChange}){
  const game=useGameStore(s=>s.game);
  const items=discoveredEnergyItems(game);
  return <nav className="sidebar" aria-label="메인 메뉴"><small>MENU</small>
    {TABS.map(([id,label])=><button key={id} className={'tab '+(activeTab===id?'selected':'')}
      type="button" aria-current={activeTab===id?'page':undefined}
      onClick={()=>onTabChange(id)}>{label}<span>›</span></button>)}
    <section className="sidebar-energies" aria-label="보유 에너지"><div className="sidebar-energy-title"><strong>보유 에너지</strong><small>{items.length}/18</small></div>
      {items.length? <div className="sidebar-energy-list">{items.map(item=><div className="sidebar-energy-item" key={item.id}><span>{item.name}</span><strong>{String(item.amount)}</strong></div>)}</div>:
        <p className="sidebar-energy-empty">발견한 에너지가 없습니다.</p>}
    </section>
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
function EnergyPage(){
  const [purchaseTab,setPurchaseTab]=useState('stats');
  const game=useGameStore(s=>s.game);
  const items=discoveredEnergyItems(game);
  return <><div className="intro"><span>ENERGY</span><h2>에너지</h2><p>발견한 에너지를 확인하고 강화 및 자동화를 관리합니다.</p></div>
    <section className="panel energy-page-balances"><h3>보유 에너지 <small>{items.length}/18종 발견</small></h3>
      {items.length?<div className="energy-balance-grid">{items.map(item=><div key={item.id} className="energy-balance-item"><span>{item.name}</span><strong>{String(item.amount)}</strong></div>)}</div>:<p>아직 발견한 에너지가 없습니다.</p>}</section>
    <section className="panel energy-purchase-panel"><div className="energy-purchase-tabs" role="tablist" aria-label="에너지 구매 분류">
      <button type="button" role="tab" aria-selected={purchaseTab==='stats'} className={purchaseTab==='stats'?'selected':''} onClick={()=>setPurchaseTab('stats')}>능력치 강화</button>
      <button type="button" role="tab" aria-selected={purchaseTab==='automation'} className={purchaseTab==='automation'?'selected':''} onClick={()=>setPurchaseTab('automation')}>자동화</button></div>
      <div role="tabpanel" className="energy-purchase-placeholder">{purchaseTab==='stats'?'능력치 강화':'자동화'} 구매 항목은 추후 추가됩니다.</div></section>
  </>;
}
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
  return <div className="shell"><CombatClock/><CombatBarAnimator/><AutoSaveClock/><TopBar/>
    <div className="workspace">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab}/>
      <main className="main" id="main-content">
        {activeTab==='ditto'?<DittoPage infoTab={infoTab} setInfoTab={setInfoTab}/>:
          activeTab==='wild'?<WildPage/>:activeTab==='dex'?<DexPage/>:activeTab==='energy'?<EnergyPage/>:<SettingsPage/>}
      </main>
      <LogPanel/>
    </div>
  </div>;
}
