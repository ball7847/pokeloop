import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {startBattle} from '../src/core/combatEngine.js';
import {recordItemProgress,itemConditionMet,refreshItemPending,collectPendingItems} from '../src/core/itemSystem.js';
import {encodeSave,decodeSave,SAVE_VERSION} from '../src/core/saveSystem.js';

const sampleItems=[
  {id:'example-run',condition:{scope:'run',metric:'victories',target:2}},
  {id:'example-lifetime',condition:{scope:'lifetime',metric:'victories',target:3}}
];

test('encyclopedia discovery stays permanent across planet travel while encounter kills reset',()=>{
  const starting=initialState();
  const discovered=startBattle({...starting,phase:'running'},'rattata');
  assert.ok(discovered.dexDiscovered.includes('rattata'));
  const before={...discovered,combat:{...discovered.combat,active:false},
    killCounts:{...discovered.killCounts,rattata:5},
    dexLifetimeKills:{rattata:12},pendingStellar:2};
  const after=transition(before,{type:'MOVE_PLANET'});
  assert.ok(after.dexDiscovered.includes('rattata'));
  assert.equal(after.dexLifetimeKills.rattata,12);
  assert.equal(after.killCounts.rattata,0);
  assert.equal(after.stellar,2);
});

test('items distinguish one-run progress from lifetime progress and claim only on planet travel',()=>{
  let state=initialState();
  state=recordItemProgress(state,'victories',2,sampleItems);
  assert.deepEqual(state.itemPending,['example-run']);
  assert.ok(itemConditionMet(state,sampleItems[0].condition));
  assert.ok(!itemConditionMet(state,sampleItems[1].condition));
  assert.deepEqual(state.itemOwned,[]);
  const claimed=collectPendingItems(state,sampleItems);
  assert.deepEqual(claimed.itemOwned,['example-run']);
  assert.deepEqual(claimed.itemPending,[]);
  assert.deepEqual(claimed.itemRunProgress,{});
  assert.equal(claimed.itemLifetimeProgress.victories,2);
  state=recordItemProgress({...state,...claimed},'victories',1,sampleItems);
  assert.deepEqual(state.itemPending,['example-lifetime']);
  assert.equal(state.itemRunProgress.victories,1);
  assert.equal(state.itemLifetimeProgress.victories,3);
  const next=collectPendingItems(state,sampleItems);
  assert.deepEqual(next.itemOwned,['example-run','example-lifetime']);
});

test('item progress and encyclopedia history persist in v12 saves',()=>{
  const original={...initialState(),phase:'running',dexDiscovered:['rattata'],
    killCounts:{...initialState().killCounts,rattata:2},dexLifetimeKills:{rattata:4},
    itemRunProgress:{victories:2,'pokemon:rattata':2},itemLifetimeProgress:{victories:4,'pokemon:rattata':4}};
  const restored=decodeSave(encodeSave(original)).game;
  assert.equal(SAVE_VERSION,16);
  assert.equal(restored.dexLifetimeKills.rattata,4);
  assert.equal(restored.itemRunProgress.victories,2);
  assert.equal(restored.itemLifetimeProgress['pokemon:rattata'],4);
  assert.deepEqual(restored.dexDiscovered,['rattata']);
});

test('v11 saves remain compatible and initialize lifetime history from available current kills',()=>{
  const original={...initialState(),phase:'running',dexDiscovered:['rattata'],
    killCounts:{...initialState().killCounts,rattata:3}};
  const encoded=encodeSave(original);
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const json=JSON.parse(new TextDecoder().decode(bytes));
  json.version=11;
  delete json.game.dexLifetimeKills;
  delete json.game.itemRunProgress;
  delete json.game.itemLifetimeProgress;
  delete json.game.itemPending;
  delete json.game.itemOwned;
  const old=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(json))));
  const restored=decodeSave(old).game;
  assert.equal(restored.dexLifetimeKills.rattata,3);
  assert.deepEqual(restored.itemPending,[]);
  assert.deepEqual(restored.itemOwned,[]);
});

test('invalid item progress cannot be loaded',()=>{
  const game={...initialState(),itemRunProgress:{victories:-3}};
  assert.throws(()=>decodeSave(encodeSave(game)),/도구 진행 기록/);
});
