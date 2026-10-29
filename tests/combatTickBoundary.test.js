import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';

// Combat must advance the same simulated time at the 100ms minimum attack period.
test('combat preserves five seconds of progress at minimum speed without losing time to loop guard',()=>{
 const base=initialState();
 const state={...base,phase:'running',dittoStats:{...base.dittoStats,hp:10000,attack:0,speed:100}};
 const started=transition(state,{type:'SELECT_WILD',pokemonId:'rattata'});
 assert.equal(started.combat.active,true);
 const single=transition(started,{type:'COMBAT_TICK',deltaMs:5000,random:()=>0.5});
 let split=started;
 for(let i=0;i<50;i++)split=transition(split,{type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
 assert.equal(single.combat.active,true);
 assert.equal(split.combat.active,true);
 assert.equal(single.combat.currentHp,split.combat.currentHp);
 assert.equal(single.combat.enemy.hp.current,split.combat.enemy.hp.current);
 assert.deepEqual(single.combat.dittoAttackCooldown,split.combat.dittoAttackCooldown);
 assert.deepEqual(single.combat.enemy.attackCooldown,split.combat.enemy.attackCooldown);
 assert.equal(single.combat.regenerationElapsedMs,split.combat.regenerationElapsedMs);
 assert.equal(single.killCounts.rattata,0);
});

test('combat rejects invalid delta without altering state',()=>{
 const base=initialState();
 const state=transition({...base,phase:'running'},{type:'SELECT_WILD',pokemonId:'rattata'});
 assert.equal(transition(state,{type:'COMBAT_TICK',deltaMs:0}),state);
 assert.equal(transition(state,{type:'COMBAT_TICK',deltaMs:Number.NaN}),state);
});
