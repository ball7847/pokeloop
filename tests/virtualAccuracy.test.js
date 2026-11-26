import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {startBattle,advanceBattle} from '../src/core/combatEngine.js';
import {nextCombatBoundaryMs,playOnePlanet,nextStellarForecast} from './helpers/virtualPlaySimulator.js';
import {estimateExpectedBattle} from './helpers/expectedCombat.js';
const ready=()=>({...initialState(),phase:'running',dittoStats:{...initialState().dittoStats,hp:10000,attack:10000,speed:100}});
test('exact boundary avoids charging time after first lethal hit',()=>{
 const s=startBattle(ready(),'rattata');
 assert.equal(nextCombatBoundaryMs(s),100);
 assert.equal(advanceBattle(s,nextCombatBoundaryMs(s),()=>0).killCounts.rattata,1);
 const {report}=playOnePlanet(ready(),{maxBattles:1,random:()=>0});
 assert.equal(report.combatMode,'exact');
 assert.equal(report.combatSeconds,.1);
 assert.equal(report.exactFights,1);
 assert.equal(report.estimatedFights,0);
 assert.ok(report.ledger.every(x=>x.ok));
 assert.ok(report.events.every((e,i,arr)=>i===0||e.elapsedSeconds>=arr[i-1].elapsedSeconds));
});
test('exact evolution channel does not consume combat RNG for evolution',()=>{
 const s=ready();s.killCounts={...s.killCounts,rattata:1,pidgey:1,mankey:1};s.uncommonChance=.5;
 const c=startBattle(s,'spearow');let calls=0;
 const won=advanceBattle(c,100,()=>.9,()=>{calls++;return 0;});
 assert.equal(won.killCounts.spearow,1);
 assert.equal(won.evolutionResults.fearow,true);
 assert.equal(calls,1);
});
test('approximate combat orders lethal hit ahead of later retaliation',()=>{
 const s=startBattle(ready(),'rattata');
 const r=estimateExpectedBattle(s,'rattata');
 assert.equal(r.result,'victory');assert.equal(r.seconds,.1);assert.equal(r.playerHp,s.combat.currentHp);
});
test('forecast accepts large-number income without converting to Infinity',()=>{
 const s=initialState();
 const r=nextStellarForecast(s,'1e400');
 assert.equal(r.estimatedPlanets,1);
});
