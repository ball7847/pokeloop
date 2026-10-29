import {startBattle,emptyCombat} from '../../src/core/combatEngine.js';
import {getWildPokemon,evolutionFor,evolutionChance,REGION,scaledReward,battleEnergyRewards} from '../../src/core/wildData.js';
import {effectiveDittoStats} from '../../src/core/shopSystem.js';
import {stellarBattleEnergyReward} from '../../src/core/stellarUpgrades.js';
import {recordItemProgress} from '../../src/core/itemSystem.js';
import {grantBattleEnergy} from '../../src/core/energySystem.js';
import {addAmount,multiplyAmount} from '../../src/core/bigNumber.js';

// Test-only settlement of an estimated encounter. Never used by gameplay.
// Values follow the live combat finish() reward pipeline.
export function settleExpectedBattle(state,id,estimate,encounterRandom=Math.random){
 const p=getWildPokemon(id),c=state.combat;
 if(!c?.active||c.pokemonId!==id)throw new Error('Expected settlement requires an active matching battle');
 if(estimate.result==='victory'){
  const count=state.killCounts[id]??0;
  if(count>=REGION.defaultKillLimit)throw new Error('Kill cap exceeded');
  const honey=1+(effectiveDittoStats(state).honey??0)*0.001;
  const stats={...state.dittoStats};
  const rewards={};
  for(const [key,base] of Object.entries(p.rewards??{})){
    const original=scaledReward(key,base,count);
    const value=honey===1?original:key==='speed'?-Number(multiplyAmount(Math.abs(original),honey)):multiplyAmount(original,honey);
    rewards[key]=value;
    stats[key]=key==='speed'?Math.max(100,stats.speed+value):addAmount(stats[key],value);
  }
  const energyRewards=Object.fromEntries(Object.entries(battleEnergyRewards(p,count))
    .map(([type,value])=>[type,honey===1?stellarBattleEnergyReward(state,type,value):
      multiplyAmount(stellarBattleEnergyReward(state,type,value),honey)]));
  let rewarded=state;
  for(const [type,value] of Object.entries(energyRewards))rewarded=grantBattleEnergy(rewarded,[type],value);
  const nextEvolution=count===0?evolutionFor(id):null;
  const evolutionResults=nextEvolution?{...state.evolutionResults,
    [nextEvolution.id]:encounterRandom()<evolutionChance(nextEvolution,state)}:state.evolutionResults;
  const progress=recordItemProgress(recordItemProgress(rewarded,'victories'),'pokemon:'+id);
  const eventId=state.eventSerial+1;
  const event={id:eventId,type:'victory',pokemonId:id,name:p.name,count:count+1,rewards,energyRewards};
  const updated={...progress,eventSerial:eventId,
    victories:state.victories+1,encounterIndex:state.encounterIndex+1,
    dittoStats:stats,evolutionResults,
    killCounts:{...state.killCounts,[id]:count+1},
    dexLifetimeKills:{...state.dexLifetimeKills,[id]:(state.dexLifetimeKills?.[id]??0)+1},
    dexDiscovered:state.dexDiscovered.includes(id)?state.dexDiscovered:[...state.dexDiscovered,id],
    combat:{...c,active:false,enemy:null,currentHp:estimate.playerHp,
      dittoHp:{...c.dittoHp,current:estimate.playerHp},
      playerStatus:estimate.playerStatus??c.playerStatus,lastEvent:event}};
  // Match hunger's chained start and carry remaining HP/poison across wins.
  if(updated.automation?.hunger&&count+1<REGION.defaultKillLimit&&estimate.playerHp>0){
    const continued=startBattle(updated,id,estimate.playerHp,updated.combat.playerStatus);
    return {...continued,combat:{...continued.combat,lastEvent:{...event,id:continued.eventSerial}}};
  }
  return updated;
 }
 if(estimate.result==='defeat'){
  const eventId=state.eventSerial+1;
  return {...state,eventSerial:eventId,recoveryMs:10000,
    retryPokemonId:state.automation?.resolve?id:null,
    combat:{...c,active:false,enemy:null,currentHp:0,dittoHp:{...c.dittoHp,current:0},
      lastEvent:{id:eventId,type:'defeat',pokemonId:id,name:p.name}}};
 }
 if(estimate.result==='uncertain'){
  // Unknown is never reported as a confirmed defeat or victory. Exit encounter
  // through an actual FLEE transition, without granting rewards.
  return {...state,combat:{...c,lastEvent:{...c.lastEvent}}};
 }
 throw new Error('Unknown estimated battle result: '+estimate.result);
}
