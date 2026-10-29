import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition,PHASE} from '../src/core/gameState.js';
import {compareAmount} from '../src/core/bigNumber.js';

test('planet move requires at least one pending SE, not held SE',()=>{
 const start={...initialState(),phase:PHASE.RUNNING,stellar:100,normalFirstMilestonePermanent:true};
 for(const pending of [0,0.5,0.999999,'0.999999999999999999']){
  const s={...start,pendingStellar:pending};
  assert.strictEqual(transition(s,{type:'MOVE_PLANET',random:()=>0}),s,'blocked at '+pending);
 }
 const sufficient={...start,pendingStellar:1};
 const moved=transition(sufficient,{type:'MOVE_PLANET',random:()=>0});
 assert.equal(moved.planetMoves,1);
 assert.equal(compareAmount(moved.pendingStellar,0),0);
 assert.equal(compareAmount(moved.stellar,101),0);
 assert.strictEqual(transition(moved,{type:'MOVE_PLANET',random:()=>0}),moved,'cannot move immediately again');
});
test('move still respects combat, recovery and paused restrictions at 1 pending SE',()=>{
 const base={...initialState(),phase:PHASE.RUNNING,pendingStellar:1};
 for(const s of [{...base,recoveryMs:1000},{...base,phase:PHASE.PAUSED},{...base,combat:{...base.combat,active:true}}]){
  assert.strictEqual(transition(s,{type:'MOVE_PLANET',random:()=>0}),s);
 }
});
