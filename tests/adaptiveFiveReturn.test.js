import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {REGION,BERRY_REGION,isRegionUnlocked,isPokemonUnlockedInState,regionForPokemon} from '../src/core/wildData.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';

const groups=[
 [REGION.id,['rattata','pidgey','mankey','spearow','zubat']],
 [BERRY_REGION.id,['caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f']]
];
const names={rattata:'꼬렛',pidgey:'구구',mankey:'망키',spearow:'깨비참',zubat:'주뱃',
 caterpie:'캐터피',weedle:'뿔충이',taillow:'테일로',igglybuff:'푸푸린','nidoran-m':'니드런♂','nidoran-f':'니드런♀'};
function simulate(strategy){
 let s=transition(initialState(),{type:'START'}),ms=0;
 const events=[],attempts={},defeats={},firstAttempts={},pending=[];
 function purchase(){
   if(strategy==='none')return;
   for(let k=0;k<40;k++){
     let preferred=strategy==='attack'?['attack','hp','attackMultiplier']:
      strategy==='hp'?['hp','attack','attackMultiplier']:
      (s.energyUpgrades.hp??0)<=(s.energyUpgrades.attack??0)?['hp','attack','attackMultiplier']:['attack','hp','attackMultiplier'];
     let changed=false;
     for(const id of preferred){const next=transition(s,{type:'BUY_UPGRADE',id});if(next!==s){s=next;changed=true;break;}}
     if(!changed)break;
   }
 }
 function ready(){
   while(s.recoveryMs>0){
     const step=Math.min(s.recoveryMs,5000);
     s=transition(s,{type:'RECOVERY_TICK',deltaMs:step});ms+=step;
   }
   purchase();
 }
 function fight(id){
   ready();
   if(!(id in firstAttempts))firstAttempts[id]={timeMs:ms,stats:effectiveDittoStats(s),upgrades:{...s.energyUpgrades},kills:{...s.killCounts}};
   s=transition(s,{type:'SELECT_WILD',pokemonId:id});
   if(!s.combat.active)return 'unavailable';
   attempts[id]=(attempts[id]??0)+1;
   let duration=0;
   while(s.combat.active&&duration<180000){
     s=transition(s,{type:'COMBAT_TICK',deltaMs:500,random:()=>0.5});
     duration+=500;ms+=500;
   }
   const kind=s.combat.active?'timeout':s.combat.lastEvent?.type;
   if(kind!=='victory')defeats[id]=(defeats[id]??0)+1;
   return kind;
 }
 function target(id,max=5){
   if(!isPokemonUnlockedInState(s,id))return 'unavailable';
   while((s.killCounts[id]??0)<max){
     const kind=fight(id);
     if(kind!=='victory'){
       events.push({event:'defeat',pokemon:id,atMs:ms,kills:s.killCounts[id]??0,
         hp:effectiveDittoStats(s).hp,attack:effectiveDittoStats(s).attack});
       return kind;
     }
   }
   return 'cleared';
 }
 function farmEarlier(visited,blocker){
   let total=0;
   const home=s.activeRegionId;
   for(const id of visited){
     const nextRegion=regionForPokemon(id);
     if(nextRegion!==s.activeRegionId)s=transition(s,{type:'SELECT_REGION',regionId:nextRegion});
     if((s.killCounts[id]??0)>=10||!isPokemonUnlockedInState(s,id))continue;
     while((s.killCounts[id]??0)<10){
       const kind=fight(id);
       if(kind!=='victory')break;
       total++;
     }
   }
   if(s.activeRegionId!==home)s=transition(s,{type:'SELECT_REGION',regionId:home});
   if(total)events.push({event:'farm',for:blocker,atMs:ms,extraWins:total,from:visited.slice()});
   return total;
 }
 function retryPending(reason){
   const pendingNow=[...pending];
   for(const id of pendingNow){
     const home=s.activeRegionId;
     const needed=regionForPokemon(id);
     if(home!==needed)s=transition(s,{type:'SELECT_REGION',regionId:needed});
     if((s.killCounts[id]??0)>=5){pending.splice(pending.indexOf(id),1);continue;}
     const kind=target(id);
     events.push({event:'retry',pokemon:id,reason,result:kind,atMs:ms,kills:s.killCounts[id]??0});
     if(kind==='cleared')pending.splice(pending.indexOf(id),1);
     if(s.activeRegionId!==home)s=transition(s,{type:'SELECT_REGION',regionId:home});
   }
 }
 const snapshots={};
 for(const [region,ids] of groups){
   if(region===BERRY_REGION.id){
     if(!isRegionUnlocked(s,region)){events.push({event:'region-locked',region,atMs:ms});break;}
     s=transition(s,{type:'SELECT_REGION',regionId:region});
   }
   const earlier=[];
   for(const id of ids){
     if(!isPokemonUnlockedInState(s,id)){
       events.push({event:'unavailable',pokemon:id,atMs:ms});continue;
     }
     if(id==='taillow'){ready();snapshots.taillow={timeMs:ms,stats:effectiveDittoStats(s),kills:{...s.killCounts},upgrades:{...s.energyUpgrades}};}
     let kind=target(id);
     if(kind!=='cleared'){
       // First failure: boost earlier monsters up to ten each and immediately retry.
       farmEarlier([...groups.slice(0,groups.findIndex(([r])=>r===region)).flatMap(([,old])=>old),...earlier],id);
       kind=target(id);
       events.push({event:'post-farm-retry',pokemon:id,result:kind,atMs:ms,kills:s.killCounts[id]??0});
     }
     if(kind!=='cleared'&&!pending.includes(id))pending.push(id);
     if(kind==='cleared')events.push({event:'five-cleared',pokemon:id,atMs:ms});
     earlier.push(id);
     // If a target remains blocked, move to the next species; after that
     // species advances, revisit the blocked one as requested.
     if(pending.length&&kind==='cleared')retryPending(id);
   }
   if(pending.length)retryPending('end-of-region');
 }
 const results={
   strategy,minutes:+(ms/60000).toFixed(2),totalVictories:s.victories,
   kills:Object.fromEntries(groups.flatMap(([,ids])=>ids).map(id=>[id,s.killCounts[id]??0])),
   attempts,defeats,unresolved:pending,taillow:snapshots.taillow??null,
   otherFirsts:{mankey:firstAttempts.mankey??null,nidoranMale:firstAttempts['nidoran-m']??null},
   events,finalStats:effectiveDittoStats(s),upgrades:s.energyUpgrades
 };
 console.log('ADAPTIVE_FIVE_'+strategy.toUpperCase()+' '+JSON.stringify(results));
 return results;
}
test('five kills, farm earlier species to ten upon loss, then skip and revisit after next species',()=>{
 for(const strategy of ['balanced','hp','attack','none']){
   const result=simulate(strategy);
   assert.ok(result.totalVictories>0);
   assert.ok(result.taillow?.stats);
 }
});
