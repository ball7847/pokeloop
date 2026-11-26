import {estimateExpectedBattle} from './expectedCombat.js';
import {settleExpectedBattle} from './fastBattleSettlement.js';
import {initialState,transition} from '../../src/core/gameState.js';
import {REGIONS,REGION,appearedInRegion,isRegionUnlocked,isPokemonUnlockedInState,regionForPokemon,getWildPokemon,getKillLimit,ALL_POKEMON} from '../../src/core/wildData.js';
import {UPGRADES,AUTOMATIONS,effectiveDittoStats,upgradeCosts} from '../../src/core/shopSystem.js';
import {STELLAR_UPGRADE_BY_ID,stellarUpgradeCost,stellarUpgradeMaxed} from '../../src/core/stellarUpgrades.js';
import {TYPES,typeLayer,particleRates} from '../../src/core/energySystem.js';
import {addAmount,compareAmount,subtractAmount,decimal} from '../../src/core/bigNumber.js';

export const DEFAULT_SU_ORDER=Object.freeze(['SU012','SU013','SU011']);
const balance=()=>Object.fromEntries(TYPES.map(type=>[type,0]));
const MAX_SAME_CONDITION_FAILURES=3;
const MAX_REPEAT_WAIT_PLANETS=2;
export const MAX_IDLE_WAIT_SECONDS=60,MAX_PLANET_IDLE_SECONDS=300;
export const ACTIVE_UPGRADE_IDS=Object.freeze(UPGRADES.filter(item=>item.base!==999999).map(item=>item.id));
export function appearedTargets(state){return REGIONS.flatMap(region=>appearedInRegion(state,region.id).map(p=>p.id));}
export function nextProductionWait(state,budget=MAX_IDLE_WAIT_SECONDS){
 if(!state.pointCirculationUnlocked||!state.automation?.point||budget<=0)return null;
 let wait=Infinity;
 for(const id of ACTIVE_UPGRADE_IDS){
  const costs=upgradeCosts(id,state.energyUpgrades[id]??0);
  if(!costs||Object.keys(costs).some(t=>typeLayer(t)>state.unlockedLayer))continue;
  if(Object.entries(costs).some(([t,c])=>t!=='노말'&&compareAmount(state.energyBalances[t]??0,c)<0))continue;
  const missing=Number(subtractAmount(costs.노말??0,state.energyBalances.노말??0));
  if(missing>0)wait=Math.min(wait,Math.ceil(missing));
 }
 return wait<=Math.min(budget,MAX_IDLE_WAIT_SECONDS)?wait:null;
}
const capForId=id=>getKillLimit(getWildPokemon(id));
const phaseGoal=(id,goal)=>Math.min(goal,capForId(id));
// Compare earned progress and combat outcomes, not the ever-growing lifetime SE.
export function planetPattern(report){
  return JSON.stringify({appeared:report.appeared,kills:report.kills,
    fiveCleared:report.fiveCleared,unlockedLayer:report.unlockedLayer,
    permanent:report.stats?.permanent,locked:report.locked});
}
// Prediction only: projected planets, kills and SE are never inserted into game state.
export function nextStellarForecast(state,planetGain){
  const choices=Object.values(STELLAR_UPGRADE_BY_ID)
    .filter(node=>!stellarUpgradeMaxed(state,node.id))
    .map(node=>({id:node.id,cost:stellarUpgradeCost(state,node.id)}))
    .filter(entry=>entry.cost!==null)
    .sort((a,b)=>compareAmount(a.cost,b.cost));
  if(!choices.length)return {status:'all-maxed',next:null,estimatedPlanets:null};
  const next=choices[0];
  const missing=compareAmount(next.cost,state.stellar)<=0?0:subtractAmount(next.cost,state.stellar);
  const ratio=compareAmount(planetGain,0)>0?decimal(missing).div(decimal(planetGain)).ceil():null;
  const estimatedPlanets=compareAmount(missing,0)===0?0:ratio===null?null:ratio.lte(Number.MAX_SAFE_INTEGER)?ratio.toNumber():ratio.toString();
  return {status:estimatedPlanets===null?'no-measured-income':'estimated',
    next:{...next,missing},estimatedPlanets};
}

// No direct mutation of game state. Every purchase, battle, recovery and move
// flows through the same transition handler as the live game.
export function availableTargets(state){
  return REGIONS.filter(region=>isRegionUnlocked(state,region.id))
    .flatMap(region=>appearedInRegion(state,region.id)
      .filter(p=>isPokemonUnlockedInState(state,p.id)).map(p=>p.id));
}
export function decidePlanetExit(state,attemptsExhausted=false){
  const ids=appearedTargets(state);
  if(ids.length===0)return {status:'STALLED',reason:'no-accessible-targets'};
  if(ids.every(id=>(state.killCounts[id]??0)>=capForId(id)))
    return {status:'COMPLETE',reason:'all-appeared-targets-capped'};
  return attemptsExhausted?{status:'STALLED',reason:'retry-budget-and-growth-exhausted'}:
    {status:'CONTINUE',reason:'remaining-kills'};
}
export function chooseStellarUpgrades(state,order=DEFAULT_SU_ORDER){
  const bought=[];
  for(let round=0;round<=Object.values(STELLAR_UPGRADE_BY_ID).reduce((sum,node)=>sum+node.maxLevel,0);round++){
    let progressed=false;
    for(const id of [...order,...Object.keys(STELLAR_UPGRADE_BY_ID).filter(id=>!order.includes(id))]){
      if(!STELLAR_UPGRADE_BY_ID[id])continue;
      const next=transition(state,{type:'BUY_STELLAR_UPGRADE',id});
      if(next!==state){state=next;bought.push(id);progressed=true;}
    }
    if(!progressed)break;
  }
  return {state,bought};
}
function statsSnapshot(state){
  return {effective:effectiveDittoStats(state),base:{...state.dittoStats},
    upgrades:{...state.energyUpgrades},permanent:{...state.permanentUpgrades}};
}
function identity(state){
  return JSON.stringify([state.killCounts,state.energyUpgrades,state.qolUnlocks,
    state.pointCirculationUnlocked,state.unlockedLayer,state.permanentUpgrades]);
}
// Advance to the next real engine event, avoiding unused time after a KO.
export function nextCombatBoundaryMs(state){
 const c=state.combat;
 const due=timer=>Math.max(0,Math.max(100,timer.duration)-timer.elapsed);
 return Math.max(1e-9,Math.min(1000,due(c.dittoAttackCooldown),due(c.enemy.attackCooldown),Math.max(0,1000-(c.regenerationElapsedMs??0))));
}
export function playOnePlanet(start,{random=()=>0.5,encounterRandom=random,evolutionRandom=encounterRandom,mode='exact',logLimit=5000,maxBattles=6000,maxTicks=250000,maxPasses=200,observe=null}={}){
  if(!['fast','hybrid','exact'].includes(mode))throw new RangeError('Invalid combat mode');
  let state=start.phase==='ready'?transition(start,{type:'START'}):start;
  const startMoves=state.planetMoves,started={...state.killCounts},startingEnergy={...state.energyBalances};
  const timeline=[],events=[],attempts={},encounterAttempts={},defeats={},maxStreak={},firstChallenges={},uncertainties=[];
  const failedConditions=new Map();
  const gained=balance(),spent=balance(),production=balance();
  let ticks=0,battles=0,seconds=0,idleSeconds=0,goal=5,safetyStop=null,firstPassDone=false,passes=0;
  let exactRechecks=0,exactTicks=0,estimatedFights=0,exactFights=0,combatSeconds=0,recoverySeconds=0;
  const layerEvents=[],milestoneEvents=[],firstProduction={},firstVictories={};
  const startLayer=state.unlockedLayer;
  const note=(kind,data={})=>{
    const {seconds:durationSeconds,...details}=data;
    const event={kind,seconds,elapsedSeconds:seconds,phaseGoal:goal,...details,...(durationSeconds===undefined?{}:{durationSeconds})};
    events.push(event);
    if(timeline.length<logLimit)timeline.push(event);
  };
  function recordChange(previous,action,deltaMs=null){
    if(previous===state)return;
    if(state.unlockedLayer>previous.unlockedLayer){
      const event={from:previous.unlockedLayer,to:state.unlockedLayer,elapsedSeconds:seconds,seconds,id:state.combat.lastEvent?.pokemonId,stats:statsSnapshot(previous)};
      layerEvents.push(event);note('layer-unlock',event);
    }
    for(const id of state.qolUnlocks??[])if(!(previous.qolUnlocks??[]).includes(id)&&id==='intimidate')note('ability-earned',{id,pokemon:'gyarados'});
    for(const t of TYPES)if(state.particleMilestones[t]>previous.particleMilestones[t]){
      const event={type:t,level:state.particleMilestones[t],elapsedSeconds:seconds,seconds,earned:state.particleEarned[t]};
      milestoneEvents.push(event);note('particle-milestone',event);
    }
    if(action==='ECONOMY_TICK'){
      const rates=particleRates(previous);
      for(const t of TYPES)if(!firstProduction[t]&&compareAmount(rates[t],0)>0&&compareAmount(state.particleEarned[t],previous.particleEarned[t])>0){
        firstProduction[t]={rate:rates[t],seconds,event:events.length};note('particle-production-start',{type:t,...firstProduction[t]});
      }
    }
    if(observe)observe({action,deltaMs,before:previous,after:state,battles,seconds,events:events.length});
  }
  const act=action=>{const previous=state;state=transition(state,action);recordChange(previous,action.type,action.deltaMs??null);return state!==previous;};
  function shop(){
    let changed=false;
    // Actions are attempted with real balances; failed attempts do not mutate state.
    for(const item of AUTOMATIONS){
      if(item.victoryPokemonId||state.qolUnlocks.includes(item.id))continue;
      const before={...state.energyBalances};
      if(act({type:'BUY_AUTOMATION',id:item.id})){
        captureSpending(before,state.energyBalances);
        changed=true;note('automation', {id:item.id});
        if(['resolve','download','moxie'].includes(item.id)&&state.automation[item.id])act({type:'TOGGLE_AUTOMATION',id:item.id});
      }
    }
    const beforeCirculation={...state.energyBalances};
    if(act({type:'BUY_CIRCULATION',id:'point'})){
      captureSpending(beforeCirculation,state.energyBalances);
      changed=true;note('production-purchase',{id:'point'});
    }
    for(let i=0;i<180;i++){
      const order=UPGRADES.filter(item=>ACTIVE_UPGRADE_IDS.includes(item.id)).sort((a,b)=>(state.energyUpgrades[a.id]??0)-(state.energyUpgrades[b.id]??0));
      let bought=false;
      for(const item of order){
        const before={...state.energyBalances};
        if(!act({type:'BUY_UPGRADE',id:item.id}))continue;
        captureSpending(before,state.energyBalances);
        note('upgrade',{id:item.id,level:state.energyUpgrades[item.id]});
        changed=true;bought=true;break;
      }
      if(!bought)break;
    }
    return changed;
  }
  function captureSpending(before,after){
    for(const type of TYPES)if(compareAmount(before[type]??0,after[type]??0)>0)
      spent[type]=addAmount(spent[type],subtractAmount(before[type],after[type]));
  }
  function economy(delta){
    const before={...state.energyBalances};
    seconds+=delta/1000;
    act({type:'ECONOMY_TICK',deltaMs:delta});
    // Only circulation currently produces type energy outside battles.
    if(state.pointCirculationUnlocked&&state.automation.point&&compareAmount(state.energyBalances.노말,before.노말)>0)
      production.노말=addAmount(production.노말,subtractAmount(state.energyBalances.노말,before.노말));
  }
  function recover(){
    while(state.recoveryMs>0){
      const delta=Math.min(5000,state.recoveryMs);
      economy(delta);recoverySeconds+=delta/1000;
      act({type:'RECOVERY_TICK',deltaMs:delta});
    }
  }
  function toggleHunger(enable){
    if(state.qolUnlocks.includes('hunger')&&state.automation.hunger!==enable)
      act({type:'TOGGLE_AUTOMATION',id:'hunger'});
  }
  function battle(id,target){
    if(battles>=maxBattles){safetyStop='battle-budget';return {result:'limit',wins:0};}
    recover();
    shop();
    const region=regionForPokemon(id);
    if(state.activeRegionId!==region)act({type:'SELECT_REGION',regionId:region});
    if(state.activeRegionId!==region)return {result:'locked',wins:0};
    const startingKills=state.killCounts[id]??0;
    const condition=JSON.stringify([id,startingKills,effectiveDittoStats(state),
      state.energyUpgrades,state.permanentUpgrades,state.itemOwned]);
    const failed=failedConditions.get(condition)??0;
    if(failed>=MAX_SAME_CONDITION_FAILURES){
      note('retry-blocked',{id,kills:startingKills,attempts:failed});
      return {result:'blocked',wins:0};
    }
    if(!firstChallenges[id])firstChallenges[id]=statsSnapshot(state);
    toggleHunger(startingKills<target-1);
    if(!act({type:'SELECT_WILD',pokemonId:id})||!state.combat.active)
      return {result:'unavailable',wins:0};
    battles++;attempts[id]=(attempts[id]??0)+1;
    let wins=0,previous=startingKills,uncertain=false;
    function captureVictory(before,estimated,rechecked){
      const after=state.killCounts[id]??0;
      if(after===previous)return;
      if(after!==previous+1)throw Error('More than one kill per encounter boundary');
      if(previous===0)firstVictories[id]=statsSnapshot(before);
      const rewards=state.combat.lastEvent?.energyRewards;
      if(!rewards)throw Error('Missing victory reward');
      for(const [type,amount] of Object.entries(rewards))gained[type]=addAmount(gained[type],amount);
      wins++;previous=after;
      note('victory',{id,kills:after,streak:wins,estimated,rechecked,target,extraFarming:goal===5&&after>phaseGoal(id,5)});
    }
    while(state.combat.active&&(state.killCounts[id]??0)<target){
      if((state.killCounts[id]??0)>=target-1)toggleHunger(false);
      if(ticks>=maxTicks){safetyStop='combat-tick-budget';break;}
      const beforeKills=state.killCounts[id]??0;
      encounterAttempts[id]=(encounterAttempts[id]??0)+1;
      const estimate=mode==='exact'?null:estimateExpectedBattle(state,id);
      if(estimate)note('expected-combat',{id,seconds:estimate.seconds,outcome:estimate.result,uncertain:estimate.uncertain,reason:estimate.reason});
      // Hybrid uses exact combat whenever a fast result could change gameplay;
      // the approximation is a diagnostic, not a source of fabricated wins.
      if(mode!=='fast'){
        exactFights++;
        const checked=mode==='hybrid'?{id,kills:beforeKills,reason:estimate.reason??'conservative-exact',estimatedOutcome:estimate.result,rechecked:true,exactOutcome:null}:null;
        if(checked){exactRechecks++;uncertainties.push(checked);}
        let elapsed=0,recheckTicks=0;
        while(state.combat.active&&(state.killCounts[id]??0)===beforeKills&&elapsed<300000&&ticks<maxTicks){
          const before=state;
          const delta=Math.min(300000-elapsed,nextCombatBoundaryMs(state));
          economy(delta);combatSeconds+=delta/1000;
          act({type:'COMBAT_TICK',deltaMs:delta,random,evolutionRandom});
          elapsed+=delta;recheckTicks++;ticks++;exactTicks++;
          captureVictory(before,false,!!checked);
        }
        let outcome=(state.killCounts[id]??0)>beforeKills?'victory':!state.combat.active?state.combat.lastEvent?.type:'unresolved';
        if(checked){checked.exactOutcome=outcome;note('exact-recheck',{...checked,ticks:recheckTicks,durationSeconds:elapsed/1000});}
        if(outcome==='unresolved'){
          if(!checked)uncertainties.push({id,kills:beforeKills,reason:'exact-time-limit',rechecked:true,exactOutcome:'unresolved'});
          uncertain=true;failedConditions.set(condition,MAX_SAME_CONDITION_FAILURES);
          if(ticks>=maxTicks)safetyStop='combat-tick-budget';
          act({type:'FLEE'});break;
        }
      }else{
        estimatedFights++;ticks++;
        const before=state;
        for(let left=estimate.seconds*1000;left>0;){const delta=Math.min(5000,left);economy(delta);combatSeconds+=delta/1000;left-=delta;}
        if(estimate.result==='uncertain'){
          uncertainties.push({id,kills:beforeKills,reason:estimate.reason,seconds:estimate.seconds});
          uncertain=true;failedConditions.set(condition,MAX_SAME_CONDITION_FAILURES);act({type:'FLEE'});break;
        }
        if(estimate.uncertain)uncertainties.push({id,kills:beforeKills,reason:estimate.reason,estimatedOutcome:estimate.result});
        state=settleExpectedBattle(state,id,estimate,evolutionRandom);
        recordChange(before,'EXPECTED_BATTLE_SETTLEMENT');captureVictory(before,true,false);
      }
    }
    if(state.combat.active){act({type:'FLEE'});if(!safetyStop)throw Error('Active combat after target completion');}
    if(safetyStop){maxStreak[id]=Math.max(maxStreak[id]??0,wins);return {result:'limit',wins};}
    const result=uncertain?'uncertain':state.combat.lastEvent?.type;
    if(result==='defeat'){
      defeats[id]=(defeats[id]??0)+1;
      if(wins===0)failedConditions.set(condition,failed+1);
      note('defeat',{id,wins});
    }
    maxStreak[id]=Math.max(maxStreak[id]??0,wins);
    note('battle-end',{id,result,wins,kills:state.killCounts[id]??0});
    return {result,wins};
  }
  // Existing policy: first 5 per species, then up to 10. After blocking,
  // cap available earlier targets and revisit the blocked target on growth.
  for(;passes<maxPasses&&!safetyStop;passes++){
    shop();
    let ids=availableTargets(state);
    const allAppeared=appearedTargets(state);
    const allFive=allAppeared.length>0&&allAppeared.every(id=>(state.killCounts[id]??0)>=phaseGoal(id,5));
    if(allFive&&!firstPassDone){
      firstPassDone=true;note('five-phase-completed');
    }
    const phaseTarget=allFive?10:goal;
    if(allFive)goal=10;
    let progressed=false;
    const beginning=identity(state);
    const visited=new Set();
    for(;;){
      if(safetyStop)break;
      ids=availableTargets(state);
      const id=ids.find(candidate=>!visited.has(candidate));
      if(!id)break;
      visited.add(id);
      const target=phaseGoal(id,phaseTarget);
      if((state.killCounts[id]??0)>=target)continue;
      const before=state.killCounts[id]??0;
      let failures=0;
      let signature=identity(state);
      let farmAttemptedAt=null;
      while((state.killCounts[id]??0)<target&&!safetyStop){
        shop();
        const current=identity(state);
        if(current!==signature){signature=current;failures=0;}
        if(failures>=MAX_SAME_CONDITION_FAILURES)break;
        const result=battle(id,target);
        if(result.result==='limit'){break;}
        if(result.wins>0){failures=0;progressed=true;signature=identity(state);}
        else if(result.result==='defeat'){
          failures++;
          // Follow the established policy: on the first defeat, farm earlier
          // accessible species to their real 10-kill cap before retrying.
          if(failures===1&&farmAttemptedAt!==signature){
            farmAttemptedAt=signature;
            const currentIds=availableTargets(state);
            const earlier=currentIds.slice(0,currentIds.indexOf(id));
            let gainedKills=0;
            for(const previousId of earlier){
              let failed=0;
              while((state.killCounts[previousId]??0)<capForId(previousId)&&failed<MAX_SAME_CONDITION_FAILURES&&!safetyStop){
                const prior=state.killCounts[previousId]??0;
                const farm=battle(previousId,capForId(previousId));
                if(farm.result==='limit')break;
                if((state.killCounts[previousId]??0)>prior){
                  gainedKills+=state.killCounts[previousId]-prior;
                  failed=0;
                }else if(farm.result==='defeat')failed++;
                else break;
              }
            }
            if(gainedKills>0){
              note('farm-before-retry',{id,gainedKills});
              progressed=true;shop();signature=identity(state);failures=0;
            }
          }
        }else break;
      }
      if((state.killCounts[id]??0)>before)progressed=true;
      if((state.killCounts[id]??0)<target)note('deferred',{id,goal:target,kills:state.killCounts[id]??0});
    }
    if(safetyStop)break;
    if(goal===5&&!progressed){
      // Do not move yet: existing farming rule allows accessible targets up to 10.
      goal=10;note('five-phase-stalled-start-farming');
      continue;
    }
    if(goal===10){
      const exit=decidePlanetExit(state,false);
      if(exit.status==='COMPLETE'){recover();shop();break;}
      // If the first-pass target was not finished, try to finish it after farming.
      }
    if(!progressed&&identity(state)===beginning){
      recover();
      if(shop())continue;
      const wait=nextProductionWait(state,MAX_PLANET_IDLE_SECONDS-idleSeconds);
      if(wait!==null){
        note('production-wait',{seconds:wait});idleSeconds+=wait;
        for(let left=wait*1000;left>0;){const delta=Math.min(5000,left);economy(delta);left-=delta;}
        if(shop())continue;
      }
      break;
    }
  }
  recover();
  const exit=decidePlanetExit(state,true);
  if(passes>=maxPasses&&exit.status!=='COMPLETE'&&!safetyStop)safetyStop='pass-budget';
  const finalFiveCleared=appearedTargets(state).length>0&&appearedTargets(state).every(id=>(state.killCounts[id]??0)>=phaseGoal(id,5));
  if(finalFiveCleared&&!firstPassDone){firstPassDone=true;note('five-phase-completed-after-farming');}
  const capped=appearedTargets(state).filter(id=>(state.killCounts[id]??0)>=capForId(id));
  const incomplete=appearedTargets(state).filter(id=>(state.killCounts[id]??0)<capForId(id));
  // A model-indeterminate encounter is not evidence of true gameplay impossibility.
  const unresolvedUncertainties=uncertainties.filter(x=>(x.rechecked?x.exactOutcome==='unresolved':!x.estimatedOutcome)&&(state.killCounts[x.id]??0)<=x.kills);
  const approximateUnresolved=unresolvedUncertainties.length>0;
  const ledger=TYPES.map(type=>{const expected=decimal(startingEnergy[type]).add(decimal(gained[type])).add(decimal(production[type])).sub(decimal(spent[type]));const actual=decimal(state.energyBalances[type]);const error=expected.sub(actual).abs();return {type,expected:expected.toString(),actual:actual.toString(),ok:error.lte(decimal(1e-8).mul(expected.abs().max(actual.abs()).max(1)))};});
   if(ledger.some(x=>!x.ok))throw Error('Virtual energy ledger mismatch: '+JSON.stringify(ledger.filter(x=>!x.ok)));
   const report={planet:startMoves+1,reason:safetyStop??(exit.status==='STALLED'&&approximateUnresolved?'UNCERTAIN':exit.status),exitReason:exit.reason,
    fiveCleared:finalFiveCleared,appeared:appearedTargets(state),locked:appearedTargets(state).filter(id=>!availableTargets(state).includes(id)),capped,incomplete,
    battles,attempts,encounterAttempts,defeats,maxStreak,exactTicks,estimatedFights,exactFights,combatSeconds,recoverySeconds,ledger,startingEnergy,limits:{maxBattles,maxTicks,maxPasses},notAppeared:ALL_POKEMON.map(p=>p.id).filter(id=>!appearedTargets(state).includes(id)),uncertainties,unresolvedUncertainties,exactRechecks,passes,approximateUnresolved,combatMode:mode,seconds,stats:statsSnapshot(state),
    kills:{...state.killCounts},gained,spent,production,remaining:{...state.energyBalances},
    particles:{...state.particleBalances},pendingStellar:state.pendingStellar,
    stellar:state.stellar,totalStellarEarned:state.totalStellarEarned,
    milestones:{...state.particleMilestones},particleEarned:{...state.particleEarned},unlockedLayer:state.unlockedLayer,startLayer,layerEvents,milestoneEvents,firstProduction,firstVictories,idleSeconds,abilities:{...state.automation},firstChallenges,events,timeline,
    truncated:events.length>timeline.length};
  return {state,report};
}
export function runMultiPlanet({maxMoves=10,random=()=>0.5,encounterRandom=random,evolutionRandom=encounterRandom,combatRandom=random,mode='exact',logLimit=5000,
  maxBattles=6000,maxTicks=250000,maxPasses=200,observe=null}={}){
  if(!Number.isInteger(maxMoves)||maxMoves<0||maxMoves>10)throw RangeError('maxMoves must be 0..10');
  let state=transition(initialState(),{type:'START'});
  const planets=[],moves=[];
  let stop='move-budget',repeatForecast=null;
  for(let cycle=0;cycle<=maxMoves;cycle++){
    const {state:finished,report}=playOnePlanet(state,{random:combatRandom,encounterRandom,evolutionRandom,mode,logLimit,maxBattles,maxTicks,maxPasses,observe});
    state=finished;planets.push(report);
    if(['battle-budget','combat-tick-budget','pass-budget'].includes(report.reason)){
      stop=report.reason;break;
    }
    if(cycle===maxMoves)break;
    const before={pending:state.pendingStellar,stellar:state.stellar,
      lifetime:state.totalStellarEarned,unlockedLayer:state.unlockedLayer,upgrades:{...state.permanentUpgrades},
      discoveries:[...state.dexDiscovered],kills:{...state.dexLifetimeKills}};
    const previous=state;
    state=transition(state,{type:'MOVE_PLANET',random:encounterRandom});
    if(state===previous){stop='move-rejected';break;}
    if(state.planetMoves!==previous.planetMoves+1)throw Error('bad planet count');
    const acquired=chooseStellarUpgrades(state);
    state=acquired.state;
    moves.push({from:cycle+1,to:cycle+2,reason:report.reason,before,
      gain:before.pending,unlockedLayer:state.unlockedLayer,afterStellar:state.stellar,bought:acquired.bought,
      permanent:{...state.permanentUpgrades},firstStats:effectiveDittoStats(state)});
    // No extrapolation: always perform a real move and try real SU purchases first.
    if(planets.length>=2&&acquired.bought.length===0&&
        !report.approximateUnresolved&&report.combatMode!=='fast'&&
        !ALL_POKEMON.some(p=>p.rarity&&p.rarity!=='common'&&!(state.dexLifetimeKills[p.id]>0))&&
        planetPattern(planets.at(-2))===planetPattern(report)){
      const forecast=nextStellarForecast(state,report.pendingStellar);
      if(forecast.status==='all-maxed'){
        stop='repeat-all-maxed';repeatForecast=forecast;break;
      }
      if(forecast.estimatedPlanets===null){
        stop='repeat-no-income';repeatForecast=forecast;break;
      }
      if(compareAmount(forecast.estimatedPlanets,MAX_REPEAT_WAIT_PLANETS)>0){
        stop='repeat-wait-too-long';repeatForecast=forecast;break;
      }
    }
  }
  return {planets,moves,state,stop,repeatForecast,unplayedPlanet:moves.length>=planets.length?state.planetMoves+1:null};
}
