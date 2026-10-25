import React,{useEffect,useState,useRef} from 'react';
import {useGameStore} from './store/useGameStore.js';
import {TopBar} from './components/TopBar.jsx';
import {DittoPage} from './pages/DittoPage.jsx';
import {WildPage} from './pages/WildPage.jsx';
import {DexPage} from './pages/DexPage.jsx';
import {EnergyPage} from './pages/EnergyPage.jsx';
import {SettingsPage} from './pages/SettingsPage.jsx';
import {Sidebar} from './components/Sidebar.jsx';
import {LogPanel} from './components/LogPanel.jsx';
import {CombatClock,AutoSaveClock} from './components/GameClocks.jsx';
import {CombatBarAnimator} from './components/CombatBarAnimator.jsx';
// Preserve public imports used by existing tests and integrations.
export {Sidebar,discoveredEnergyItems} from './components/Sidebar.jsx';
export {LogPanel} from './components/LogPanel.jsx';
export {CombatClock} from './components/GameClocks.jsx';
export function App(){
  const [activeTab,setActiveTab]=useState('ditto');
  const [infoTab,setInfoTab]=useState('basic');
  const combatActive=useGameStore(s=>s.game.combat.active);
  const lastCombat=useRef(false);
  useEffect(()=>{
    if(combatActive&&!lastCombat.current)setActiveTab('ditto');
    // Leave the final hit visible for the full 1.2s popup lifetime before changing tabs.
    const finished=!combatActive&&lastCombat.current;
    lastCombat.current=combatActive;
    if(!finished)return;
    const timeout=setTimeout(()=>setActiveTab(tab=>tab==='ditto'?'wild':tab),1200);
    return ()=>clearTimeout(timeout);
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
