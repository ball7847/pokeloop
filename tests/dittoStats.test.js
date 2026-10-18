import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DITTO_STATS, visibleBasicStats, rollDamagePercent } from '../src/core/dittoStats.js';
import { initialState, transition } from '../src/core/gameState.js';

test('initial Ditto stats use approved seven defaults', () => {
  assert.deepEqual(initialState().dittoStats, {hp:10,attack:1,defense:0,specialAttack:0,specialDefense:0,speed:3000,minDamagePercent:85});
  assert.deepEqual(DEFAULT_DITTO_STATS, initialState().dittoStats);
});
test('zero-valued ability is retained in state but hidden from UI', () => {
  const state=initialState();
  assert.equal(state.dittoStats.defense,0);
  assert.deepEqual(visibleBasicStats(state.dittoStats).map(x=>x.key),['hp','attack','speed']);
});
test('combat current HP is separate from immutable HP stat', () => {
  const state=initialState();
  assert.equal(state.combat.currentHp,10);
  const damaged={...state,combat:{...state.combat,currentHp:3}};
  assert.equal(damaged.dittoStats.hp,10);
  assert.equal(damaged.combat.maxHp,10);
  assert.equal(damaged.combat.currentHp,3);
  assert.equal(state.dittoStats.hp,10);
  const reset=transition(damaged,{type:'RESET'});
  assert.equal(reset.dittoStats.hp,10);
  assert.equal(reset.combat.currentHp,10);
  assert.equal(reset.combat.maxHp,10);
});
test('damage multiplier chooses inclusive integer 85 to 100 in 1% steps', () => {
  assert.equal(rollDamagePercent(85,()=>0),85);
  assert.equal(rollDamagePercent(85,()=>0.5),93);
  assert.equal(rollDamagePercent(85,()=>0.999999),100);
  for(let i=0;i<16;i++) assert.equal(rollDamagePercent(85,()=>i/16),85+i);
});

test('default minimum damage is shared and hidden; modified values remain visible',()=>{
 const s=initialState().dittoStats;
 assert.equal(s.minDamagePercent,85);
 assert.equal(visibleBasicStats(s).some(x=>x.key==='minDamagePercent'),false);
 assert.equal(visibleBasicStats({...s,minDamagePercent:90}).some(x=>x.key==='minDamagePercent'),true);
});
