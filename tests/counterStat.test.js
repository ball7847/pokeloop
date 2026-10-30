import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAttack,emptyCombat} from '../src/core/combatEngine.js';
import {DEFAULT_DITTO_STATS,resolveStats,visibleSpecialStats} from '../src/core/dittoStats.js';
import {initialState} from '../src/core/gameState.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';
import {readFileSync} from 'node:fs';

const makeCombat=()=>({...emptyCombat(100),currentHp:100,dittoHp:{current:100,max:100},enemy:{hp:{current:100,max:100}}});
test('counter triggers immediately on damaging hit, does not negate damage or reset attack timers',()=>{
 const c=makeCombat(); c.dittoAttackCooldown={elapsed:500,duration:3000};c.enemy.attackCooldown={elapsed:200,duration:1000};
 resolveAttack(c,'enemy',resolveStats({attack:10}),resolveStats({attack:6,counter:100}),()=>0.999999);
 assert.equal(c.currentHp,90);
 assert.equal(c.enemy.hp.current,94);
 assert.deepEqual(c.dittoAttackCooldown,{elapsed:500,duration:3000});
 assert.deepEqual(c.enemy.attackCooldown,{elapsed:200,duration:1000});
});
test('counter fails its proc or cannot trigger on misses and blocked damage',()=>{
 const defender=resolveStats({attack:6,counter:100});
 const miss=makeCombat(); resolveAttack(miss,'enemy',resolveStats({attack:10,accuracy:0}),defender,()=>0.999999);
 assert.equal(miss.enemy.hp.current,100);
 const blocked=makeCombat();resolveAttack(blocked,'enemy',resolveStats({attack:10}),{...defender,defense:100},()=>0.999999);
 assert.equal(blocked.enemy.hp.current,100);
 const zero=makeCombat();resolveAttack(zero,'enemy',resolveStats({attack:10}),{...defender,counter:0},()=>0.999999);
 assert.equal(zero.enemy.hp.current,100);
});
test('counter cannot recursively trigger another counter',()=>{
 const c=makeCombat();resolveAttack(c,'enemy',resolveStats({attack:10,counter:100}),resolveStats({attack:6,counter:100}),()=>0.999999);
 assert.equal(c.currentHp,90);assert.equal(c.enemy.hp.current,94);
});
test('counter persists through saves and has a dedicated transparent icon',()=>{
 const state=initialState();state.dittoStats={...DEFAULT_DITTO_STATS,counter:30};
 assert.equal(decodeSave(encodeSave(state)).game.dittoStats.counter,30);
 assert.ok(visibleSpecialStats(state.dittoStats).some(x=>x.key==='counter'));
 const svg=readFileSync(new URL('../public/assets/stats/counter.svg',import.meta.url),'utf8');
 assert.match(svg,/viewBox=/);assert.doesNotMatch(svg,/<rect|<image|background/i);
});
