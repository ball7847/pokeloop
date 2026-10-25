import {useEffect} from 'react';
import {AUTOSAVE_INTERVAL_MS} from '../core/saveSystem.js';
import {useGameStore} from '../store/useGameStore.js';

export function AutoSaveClock(){
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

// Wall-clock idle time produces resources only. Foreground combat and recovery
// use a bounded, carried-over elapsed-time budget, never an offline catch-up.
export function CombatClock(){
  useEffect(()=>{
    let last=performance.now();
    let wasHidden=typeof document!=='undefined'&&document.hidden;
    let combatDebtMs=0;
    const run=()=>{
      const now=performance.now(),deltaMs=Math.max(0,now-last);
      last=now;
      const store=useGameStore.getState();
      if(store.game.phase!=='running'){
        combatDebtMs=0;
        return;
      }
      const hidden=typeof document!=='undefined'&&document.hidden;
      if(hidden||wasHidden){
        // Large or throttled hidden ticks must never simulate combat.
        if(deltaMs>0)store.queueOfflineProduction(deltaMs/1000);
        combatDebtMs=0;
      }else if(deltaMs>0){
        // All truly foreground elapsed time belongs to combat (including long stalls).
        // Its unused portion is carried to later frames rather than discarded.
        combatDebtMs+=deltaMs;
        if(deltaMs<=5000)store.dispatch({type:'ECONOMY_TICK',deltaMs});
        else store.queueOfflineProduction(deltaMs/1000);
        // Carry excess foreground simulation into later ticks, honoring engine limits.
        let chunks=0;
        while(combatDebtMs>0&&chunks++<8){
          const ms=Math.min(5000,combatDebtMs);
          const current=useGameStore.getState().game;
          if(current.phase!=='running')break;
          const recoveryPart=Math.min(ms,current.recoveryMs??0);
          if(recoveryPart>0)store.dispatch({type:'RECOVERY_TICK',deltaMs:recoveryPart});
          const battlePart=ms-recoveryPart;
          if(battlePart>0&&useGameStore.getState().game.combat.active)
            store.dispatch({type:'COMBAT_TICK',deltaMs:battlePart});
          combatDebtMs-=ms;
        }
      }
      wasHidden=hidden;
      // Catch up economy in small chunks, bounded by elapsed processing time.
      // Remaining seconds are retained in store and in autosave's logical timestamp.
      const begin=performance.now();
      while(useGameStore.getState().offlineRemainingSeconds>0&&performance.now()-begin<12){
        useGameStore.getState().consumeOfflineProduction(5);
      }
    };
    const id=setInterval(run,100);
    const onVisibility=()=>{
      // Never replay a hidden interval as foreground combat.
      const now=performance.now();
      const delta=Math.max(0,now-last);
      if(wasHidden&&delta>0&&useGameStore.getState().game.phase==='running')
        useGameStore.getState().queueOfflineProduction(delta/1000);
      last=now;
      wasHidden=typeof document!=='undefined'&&document.hidden;
    };
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',onVisibility);
    return ()=>{
      clearInterval(id);
      if(typeof document!=='undefined')document.removeEventListener('visibilitychange',onVisibility);
    };
  },[]);
  return null;
}
