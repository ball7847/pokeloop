import {REGION,getWildPokemon,isPokemonUnlockedInState,regionForPokemon,spriteUrl,scaledReward,battleEnergyRewards,evolutionFor,evolutionChance} from './wildData.js';
import {rollDamagePercent, visibleNonDefaultStats} from './dittoStats.js';
import {grantBattleEnergy} from './energySystem.js';
import {recordItemProgress} from './itemSystem.js';
import {stellarBattleEnergyReward} from './stellarUpgrades.js';
import {effectiveDittoStats} from './shopSystem.js';
import {addAmount,subtractAmount,multiplyAmount,compareAmount,decimal} from './bigNumber.js';
import {appendDamageEvents,appendStatusDamageEvent,appendHealingEvent} from './combatVisualEvents.js';
export const emptyCombat = hp=>({
  active:false, enemy:null, currentHp:hp, maxHp:hp,
  dittoHp:{current:hp,max:hp}, dittoAttackCooldown:null, regenerationElapsedMs:0,
  playerStatus:{paralysis:0,poison:0},enemyStatus:{paralysis:0,poison:0},
  lastEvent:null
});
export function startBattle(state,id,carryHp=null,carryStatus=null) {
  const p=getWildPokemon(id);
  if(!p || state.combat.active || (state.recoveryMs??0)>0 || state.phase==='paused'||state.phase==='finished' ||
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
      minDamagePercent:p.minDamagePercent,maxDamagePercent:p.maxDamagePercent,
      rewards:Object.fromEntries(Object.entries(p.rewards).map(([key,value])=>[key,scaledReward(key,value,state.killCounts[id]||0)])),
      energyRewards:Object.fromEntries(Object.entries(battleEnergyRewards(p,state.killCounts[id]||0)).map(([type,amount])=>[type,stellarBattleEnergyReward(state,type,amount)])),
      attackCooldown:{elapsed:0,duration:p.speed},
      damage:p.attack,statistics:p
    },
    dittoAttackCooldown:{elapsed:0,duration:effective.speed},
    lastEvent:{id:state.eventSerial+1,type:'start',pokemonId:id,name:p.name}
  }};
}
function finish(state,c,type,random=Math.random) {
  const p=getWildPokemon(c.pokemonId);
  if(type==='victory') {
    const count=state.killCounts[p.id]||0;
    if(count>=REGION.defaultKillLimit)return {...state,combat:{...c,active:false,enemy:null}};
    const stats={...state.dittoStats};
    for(const [key,base] of Object.entries(p.rewards)){
      const value=scaledReward(key,base,count);
      stats[key]=key==='speed'?Math.max(100,stats.speed+value):addAmount(stats[key],value);
    }
    const energyRewards=Object.fromEntries(Object.entries(battleEnergyRewards(p,count)).map(([type,amount])=>[type,stellarBattleEnergyReward(state,type,amount)]));
    let rewarded=state;
    for(const [type,amount] of Object.entries(energyRewards))
      rewarded=grantBattleEnergy(rewarded,[type],amount);
    const evolution=count===0?evolutionFor(p.id):null;
    const evolutionResults=evolution?{...state.evolutionResults,[evolution.id]:random()<evolutionChance(evolution,state)}:state.evolutionResults;
    const itemProgress=recordItemProgress(recordItemProgress(rewarded,'victories'),'pokemon:'+p.id);
    const updated={...itemProgress,dexLifetimeKills:{...state.dexLifetimeKills,[p.id]:(state.dexLifetimeKills?.[p.id]??0)+1},evolutionResults,eventSerial:state.eventSerial+1,dittoStats:stats,victories:state.victories+1,
      encounterIndex:state.encounterIndex+1,
      killCounts:{...state.killCounts,[p.id]:count+1},
      dexDiscovered:state.dexDiscovered.includes(p.id)?state.dexDiscovered:[...state.dexDiscovered,p.id],
      combat:{...c,active:false,enemy:null,lastEvent:{id:state.eventSerial+1,type:'victory',pokemonId:p.id,name:p.name,
        count:count+1,rewards:Object.fromEntries(Object.entries(p.rewards).map(([k,v])=>[k,scaledReward(k,v,count)])),energyRewards}}};
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
export function resolveAttack(c,attacker,attackerStats,defenderStats,random=Math.random,visualEvents=[]){
  const player=attacker==='player';
  const actingStatus=player?c.playerStatus:c.enemyStatus;
  const targetStatus=player?c.enemyStatus:c.playerStatus;
  const defenderHp=player?()=>c.enemy.hp.current:()=>c.currentHp;
  const setDefenderHp=value=>{
    if(player)c.enemy.hp.current=value;
    else {c.currentHp=value;c.dittoHp.current=value;}
  };
  // Paralysis never cancels the current attack. A successful 25% proc
  // consumes the entire stack and extends only the NEXT attack cooldown.
  const paralysis=actingStatus.paralysis??0;
  const triggered=compareAmount(paralysis,0)>0&&random()<0.25;
  const delayMs=triggered?Math.min(Number.MAX_VALUE,decimal(paralysis).toNumber()):0;
  if(triggered)actingStatus.paralysis=0;
  const target=player?'enemy':'player';
  const strike=()=>{
  const hit=random()<hitChance(attackerStats,defenderStats);
  if(hit){
    // Physical and special damage are separate channels within the same action.
    let damage=0;
    const channels=[];
    for(const [attack,defense,kind] of [['attack','defense','physical'],['specialAttack','specialDefense','special']]){
      if(compareAmount(attackerStats[attack]??0,0)<=0)continue;
      const factor=rollDamagePercent(attackerStats.minDamagePercent??85,random,attackerStats.maxDamagePercent??100)/100;
      const raw=multiplyAmount(attackerStats[attack],factor);
      const net=subtractAmount(raw,defenderStats[defense]??0);
      if(compareAmount(net,0)>0){
        damage=addAmount(damage,net);
        channels.push({kind,value:net});
      }
    }
    if(compareAmount(damage,0)>0){
      const before=defenderHp();
      setDefenderHp(subtractAmount(before,damage));
      appendDamageEvents(visualEvents,target,channels,before,damage);
    }else visualEvents.push({target,kind:'blocked',value:0});
    targetStatus.paralysis=addAmount(targetStatus.paralysis??0,attackerStats.paralysis??0);
    targetStatus.poison=addAmount(targetStatus.poison,attackerStats.poison??0);
  }else visualEvents.push({target,kind:'miss',value:'MISS'});
  return hit;
  };
  const hit=strike();
  // An additional hit is immediate; do not recurse or pay poison per hit.
  // A value of 1000 guarantees one bonus hit; fractional remainder is rolled once.
  const multi=decimal(attackerStats.multiStrike??0);
  if(multi.gt(0)&&compareAmount(defenderHp(),0)>0){
    const guaranteed=Math.min(1000,Math.floor(multi.div(1000).toNumber()));
    for(let i=0;i<guaranteed&&compareAmount(defenderHp(),0)>0;i++)strike();
    if(compareAmount(defenderHp(),0)>0&&random()<multi.mod(1000).div(1000).toNumber())strike();
  }
  return {hit,cancelled:false,paralysisTriggered:triggered,delayMs};
}
export function advanceBattle(state,deltaMs,random=Math.random) {
  if(state.phase!=='running'||!state.combat.active)return state;
  if(!Number.isFinite(deltaMs)||deltaMs<=0)return state;
  const c=structuredClone(state.combat);
  const visualEvents=[];
  const withEffects=next=>({...next,combatVisualEvents:visualEvents});
  c.playerStatus??=freshStatus();c.enemyStatus??=freshStatus();
  const playerStats=effectiveDittoStats(state),enemyStats=c.enemy.statistics??getWildPokemon(c.pokemonId);
  let remaining=Math.min(deltaMs,5000);
  c.regenerationElapsedMs??=0;
  // Shared second boundary: antidote -> poison damage -> regeneration.
  // Status ticks are independent of attack speed and paralysis.
  const applySecond=()=>{
    for(const [stats,status,getHp,setHp,maxHp,target] of [
      [playerStats,c.playerStatus,()=>c.currentHp,v=>{c.currentHp=v;c.dittoHp.current=v;},playerStats.hp,'player'],
      [enemyStats,c.enemyStatus,()=>c.enemy.hp.current,v=>{c.enemy.hp.current=v;},c.enemy.hp.max,'enemy']
    ]){
      if(compareAmount(getHp(),0)<=0)continue;
      const antidote=stats.antidote??0;
      if(compareAmount(status.poison??0,0)>0&&compareAmount(antidote,0)>0){
        const leftover=subtractAmount(status.poison,antidote);
        status.poison=compareAmount(leftover,0)>0?leftover:0;
      }
      if(compareAmount(status.poison??0,0)>0){
        const before=getHp();
        const damage=status.poison;
        setHp(subtractAmount(before,damage));
        appendStatusDamageEvent(visualEvents,target,'poison',compareAmount(before,damage)<0?before:damage);
      }
      // Poison death is final; healing cannot revive the combatant.
      if(compareAmount(getHp(),0)<=0)continue;
      if(compareAmount(stats.regeneration??0,0)>0&&compareAmount(getHp(),maxHp)<0){
        const before=getHp();
        const restored=addAmount(before,stats.regeneration);
        const after=compareAmount(restored,maxHp)>0?maxHp:restored;
        setHp(after);
        appendHealingEvent(visualEvents,target,before,after);
      }
    }
  };
  const my=c.dittoAttackCooldown,foe=c.enemy.attackCooldown;
  for(let steps=0;remaining>0&&steps<1000;steps++){
    const myPeriod=Math.max(100,my.duration),foePeriod=Math.max(100,foe.duration);
    const toMine=Math.max(0,myPeriod-my.elapsed),toFoe=Math.max(0,foePeriod-foe.elapsed);
    const untilSecond=Math.max(0,1000-c.regenerationElapsedMs);
    const next=Math.min(toMine,toFoe,untilSecond,remaining);
    my.elapsed+=next;foe.elapsed+=next;remaining-=next;
    c.regenerationElapsedMs+=next;
    if(c.regenerationElapsedMs>=1000){
      c.regenerationElapsedMs-=1000;
      applySecond();
      if(compareAmount(c.currentHp,0)<=0)return withEffects(finish(state,c,'defeat',random));
      if(compareAmount(c.enemy.hp.current,0)<=0)return withEffects(finish(state,c,'victory',random));
    }
    // Continue elapsed time across second-boundary ticks without skipping due attacks.
    if(my.elapsed<myPeriod&&foe.elapsed<foePeriod){
      if(remaining<=0)break;
      continue;
    }
    if(my.elapsed>=myPeriod){
      my.elapsed-=myPeriod;
      const attack=resolveAttack(c,'player',playerStats,enemyStats,random,visualEvents);
      my.duration=Math.max(100,playerStats.speed+attack.delayMs);
      if(compareAmount(c.currentHp,0)<=0)return withEffects(finish(state,c,'defeat',random));
      if(compareAmount(c.enemy.hp.current,0)<=0)return withEffects(finish(state,c,'victory',random));
    }
    if(foe.elapsed>=foePeriod){
      foe.elapsed-=foePeriod;
      const attack=resolveAttack(c,'enemy',enemyStats,playerStats,random,visualEvents);
      foe.duration=Math.max(100,enemyStats.speed+attack.delayMs);
      if(compareAmount(c.currentHp,0)<=0)return withEffects(finish(state,c,'defeat',random));
      if(compareAmount(c.enemy.hp.current,0)<=0)return withEffects(finish(state,c,'victory',random));
    }
  }
  return {...state,combat:c,combatVisualEvents:visualEvents};
}
export function fleeBattle(state){
  return state.combat.active ? finish(state,state.combat,'flee') : state;
}
