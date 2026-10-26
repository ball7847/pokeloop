import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {isPokemonUnlockedInState,isRegionUnlocked,REGION,BERRY_REGION,BERRY_POKEMON,UNCOMMON_BASE_CHANCE} from '../src/core/wildData.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

const first=['rattata','pidgey','spearow','mankey','zubat','meowth','geodude','exeggcute','sentret','tauros'];
const second=['caterpie','weedle','taillow','kakuna','metapod','igglybuff','nidoran-m','nidoran-f'];
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
 assert.equal(BERRY_POKEMON.find(p=>p.id==='caterpie').energyReward,3);
 assert.equal(BERRY_POKEMON.find(p=>p.id==='taillow').energyReward,10);
 assert.equal(BERRY_POKEMON.find(p=>p.id==='igglybuff').energyReward,17.4);
 // Under the current capped first region, total normal energy available is finite.
 const H10=Array.from({length:10},(_,i)=>1/(i+1)).reduce((a,b)=>a+b,0);
 const maxNormal=H10*(1+2+3);
 assert.ok(maxNormal<1025);
 console.log('VIRTUAL_ECONOMY '+JSON.stringify({maxNormalFromRegion1:maxNormal,normalMilestone:1025,
  berriesAwardEnergy:'igglybuff normal/fairy 17.4 each; nidoran male/female poison 6.9 each',secondRegionRareAppearsWithoutExplicitStateChange:false}));
});

test('region 2 late encounters: Monte Carlo first-win viability after all accessible stat farming',()=>{
 const {s}=run('hp');
 assert.equal(s.activeRegionId,BERRY_REGION.id);
 function seeded(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
 const sample=500;
 const wins={};
 for(const id of ['igglybuff','nidoran-m','nidoran-f']){
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
  for(const id of ['igglybuff','nidoran-m','nidoran-f']){
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
   for(const id of ['igglybuff','nidoran-m','nidoran-f']){
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
 assert.ok(['hp','attack','balanced'].every(policy=>routes[policy].victories>=90));
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


test('female Nidoran ATK/poison 4.7: single encounter, ordinary repeats, and real endless hunger streak',()=>{
 // Deterministic seeds mean the manual and chained scenarios can be replayed.
 const rng=seed=>{let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 let {s:baseline,results}=run('balanced');
 const preparation={commonClears:results.region2,
  initialNormal:baseline.energyBalances['노말'],initialPoison:baseline.energyBalances['독'],
  initialStats:effectiveDittoStats(baseline)};
 // Use only actual victories, energy rewards, and normal post-loss recovery.
 let maleTries=0;
 while((baseline.killCounts['nidoran-m']??0)<10&&maleTries<500){
   while(baseline.recoveryMs>0)baseline=transition(baseline,{type:'RECOVERY_TICK',deltaMs:5000});
   const result=battle(baseline,'nidoran-m',rng(11003+maleTries*1193));
   baseline=result.state;
   maleTries++;
 }
 assert.equal(baseline.killCounts['nidoran-m'],10,'cannot prepare 10 male victories');
 const beforeFemale={maleTries,stats:effectiveDittoStats(baseline),
   poisonEnergy:baseline.energyBalances['독'],normalEnergy:baseline.energyBalances['노말']};
 const samples=300;
 const options={};
 for(const antidote of [0,2]){
   let starting={...baseline,killCounts:{...baseline.killCounts,'nidoran-f':0}};
   while((starting.energyUpgrades.antidote??0)<antidote){
     const next=transition(starting,{type:'BUY_UPGRADE',id:'antidote'});
     assert.notEqual(next,starting,'not enough real poison energy');
     starting=next;
   }
   // Fresh independent encounters, always starting with full HP.
   let standalone=0;
   for(let i=0;i<samples;i++){
     const outcome=battle({...starting,recoveryMs:0,retryPokemonId:null},'nidoran-f',rng(210011+i*1279));
     if(outcome.kind==='victory')standalone++;
   }
   // Repeated ordinary battles: each encounter heals to full, unlike endless hunger.
   let ordinary=starting,ordinaryAttempts=0,firstWinAttempt=null;
   while((ordinary.killCounts['nidoran-f']??0)<10&&ordinaryAttempts<250){
     while(ordinary.recoveryMs>0)ordinary=transition(ordinary,{type:'RECOVERY_TICK',deltaMs:5000});
     const outcome=battle(ordinary,'nidoran-f',rng(310021+ordinaryAttempts*1733));
     ordinary=outcome.state;
     ordinaryAttempts++;
     if(firstWinAttempt===null&&ordinary.killCounts['nidoran-f']>0)firstWinAttempt=ordinaryAttempts;
   }
   // Continuous-kill action only becomes available after buying endless hunger.
   let chained=transition(starting,{type:'BUY_AUTOMATION',id:'hunger'});
   assert.equal(chained.automation.hunger,true);
   const chainHistogram=Array(11).fill(0);
   let completeChains=0,highestChain=0;
   let representative=null;
   for(let i=0;i<samples;i++){
     let state={...chained,recoveryMs:0,retryPokemonId:null};
     const initial=state.killCounts['nidoran-f']??0;
     state=transition(state,{type:'SELECT_WILD',pokemonId:'nidoran-f'});
     assert.equal(state.combat.active,true);
     const random=rng(410031+i*1913);
     let steps=0,peak=initial;
     let previousCount=initial;
     let afterWinHp=null,afterWinPoison=null;
     while(state.combat.active&&steps++<2000){
       state=transition(state,{type:'COMBAT_TICK',deltaMs:500,random});
       if(state.killCounts['nidoran-f']>previousCount){
         previousCount=state.killCounts['nidoran-f'];
         peak=previousCount;
         if(afterWinHp===null){
           afterWinHp=state.combat.currentHp;
           afterWinPoison=state.combat.playerStatus.poison;
         }
       }
     }
     assert.ok(steps<2000,'endless hunger battle timeout');
     const successes=peak-initial;
     chainHistogram[successes]++;
     if(successes===10)completeChains++;
     highestChain=Math.max(highestChain,successes);
     if(i===0)representative={kills:successes,afterWinHp,afterWinPoison,
       finishEvent:state.combat.lastEvent?.type,remainingHp:state.combat.currentHp};
   }
   options['antidote'+antidote]={
     availablePoison:starting.energyBalances['독'],
     standaloneWins:standalone,standaloneTrials:samples,
     ordinary:{attempts:ordinaryAttempts,kills:ordinary.killCounts['nidoran-f'],
       firstWinAttempt,finalStats:effectiveDittoStats(ordinary),
       remainingPoison:ordinary.energyBalances['독']},
     endlessHunger:{trials:samples,chainHistogram,completeChains,highestChain,representative}
   };
 }
 console.log('FEMALE_NIDORAN_47_CHAIN_TEST '+JSON.stringify({preparation,beforeFemale,options}));
});


test('endless hunger full-route audit: per-species chain length with actual HP and poison carry',()=>{
 const seeded=seed=>{let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 let game=transition(initialState(),{type:'START'});
 const history={};
 const purchase=()=>{
   if(!game.automation.hunger){
     const next=transition(game,{type:'BUY_AUTOMATION',id:'hunger'});
     if(next!==game)game=next;
   }
   for(let i=0;i<35;i++){
     const order=(game.energyUpgrades.hp??0)<=(game.energyUpgrades.attack??0)?
       ['hp','attack','attackMultiplier']:['attack','hp','attackMultiplier'];
     let next=game;
     for(const id of order){
       const candidate=transition(game,{type:'BUY_UPGRADE',id});
       if(candidate!==game){next=candidate;break;}
     }
     if(next===game)break;
     game=next;
   }
 };
 const enter=id=>{
   let attempted=0,chainMax=0,chainResults=[],losses=0,finished=0;
   while((game.killCounts[id]??0)<10&&attempted<35){
     while(game.recoveryMs>0)game=transition(game,{type:'RECOVERY_TICK',deltaMs:5000});
     purchase();
     const before=game.killCounts[id]??0;
     game=transition(game,{type:'SELECT_WILD',pokemonId:id});
     if(!game.combat.active)break;
     const r=seeded(701+id.split('').reduce((v,c)=>v+c.charCodeAt(0),0)*3001+attempted*1613);
     let ticks=0,peak=before;
     while(game.combat.active&&ticks++<1000){
       game=transition(game,{type:'COMBAT_TICK',deltaMs:500,random:r});
       peak=Math.max(peak,game.killCounts[id]??0);
     }
     assert.ok(ticks<1000,'endless hunger timeout for '+id);
     const chain=peak-before;
     chainMax=Math.max(chainMax,chain);
     chainResults.push(chain);
     if(game.combat.lastEvent?.type==='defeat')losses++;
     else if(game.combat.lastEvent?.type==='victory')finished++;
     attempted++;
   }
   history[id]={kills:game.killCounts[id]??0,attempts:attempted,maximumUnbrokenKills:chainMax,
     chainLengths:chainResults,defeats:losses,normalEnergy:game.energyBalances['노말'],
     stats:effectiveDittoStats(game)};
 };
 for(const id of first)if(isPokemonUnlockedInState(game,id))enter(id);
 if(isRegionUnlocked(game,BERRY_REGION.id)){
   game=transition(game,{type:'SELECT_REGION',regionId:BERRY_REGION.id});
   for(const id of second)if(isPokemonUnlockedInState(game,id))enter(id);
 }
 console.log('ENDLESS_HUNGER_FULL_ROUTE '+JSON.stringify({purchased:game.automation.hunger,
   totalWins:game.victories,history}));
 assert.equal(game.automation.hunger,true);
});


test('Nidoran female battle: report remaining HP distribution after poison 4.7 patch',()=>{
 const rng=seed=>{let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 let {s}=run('balanced');
 for(let i=0;i<500&&(s.killCounts['nidoran-m']??0)<10;i++){
   while(s.recoveryMs>0)s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
   s=battle(s,'nidoran-m',rng(11003+i*1193)).state;
 }
 assert.equal(s.killCounts['nidoran-m'],10);
 const data={player:effectiveDittoStats(s),samples:{}};
 for(const level of [0,2]){
   let candidate={...s,killCounts:{...s.killCounts,'nidoran-f':0}};
   while((candidate.energyUpgrades.antidote??0)<level){
     const next=transition(candidate,{type:'BUY_UPGRADE',id:'antidote'});
     assert.notEqual(next,candidate);
     candidate=next;
   }
   const hp=[],times=[],outcomes={};
   for(let i=0;i<300;i++){
     let state=transition({...candidate,recoveryMs:0,retryPokemonId:null}, {type:'SELECT_WILD',pokemonId:'nidoran-f'});
     const random=rng(210011+i*1279);
     let lastEnemyHp=state.combat.enemy.hp.current;
     let elapsed=0;
     while(state.combat.active&&elapsed<180000){
       lastEnemyHp=state.combat.enemy.hp.current;
       state=transition(state,{type:'COMBAT_TICK',deltaMs:50,random});
       elapsed+=50;
     }
     const outcome=state.combat.lastEvent?.type??'timeout';
     outcomes[outcome]=(outcomes[outcome]??0)+1;
     if(outcome==='defeat'){hp.push(lastEnemyHp);times.push(elapsed);}
   }
   hp.sort((a,b)=>a-b);
   const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
   const percentile=p=>hp.length?hp[Math.floor((hp.length-1)*p)]:null;
   data.samples['antidote'+level]={outcomes,remainingHp:{min:hp.length?hp[0]:null,p10:percentile(.1),p25:percentile(.25),median:percentile(.5),
     average:hp.length?mean(hp):null,p75:percentile(.75),p90:percentile(.9),max:hp.length?hp.at(-1):null},
     averageEnemyHpLost:hp.length?440-mean(hp):null,averageFightSeconds:times.length?mean(times)/1000:null};
 }
 console.log('NIDORAN_F_DEFEAT_REMAINING_HP '+JSON.stringify(data));
});


test('poison amplification 3 percent progression: affordable timing, payoff, repeat and actual carry-HP chains',async()=>{
 const seeded=seed=>{let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 let {s:baseline,results}=run('balanced');
 let maleAttempts=0;
 while(baseline.killCounts['nidoran-m']<10&&maleAttempts<300){
   while(baseline.recoveryMs>0)baseline=transition(baseline,{type:'RECOVERY_TICK',deltaMs:5000});
   baseline=battle(baseline,'nidoran-m',seeded(11003+maleAttempts*1193)).state;
   maleAttempts++;
 }
 assert.equal(baseline.killCounts['nidoran-m'],10);
 const beforeFemale={maleAttempts,stats:effectiveDittoStats(baseline),poisonEnergy:baseline.energyBalances['독']};
 const options={};
 for(const policy of ['antidote2','antidote1Poison1','poison2','antidote2ThenPoison1']){
   let s=baseline;
   const choices=policy==='antidote2'||policy==='antidote2ThenPoison1'?
     ['antidote','antidote']:policy==='antidote1Poison1'?['antidote','poisonMultiplier']:['poisonMultiplier','poisonMultiplier'];
   for(const id of choices){
     const next=transition(s,{type:'BUY_UPGRADE',id});
     assert.notEqual(next,s,policy+' cannot buy '+id);
     s=next;
   }
   const firstStage={levels:s.energyUpgrades,stats:effectiveDittoStats(s),poisonEnergy:s.energyBalances['독']};
   let wins=0;
   for(let i=0;i<150;i++){
     const outcome=battle({...s,recoveryMs:0,retryPokemonId:null},'nidoran-f',seeded(311311+i*1571));
     if(outcome.kind==='victory')wins++;
   }
   let ordinary=s,ordinaryTries=0,firstWin=null;
   while(ordinary.killCounts['nidoran-f']<10&&ordinaryTries<120){
     while(ordinary.recoveryMs>0)ordinary=transition(ordinary,{type:'RECOVERY_TICK',deltaMs:5000});
     const result=battle(ordinary,'nidoran-f',seeded(410021+ordinaryTries*1733));
     ordinary=result.state;ordinaryTries++;
     if(firstWin===null&&ordinary.killCounts['nidoran-f']>0)firstWin=ordinaryTries;
   }
   let after=ordinary;
   if(policy==='antidote2ThenPoison1'&&after.killCounts['nidoran-f']>0){
     const next=transition(after,{type:'BUY_UPGRADE',id:'poisonMultiplier'});
     if(next!==after)after=next;
   }
   // Independently test hunger auto-continuation with actual HP/poison carry.
   let hunger=transition(s,{type:'BUY_AUTOMATION',id:'hunger'});
   assert.equal(hunger.automation.hunger,true);
   let histogram=Array(11).fill(0);
   for(let i=0;i<150;i++){
     let q=transition({...hunger,recoveryMs:0,retryPokemonId:null},{type:'SELECT_WILD',pokemonId:'nidoran-f'});
     const random=seeded(611031+i*1997);
     let steps=0;
     while(q.combat.active&&steps++<1000)q=transition(q,{type:'COMBAT_TICK',deltaMs:500,random});
     assert.ok(steps<1000);
     histogram[q.killCounts['nidoran-f']??0]++;
   }
   options[policy]={firstStage,firstBattleWins:wins,firstBattleAttempts:150,
     ordinary:{firstWin,attempts:ordinaryTries,kills:ordinary.killCounts['nidoran-f'],basePoison:ordinary.dittoStats.poison,
       finalEffective:effectiveDittoStats(ordinary),poisonEnergy:ordinary.energyBalances['독']},
     afterOptionalPoisonPurchase:{levels:after.energyUpgrades,poison:effectiveDittoStats(after).poison,poisonEnergy:after.energyBalances['독']},
     hunger:{samples:150,histogram,maxChain:histogram.reduce((mx,n,i)=>n>0?Math.max(mx,i):mx,0)}};
 }
 // Isolate the poison-amplification effect on a repeatable target at an actual attainable post-female state.
 const grown=options.antidote2ThenPoison1.afterOptionalPoisonPurchase;
 const bought=options.antidote2ThenPoison1.afterOptionalPoisonPurchase.levels.poisonMultiplier??0;
 const basePoison=options.antidote2ThenPoison1.ordinary.basePoison;
 const rawPoison=options.antidote2.ordinary.basePoison;
 assert.ok(bought>=1,'a poison level should be affordable after 10 female kills');
 const {resolveAttack}=await import('../src/core/combatEngine.js');
 const combatCase=(poison)=>{
   const c={currentHp:100000,dittoHp:{current:100000,max:100000},playerStatus:{poison:0,paralysis:0},
     enemyStatus:{poison:0,paralysis:0},enemy:{hp:{current:100000,max:100000}}};
   const attacking={attack:0,specialAttack:0,poison,accuracy:100,minDamagePercent:100};
   const defending={defense:0,specialDefense:0,dodge:0};
   for(let i=0;i<10;i++){
     resolveAttack(c,'player',attacking,defending,()=>0.5);
     resolveAttack(c,'enemy',{attack:0,specialAttack:0,poison:0,accuracy:100,minDamagePercent:100},defending,()=>0.5);
   }
   return {stack:c.enemyStatus.poison,damage:100000-c.enemy.hp.current};
 };
 const damageComparison={raw:combatCase(rawPoison),amplified:combatCase(basePoison*(1+bought*.03))};
 console.log('POISON_3_PERCENT_VIRTUAL '+JSON.stringify({initialRegionalKills:results.region2,beforeFemale,options,damageComparison}));
 assert.ok(damageComparison.amplified.damage>damageComparison.raw.damage);
});
