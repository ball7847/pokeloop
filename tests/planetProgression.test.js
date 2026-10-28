import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {availableTargets,decidePlanetExit,chooseStellarUpgrades,playOnePlanet,runMultiPlanet} from './helpers/virtualPlaySimulator.js';

test('dynamic available targets respect actual appearance and unlocking',()=>{
 const state=transition(initialState(),{type:'START'});
 assert.deepEqual(availableTargets(state),['rattata','pidgey','mankey']);
 assert.equal(decidePlanetExit(state).status,'CONTINUE');
 assert.equal(decidePlanetExit(state,true).status,'STALLED');
});
test('stellar purchases use actual SE without inventing a balance',()=>{
 let state=transition(initialState(),{type:'START'});
 assert.deepEqual(chooseStellarUpgrades(state).bought,[]);
 assert.equal(state.stellar,0);
 // Test a real received value only by running the economy through the production
 // engine in integrated tests; this unit test only checks the insufficient case.
});
test('virtual play completes or explicitly reports a limit, never fabricates kills',()=>{
 const state=transition(initialState(),{type:'START'});
 const {state:end,report}=playOnePlanet(state,{maxBattles:600,maxTicks:40000,logLimit:250});
 assert.ok(report.battles>0);
 assert.ok(['COMPLETE','STALLED','battle-budget','combat-tick-budget'].includes(report.reason));
 assert.equal(report.planet,1);
 assert.equal(report.truncated,report.events.length>report.timeline.length);
 assert.equal(end.victories,Object.values(end.killCounts).reduce((sum,count)=>sum+count,0));
 assert.ok(report.appeared.every(id=>report.kills[id]>=0&&report.kills[id]<=10));
});
test('multi-planet progression preserves real reset and stellar purchase semantics',()=>{
 const result=runMultiPlanet({maxMoves:1,maxBattles:800,maxTicks:50000,logLimit:80});
 assert.ok(result.planets.length>=1);
 if(result.moves.length){
  const move=result.moves[0];
  assert.equal(move.to,2);
  assert.equal(result.planets[0].planet,1);
  assert.equal(result.planets[1].planet,2);
  assert.equal(result.state.planetMoves,1);
  assert.ok(move.bought.every(id=>move.permanent[id]>=1));
  assert.ok(result.state.dexLifetimeKills.rattata>=result.planets[0].kills.rattata);
 }else assert.ok(['battle-budget','combat-tick-budget','move-rejected'].includes(result.stop));
 console.log('MULTI_PLANET_REPORT '+JSON.stringify({
  planets:result.planets.map(p=>({planet:p.planet,reason:p.reason,battles:p.battles,
    fiveCleared:p.fiveCleared,capped:p.capped,incomplete:p.incomplete,pendingStellar:p.pendingStellar,
    stellar:p.stellar,kills:p.kills,stats:p.stats,remaining:p.remaining,gained:p.gained,
    spent:p.spent,production:p.production,defeats:p.defeats,upgrades:p.stats.upgrades})),
  moves:result.moves,stop:result.stop
 }));
});
