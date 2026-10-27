import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';
import {buyStellarUpgrade,STELLAR_UPGRADES,stellarBattleEnergyReward} from '../src/core/stellarUpgrades.js';
import {movePlanet} from '../src/core/energySystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

test('SU identifiers occupy Normal physical slots 1, 2, 4; slot 3 is blank',()=>{
  assert.deepEqual(Object.keys(STELLAR_UPGRADES.노말),['0','1','3']);
  assert.deepEqual(Object.values(STELLAR_UPGRADES.노말).map(x=>x.id),['SU011','SU012','SU013']);
});
test('SU can be purchased once at SE 1 each, and cannot be purchased while paused',()=>{
  let state={...initialState(),stellar:3,phase:'running'};
  state=transition(state,{type:'BUY_STELLAR_UPGRADE',id:'SU011'});
  assert.equal(state.stellar,2);
  assert.equal(state.permanentUpgrades.SU011,1);
  assert.equal(effectiveDittoStats(state).hp,20);
  assert.equal(transition(state,{type:'BUY_STELLAR_UPGRADE',id:'SU011'}),state);
  const paused={...state,phase:'paused'};
  assert.equal(transition(paused,{type:'BUY_STELLAR_UPGRADE',id:'SU012'}),paused);
  const bought=transition(state,{type:'BUY_STELLAR_UPGRADE',id:'SU012'});
  assert.equal(bought.stellar,1);
  assert.equal(effectiveDittoStats(bought).attack,2);
  const third=transition(bought,{type:'BUY_STELLAR_UPGRADE',id:'SU013'});
  assert.equal(third.stellar,0);
  assert.equal(stellarBattleEnergyReward(third,'노말',10),11);
  assert.equal(stellarBattleEnergyReward(third,'불꽃',10),10);
  assert.equal(transition(third,{type:'BUY_STELLAR_UPGRADE',id:'SU012'}),third);
});
test('SU purchase rejects unavailable SE and unknown IDs',()=>{
  const state={...initialState(),phase:'running',stellar:0};
  assert.equal(buyStellarUpgrade(state,'SU011'),state);
  assert.equal(buyStellarUpgrade({...state,stellar:2},'SU999').stellar,2);
});
test('SU persists through planet move and save roundtrip',()=>{
  let state={...initialState(),phase:'running',stellar:2};
  state=transition(state,{type:'BUY_STELLAR_UPGRADE',id:'SU011'});
  state=movePlanet(state);
  assert.equal(state.permanentUpgrades.SU011,1);
  assert.equal(effectiveDittoStats({...initialState(),...state}).hp,20);
  const saved=decodeSave(encodeSave({...initialState(),...state})).game;
  assert.equal(saved.permanentUpgrades.SU011,1);
  assert.equal(effectiveDittoStats(saved).hp,20);
});
