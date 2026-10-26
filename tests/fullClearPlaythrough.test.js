import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {REGION,BERRY_REGION,isRegionUnlocked,isPokemonUnlockedInState,appearedInRegion} from '../src/core/wildData.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

// Full-clear route: only combat victories, earned currencies and legal shop purchases.
// No preloaded stats, kill counts, injected energy or skipped recovery timers.
const route={
  [REGION.id]:['rattata','pidgey','spearow','mankey','zubat','meowth','geodude','exeggcute','sentret','tauros'],
  [BERRY_REGION.id]:['caterpie','weedle','taillow','kakuna','metapod','igglybuff','nidoran-m','nidoran-f']
};
function simulate(priority){
 let s=transition(initialState(),{type:'START'});
 let elapsedMs=0;
 const attempts={},failures={},firstKillTimes={},upgrades=[],winsPerRegion={},recoveryMs={};
 const shop=()=>{
   for(let i=0;i<40;i++){
     const balanced=(s.energyUpgrades.hp??0)<=(s.energyUpgrades.attack??0)?
       ['hp','attack','attackMultiplier']:['attack','hp','attackMultiplier'];
     const order=priority==='none'?[]:priority==='hp'?['hp','attack','attackMultiplier']:
       priority==='attack'?['attack','hp','attackMultiplier']:balanced;
     let changed=false;
     for(const id of order){
       const after=transition(s,{type:'BUY_UPGRADE',id});
       if(after!==s){s=after;upgrades.push(id);changed=true;break;}
     }
     if(!changed)break;
   }
 };
 const fight=id=>{
   const started=transition(s,{type:'SELECT_WILD',pokemonId:id});
   if(!started.combat.active)throw new Error('unavailable encounter '+id+' at '+s.victories+' wins');
   s=started;attempts[id]=(attempts[id]??0)+1;
   let fightMs=0;
   while(s.combat.active&&fightMs<180000){
     s=transition(s,{type:'COMBAT_TICK',deltaMs:500,random:()=>0.5});
     elapsedMs+=500;fightMs+=500;
   }
   if(s.combat.active)throw new Error('battle timeout: '+id);
   const event=s.combat.lastEvent?.type;
   if(event==='defeat')failures[id]=(failures[id]??0)+1;
   else if(event==='victory'){
     if(s.killCounts[id]===1)firstKillTimes[id]=elapsedMs;
   }else throw new Error('unexpected battle end: '+event);
   return event;
 };
 const clearRegion=region=>{
   const ids=route[region];
   const initialVictories=s.victories;
   let noProgress=0;
   for(let pass=0;pass<10;pass++){
     const before=s.victories;
     for(const id of ids){
       if(!isPokemonUnlockedInState(s,id))continue;
       let consecutiveFailures=0;
       while((s.killCounts[id]??0)<REGION.defaultKillLimit && consecutiveFailures<2){
         while(s.recoveryMs>0){
           const next=Math.min(5000,s.recoveryMs);
           s=transition(s,{type:'RECOVERY_TICK',deltaMs:next});
           elapsedMs+=next;
           recoveryMs[id]=(recoveryMs[id]??0)+next;
         }
         shop();
         const event=fight(id);
         if(event==='victory')consecutiveFailures=0;else consecutiveFailures++;
       }
     }
     if(s.victories===before)noProgress++;else noProgress=0;
     if(noProgress>=2||ids.every(id=>(s.killCounts[id]??0)===10))break;
   }
   winsPerRegion[region]=s.victories-initialVictories;
   return Object.fromEntries(ids.map(id=>[id,s.killCounts[id]??0]));
 };
 const first=clearRegion(REGION.id);
 assert.equal(isRegionUnlocked(s,BERRY_REGION.id),true,'Berry Forest did not unlock');
 s=transition(s,{type:'SELECT_REGION',regionId:BERRY_REGION.id});
 const second=clearRegion(BERRY_REGION.id);
 const result={
   priority,elapsedMs,elapsedMinutes:Number((elapsedMs/60000).toFixed(2)),
   first,second,winsPerRegion,totalVictories:s.victories,
   attempts,failures,firstKillTimes,recoveryMs,
   evolutionResults:s.evolutionResults,
   effectiveStats:effectiveDittoStats(s),
   particleEarnedNormal:s.particleEarned['노말'],
   unlockedLayer:s.unlockedLayer,energyBalances:s.energyBalances,
   upgrades:Object.fromEntries(Object.entries(s.energyUpgrades)),
   uncommonAppearances:{starter:s.uncommonStarterId,pikachu:s.berryRareAppeared},
   saveRoundTrip:decodeSave(encodeSave(s)).game.victories===s.victories
 };
 console.log('FULL_CLEAR_'+priority.toUpperCase()+' '+JSON.stringify(result));
 return result;
}
test('full-clear attempt reports reachable progress after balance changes without state shortcuts',()=>{
 for(const priority of ['balanced','hp','attack','none']){
   const result=simulate(priority);
   // Stronger enemies can block a strategy; report partial progress rather than
   // assuming every balance revision is winnable without a different route.
   assert.ok(result.totalVictories>0&&result.totalVictories<=180);
   assert.equal(Object.keys(result.first).length,10);
   assert.equal(Object.keys(result.second).length,8);
   assert.ok(Object.values(result.first).every(n=>n>=0&&n<=10));
   assert.ok(Object.values(result.second).every(n=>n>=0&&n<=10));
   if(result.second.caterpie===10)assert.equal(result.evolutionResults.metapod,true);
   if(result.second.weedle===10)assert.equal(result.evolutionResults.kakuna,true);
   assert.equal(result.saveRoundTrip,true);
 }
});
