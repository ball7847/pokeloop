import React,{useEffect,useState,useRef,memo} from 'react';
import {encodeSave,decodeSave,AUTOSAVE_INTERVAL_MS} from './core/saveSystem.js';
import {useGameStore} from './store/useGameStore.js';
import {TopBar} from './components/TopBar.jsx';
import {DittoPage} from './pages/DittoPage.jsx';
import {WildPage} from './pages/WildPage.jsx';
import {CombatBarAnimator} from './components/CombatBarAnimator.jsx';
import {TYPES,LAYERS,FIRST_MILESTONE,particleRates,particleMilestoneThreshold} from './core/energySystem.js';
import {formatAmount,compareAmount,divideAmount} from './core/bigNumber.js';
import {UPGRADES,AUTOMATIONS,upgradeCost,effectiveDittoStats} from './core/shopSystem.js';
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
  const [energyTab,setEnergyTab]=useState('stats');
  const game=useGameStore(s=>s.game);
  const dispatch=useGameStore(s=>s.dispatch);
  const rates=particleRates(game);
  return <div className="energy-overview">
    <div className="intro"><span>PLANETARY ENERGY</span><h2>에너지</h2>
      <p>강화와 자동화를 구매하거나 내부세계의 계층과 입자 생산 현황을 확인합니다.</p></div>
    <div className="ditto-info-tabs energy-section-tabs" role="tablist" aria-label="에너지 분류">
      {[['stats','강화'],['automation','자동화'],['world','내부세계']].map(([id,label])=><button key={id} type="button" role="tab"
        aria-selected={energyTab===id} className={'ditto-info-tab '+(energyTab===id?'is-active':'')}
        onClick={()=>setEnergyTab(id)}>{label}</button>)}
    </div>
    {energyTab==='world'?<div className="energy-world-content" role="tabpanel">
    <section className="panel energy-page-balances"><h3>10계층 입자 생산 현황 <small>{game.unlockedLayer}/10계층 해금</small></h3>
      <div className="energy-layer-list">
        {[...LAYERS].reverse().map(layer=>{
          const unlocked=layer.level<=game.unlockedLayer;
          return <div key={layer.level} className={'energy-layer '+(!unlocked?'is-locked':'')}>
            <header><strong>{layer.level}계층 · {layer.name}</strong><small>{unlocked?'해금됨':'잠김'}</small></header>
            {layer.types.map(t=><div className="energy-layer-type" key={t}>
              <span>{t}</span>
              <strong>{unlocked?formatAmount(game.particleBalances[t]??0):'—'}</strong>
              <small>{unlocked?formatAmount(rates[t]??0)+'/s':'보관 '+formatAmount(game.particleBank[t]??0)}</small>
              <small>누적 {unlocked?formatAmount(game.particleEarned[t]??0):'—'} · 이정표 {game.particleMilestones[t]??0}</small>
              {unlocked&&<small>다음 {formatAmount(particleMilestoneThreshold(game.particleMilestones[t]??0))}</small>}
            </div>)}
          </div>;
        })}
      </div>
      <p>미해금 계층에도 타입 에너지는 정상 지급됩니다. 에너지 구매로 생성된 입자는 100% 보관하고 계층 해금 시 지급됩니다.</p>
    </section>
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
    </div>:<section className="panel energy-purchase-panel" role="tabpanel">
      <div className="energy-shop-list">
        {energyTab==='stats'?UPGRADES.map(item=>{
          const level=game.energyUpgrades?.[item.id]??0;
          const cost=upgradeCost(item.id,level);
          const affordable=compareAmount(game.energyBalances[item.type]??0,cost)>=0;
          return <div className="energy-shop-item" key={item.id}>
            <div><strong>{item.name}</strong><small>Lv. {level} · 레벨당 +{item.unit==='flat'?item.bonus:item.bonus*100}{item.unit==='flat'?'':'%'} {item.stat}</small></div>
            <button type="button" disabled={!affordable||game.combat.active||game.phase==='paused'}
              onClick={()=>dispatch({type:'BUY_UPGRADE',id:item.id})}>{item.type} 에너지 {formatAmount(cost)} 구매</button>
          </div>;
        }):AUTOMATIONS.map(item=>{
          const owned=game.qolUnlocks?.includes(item.id);
          const active=game.automation?.[item.id]??false;
          return <div className="energy-shop-item" key={item.id}>
            <div><strong>{item.name}</strong><small>{item.description}</small></div>
            {owned?<button type="button" aria-pressed={active} onClick={()=>dispatch({type:'TOGGLE_AUTOMATION',id:item.id})}>
              {active?'활성화 · 끄기':'비활성화 · 켜기'}</button>:
              <button type="button" disabled={compareAmount(game.energyBalances[item.type]??0,item.cost)<0||game.phase==='paused'}
                onClick={()=>dispatch({type:'BUY_AUTOMATION',id:item.id})}>{item.type} 에너지 {item.cost} 해금</button>}
          </div>;
        })}
        <small>구매 시 소비한 타입 에너지와 동일한 수량의 입자가 생성됩니다. 미해금 계층의 입자는 보관됩니다.</small>
      </div>
    </section>}
  </div>;
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
      if(game.phase==='running'){
        dispatch({type:'ECONOMY_TICK',deltaMs});
        if(game.recoveryMs>0)dispatch({type:'RECOVERY_TICK',deltaMs});
        if(game.combat.active)dispatch({type:'COMBAT_TICK',deltaMs});
      }
    },100);
    return ()=>clearInterval(id);
  },[]);
  return null;
}
export function App(){
  const [activeTab,setActiveTab]=useState('ditto');
  const [infoTab,setInfoTab]=useState('basic');
  const combatActive=useGameStore(s=>s.game.combat.active);
  const lastCombat=useRef(false);
  useEffect(()=>{
    if(combatActive&&!lastCombat.current)setActiveTab('ditto');
    if(!combatActive&&lastCombat.current)setActiveTab(tab=>tab==='ditto'?'wild':tab);
    lastCombat.current=combatActive;
  },[combatActive]);
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
