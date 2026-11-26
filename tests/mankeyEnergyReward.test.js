import test from 'node:test';
import assert from 'node:assert/strict';
import {getWildPokemon,battleEnergyRewards} from '../src/core/wildData.js';
test('Mankey yields 3.5 fighting energy on first victory and uses standard decay',()=>{
 const pokemon=getWildPokemon('mankey');
 assert.equal(pokemon.energyReward,3.5);
 assert.deepEqual(battleEnergyRewards(pokemon,0),{노말:3.5});
 assert.deepEqual(battleEnergyRewards(pokemon,1),{노말:1.75});
});
