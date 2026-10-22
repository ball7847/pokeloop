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
