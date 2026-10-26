import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {REGION,BERRY_REGION,isRegionUnlocked,isPokemonUnlockedInState,regionForPokemon,appearedInRegion,ALL_POKEMON,battleEnergyRewards} from '../src/core/wildData.js';
import {effectiveDittoStats,UPGRADES,AUTOMATIONS} from '../src/core/shopSystem.js';

const groups=[
 [REGION.id,['rattata','pidgey','mankey','spearow','zubat','meowth','geodude','exeggcute','sentret','tauros']],
 [BERRY_REGION.id,['caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f','tangela','bidoof','surskit','tropius']]
];
function run(strategy){
 let s=transition(initialState(),{type:'START'}),ms=0,steps=0;
 const allIds=groups.flatMap(([,ids])=>ids);
 const evolutionIds=['metapod','kakuna'];
 const reportIds=[...allIds,...evolutionIds];
 const logs=[],timeline=[],firstChallenge={},firstKillSnapshots={},battles={},streaks={},failures={},pending=[];
 const purchasedAutomations=[];
 const labels={rattata:'꼬렛',pidgey:'구구',mankey:'망키',spearow:'깨비참',zubat:'주뱃',meowth:'나옹',geodude:'꼬마돌',exeggcute:'아라리',sentret:'꼬리선',tauros:'켄타로스',caterpie:'캐터피',weedle:'뿔충이',taillow:'테일로',igglybuff:'푸푸린','nidoran-m':'니드런♂','nidoran-f':'니드런♀',tangela:'덩쿠리',bidoof:'비버니',surskit:'비구술',tropius:'트로피우스',metapod:'단데기',kakuna:'딱충이'};
 const note=message=>timeline.push(message);
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
     if(bought!==s){s=bought;automationBoughtAt=ms;note('끝없는 허기 구매');}
   }
   for(const item of AUTOMATIONS){
     if(s.qolUnlocks.includes(item.id))continue;
     const bought=transition(s,{type:'BUY_AUTOMATION',id:item.id});
     if(bought!==s){s=bought;purchasedAutomations.push(item.id);note('자동화 '+item.name+' 구매');
       // The simulation handles defeats with farming/revisit rules rather than automatic retry.
       if(item.id==='resolve'){s=transition(s,{type:'TOGGLE_AUTOMATION',id:'resolve'});note('불굴의 의지 자동 재도전 일시 중지(파밍 규칙 우선)');}
     }
   }
   if(strategy==='none')return;
   for(let n=0;n<120;n++){
     const order=strategy==='attack'?['attack','hp','attackMultiplier','speed','antidote','poisonMultiplier']:
       strategy==='hp'?['hp','attack','attackMultiplier','speed','antidote','poisonMultiplier']:
       [...UPGRADES].sort((a,b)=>(s.energyUpgrades[a.id]??0)-(s.energyUpgrades[b.id]??0)).map(item=>item.id);
     let purchased=false;
     for(const id of order){
       const next=transition(s,{type:'BUY_UPGRADE',id});
       if(next!==s){s=next;purchased=true;note('강화 '+id+' Lv'+(s.energyUpgrades[id]??0));break;}
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
     const beforeFirstKill=(id==='nidoran-m'||id==='nidoran-f')&&!firstKillSnapshots[id]&&lastKills===0
       ? {stats:effectiveDittoStats(s),upgrades:{...s.energyUpgrades},baseStats:{...s.dittoStats}}:null;
     const next=transition(s,{type:'COMBAT_TICK',deltaMs:500,random:()=>0.5});
     s=next;ms+=500;elapsed+=500;steps++;
     const now=s.killCounts[id]??0;
     if(now>lastKills){
       if(beforeFirstKill)firstKillSnapshots[id]={...beforeFirstKill,afterStats:effectiveDittoStats(s),afterBaseStats:{...s.dittoStats},killCount:now};
       wins+=now-lastKills;lastKills=now;
     }
   }
   if(s.combat.active)throw Error('combat timed out '+id);
   let result=s.combat.lastEvent?.type;
   if(result==='defeat')failures[id]=(failures[id]??0)+1;
   note(labels[id]+' 연속 '+wins+'승 / '+result+' / 누적 '+(s.killCounts[id]??0)+'회');
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
   if(extra){logs.push({event:'farm',blocked,extra,atMs:ms});note(labels[blocked]+' 재도전 위해 이전 적 '+extra+'회 추가 파밍');}
 }
 function retry(reason){
   for(const id of [...pending]){
     const saved=s.activeRegionId;
     const result=target(id);
     logs.push({event:'retry',target:id,reason,result,kills:s.killCounts[id]??0,atMs:ms});note(labels[id]+' 보류 대상 재도전: '+result);
     if(result==='cleared')pending.splice(pending.indexOf(id),1);
     if(s.activeRegionId!==saved)s=transition(s,{type:'SELECT_REGION',regionId:saved});
   }
 }
 for(let g=0;g<groups.length;g++){
   const [region,ids]=groups[g];
   if(g>0){
     if(!isRegionUnlocked(s,region)){logs.push({event:'region-locked',region});note('베리숲 잠김');break;}
     s=transition(s,{type:'SELECT_REGION',regionId:region});note('베리숲 해금 및 진입');
   }
   const earlier=groups.slice(0,g).flatMap(([,species])=>species);
   // Re-read live encounter order after each Pokémon's first victory.
   // Newly appeared evolutions are inserted directly after their parent.
   for(let i=0;i<appearedInRegion(s,region).length;i++){
     const id=appearedInRegion(s,region)[i].id;
     if(!isPokemonUnlockedInState(s,id)){logs.push({event:'unavailable',pokemon:id});continue;}
     note(labels[id]+' 목표 5회 도전');
     let result=target(id);
     if(result!=='cleared'){
       logs.push({event:'blocked',pokemon:id,result,atMs:ms,kills:s.killCounts[id]??0});
       farm([...earlier,...appearedInRegion(s,region).slice(0,i).map(p=>p.id)],id);
       result=target(id);
       logs.push({event:'after-farm',pokemon:id,result,kills:s.killCounts[id]??0,atMs:ms});
     }
     if(result!=='cleared'&&!pending.includes(id)){pending.push(id);note(labels[id]+' 보류');}
     if(result==='cleared')note(labels[id]+' 5회 달성');
     if(result==='cleared'&&pending.length)retry('after '+id+' 5 wins');
   }
   if(pending.length)retry('end '+region);
 }
 // Second pass runs after every appeared species has reached five kills.
 const appearedIds=groups.flatMap(([region])=>appearedInRegion(s,region).filter(p=>isPokemonUnlockedInState(s,p.id)).map(p=>p.id));
 const fiveCleared=appearedIds.every(id=>(s.killCounts[id]??0)>=5)&&pending.length===0;
 const secondPassPending=[];
 const fiveClearTimelineEnd=timeline.length;
 const fiveClearStats=effectiveDittoStats(s);
 const fiveClearUpgrades={...s.energyUpgrades};
 if(fiveCleared){
   note('전 포켓몬 5회 달성 → 최대 10회 채우기 시작');
   for(const id of appearedIds){
     if((s.killCounts[id]??0)>=10)continue;
     note(labels[id]+' 최대 10회 도전');
     let outcome=target(id,10);
     if(outcome!=='cleared'){
       logs.push({event:'second-pass-blocked',pokemon:id,result:outcome,kills:s.killCounts[id]??0});
       farm(appearedIds.slice(0,appearedIds.indexOf(id)),id);
       outcome=target(id,10);
     }
     if(outcome!=='cleared')secondPassPending.push(id);
     else note(labels[id]+' 최대 10회 달성');
   }
   for(let pass=0;secondPassPending.length&&pass<appearedIds.length;pass++){
     let progressed=false;
     for(const id of [...secondPassPending]){
       const before=s.killCounts[id]??0;
       const outcome=target(id,10);
       if((s.killCounts[id]??0)>before)progressed=true;
       note(labels[id]+' 최대 횟수 보류 후 재도전: '+outcome);
       if(outcome==='cleared')secondPassPending.splice(secondPassPending.indexOf(id),1);
     }
     if(!progressed)break;
   }
 }
 const totalEnergy=Object.fromEntries(Object.keys(s.energyBalances).map(type=>[type,0]));
 for(const pokemon of ALL_POKEMON){
   for(let i=0;i<(s.killCounts[pokemon.id]??0);i++){
     for(const [type,value] of Object.entries(battleEnergyRewards(pokemon,i)))totalEnergy[type]+=value;
   }
 }
 const result={fiveClearTimelineEnd,fiveClearStats,fiveClearUpgrades,fiveCleared,secondPassPending,appearedIds,totalEnergy,remainingEnergy:{...s.energyBalances},strategy,minutes:+(ms/60000).toFixed(2),automationBoughtAt,
   victories:s.victories,kills:Object.fromEntries(reportIds.map(id=>[id,s.killCounts[id]??0])),
   battles,failures,streaks,
   maxStreak:Object.fromEntries(reportIds.map(id=>[id,Math.max(0,...(streaks[id]??[]).map(x=>x.wins))])),
   firstTaillow:firstChallenge.taillow??null,firstChallengeNidoran:{male:firstChallenge['nidoran-m'],female:firstChallenge['nidoran-f']},firstKillSnapshots,unresolved:pending,events:logs,purchasedAutomations,
   stats:effectiveDittoStats(s),upgrades:s.energyUpgrades,steps,timeline};
 console.log('HUNGER_FIVE_'+strategy.toUpperCase()+' '+JSON.stringify(result));
 return result;
}
test('buy real endless hunger and evaluate five-kill streaks, adaptive recovery and skip/retry',()=>{
 for(const strategy of ['balanced','attack','hp','none']){
   const result=run(strategy); // Re-run virtual progression after Nidoran speed and poison tuning.
   assert.notEqual(result.automationBoughtAt,null,'hunger must be purchased with earned energy');
   assert.ok(result.victories>0);
   if(strategy!=='none')assert.ok(result.firstTaillow?.stats);
   if(strategy==='balanced')console.log('OFFICIAL_FIVE_STREAK_REPORT '+JSON.stringify({finalStats:result.stats,finalUpgrades:result.upgrades,fiveClearTimelineEnd:result.fiveClearTimelineEnd,fiveClearStats:result.fiveClearStats,fiveClearUpgrades:result.fiveClearUpgrades,fiveCleared:result.fiveCleared,secondPassPending:result.secondPassPending,appearedIds:result.appearedIds,totalEnergy:result.totalEnergy,remainingEnergy:result.remainingEnergy,strategy,firstChallengeNidoran:result.firstChallengeNidoran,firstKillSnapshots:result.firstKillSnapshots,victories:result.victories,kills:result.kills,maxStreak:result.maxStreak,streaks:result.streaks,failures:result.failures,events:result.events,unresolved:result.unresolved,upgrades:result.upgrades,purchasedAutomations:result.purchasedAutomations,timeline:result.timeline}));
   assert.ok(Object.values(result.maxStreak).every(n=>n>=0&&n<=10));
 }
});
