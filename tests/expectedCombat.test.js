import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {startBattle} from '../src/core/combatEngine.js';
import {getWildPokemon} from '../src/core/wildData.js';
import {expectedStrike,estimateExpectedBattle} from './helpers/expectedCombat.js';
import {settleExpectedBattle} from './helpers/fastBattleSettlement.js';
import {playOnePlanet} from './helpers/virtualPlaySimulator.js';

const battle=(id='rattata')=>{
 let state=initialState();state=transition(state,{type:'START'});
 state={...state,dittoStats:{...state.dittoStats,hp:10000,attack:10000,speed:100}};
 return startBattle(state,id);
};

test('expected strike includes accuracy, physical/special and critical multiplier',()=>{
 const a={attack:100,specialAttack:50,accuracy:80,criticalChance:50,criticalMultiplier:200,multiStrike:1000,
 minDamagePercent:100,maxDamagePercent:100};
 const d={defense:20,specialDefense:10,dodge:0};
 assert.equal(expectedStrike(a,d).expectedDamage,288); // (80+40)*0.8*1.5*2
 assert.equal(expectedStrike({...a,accuracy:0},d).expectedDamage,0);
});
test('fast settlement preserves rewards, kill records and first-victory evolution roll',()=>{
 let state=battle('rattata');
 const outcome={result:'victory',seconds:1,playerHp:9999,playerStatus:{poison:0,paralysis:0}};
 const next=settleExpectedBattle(state,'rattata',outcome,()=>0.5);
 assert.equal(next.killCounts.rattata,1);
 assert.equal(next.dittoStats.attack,state.dittoStats.attack+1);
 assert.equal(next.energyBalances.노말,1);
 assert.equal(next.dexLifetimeKills.rattata,1);
 assert.equal(next.victories,1);
 assert.equal(next.combat.active,false);
});
test('fast settlement preserves a first-victory uncommon evolution draw',()=>{
 let state=battle('rattata');
 // Initial three cards do not include Spearow; unlock through known first kills.
 state={...state,killCounts:{...state.killCounts,rattata:1,pidgey:1,mankey:1,spearow:0},uncommonChance:0.5};
 state=startBattle({...state,combat:{...state.combat,active:false}},'spearow');
 assert.equal(state.combat.active,true);
 const next=settleExpectedBattle(state,'spearow',
  {result:'victory',seconds:2,playerHp:9500,playerStatus:{poison:0,paralysis:0}},()=>0);
 assert.equal(next.evolutionResults.fearow,true);
});
test('expected combat avoids real COMBAT_TICK and marks long stalemates uncertain',()=>{
 const state=battle();
 const easy=estimateExpectedBattle(state,'rattata');
 assert.equal(easy.result,'victory');
 assert.ok(easy.seconds<=300);
 const noDamage={...state,dittoStats:{...state.dittoStats,attack:0,specialAttack:0}};
 const tough=estimateExpectedBattle(noDamage,'rattata',{maxSeconds:2});
 assert.equal(tough.result,'uncertain');
 assert.equal(tough.reason,'expected-time-limit');
});
test('simulation can select fast default and exact explicitly',()=>{
 const s=initialState();
 const fast=playOnePlanet(s,{maxBattles:1,logLimit:10});
 assert.equal(fast.report.combatMode,'fast');
 const exact=playOnePlanet(s,{mode:'exact',maxBattles:1,maxTicks:100,logLimit:10});
 assert.equal(exact.report.combatMode,'exact');
});
