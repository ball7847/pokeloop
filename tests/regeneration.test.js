import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {startBattle,advanceBattle} from '../src/core/combatEngine.js';
import {BERRY_REGION,appearedInRegion,getWildPokemon} from '../src/core/wildData.js';
import {resolveStats,statLabel} from '../src/core/dittoStats.js';

test('Tangela occupies an ordinary Berry Forest slot with its specified stats and rewards',()=>{
  const p=getWildPokemon('tangela');
  assert.equal(p.encounterCode,'R20801');
  assert.deepEqual(p.types,['풀']);
  assert.equal(p.hp,195);
  assert.equal(p.energyReward,11.4);
  assert.equal(p.specialAttack,15.5);
  assert.equal(p.regeneration,5);
  assert.equal(p.speed,1600);
  assert.deepEqual(p.rewards,{hp:11.4,regeneration:1.14});
  assert.equal(statLabel('regeneration'),'회복');
  assert.equal(appearedInRegion(initialState(),BERRY_REGION.id).at(-1).id,'tangela');
});

test('regeneration heals both combatants once per second without exceeding max HP',()=>{
  const s={...initialState(),phase:'running',activeRegionId:BERRY_REGION.id,killCounts:{...initialState().killCounts,caterpie:1,weedle:1,taillow:1,igglybuff:1,'nidoran-m':1,'nidoran-f':1,rattata:1,pidgey:1,mankey:1,spearow:1,zubat:1,meowth:1,geodude:1}};
  const prepared={...s,dittoStats:{...s.dittoStats,hp:20,regeneration:2}};
  let c=startBattle(prepared,'tangela');
  assert.equal(c.combat.active,true);
  // Create a damaged combat fixture, then advance via the real engine (no mocked heals).
  c={...c,combat:{...c.combat,currentHp:10,dittoHp:{current:10,max:20},
    enemy:{...c.combat.enemy,hp:{current:185,max:195}}}};
  c=advanceBattle(c,500,()=>0.5);
  assert.equal(c.combat.currentHp,10);
  assert.equal(c.combat.enemy.hp.current,185);
  c=advanceBattle(c,500,()=>0.5);
  assert.equal(c.combat.currentHp,12);
  assert.equal(c.combat.enemy.hp.current,190);
  assert.equal(c.combat.regenerationElapsedMs,0);
  c=advanceBattle(c,500,()=>0.5);
  assert.equal(c.combat.currentHp,12);
  assert.equal(c.combat.enemy.hp.current,190);
});

test('regeneration is a persistent base stat defaulting to zero',()=>{
  assert.equal(resolveStats({}).regeneration,0);
  assert.equal(resolveStats({regeneration:1.14}).regeneration,1.14);
});
