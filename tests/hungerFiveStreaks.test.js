import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {REGION,BERRY_REGION,isRegionUnlocked,isPokemonUnlockedInState,regionForPokemon} from '../src/core/wildData.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';

const groups=[
 [REGION.id,['rattata','pidgey','mankey','spearow','zubat']],
 [BERRY_REGION.id,['caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f']]
];
function run(strategy){
 let s=transition(initialState(),{type:'START'}),ms=0,steps=0;
 const allIds=groups.flatMap(([,ids])=>ids);
 const evolutionIds=['metapod','kakuna'];
 const reportIds=[...allIds,...evolutionIds];
 const logs=[],firstChallenge={},battles={},streaks={},failures={},pending=[];
 let automationBoughtAt=null;
 function toggle(on){
   // The first victory is needed to earn the one Normal energy for this automation.
   if(!s.qolUnlocks.includes('hunger'))return;
   if(s.automation.hunger!==on){
     s=transition(s,{type:'TOGGLE_AUTOMATION',id:'hunger'});
     if(s.automation.hunger!==on)throw Error('could not change hunger toggle');
   }
 }
 function shop(){
   if(automationBoughtAt===null){
     const bought=transition(s,{type:'BUY_AUTOMATION',id:'hunger'});
     if(bought!==s){s=bought;automationBoughtAt=ms;}
   }
   if(strategy==='none')return;
   for(let n=0;n<40;n++){
     const order=strategy==='attack'?['attack','hp','attackMultiplier']:
       strategy==='hp'?['hp','attack','attackMultiplier']:
       (s.energyUpgrades.hp??0)<=(s.energyUpgrades.attack??0)?['hp','attack','attackMultiplier']:['attack','hp','attackMultiplier'];
     let purchased=false;
     for(const id of order){
       const next=transition(s,{type:'BUY_UPGRADE',id});
       if(next!==s){s=next;purchased=true;break;}
     }
     if(!purchased)break;
   }
 }
 function recover(){
   while(s.recoveryMs>0){
     const delta=Math.min(5000,s.recoveryMs);
     s=transition(s,{type:'RECOVERY_TICK',deltaMs:delta});ms+=delta;
   }
 }
 function ensureRegion(id){
   const region=regionForPokemon(id);
   if(s.activeRegionId!==region)s=transition(s,{type:'SELECT_REGION',regionId:region});
   if(s.activeRegionId!==region)throw Error('failed region switch '+id);
 }
 // One continuous streak always carries HP forward, without resetting by hand.
 // Stop automatic continuation before the LAST win needed for the goal.
 function streak(id,goal){
   ensureRegion(id);recover();shop();
   if(!firstChallenge[id])firstChallenge[id]={atMs:ms,stats:effectiveDittoStats(s),upgrades:{...s.energyUpgrades},
     kills:Object.fromEntries(allIds.map(x=>[x,s.killCounts[x]??0]))};
   toggle((s.killCounts[id]??0)<goal-1);
   s=transition(s,{type:'SELECT_WILD',pokemonId:id});
   if(!s.combat.active)return {wins:0,result:'unavailable'};
   battles[id]=(battles[id]??0)+1;
   let wins=0,elapsed=0,lastKills=s.killCounts[id]??0,activeTicks=0;
   while(s.combat.active&&elapsed<180000&&activeTicks++<2000){
     // Disable hunger on reaching goal-1 while retaining the currently active battle.
     if((s.killCounts[id]??0)>=goal-1&&s.automation.hunger)toggle(false);
     const next=transition(s,{type:'COMBAT_TICK',deltaMs:500,random:()=>0.5});
     s=next;ms+=500;elapsed+=500;steps++;
     const now=s.killCounts[id]??0;
     if(now>lastKills){wins+=now-lastKills;lastKills=now;}
   }
   if(s.combat.active)throw Error('combat timed out '+id);
   let result=s.combat.lastEvent?.type;
   if(result==='defeat')failures[id]=(failures[id]??0)+1;
   if(result!=='defeat'&&result!=='victory')throw Error('unexpected '+id+': '+result);
   (streaks[id]??=[]).push({wins,result,atMs:ms,remainingHp:s.combat.currentHp});
   return {wins,result};
 }
 function target(id,goal=5){
   if(!isPokemonUnlockedInState(s,id))return 'unavailable';
   let guard=0;
   while((s.killCounts[id]??0)<goal&&guard++<25){
     const x=streak(id,goal);
     if(x.result!=='victory')return x.result;
   }
   if(guard>=25)throw Error('stalled '+id);
   return 'cleared';
 }
 function farm(ids,blocked){
   let extra=0;
   for(const id of ids){
     if((s.killCounts[id]??0)>=10||!isPokemonUnlockedInState(s,id))continue;
     const old=s.killCounts[id]??0;
     target(id,10);
     extra+=(s.killCounts[id]??0)-old;
   }
   if(extra)logs.push({event:'farm',blocked,extra,atMs:ms});
 }
 function retry(reason){
   for(const id of [...pending]){
     const saved=s.activeRegionId;
     const result=target(id);
     logs.push({event:'retry',target:id,reason,result,kills:s.killCounts[id]??0,atMs:ms});
     if(result==='cleared')pending.splice(pending.indexOf(id),1);
     if(s.activeRegionId!==saved)s=transition(s,{type:'SELECT_REGION',regionId:saved});
   }
 }
 for(let g=0;g<groups.length;g++){
   const [region,ids]=groups[g];
   if(g>0){
     if(!isRegionUnlocked(s,region)){logs.push({event:'region-locked',region});break;}
     s=transition(s,{type:'SELECT_REGION',regionId:region});
   }
   const earlier=groups.slice(0,g).flatMap(([,species])=>species);
   for(let i=0;i<ids.length;i++){
     const id=ids[i];
     if(!isPokemonUnlockedInState(s,id)){logs.push({event:'unavailable',pokemon:id});continue;}
     let result=target(id);
     if(result!=='cleared'){
       logs.push({event:'blocked',pokemon:id,result,atMs:ms,kills:s.killCounts[id]??0});
       farm([...earlier,...ids.slice(0,i)],id);
       result=target(id);
       logs.push({event:'after-farm',pokemon:id,result,kills:s.killCounts[id]??0,atMs:ms});
     }
     if(result!=='cleared'&&!pending.includes(id))pending.push(id);
     if(result==='cleared'&&pending.length)retry('after '+id+' 5 wins');
   }
   if(pending.length)retry('end '+region);
 }
 // Evolved enemies only appear after a parent's tenth victory. If unlocked,
 // include each in the completion probe rather than silently omitting them.
 for(const id of evolutionIds){
   if(!isPokemonUnlockedInState(s,id))continue;
   let outcome=target(id);
   if(outcome!=='cleared'){
     logs.push({event:'blocked-evolution',pokemon:id,result:outcome,atMs:ms});
     farm(allIds,id);
     outcome=target(id);
   }
   if(outcome!=='cleared'&&!pending.includes(id))pending.push(id);
   logs.push({event:'evolution-result',pokemon:id,result:outcome,kills:s.killCounts[id]??0,atMs:ms});
   if(outcome==='cleared'&&pending.length)retry('after '+id+' evolution wins');
 }
 const result={strategy,minutes:+(ms/60000).toFixed(2),automationBoughtAt,
   victories:s.victories,kills:Object.fromEntries(reportIds.map(id=>[id,s.killCounts[id]??0])),
   battles,failures,streaks,
   maxStreak:Object.fromEntries(reportIds.map(id=>[id,Math.max(0,...(streaks[id]??[]).map(x=>x.wins))])),
   firstTaillow:firstChallenge.taillow??null,unresolved:pending,events:logs,
   stats:effectiveDittoStats(s),upgrades:s.energyUpgrades,steps};
 console.log('HUNGER_FIVE_'+strategy.toUpperCase()+' '+JSON.stringify(result));
 return result;
}
test('buy real endless hunger and evaluate five-kill streaks, adaptive recovery and skip/retry',()=>{
 for(const strategy of ['balanced','attack','hp','none']){
   const result=run(strategy);
   assert.notEqual(result.automationBoughtAt,null,'hunger must be purchased with earned energy');
   assert.ok(result.victories>0);
   assert.ok(result.firstTaillow?.stats);
   assert.ok(Object.values(result.maxStreak).every(n=>n>=0&&n<=10));
 }
});
