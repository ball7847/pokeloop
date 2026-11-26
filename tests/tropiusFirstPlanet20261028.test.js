import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {playOnePlanet} from './helpers/virtualPlaySimulator.js';

// Only the first planet. No MOVE_PLANET, no fabricated rewards or stats.
test('Tropius first-planet balance check after special-cost and enemy stat patch',()=>{
 const initial=transition(initialState(),{type:'START'});
 const {state,report}=playOnePlanet(initial,{
  random:()=>0.5,maxBattles:1000,maxTicks:75000,logLimit:12000
 });
 assert.equal(state.planetMoves,0);
 assert.equal(state.stellar,0);
 assert.ok((report.kills.tropius??0)<=10);
 assert.ok(['COMPLETE','STALLED'].includes(report.reason));
 const timeline=report.events.filter(e=>e.id==='tropius'||
   (e.kind==='farm-before-retry'&&e.id==='tropius'));
 console.log('TROPIUS_FIRST_PLANET_RESULT '+JSON.stringify({
  reason:report.reason,exitReason:report.exitReason,planetMoves:state.planetMoves,
  firstTropiusChallenge:report.firstChallenges.tropius,
  tropiusKills:report.kills.tropius??0,
  tropiusAttempts:report.attempts.tropius??0,
  tropiusDefeats:report.defeats.tropius??0,
  tropiusMaxStreak:report.maxStreak.tropius??0,
  tropiusEvents:timeline,
  appeared:report.appeared.length,capped:report.capped,
  incomplete:report.incomplete,battles:report.battles,defeats:report.defeats,
  finalStats:report.stats.effective,
  generalUpgrades:report.stats.upgrades,
  pendingStellar:report.pendingStellar,remainingEnergy:report.remaining
 }));
});