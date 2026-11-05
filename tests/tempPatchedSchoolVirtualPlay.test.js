import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {playOnePlanet,chooseStellarUpgrades,planetPattern,nextStellarForecast} from './helpers/virtualPlaySimulator.js';
import {getWildPokemon} from '../src/core/wildData.js';
import {compareAmount} from '../src/core/bigNumber.js';

test('patched 3-region playthrough until first school form, planet by planet',()=>{
 let state=transition(initialState(),{type:'START'});
 const reports=[],moves=[];let stop='move-budget', forecast=null;
 const name=id=>getWildPokemon(id)?.name??id;
 for(let cycle=0;cycle<=10;cycle++){
  const {state:finished,report}=playOnePlanet(state,{random:()=>0.5,encounterRandom:()=>0.5,mode:'fast',
    logLimit:18000,maxBattles:1800,maxTicks:150000,stopOnVictoryId:'wishiwashi-school'});
  state=finished;reports.push(report);
  const schoolCleared=(state.killCounts['wishiwashi-school']??0)>=1;
  const events=report.events.filter(e=>e.kind==='battle-end'||e.kind==='automation'||e.kind==='upgrade'||
    e.kind==='production-purchase'||e.kind==='deferred'||e.kind==='farm-before-retry'||
    e.kind==='retry-blocked'||e.kind.startsWith('five-phase'));
  const compressed=[];
  for(const e of events){
   const last=compressed.at(-1);
   if(e.kind==='upgrade'&&last?.kind==='upgrade')last.upgrades.push(e.id+':'+e.level);
   else if(e.kind==='battle-end'&&last?.kind==='battle-end'&&last.id===e.id)
     last.runs.push({wins:e.wins,result:e.result,kills:e.kills});
   else compressed.push(e.kind==='upgrade'?{kind:e.kind,upgrades:[e.id+':'+e.level]}:
     e.kind==='battle-end'?{kind:e.kind,id:e.id,name:name(e.id),runs:[{wins:e.wins,result:e.result,kills:e.kills}]}:
     {...e,name:e.id?name(e.id):null});
  }
  const lake=['buizel','magikarp','gyarados','popplio','sobble','quaxly','cutiefly','ribombee',
   'azurill','marill','azumarill','wingull','feebas','milotic','tadbulb','lotad','bombirdier','wishiwashi','wishiwashi-school'];
  const lakeKills=Object.fromEntries(lake.filter(id=>(report.kills[id]??0)>0).map(id=>[name(id),report.kills[id]]));
  console.log('PATCHED_PLANET_SUMMARY '+JSON.stringify({
   planet:cycle+1,reason:report.reason,schoolCleared,combatMode:report.combatMode,fiveCleared:report.fiveCleared,
   battles:report.battles,defeats:Object.values(report.defeats).reduce((a,b)=>a+b,0),
   unclear:report.uncertainties.length,indeterminate:report.uncertainties.filter(e=>!e.estimatedOutcome).length,
   appeared:report.appeared.map(name),capped:report.capped.map(name),incomplete:report.incomplete.map(name),
   lakeKills,stats:report.stats,remaining:report.remaining,gained:report.gained,spent:report.spent,
   production:report.production,pendingSE:report.pendingStellar,stellar:report.stellar,
   events:compressed
  }));
  if(schoolCleared){stop='target-clear';break;}
  if(report.reason==='battle-budget'||report.reason==='combat-tick-budget'){stop=report.reason;break;}
  if(cycle===10)break;
  const previous=state;
  state=transition(state,{type:'MOVE_PLANET',random:()=>0.5});
  if(state===previous){stop='move-rejected';break;}
  const acquired=chooseStellarUpgrades(state);
  state=acquired.state;
  moves.push({from:cycle+1,to:cycle+2,pendingSE:report.pendingStellar,
    purchased:acquired.bought,stellar:state.stellar,permanent:{...state.permanentUpgrades}});
  console.log('PATCHED_PLANET_MOVE '+JSON.stringify(moves.at(-1)));
  if(reports.length>=2&&acquired.bought.length===0&&planetPattern(reports.at(-2))===planetPattern(report)){
   forecast=nextStellarForecast(state,report.pendingStellar);
   if(forecast.status==='all-maxed'){stop='repeat-all-maxed';break;}
   if(forecast.estimatedPlanets===null){stop='repeat-no-income';break;}
   if(forecast.estimatedPlanets>2){stop='repeat-wait-too-long';break;}
  }
 }
 console.log('PATCHED_FINAL '+JSON.stringify({stop,planets:reports.length,moves:moves.length,
  targetKills:state.killCounts['wishiwashi-school']??0,forecast,finalPermanent:state.permanentUpgrades,
  finalStellar:state.stellar,finalMoves:state.planetMoves}));
 assert.ok(reports.length>=1);
});
