import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {isPokemonUnlockedInState,isRegionUnlocked,REGION,BERRY_REGION,BERRY_POKEMON,UNCOMMON_BASE_CHANCE} from '../src/core/wildData.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

const first=['rattata','pidgey','spearow','mankey','zubat'];
const second=['caterpie','weedle','kakuna','metapod','jigglypuff','nidoran-m','nidoran-f'];
function battle(s,id,seed=0.5){
 s=transition(s,{type:'SELECT_WILD',pokemonId:id});
 if(!s.combat.active)return {state:s,kind:'blocked',elapsed:0};
 let elapsed=0;
 while(s.combat.active&&elapsed<180000){
   const before=s;
   s=transition(s,{type:'COMBAT_TICK',deltaMs:500,random:typeof seed==='function'?seed:()=>seed});
   elapsed+=500;
   if(s===before)throw new Error('combat tick stalled '+id);
 }
 if(s.combat.active) return {state:s,kind:'timeout',elapsed};
 const kind=s.combat.lastEvent?.type;
 return {state:s,kind,elapsed};
}
function run(strategy){
 let s=transition(initialState(),{type:'START'});
 const results={strategy,region1:{},region2:{},events:[],warnings:[]};
 const upgrade=()=>{
   for(let loop=0;loop<40;loop++){
     const types=strategy==='hp'?['hp','attack','attackMultiplier']:strategy==='attack'?['attack','hp','attackMultiplier']:strategy==='balanced'?[(s.energyUpgrades.hp??0)<=(s.energyUpgrades.attack??0)?'hp':'attack',(s.energyUpgrades.hp??0)<=(s.energyUpgrades.attack??0)?'attack':'hp','attackMultiplier']:['hp','attack','attackMultiplier','speed'];
     let changed=false;
     for(const id of types){
       const next=transition(s,{type:'BUY_UPGRADE',id});
       if(next!==s){s=next;changed=true;results.events.push('upgrade '+id+' lv'+s.energyUpgrades[id]);break;}
     }
     if(!changed)break;
   }
 };
 const process=(ids,key,passes)=>{
  let oldVictories=-1;
  for(let pass=0;pass<passes;pass++){
   const initial=s.victories;
   for(const id of ids){
     if(!isPokemonUnlockedInState(s,id))continue;
     let failures=0;
     while((s.killCounts[id]??0)<10&&failures<2){
       if(s.recoveryMs>0)s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
       if(s.recoveryMs>0)s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
       if(strategy!=='none')upgrade();
       const a=battle(s,id);
       s=a.state;
       if(a.kind==='victory'){failures=0;if(s.killCounts[id]===1)results.events.push('first victory '+id+' at '+(s.victories)+' total');}
       else {failures++;if(failures===1)results.events.push('failed '+id+': '+a.kind+' HP '+s.dittoStats.hp+' ATK '+s.dittoStats.attack);if(a.kind==='timeout')throw Error('timeout '+id);}
     }
   }
   if(s.victories===initial||s.victories===oldVictories)break;
   oldVictories=s.victories;
  }
  results[key]=Object.fromEntries(ids.map(id=>[id,s.killCounts[id]??0]));
 };
 process(first,'region1',4);
 results.berryUnlocked=isRegionUnlocked(s,BERRY_REGION.id);
 if(results.berryUnlocked){
   s=transition(s,{type:'SELECT_REGION',regionId:BERRY_REGION.id});
   process(second,'region2',4);
 }
 results.stats={...effectiveDittoStats(s)};
 results.particles=s.particleEarned['노말'];
 results.energy={...s.energyBalances};
 results.unlockLayer=s.unlockedLayer;
 results.totalVictories=s.victories;
 results.pikachuAppeared=s.berryRareAppeared;
 results.saves=decodeSave(encodeSave(s)).game.activeRegionId===s.activeRegionId;
 console.log('VIRTUAL_PLAYTRACE '+JSON.stringify(results));
 return {s,results};
}
test('complete progression simulation from empty save with four manual purchase strategies',()=>{
 let unlocked=0;
 for(const policy of ['hp','attack','balanced','none']){
   const {s,results}=run(policy);
   assert.ok(s.victories>0,'no victories for '+policy);
   assert.equal(results.saves,true);
   if(results.berryUnlocked)unlocked++;
 }
 assert.ok(unlocked>0,'all strategies fail to unlock second region');
});
test('economic and rare encounter reachability, game default rules',()=>{
 const s=initialState();
 assert.equal(s.berryRareAppeared,false);
 assert.equal(UNCOMMON_BASE_CHANCE,0);
 assert.ok(BERRY_POKEMON.filter(p=>!['jigglypuff','nidoran-m','nidoran-f'].includes(p.id)).every(p=>p.energyReward===undefined));
 assert.equal(BERRY_POKEMON.find(p=>p.id==='jigglypuff').energyReward,10);
 // Under the current capped first region, total normal energy available is finite.
 const H10=Array.from({length:10},(_,i)=>1/(i+1)).reduce((a,b)=>a+b,0);
 const maxNormal=H10*(1+2+3);
 assert.ok(maxNormal<1025);
 console.log('VIRTUAL_ECONOMY '+JSON.stringify({maxNormalFromRegion1:maxNormal,normalMilestone:1025,
  berriesAwardEnergy:'jigglypuff normal/fairy 10 each; nidoran male/female poison 6.9 each',secondRegionRareAppearsWithoutExplicitStateChange:false}));
});

test('region 2 late encounters: Monte Carlo first-win viability after all accessible stat farming',()=>{
 const {s}=run('hp');
 assert.equal(s.activeRegionId,BERRY_REGION.id);
 function seeded(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
 const sample=500;
 const wins={};
 for(const id of ['jigglypuff','nidoran-m','nidoran-f']){
   let count=0;
   for(let i=1;i<=sample;i++){
     const {kind}=battle({...s,recoveryMs:0,retryPokemonId:null},id,seeded(i*1009+17));
     if(kind==='victory')count++;
   }
   wins[id]=count;
 }
 console.log('VIRTUAL_LATE_BERRY_MONTE_CARLO '+JSON.stringify({samplesPerEnemy:sample,wins,finalPlayerStats:effectiveDittoStats(s)}));
});

test('post-change balance: all available enemies and stat/economy state across strategies',()=>{
 const traces={};
 for(const policy of ['hp','attack','balanced','none']){
  const {s,results}=run(policy);
  traces[policy]={
   killsFirst:results.region1,killsBerry:results.region2,
   base:{hp:s.dittoStats.hp,attack:s.dittoStats.attack},
   effective:effectiveDittoStats(s),
   upgrades:s.energyUpgrades,
   spentNormal:s.particleEarned['노말'],
   fightingSpent:s.particleBank['격투'],
   totalWins:s.victories
  };
 }
 console.log('VIRTUAL_FLAT_UPGRADE_COMPARISON '+JSON.stringify(traces));
 assert.ok(traces.hp.effective.hp>=traces.none.effective.hp);
 assert.ok(traces.attack.effective.attack>=traces.none.effective.attack);
});

test('controlled allocation comparison: HP only, attack only, balanced with same earned energy',()=>{
 const baseline=run('none').s;
 const names=['hpOnly','attackOnly','balanced'];
 const results={};
 function seeded(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
 for(const strategy of names){
  let s=baseline;
  for(let n=0;n<100;n++){
   const chosen=strategy==='hpOnly'?'hp':strategy==='attackOnly'?'attack':
    (s.energyUpgrades.hp??0)<=(s.energyUpgrades.attack??0)?'hp':'attack';
   const next=transition(s,{type:'BUY_UPGRADE',id:chosen});
   if(next===s)break;
   s=next;
  }
  for(let n=0;n<100;n++){
   const next=transition(s,{type:'BUY_UPGRADE',id:'attackMultiplier'});
   if(next===s)break;
   s=next;
  }
  const wins={},trials=300;
  for(const id of ['jigglypuff','nidoran-m','nidoran-f']){
   let victories=0;
   for(let i=0;i<trials;i++){
    const v=battle({...s,recoveryMs:0,retryPokemonId:null},id,seeded(i*983+42));
    if(v.kind==='victory')victories++;
   }
   wins[id]=victories;
  }
  results[strategy]={levels:s.energyUpgrades,stats:effectiveDittoStats(s),unspentNormal:s.energyBalances['노말'],wins,trials};
 }
 console.log('VIRTUAL_ALLOCATION_CONTROLLED '+JSON.stringify(results));
});

test('post-Nidoran rebalance: reachable route, rewards, and late battle odds',()=>{
 const seeded=seed=>{let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 const routes={};
 for(const strategy of ['hp','attack','balanced','none']){
   const {s,results}=run(strategy);
   const finalStats=effectiveDittoStats(s);
   const wins={};
   for(const id of ['jigglypuff','nidoran-m','nidoran-f']){
     let victories=0;
     for(let i=1;i<=200;i++){
       const probe=battle({...s,recoveryMs:0,retryPokemonId:null},id,seeded(i*1013+33));
       if(probe.kind==='victory')victories++;
     }
     wins[id]=victories;
   }
   routes[strategy]={kills:results.region2,victories:s.victories,levels:s.energyUpgrades,
     stats:finalStats,energy:{normal:s.energyBalances['노말'],fairy:s.energyBalances['페어리'],poison:s.energyBalances['독']},
     winProbesPerEnemy:200,wins};
 }
 console.log('NIDORAN_REBALANCE_ROUTE '+JSON.stringify(routes));
 assert.ok(Object.values(routes).every(route=>route.victories>=90));
});

test('Nidoran male first-win snowball check: 2000 seeded attempts plus subsequent catches',()=>{
 const seeded=seed=>{let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 let {s}=run('balanced');
 let firstWin=null;
 for(let i=1;i<=2000;i++){
   const outcome=battle({...s,recoveryMs:0,retryPokemonId:null},'nidoran-m',seeded(30001+i*109));
   if(outcome.kind==='victory'){firstWin={attempt:i,elapsed:outcome.elapsed};s=outcome.state;break;}
 }
 if(firstWin){
   for(const id of ['nidoran-m','nidoran-f']){
     let wins=0,attempts=0;
     while((s.killCounts[id]??0)<10&&attempts<150){
       if(s.recoveryMs>0) s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
       if(s.recoveryMs>0) s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
       const outcome=battle(s,id,seeded(950001+attempts*193+(id==='nidoran-f'?100000:0)));
       s=outcome.state;
       if(outcome.kind==='victory')wins++;
       attempts++;
     }
   }
 }
 console.log('NIDORAN_LUCKY_PROGRESSION '+JSON.stringify({firstWin,counts:{male:s.killCounts['nidoran-m'],female:s.killCounts['nidoran-f']},victories:s.victories,stats:effectiveDittoStats(s),energy:{poison:s.energyBalances['독']}}));
});

test('antidote and new Nidoran rebalance: full virtual route plus controlled poison mitigation',()=>{
 function seeded(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
 const {s:afterCommon,results:base}=run('balanced');
 const observed={first:base.region1,berryBeforeRare:base.region2,commonStats:effectiveDittoStats(afterCommon),
   balanceAtStart:{poison:afterCommon.energyBalances['독'],normal:afterCommon.energyBalances['노말']}};
 let s=afterCommon;
 let firstMale=null;
 for(let i=1;i<=1000;i++){
   const probe=battle({...s,recoveryMs:0,retryPokemonId:null},'nidoran-m',seeded(i*1009+191));
   if(probe.kind==='victory'){firstMale={attempt:i,elapsed:probe.elapsed};s=probe.state;break;}
 }
 observed.firstMale=firstMale;
 if(!firstMale){console.log('ANTIDOTE_BALANCE_VIRTUAL '+JSON.stringify(observed));return;}
 let maleAttempts=0;
 while(s.killCounts['nidoran-m']<10&&maleAttempts<200){
   if(s.recoveryMs>0)s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
   if(s.recoveryMs>0)s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
   const trial=battle(s,'nidoran-m',seeded(maleAttempts*971+20003));
   s=trial.state;maleAttempts++;
 }
 observed.afterMale={count:s.killCounts['nidoran-m'],attempts:maleAttempts+firstMale.attempt,
  stats:effectiveDittoStats(s),poisonEnergy:s.energyBalances['독']};
 const trials=500,variants={};
 for(const variant of ['noAntidote','buyAntidote']){
   let v=s;
   if(variant==='buyAntidote'){
     for(let t=0;t<20;t++){
       const next=transition(v,{type:'BUY_UPGRADE',id:'antidote'});
       if(next===v)break;
       v=next;
     }
   }
   let wins=0,firstSuccess=null;
   for(let i=1;i<=trials;i++){
     const fight=battle({...v,recoveryMs:0,retryPokemonId:null},'nidoran-f',seeded(i*1307+701));
     if(fight.kind==='victory'){wins++;firstSuccess??=i;}
   }
   variants[variant]={levels:v.energyUpgrades,stats:effectiveDittoStats(v),
     poisonEnergy:v.energyBalances['독'],wins,trials,firstSuccess};
 }
 observed.femaleProbes=variants;
 // Continue the actual run with antidote and real rewards/recovery.
 let v=s;
 for(let n=0;n<20;n++){
   const bought=transition(v,{type:'BUY_UPGRADE',id:'antidote'});
   if(bought===v)break;
   v=bought;
 }
 let femaleAttempts=0;
 while(v.killCounts['nidoran-f']<10&&femaleAttempts<300){
   if(v.recoveryMs>0)v=transition(v,{type:'RECOVERY_TICK',deltaMs:5000});
   if(v.recoveryMs>0)v=transition(v,{type:'RECOVERY_TICK',deltaMs:5000});
   const fight=battle(v,'nidoran-f',seeded(femaleAttempts*2017+13031));
   v=fight.state;femaleAttempts++;
 }
 observed.final={male:v.killCounts['nidoran-m'],female:v.killCounts['nidoran-f'],femaleAttempts,
  totalWins:v.victories,upgrades:v.energyUpgrades,stats:effectiveDittoStats(v),
  poisonEnergy:v.energyBalances['독'],saved:decodeSave(encodeSave(v)).game.energyUpgrades.antidote===v.energyUpgrades.antidote};
 console.log('ANTIDOTE_BALANCE_VIRTUAL '+JSON.stringify(observed));
 assert.ok(observed.final.saved);
});
