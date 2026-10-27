import test from 'node:test';
import assert from 'node:assert/strict';
import {appendHealingEvent} from '../src/core/combatVisualEvents.js';
import {initialState} from '../src/core/gameState.js';
import {startBattle,advanceBattle} from '../src/core/combatEngine.js';

test('healing visual events include only actual gained HP and ignore nonpositive changes',()=>{
  const events=[];
  appendHealingEvent(events,'player',95,100);
  appendHealingEvent(events,'enemy',40,55);
  appendHealingEvent(events,'player',100,100);
  appendHealingEvent(events,'enemy',10,7);
  assert.deepEqual(events,[
    {target:'player',kind:'heal',value:5},
    {target:'enemy',kind:'heal',value:15}
  ]);
});

function battleForHealing(){
  let state=initialState();
  state={...state,phase:'running',dittoStats:{...state.dittoStats,hp:100,regeneration:15}};
  state=startBattle(state,'rattata');
  assert.equal(state.combat.active,true);
  return {...state,combat:{...state.combat,currentHp:95,dittoHp:{current:95,max:100},
    dittoAttackCooldown:{elapsed:0,duration:5000},
    enemy:{...state.combat.enemy,hp:{current:10,max:20},
      statistics:{...state.combat.enemy.statistics,regeneration:8},
      attackCooldown:{elapsed:0,duration:5000}}}};
}
test('combat healing popup numbers match capped actual regen for player and enemy',()=>{
  const state=battleForHealing();
  const next=advanceBattle(state,1000,()=>0.5);
  assert.equal(next.combat.currentHp,100);
  assert.equal(next.combat.enemy.hp.current,18);
  assert.deepEqual(next.combatVisualEvents,[
    {target:'player',kind:'heal',value:5},
    {target:'enemy',kind:'heal',value:8}
  ]);
});
test('combat skips popup at full HP and emits poison before healing',()=>{
  let state=battleForHealing();
  state={...state,combat:{...state.combat,currentHp:100,dittoHp:{current:100,max:100},
    playerStatus:{paralysis:0,poison:3},
    enemy:{...state.combat.enemy,hp:{current:20,max:20}}}};
  const next=advanceBattle(state,1000,()=>0.5);
  assert.equal(next.combat.currentHp,100);
  assert.equal(next.combat.enemy.hp.current,20);
  assert.deepEqual(next.combatVisualEvents,[
    {target:'player',kind:'poison',value:3},
    {target:'player',kind:'heal',value:3}
  ]);
});
test('lethal poison does not produce a resurrection heal popup',()=>{
  let state=battleForHealing();
  state={...state,combat:{...state.combat,currentHp:2,dittoHp:{current:2,max:100},
    playerStatus:{paralysis:0,poison:3}}};
  const next=advanceBattle(state,1000,()=>0.5);
  assert.equal(next.combat.active,false);
  assert.equal(next.combatVisualEvents.some(effect=>effect.kind==='heal'&&effect.target==='player'),false);
});
