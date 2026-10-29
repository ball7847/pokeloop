import {estimateExpectedBattle} from './expectedCombat.js';
import {settleExpectedBattle} from './fastBattleSettlement.js';
import {initialState,transition} from '../../src/core/gameState.js';
import {REGIONS,REGION,appearedInRegion,isRegionUnlocked,isPokemonUnlockedInState,regionForPokemon} from '../../src/core/wildData.js';
import {UPGRADES,AUTOMATIONS,effectiveDittoStats} from '../../src/core/shopSystem.js';
import {STELLAR_UPGRADE_BY_ID,stellarUpgradeCost,stellarUpgradeMaxed} from '../../src/core/stellarUpgrades.js';
import {TYPES} from '../../src/core/energySystem.js';
import {addAmount,compareAmount,subtractAmount} from '../../src/core/bigNumber.js';

export const DEFAULT_SU_ORDER=Object.freeze(['SU012','SU013','SU011']);
const balance=()=>Object.fromEntries(TYPES.map(type=>[type,0]));
const MAX_SAME_CONDITION_FAILURES=3;
const MAX_REPEAT_WAIT_PLANETS=2;
// Compare earned progress and combat outcomes, not the ever-growing lifetime SE.
export function planetPattern(report){
  return JSON.stringify({
    appeared:report.appeared,kills:report.kills,attempts:report.attempts,
    defeats:report.defeats,maxStreak:report.maxStreak,battles:report.battles,
    uncertainties:report.uncertainties,combatMode:report.combatMode,
    fiveCleared:report.fiveCleared,stats:report.stats,
    remaining:report.remaining,gained:report.gained,spent:report.spent,
    production:report.production,pendingStellar:report.pendingStellar
  });
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
  const income=Number(planetGain);
  const estimatedPlanets=compareAmount(missing,0)===0?0:
    Number.isFinite(income)&&income>0?Math.ceil(Number(missing)/income):null;
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
  const ids=availableTargets(state);
  if(ids.length===0)return {status:'STALLED',reason:'no-accessible-targets'};
  if(ids.every(id=>(state.killCounts[id]??0)>=REGION.defaultKillLimit))
    return {status:'COMPLETE',reason:'all-appeared-targets-capped'};
  return attemptsExhausted?{status:'STALLED',reason:'retry-budget-and-growth-exhausted'}:
    {status:'CONTINUE',reason:'remaining-kills'};
}
export function chooseStellarUpgrades(state,order=DEFAULT_SU_ORDER){
  const bought=[];
  for(let round=0;round<400;round++){
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
    state.pointCirculationUnlocked,state.permanentUpgrades]);
}
export function playOnePlanet(start,{random=()=>0.5,encounterRandom=random,mode='fast',logLimit=5000,maxBattles=6000,maxTicks=250000}={}){
  if(!['fast','exact'].includes(mode))throw new RangeError('Invalid combat mode');
  let state=start.phase==='ready'?transition(start,{type:'START'}):start;
  const startMoves=state.planetMoves,started={...state.killCounts};
  const timeline=[],events=[],attempts={},defeats={},maxStreak={},firstChallenges={},uncertainties=[];
  const failedConditions=new Map();
  const gained=balance(),spent=balance(),production=balance();
  let ticks=0,battles=0,seconds=0,goal=5,safetyStop=null,firstPassDone=false;
  const note=(kind,data={})=>{
    const event={kind,...data};
    events.push(event);
    if(timeline.length<logLimit)timeline.push(event);
  };
  const act=action=>{const next=transition(state,action);const changed=next!==state;state=next;return changed;};
  function shop(){
    let changed=false;
    // Actions are attempted with real balances; failed attempts do not mutate state.
    for(const item of AUTOMATIONS){
      if(state.qolUnlocks.includes(item.id))continue;
      const before={...state.energyBalances};
      if(act({type:'BUY_AUTOMATION',id:item.id})){
        captureSpending(before,state.energyBalances);
        changed=true;note('automation', {id:item.id});
        if(item.id==='resolve'&&state.automation.resolve)act({type:'TOGGLE_AUTOMATION',id:'resolve'});
      }
    }
    const beforeCirculation={...state.energyBalances};
    if(act({type:'BUY_CIRCULATION',id:'point'})){
      captureSpending(beforeCirculation,state.energyBalances);
      changed=true;note('production-purchase',{id:'point'});
    }
    for(let i=0;i<180;i++){
      const order=[...UPGRADES].sort((a,b)=>(state.energyUpgrades[a.id]??0)-(state.energyUpgrades[b.id]??0));
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
    act({type:'ECONOMY_TICK',deltaMs:delta});
    seconds+=delta/1000;
    // Only circulation currently produces type energy outside battles.
    if(state.pointCirculationUnlocked&&compareAmount(state.energyBalances.노말,before.노말)>0)
      production.노말=addAmount(production.노말,subtractAmount(state.energyBalances.노말,before.노말));
  }
  function recover(){
    while(state.recoveryMs>0){
      const delta=Math.min(5000,state.recoveryMs);
      act({type:'RECOVERY_TICK',deltaMs:delta});
      economy(delta);
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
    let wins=0,steps=0,previous=startingKills,uncertain=false;
    if(mode==='fast'){
      while(state.combat.active&&(state.killCounts[id]??0)<target&&steps++<REGION.defaultKillLimit){
        if((state.killCounts[id]??0)>=target-1)toggleHunger(false);
        const estimate=estimateExpectedBattle(state,id);
        note('expected-combat',{id,seconds:estimate.seconds,outcome:estimate.result,
          uncertain:estimate.uncertain,reason:estimate.reason});
        // Ambiguous model outputs must not create fictitious victories or defeats.
        if(estimate.result==='uncertain'){
          uncertainties.push({id,kills:state.killCounts[id]??0,reason:estimate.reason,
            seconds:estimate.seconds,playerHp:estimate.playerHp,enemyHp:estimate.enemyHp});
          failedConditions.set(condition,MAX_SAME_CONDITION_FAILURES);
          act({type:'FLEE'});
          uncertain=true;
          break;
        }
        if(estimate.uncertain){
          uncertainties.push({id,kills:state.killCounts[id]??0,reason:estimate.reason,
            seconds:estimate.seconds,playerHp:estimate.playerHp,enemyHp:estimate.enemyHp,
            estimatedOutcome:estimate.result});
        }
        const before={...state.energyBalances};
        state=settleExpectedBattle(state,id,estimate,encounterRandom);
        // Economic production is still handled by real game transitions, at
        // legal 5s chunks. No invented energy or stellar grants.
        let remainingMs=estimate.seconds*1000;
        while(remainingMs>0){
          const delta=Math.min(5000,remainingMs);
          economy(delta);
          remainingMs-=delta;
        }
        const after=state.killCounts[id]??0;
        if(after>previous){
          if(after!==previous+1)throw Error('Expected settlement must add exactly one kill');
          const rewards=state.combat.lastEvent?.energyRewards;
          if(!rewards)throw Error('Missing expected victory reward');
          for(const [type,amount] of Object.entries(rewards))gained[type]=addAmount(gained[type],amount);
          wins++;previous=after;
          note('victory',{id,kills:after,streak:wins,estimated:true,uncertain:estimate.uncertain});
        }
        ticks++;
      }
      if(state.combat.active){
        // No artificial combat timeouts in fast mode. A remaining encounter
        // must be closed before the next target or planet.
        act({type:'FLEE'});
      }
    }else{
    while(state.combat.active&&steps++<2400&&ticks<maxTicks){
      if((state.killCounts[id]??0)>=target-1)toggleHunger(false);
      const before={...state.energyBalances};
      act({type:'COMBAT_TICK',deltaMs:500,random});
      // The combat event reports the actual grant, including SU bonuses.
      const after=state.killCounts[id]??0;
      if(after>previous){
        if(after-previous!==1)throw Error('multiple kills in one tick: reduce tick duration');
        const rewards=state.combat.lastEvent?.energyRewards;
        if(!rewards)throw Error('missing victory reward event');
        for(const [type,amount] of Object.entries(rewards))gained[type]=addAmount(gained[type],amount);
        wins+=after-previous;previous=after;
        note('victory',{id,kills:after,streak:wins});
      }
      // If the real event was not exposed, never backfill invented rewards.
      economy(500);
      ticks++;
      if(state.combat.active&&wins>REGION.defaultKillLimit)throw Error('invalid streak');
    }
    }
    if(state.combat.active){safetyStop='combat-tick-budget';return {result:'limit',wins};}
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
  for(let pass=0;pass<200&&!safetyStop;pass++){
    shop();
    const ids=availableTargets(state);
    const allFive=ids.length>0&&ids.every(id=>(state.killCounts[id]??0)>=5);
    if(allFive&&!firstPassDone){
      firstPassDone=true;note('five-phase-completed');
    }
    const target=allFive?10:goal;
    if(allFive)goal=10;
    let progressed=false;
    const beginning=identity(state);
    for(const id of ids){
      if(safetyStop)break;
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
            const earlier=ids.slice(0,ids.indexOf(id));
            let gainedKills=0;
            for(const previousId of earlier){
              let failed=0;
              while((state.killCounts[previousId]??0)<10&&failed<MAX_SAME_CONDITION_FAILURES&&!safetyStop){
                const prior=state.killCounts[previousId]??0;
                const farm= battle(previousId,10);
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
      if(exit.status==='COMPLETE')break;
      // If the first-pass target was not finished, try to finish it after farming.
      if(!progressed&&identity(state)===beginning)break;
    }
    if(!progressed&&identity(state)===beginning)break;
  }
  recover();
  shop();
  const exit=decidePlanetExit(state,true);
  const finalFiveCleared=availableTargets(state).length>0&&availableTargets(state).every(id=>(state.killCounts[id]??0)>=5);
  if(finalFiveCleared&&!firstPassDone){firstPassDone=true;note('five-phase-completed-after-farming');}
  const capped=availableTargets(state).filter(id=>(state.killCounts[id]??0)>=10);
  const incomplete=availableTargets(state).filter(id=>(state.killCounts[id]??0)<10);
  const report={planet:startMoves+1,reason:safetyStop??exit.status,exitReason:exit.reason,
    fiveCleared:finalFiveCleared,appeared:availableTargets(state),capped,incomplete,
    battles,attempts,defeats,maxStreak,uncertainties,combatMode:mode,seconds,stats:statsSnapshot(state),
    kills:{...state.killCounts},gained,spent,production,remaining:{...state.energyBalances},
    particles:{...state.particleBalances},pendingStellar:state.pendingStellar,
    stellar:state.stellar,totalStellarEarned:state.totalStellarEarned,
    milestones:{...state.particleMilestones},firstChallenges,events,timeline,
    truncated:events.length>timeline.length};
  return {state,report};
}
export function runMultiPlanet({maxMoves=10,random=()=>0.5,encounterRandom=random,combatRandom=random,mode='fast',logLimit=5000,
  maxBattles=6000,maxTicks=250000}={}){
  if(!Number.isInteger(maxMoves)||maxMoves<0||maxMoves>10)throw RangeError('maxMoves must be 0..10');
  let state=transition(initialState(),{type:'START'});
  const planets=[],moves=[];
  let stop='move-budget',repeatForecast=null;
  for(let cycle=0;cycle<=maxMoves;cycle++){
    const {state:finished,report}=playOnePlanet(state,{random:combatRandom,encounterRandom,mode,logLimit,maxBattles,maxTicks});
    state=finished;planets.push(report);
    if(report.reason==='battle-budget'||report.reason==='combat-tick-budget'){
      stop=report.reason;break;
    }
    if(cycle===maxMoves)break;
    const before={pending:state.pendingStellar,stellar:state.stellar,
      lifetime:state.totalStellarEarned,upgrades:{...state.permanentUpgrades},
      discoveries:[...state.dexDiscovered],kills:{...state.dexLifetimeKills}};
    const previous=state;
    state=transition(state,{type:'MOVE_PLANET',random:encounterRandom});
    if(state===previous){stop='move-rejected';break;}
    if(state.planetMoves!==previous.planetMoves+1)throw Error('bad planet count');
    const acquired=chooseStellarUpgrades(state);
    state=acquired.state;
    moves.push({from:cycle+1,to:cycle+2,reason:report.reason,before,
      gain:before.pending,afterStellar:state.stellar,bought:acquired.bought,
      permanent:{...state.permanentUpgrades},firstStats:effectiveDittoStats(state)});
    // No extrapolation: always perform a real move and try real SU purchases first.
    if(planets.length>=2&&acquired.bought.length===0&&
        planetPattern(planets.at(-2))===planetPattern(report)){
      const forecast=nextStellarForecast(state,report.pendingStellar);
      if(forecast.status==='all-maxed'){
        stop='repeat-all-maxed';repeatForecast=forecast;break;
      }
      if(forecast.estimatedPlanets===null){
        stop='repeat-no-income';repeatForecast=forecast;break;
      }
      if(forecast.estimatedPlanets>MAX_REPEAT_WAIT_PLANETS){
        stop='repeat-wait-too-long';repeatForecast=forecast;break;
      }
    }
  }
  return {planets,moves,state,stop,repeatForecast};
}
