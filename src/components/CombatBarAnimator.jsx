import {useEffect} from 'react';
import {useGameStore} from '../store/useGameStore.js';

// Predict only the visual fill between combat ticks. Never mutate the combat state.
export function cooldownProgress(cooldown,deltaMs=0,active=true){
  if(!cooldown||!Number.isFinite(cooldown.duration)||cooldown.duration<=0||!Number.isFinite(cooldown.elapsed))return 0;
  const offset=active&&Number.isFinite(deltaMs)?Math.max(0,deltaMs):0;
  return Math.min(100,Math.max(0,(cooldown.elapsed+offset)/cooldown.duration*100));
}

export function paintCooldownBars(root,combat,deltaMs=0,active=true){
  if(!root||!combat?.active||!combat.enemy)return;
  const bars=[
    ['.battle-cooldown.enemy',combat.enemy.attackCooldown],
    ['.battle-cooldown.ditto',combat.dittoAttackCooldown]
  ];
  for(const [selector,cooldown] of bars){
    const track=root.querySelector(selector+' [role="progressbar"]');
    if(!track)continue;
    const fill=track.querySelector('.battle-cooldown-fill');
    if(!fill)continue;
    const progress=cooldownProgress(cooldown,deltaMs,active);
    fill.style.transform='scaleX('+(progress/100)+')';
    track.setAttribute('aria-valuenow',String(Number(progress.toFixed(1))));
  }
}

// One animation loop while combat is mounted. React renders each 100ms tick,
// but the bar itself changes on animation frames without re-rendering the UI.
export function CombatBarAnimator(){
  useEffect(()=>{
    let frame=null;
    let snapshot=useGameStore.getState().game;
    let sampledAt=performance.now();
    const render=(now)=>{
      frame=null;
      if(!snapshot.combat.active)return;
      paintCooldownBars(document,snapshot.combat,now-sampledAt,snapshot.phase==='running');
      frame=requestAnimationFrame(render);
    };
    const onState=(state)=>{
      if(state.game!==snapshot){
        snapshot=state.game;
        sampledAt=performance.now();
      }
      if(snapshot.combat.active&&frame===null)frame=requestAnimationFrame(render);
      if(!snapshot.combat.active&&frame!==null){
        cancelAnimationFrame(frame);
        frame=null;
      }
    };
    const unsubscribe=useGameStore.subscribe(onState);
    onState(useGameStore.getState());
    return ()=>{
      unsubscribe();
      if(frame!==null)cancelAnimationFrame(frame);
    };
  },[]);
  return null;
}
