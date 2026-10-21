import {REGION,getWildPokemon,isPokemonUnlockedInState,regionForPokemon,spriteUrl,scaledReward,battleEnergyRewards} from './wildData.js';
import {rollDamagePercent, visibleNonDefaultStats} from './dittoStats.js';
import {grantBattleEnergy} from './energySystem.js';
import {effectiveDittoStats} from './shopSystem.js';
import {addAmount,subtractAmount,multiplyAmount,compareAmount} from './bigNumber.js';
export const emptyCombat = hp=>({
  active:false, enemy:null, currentHp:hp, maxHp:hp,
  dittoHp:{current:hp,max:hp}, dittoAttackCooldown:null,
  playerStatus:{paralysis:0,poison:0},enemyStatus:{paralysis:0,poison:0},
  lastEvent:null
});
export function startBattle(state,id,carryHp=null,carryStatus=null) {
  const p=getWildPokemon(id);
  if(!p || (p.rarity==='uncommon'&&!(p.id==='pikachu'?state.berryRareAppeared:p.id===state.uncommonStarterId)) || state.combat.active || (state.recoveryMs??0)>0 || state.phase==='paused'||state.phase==='finished' ||
    (state.killCounts[id]||0)>=REGION.defaultKillLimit || !isPokemonUnlockedInState(state,id))return state;
  const effective=effectiveDittoStats(state);
  const hp=effective.hp;
  const currentHp=carryHp===null?hp:carryHp;
  if(regionForPokemon(id)!==state.activeRegionId)return state;
  return {...state,phase:'running',eventSerial:state.eventSerial+1,
    dexDiscovered:state.dexDiscovered.includes(id)?state.dexDiscovered:[...state.dexDiscovered,id],combat:{
    ...emptyCombat(hp),currentHp,dittoHp:{current:currentHp,max:hp},active:true,pokemonId:id,
    playerStatus:carryStatus??{paralysis:0,poison:0},enemyStatus:{paralysis:0,poison:0},
    enemy:{
      name:p.name,imageUrl:spriteUrl(p.number),
      hp:{current:p.hp,max:p.hp},
      stats:Object.fromEntries(visibleNonDefaultStats(p).map(({key,label})=>[label,p[key]])),
      minDamagePercent:p.minDamagePercent,
      rewards:Object.fromEntries(Object.entries(p.rewards).map(([key,value])=>[key,scaledReward(key,value,state.killCounts[id]||0)])),
      attackCooldown:{elapsed:0,duration:p.speed},
      damage:p.attack,statistics:p
    },
    dittoAttackCooldown:{elapsed:0,duration:effective.speed},
    lastEvent:{id:state.eventSerial+1,type:'start',pokemonId:id,name:p.name}
  }};
}
function finish(state,c,type) {
  const p=getWildPokemon(c.pokemonId);
  if(type==='victory') {
    const count=state.killCounts[p.id]||0;
    if(count>=REGION.defaultKillLimit)return {...state,combat:{...c,active:false,enemy:null}};
    const stats={...state.dittoStats};
    for(const [key,base] of Object.entries(p.rewards)){
      const value=scaledReward(key,base,count);
      stats[key]=key==='speed'?Math.max(1,stats.speed+value):addAmount(stats[key],value);
    }
    let rewarded=state;
    for(const [type,amount] of Object.entries(battleEnergyRewards(p,count)))
      rewarded=grantBattleEnergy(rewarded,[type],amount);
    const updated={...rewarded,eventSerial:state.eventSerial+1,dittoStats:stats,victories:state.victories+1,
      encounterIndex:state.encounterIndex+1,
      killCounts:{...state.killCounts,[p.id]:count+1},
      dexDiscovered:state.dexDiscovered.includes(p.id)?state.dexDiscovered:[...state.dexDiscovered,p.id],
      combat:{...c,active:false,enemy:null,lastEvent:{id:state.eventSerial+1,type:'victory',pokemonId:p.id,name:p.name,
        count:count+1,rewards:Object.fromEntries(Object.entries(p.rewards).map(([k,v])=>[k,scaledReward(k,v,count)]))}}};
    if(updated.automation?.hunger&&count+1<REGION.defaultKillLimit&&compareAmount(c.currentHp,0)>0){
      // Reward applies before next encounter. Current HP carries over without healing.
      // A follow-up attack starts a fresh enemy and cooldown, not a new run.
      const continued=startBattle(updated,p.id,c.currentHp,c.playerStatus);
      // Keep the victory notification while entering the next encounter;
      // the UI should log every kill rather than hiding chained rewards.
      return {...continued,combat:{...continued.combat,
        lastEvent:{...updated.combat.lastEvent,id:continued.eventSerial}}};
    }
    return updated;
  }
  const cooldown=type==='defeat'?10000:type==='flee'?5000:0;
  return {...state,eventSerial:state.eventSerial+1,recoveryMs:cooldown,
    retryPokemonId:type==='defeat'&&state.automation?.resolve?p.id:null,
    combat:{...c,active:false,enemy:null,lastEvent:{id:state.eventSerial+1,type,pokemonId:p.id,name:p.name}}};
}
export function hitChance(attacker,defender){
  const accuracy=attacker.accuracy??100,dodge=defender.dodge??0;
  if(accuracy<=0)return 0;
  const scaledDodge=accuracy>100?dodge/(accuracy/100):dodge;
  return Math.max(0,Math.min(1,(Math.min(accuracy,100)-scaledDodge)/100));
}
const freshStatus=()=>({paralysis:0,poison:0});
export function resolveAttack(c,attacker,attackerStats,defenderStats,random=Math.random){
  const player=attacker==='player';
  const actingStatus=player?c.playerStatus:c.enemyStatus;
  const targetStatus=player?c.enemyStatus:c.playerStatus;
  const actingHp=player?()=>c.currentHp:()=>c.enemy.hp.current;
  const setActingHp=value=>{
    if(player){c.currentHp=value;c.dittoHp.current=value;}
    else c.enemy.hp.current=value;
  };
  const defenderHp=player?()=>c.enemy.hp.current:()=>c.currentHp;
  const setDefenderHp=value=>{
    if(player)c.enemy.hp.current=value;
    else {c.currentHp=value;c.dittoHp.current=value;}
  };
  const cancelChance=Math.min(250,actingStatus.paralysis)*.001;
  const cancelled=random()<cancelChance;
  const hit=!cancelled&&random()<hitChance(attackerStats,defenderStats);
  if(hit){
    // Physical and special damage are separate channels within the same action.
    let damage=0;
    for(const [attack,defense] of [['attack','defense'],['specialAttack','specialDefense']]){
      if(compareAmount(attackerStats[attack]??0,0)<=0)continue;
      const factor=rollDamagePercent(attackerStats.minDamagePercent??85,random)/100;
      const raw=multiplyAmount(attackerStats[attack],factor);
      const net=subtractAmount(raw,defenderStats[defense]??0);
      if(compareAmount(net,0)>0)damage=addAmount(damage,net);
    }
    if(compareAmount(damage,0)>0)setDefenderHp(subtractAmount(defenderHp(),damage));
    targetStatus.paralysis=Math.min(250,targetStatus.paralysis+(attackerStats.paralysis??0));
    targetStatus.poison=addAmount(targetStatus.poison,attackerStats.poison??0);
  }
  // Poison is always paid by the acting unit at the END of its action,
  // even when paralysis cancels the attack or accuracy misses.
  if(compareAmount(actingStatus.poison,0)>0)setActingHp(subtractAmount(actingHp(),actingStatus.poison));
  return {hit,cancelled};
}
export function advanceBattle(state,deltaMs,random=Math.random) {
  if(state.phase!=='running'||!state.combat.active)return state;
  if(!Number.isFinite(deltaMs)||deltaMs<=0)return state;
  const c=structuredClone(state.combat);
  c.playerStatus??=freshStatus();c.enemyStatus??=freshStatus();
  const playerStats=effectiveDittoStats(state),enemyStats=c.enemy.statistics??getWildPokemon(c.pokemonId);
  let remaining=Math.min(deltaMs,5000);
  const my=c.dittoAttackCooldown,foe=c.enemy.attackCooldown;
  const myPeriod=Math.max(1,my.duration),foePeriod=Math.max(1,foe.duration);
  for(let steps=0;remaining>0&&steps<1000;steps++){
    const toMine=Math.max(0,myPeriod-my.elapsed),toFoe=Math.max(0,foePeriod-foe.elapsed);
    const next=Math.min(toMine,toFoe,remaining);
    my.elapsed+=next;foe.elapsed+=next;remaining-=next;
    if(my.elapsed<myPeriod&&foe.elapsed<foePeriod)break;
    if(my.elapsed>=myPeriod){
      my.elapsed-=myPeriod;
      resolveAttack(c,'player',playerStats,enemyStats,random);
      if(compareAmount(c.currentHp,0)<=0)return finish(state,c,'defeat');
      if(compareAmount(c.enemy.hp.current,0)<=0)return finish(state,c,'victory');
    }
    if(foe.elapsed>=foePeriod){
      foe.elapsed-=foePeriod;
      resolveAttack(c,'enemy',enemyStats,playerStats,random);
      if(compareAmount(c.currentHp,0)<=0)return finish(state,c,'defeat');
      if(compareAmount(c.enemy.hp.current,0)<=0)return finish(state,c,'victory');
    }
  }
  return {...state,combat:c};
}
export function fleeBattle(state){
  return state.combat.active ? finish(state,state.combat,'flee') : state;
}
