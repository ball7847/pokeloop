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
