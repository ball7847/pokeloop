import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATS, DEFAULT_DITTO_STATS, resolveStats, isDefaultStat, visibleBasicStats, rollDamagePercent } from '../src/core/dittoStats.js';
import { initialState, transition } from '../src/core/gameState.js';

test('initial Ditto stats use approved seven defaults', () => {
  assert.deepEqual(initialState().dittoStats, {hp:10,attack:1,defense:0,specialAttack:0,specialDefense:0,speed:3000,minDamagePercent:85,maxDamagePercent:100,paralysis:0,poison:0,antidote:0,regeneration:0,multiStrike:0,intimidation:0,sound:0,criticalChance:0,criticalMultiplier:150,honey:0,accuracy:100,dodge:0});
  assert.deepEqual(DEFAULT_DITTO_STATS, initialState().dittoStats);
});
test('zero-valued ability is retained in state but hidden from UI', () => {
  const state=initialState();
  assert.equal(state.dittoStats.defense,0);
  assert.deepEqual(visibleBasicStats(state.dittoStats).map(x=>x.key),['hp','attack','speed','minDamagePercent']);
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
test('damage multiplier chooses inclusive integer 85 to 100 or custom 150%', () => {
  assert.equal(rollDamagePercent(85,()=>0),85);
  assert.equal(rollDamagePercent(85,()=>0.5),93);
  assert.equal(rollDamagePercent(85,()=>0.999999),100);
  assert.equal(rollDamagePercent(85,()=>0,150),85);
  assert.equal(rollDamagePercent(85,()=>0.999999,150),150);
  assert.equal(rollDamagePercent(85,()=>0.999999,103.2),103);
  for(let i=0;i<16;i++) assert.equal(rollDamagePercent(85,()=>i/16),85+i);
});

test('default minimum damage is shared and hidden; modified values remain visible',()=>{
 const s=initialState().dittoStats;
 assert.equal(s.minDamagePercent,85);
 assert.equal(visibleBasicStats(s).some(x=>x.key==='minDamagePercent'),true);
 assert.equal(visibleBasicStats({...s,minDamagePercent:90}).some(x=>x.key==='minDamagePercent'),true);
});

test('common stats default independently of Ditto starting overrides',()=>{
 assert.deepEqual(DEFAULT_STATS,{hp:0,attack:0,defense:0,specialAttack:0,specialDefense:0,speed:0,minDamagePercent:85,maxDamagePercent:100,paralysis:0,poison:0,antidote:0,regeneration:0,multiStrike:0,intimidation:0,sound:0,criticalChance:0,criticalMultiplier:150,honey:0,accuracy:100,dodge:0});
 assert.deepEqual(resolveStats({hp:6,attack:2.5}),{...DEFAULT_STATS,hp:6,attack:2.5});
 assert.equal(isDefaultStat('speed',0),true);
 assert.equal(isDefaultStat('speed',3000),false);
 assert.equal(isDefaultStat('speed',2000),false);
 assert.equal(isDefaultStat('critChance',0),true);
 assert.equal(isDefaultStat('critChance',10),false);
 assert.equal(visibleBasicStats(DEFAULT_DITTO_STATS).map(x=>x.key).join(','),'hp,attack,speed,minDamagePercent');
});

test('Ditto always displays four core abilities even at baseline values',()=>{
 const baseline=resolveStats({});
 assert.deepEqual(visibleBasicStats(baseline).map(x=>x.key),['hp','attack','speed','minDamagePercent']);
 assert.deepEqual(visibleBasicStats({...baseline,defense:4}).map(x=>x.key),['hp','attack','defense','speed','minDamagePercent']);
});

test('shared speed defaults to zero while initial combat speeds remain unchanged',async()=>{
 const {WILD_POKEMON}=await import('../src/core/wildData.js');
 const {visibleNonDefaultStats}=await import('../src/core/dittoStats.js');
 assert.equal(resolveStats({hp:1}).speed,0);
 assert.equal(DEFAULT_DITTO_STATS.speed,3000);
 assert.deepEqual(WILD_POKEMON.map(x=>x.speed),[2100,2400,1800,1300,800,1100,6000,4700,2400,1500]);
 assert.deepEqual(visibleNonDefaultStats({hp:3,speed:0}).map(x=>x.key),['hp']);
 assert.deepEqual(visibleNonDefaultStats({hp:3,speed:3000}).map(x=>x.key),['hp','speed']);
 const state=transition(initialState(),{type:'SELECT_WILD',pokemonId:'rattata'});
 assert.equal(state.combat.dittoAttackCooldown.duration,3000);
 assert.equal(state.combat.enemy.attackCooldown.duration,2100);
 assert.equal(state.combat.enemy.stats['스피드'],2100);
});

test('fractional damage bounds are stored but floored for inclusive integer combat rolls',()=>{
 assert.equal(rollDamagePercent(86.5,()=>0,103.7),86);
 assert.equal(rollDamagePercent(86.5,()=>0.5,103.7),95);
 assert.equal(rollDamagePercent(86.5,()=>0.999999,103.7),103);
 assert.equal(rollDamagePercent(86.5,()=>0,86.9),86);
 assert.equal(rollDamagePercent(86.5,()=>0.999999,86.9),86);
 for(let i=0;i<18;i++)assert.equal(rollDamagePercent(86.5,()=>i/18,103.7),86+i);
 assert.throws(()=>rollDamagePercent(-.01,()=>0,100),RangeError);
 assert.throws(()=>rollDamagePercent(101.5,()=>0,101.4),RangeError);
 const stats=resolveStats({minDamagePercent:86.5,maxDamagePercent:103.7});
 assert.equal(stats.minDamagePercent,86.5);
 assert.equal(stats.maxDamagePercent,103.7);
});
