import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAttack,emptyCombat} from '../src/core/combatEngine.js';
import {initialState} from '../src/core/gameState.js';
import {playOnePlanet,runMultiPlanet} from './helpers/virtualPlaySimulator.js';
test('lethal counter during guaranteed multi strike prevents further strikes and fractional hit',()=>{
 const c={...emptyCombat(15),enemy:{hp:{current:100,max:100}}};
 resolveAttack(c,'player',{attack:10,accuracy:100,minDamagePercent:100,maxDamagePercent:100,multiStrike:3500},{attack:10,accuracy:100,minDamagePercent:100,maxDamagePercent:100,counter:100},()=>0);
 assert.equal(c.currentHp,0);
 assert.equal(c.enemy.hp.current,80);
});
test('pass budget is explicit and prevents planet movement',()=>{
 const result=runMultiPlanet({maxMoves:1,maxPasses:0});
 assert.equal(result.stop,'pass-budget');
 assert.equal(result.moves.length,0);
 assert.equal(result.planets[0].reason,'pass-budget');
});
test('hybrid rechecks close expected outcomes with actual engine',()=>{
 const start=initialState();
 const {report}=playOnePlanet(start,{mode:'hybrid',maxBattles:8,maxPasses:4,random:()=>.5});
 assert.equal(report.combatMode,'hybrid');
 assert.ok(report.exactRechecks>0);
 assert.ok(report.uncertainties.some(x=>x.rechecked&&['victory','defeat','unresolved'].includes(x.exactOutcome)));
 assert.ok(report.events.some(x=>x.kind==='exact-recheck'));
});
