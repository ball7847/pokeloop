import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {REGION,BERRY_REGION,isRegionUnlocked,isPokemonUnlockedInState} from '../src/core/wildData.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';

// Attempt five victories per species. Only if a battle fails, farm earlier
// available species toward ten victories, then retry the blocked encounter.
const stages=[
 [REGION.id,['rattata','pidgey','mankey','spearow','zubat']],
 [BERRY_REGION.id,['caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f']]
];
function run(strategy){
 let s=transition(initialState(),{type:'START'}),clock=0;
 const events=[],fails={},attempts={},before={};
 function shop(){
   if(strategy==='none')return;
   for(let n=0;n<40;n++){
     let priority=strategy==='attack'?['attack','hp','attackMultiplier']:
       strategy==='hp'?['hp','attack','attackMultiplier']:
       (s.energyUpgrades.hp??0)<=(s.energyUpgrades.attack??0)?
       ['hp','attack','attackMultiplier']:['attack','hp','attackMultiplier'];
     let advanced=false;
     for(const id of priority){
       const next=transition(s,{type:'BUY_UPGRADE',id});
       if(next!==s){s=next;advanced=true;break;}
     }
     if(!advanced)break;
   }
 }
 function recover(){
   while(s.recoveryMs>0){
     const ms=Math.min(5000,s.recoveryMs);
     s=transition(s,{type:'RECOVERY_TICK',deltaMs:ms});clock+=ms;
   }
 }
 function fight(id){
   recover();shop();
   const started=transition(s,{type:'SELECT_WILD',pokemonId:id});
   if(!started.combat.active)return 'locked';
   s=started;
   attempts[id]=(attempts[id]??0)+1;
   let elapsed=0;
   while(s.combat.active&&elapsed<180000){
     s=transition(s,{type:'COMBAT_TICK',deltaMs:500,random:()=>0.5});
     elapsed+=500;clock+=500;
   }
   const outcome=s.combat.active?'timeout':s.combat.lastEvent?.type;
   if(outcome!=='victory')fails[id]=(fails[id]??0)+1;
   return outcome;
 }
 function farm(previous,blocked){
   let gained=0,failures=0;
   // Prioritize earlier, weaker Pokemon. Their limit is 10 total victories.
   for(const prior of previous){
     if(!isPokemonUnlockedInState(s,prior))continue;
     while((s.killCounts[prior]??0)<10){
       const kind=fight(prior);
       if(kind!=='victory'){
         failures++;
         if(failures>=2)break;
         continue;
       }
       gained++;
     }
   }
   events.push({at:clock,kind:'fallback-farm',blocked,from:previous.slice(),additionalKills:gained,
     stats:effectiveDittoStats(s)});
   return gained;
 }
 const clear={};
 for(const [region,ids] of stages){
   if(region===BERRY_REGION.id){
     if(!isRegionUnlocked(s,region)){
       events.push({kind:'region-locked',region,at:clock});break;
     }
     s=transition(s,{type:'SELECT_REGION',regionId:region});
   }
   for(let i=0;i<ids.length;i++){
     const id=ids[i];let failed=0,guard=0;
     if(!isPokemonUnlockedInState(s,id)){
       events.push({kind:'locked',id,at:clock});continue;
     }
     before[id]={at:clock,stats:effectiveDittoStats(s)};
     while((s.killCounts[id]??0)<5&&guard++<45){
       const outcome=fight(id);
       if(outcome==='victory'){failed=0;continue;}
       events.push({kind:'blocked-fight',id,at:clock,outcome,kills:s.killCounts[id]??0,
         stats:effectiveDittoStats(s)});
       failed++;
       if(failed>=1){
         const previous=ids.slice(0,i).filter(p=>(s.killCounts[p]??0)<10);
         const gain=farm(previous,id);
         if(gain===0){
           // Include previously visited area when this area's earlier species are exhausted.
           const earlier=stages[0][1].filter(p=>(s.killCounts[p]??0)<10);
           if(earlier.length&&region!==REGION.id){
             const present=s.activeRegionId;
             s=transition(s,{type:'SELECT_REGION',regionId:REGION.id});
             const got=farm(earlier,id);
             s=transition(s,{type:'SELECT_REGION',regionId:present});
             if(!got)break;
           }else break;
         }
         failed=0;
       }
     }
     events.push({kind:'species-result',id,kills:s.killCounts[id]??0,at:clock,
       attempts:attempts[id]??0,failures:fails[id]??0});
   }
   clear[region]=Object.fromEntries(ids.map(id=>[id,s.killCounts[id]??0]));
 }
 // Evolution children appear only after the parent reaches ten.
 const evolution={metapod:isPokemonUnlockedInState(s,'metapod'),kakuna:isPokemonUnlockedInState(s,'kakuna')};
 const res={strategy,minutes:+(clock/60000).toFixed(2),victories:s.victories,clear,attempts,fails,
   events,evolution,stats:effectiveDittoStats(s),upgrades:s.energyUpgrades};
 console.log('FIVE_KILL_PROBE_'+strategy.toUpperCase()+' '+JSON.stringify(res));
 return res;
}
test('five-victory adaptive progression probes bottlenecks without giving free progress',()=>{
 for(const strategy of ['balanced','attack','hp','none']){
   const result=run(strategy);
   assert.ok(result.victories>0);
 }
});
