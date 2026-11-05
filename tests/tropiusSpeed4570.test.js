import test from 'node:test';
import assert from 'node:assert/strict';
import {getWildPokemon,battleEnergyRewards} from '../src/core/wildData.js';
test('approved Tropius speed buff preserves all other stats and rewards',()=>{
 const p=getWildPokemon('tropius');
 assert.equal(p.speed,4570);
 assert.deepEqual({hp:p.hp,attack:p.attack,specialAttack:p.specialAttack,regeneration:p.regeneration},{hp:990,attack:68,specialAttack:72,regeneration:46});
 assert.deepEqual(p.rewards,{hp:50,attack:10,specialAttack:10,regeneration:10});
 assert.deepEqual(battleEnergyRewards(p,0),{풀:100,비행:100});
});
