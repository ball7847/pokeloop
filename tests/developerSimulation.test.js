import test from 'node:test';
import assert from 'node:assert/strict';
import {useGameStore} from '../src/store/useGameStore.js';
import {encodeSave,decodeSave} from '../src/core/saveCodec.js';
import {initialState} from '../src/core/gameState.js';
import {tickEconomy} from '../src/core/energySystem.js';

test('temporary speed toggle is session-only, supports 1x and 10x',()=>{
  const store=useGameStore.getState();
  store.setSimulationSpeed(10);
  assert.equal(useGameStore.getState().simulationSpeed,10);
  store.setSimulationSpeed(1);
  assert.equal(useGameStore.getState().simulationSpeed,1);
  const saved=decodeSave(encodeSave(initialState()));
  assert.equal(Object.hasOwn(saved.game,'simulationSpeed'),false);
});

test('repeatable offline hour queues only production, not battles or rewards',()=>{
  useGameStore.setState({game:initialState(),offlineRemainingSeconds:0,simulationSpeed:10});
  useGameStore.getState().grantOfflineHour();
  assert.equal(useGameStore.getState().offlineRemainingSeconds,0);
  useGameStore.getState().dispatch({type:'START'});
  useGameStore.getState().grantOfflineHour();
  useGameStore.getState().grantOfflineHour();
  let state=useGameStore.getState();
  assert.equal(state.offlineRemainingSeconds,7200);
  assert.equal(state.game.victories,0);
  assert.equal(state.game.combat.active,false);
  state.consumeOfflineProduction(5);
  state=useGameStore.getState();
  assert.equal(state.offlineRemainingSeconds,7195);
  assert.equal(state.game.victories,0);
  assert.deepEqual(state.game.killCounts,initialState().killCounts);
  useGameStore.setState({game:initialState(),offlineRemainingSeconds:0,simulationSpeed:1});
});

test('production batching retains the exact standard 5-second economy model',()=>{
  let state={...initialState(),pointCirculationUnlocked:true,phase:'running'};
  const before=state;
  state=tickEconomy(state,5);
  assert.equal(state.energyBalances.노말,2.5);
  assert.equal(before.energyBalances.노말,0);
});
