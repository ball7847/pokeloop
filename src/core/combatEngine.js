import {REGION,WILD_POKEMON,getWildPokemon,isPokemonUnlocked,spriteUrl,rewardMultiplier} from './wildData.js';
import {rollDamagePercent} from './dittoStats.js';
export const emptyCombat = hp=>({
  active:false, enemy:null, currentHp:hp, maxHp:hp,
  dittoHp:{current:hp,max:hp}, dittoAttackCooldown:null,
  lastEvent:null
});
export function startBattle(state,id) {
  const p=getWildPokemon(id);
  if(!p || state.combat.active || state.phase==='paused'||state.phase==='finished' ||
    (state.killCounts[id]||0)>=REGION.defaultKillLimit || !isPokemonUnlocked(state.killCounts,id))return state;
  const hp=state.dittoStats.hp;
  return {...state,phase:'running',eventSerial:state.eventSerial+1,combat:{
    ...emptyCombat(hp),active:true,pokemonId:id,
    enemy:{
      name:p.name,imageUrl:spriteUrl(p.number),
      hp:{current:p.hp,max:p.hp},
      stats:{HP:p.hp,공격:p.attack,스피드:p.speed},
      rewards:Object.fromEntries(Object.entries(p.rewards).map(([key,value])=>[key,value*rewardMultiplier(state.killCounts[id]||0)])),
      attackCooldown:{elapsed:0,duration:p.speed},
      damage:p.attack
    },
    dittoAttackCooldown:{elapsed:0,duration:state.dittoStats.speed},
    lastEvent:{id:state.eventSerial+1,type:'start',pokemonId:id,name:p.name}
  }};
}
function finish(state,c,type) {
  const p=getWildPokemon(c.pokemonId);
  if(type==='victory') {
    const count=state.killCounts[p.id]||0;
    if(count>=REGION.defaultKillLimit)return {...state,combat:{...c,active:false,enemy:null}};
    const ratio=rewardMultiplier(count);
    const stats={...state.dittoStats};
    for(const [key,base] of Object.entries(p.rewards))stats[key]+=base*ratio;
    return {...state,eventSerial:state.eventSerial+1,dittoStats:stats,victories:state.victories+1,encounterIndex:state.encounterIndex+1,
      killCounts:{...state.killCounts,[p.id]:count+1},
      combat:{...c,active:false,enemy:null,lastEvent:{id:state.eventSerial+1,type:'victory',pokemonId:p.id,name:p.name,
        count:count+1,rewards:Object.fromEntries(Object.entries(p.rewards).map(([k,v])=>[k,v*ratio]))}}};
  }
  return {...state,eventSerial:state.eventSerial+1,combat:{...c,active:false,enemy:null,lastEvent:{id:state.eventSerial+1,type,pokemonId:p.id,name:p.name}}};
}
export function advanceBattle(state,deltaMs,random=Math.random) {
  if(state.phase!=='running'||!state.combat.active)return state;
  if(!Number.isFinite(deltaMs)||deltaMs<=0)return state;
  const c=structuredClone(state.combat);
  // Use real elapsed time; cap catch-up to avoid a burst of attacks after a tab was suspended.
  let remaining=Math.min(deltaMs,5000);
  const my=c.dittoAttackCooldown, foe=c.enemy.attackCooldown;
  const myPeriod=Math.max(1,my.duration), foePeriod=Math.max(1,foe.duration);
  // Advance to the next attack boundary in chronological order, resolving ties player-first.
  for(let steps=0;remaining>0 && steps<1000;steps++){
    const toMine=Math.max(0,myPeriod-my.elapsed);
    const toFoe=Math.max(0,foePeriod-foe.elapsed);
    const next=Math.min(toMine,toFoe,remaining);
    my.elapsed+=next;foe.elapsed+=next;remaining-=next;
    if(my.elapsed<myPeriod && foe.elapsed<foePeriod)break;
    if(my.elapsed>=myPeriod){
      my.elapsed-=myPeriod;
      const factor=rollDamagePercent(state.dittoStats.minDamagePercent,random)/100;
      c.enemy.hp.current=Math.max(0,c.enemy.hp.current-Math.max(0,state.dittoStats.attack*factor));
      if(c.enemy.hp.current<=0)return finish(state,c,'victory');
    }
    if(foe.elapsed>=foePeriod){
      foe.elapsed-=foePeriod;
      const factor=rollDamagePercent(85,random)/100;
      const damage=Math.max(0,c.enemy.damage*factor-Math.max(0,state.dittoStats.defense));
      c.currentHp=Math.max(0,c.currentHp-damage);
      c.dittoHp.current=c.currentHp;
      if(c.currentHp<=0)return finish(state,c,'defeat');
    }
  }
  return {...state,combat:c};
}
export function fleeBattle(state){
  return state.combat.active ? finish(state,state.combat,'flee') : state;
}
