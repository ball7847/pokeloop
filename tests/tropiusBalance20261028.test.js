import test from 'node:test';
import assert from 'node:assert/strict';
import {BERRY_POKEMON} from '../src/core/wildData.js';

test('Tropius speed and regeneration change without changing the other stats or rewards',()=>{
 const p=BERRY_POKEMON.find(entry=>entry.id==='tropius');
 assert.ok(p);
 assert.equal(p.hp,990);
 assert.equal(p.attack,68);
 assert.equal(p.specialAttack,72);
 assert.equal(p.regeneration,46);
 assert.equal(p.speed,5100);
 assert.equal(p.energyReward,100);
 assert.deepEqual(p.rewards,{hp:50,attack:10,specialAttack:10,regeneration:10});
});
