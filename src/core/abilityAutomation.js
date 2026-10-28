import {UPGRADES,upgradeCosts,buyUpgrade} from './shopSystem.js';
import {addAmount,compareAmount} from './bigNumber.js';
import {REGIONS,REGION,appearedInRegion,isRegionUnlocked,isPokemonUnlockedInState} from './wildData.js';
import {startBattle} from './combatEngine.js';

export function autoBuyTick(state,maxPurchases=3){
 if(state.phase!=='running'||!state.qolUnlocks?.includes('download')||!state.automation?.download)return state;
 let current=state;
 for(let purchase=0;purchase<maxPurchases;purchase++){
  let candidate=null;
  for(const item of UPGRADES){
   if(current.autoBuySelection?.[item.id]===false)continue;
   const costs=upgradeCosts(item.id,current.energyUpgrades?.[item.id]??0);
   if(!costs||Object.entries(costs).some(([type,cost])=>compareAmount(current.energyBalances[type]??0,cost)<0))continue;
   const total=Object.values(costs).reduce((sum,cost)=>addAmount(sum,cost),0);
   if(!candidate||compareAmount(total,candidate.total)<0)candidate={id:item.id,total};
  }
  if(!candidate)break;
  const next=buyUpgrade(current,candidate.id);
  if(next===current)break;
  current=next;
 }
 return current;
}

export function autoChallengeTick(state){
 if(state.phase!=='running'||!state.qolUnlocks?.includes('moxie')||!state.automation?.moxie||
   state.combat.active||state.recoveryMs>0||state.retryPokemonId)return state;
 const event=state.combat.lastEvent;
 if(event&&(event.type==='flee'||event.type==='defeat'||event.type==='start'))return state;
 if(event?.type==='victory'&&(state.killCounts[event.pokemonId]??0)<REGION.defaultKillLimit)return state;
 for(const region of REGIONS){
  if(!isRegionUnlocked(state,region.id))continue;
  for(const pokemon of appearedInRegion(state,region.id)){
   if((state.killCounts[pokemon.id]??0)>=REGION.defaultKillLimit||!isPokemonUnlockedInState(state,pokemon.id))continue;
   return startBattle({...state,activeRegionId:region.id},pokemon.id);
  }
 }
 return state;
}

export function autoAbilityTick(state){
 if(state.phase!=='running')return state;
 return autoChallengeTick(autoBuyTick(state));
}
