import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/core/gameState.js';
import {tickEconomy,particleRates,productionMultiplier,typeLayer} from '../src/core/energySystem.js';
import {getWildPokemon,evolutionFor,regionForPokemon,BERRY_REGION} from '../src/core/wildData.js';

test('unproductive first layer economy ticks preserve state identity',()=>{
 const s=initialState();
 assert.equal(tickEconomy(s,0.1),s);
 assert.equal(tickEconomy(s,5),s);
 // Spending resources can still trigger milestones independently of economy ticks.
});
test('cached production factors retain milestone progression',()=>{
 assert.equal(productionMultiplier(0),1);
 assert.equal(productionMultiplier(1),1);
 assert.equal(productionMultiplier(2),1000);
 assert.equal(productionMultiplier(3),1000000);
 assert.equal(productionMultiplier(4),1000000000);
});
test('indexed catalog lookup preserves evolution and region lookup',()=>{
 assert.equal(getWildPokemon('caterpie').name,'캐터피');
 assert.equal(evolutionFor('caterpie').id,'metapod');
 assert.equal(evolutionFor('weedle').id,'kakuna');
 assert.equal(evolutionFor('metapod'),null);
 assert.equal(regionForPokemon('metapod'),BERRY_REGION.id);
 assert.equal(getWildPokemon('not-present'),null);
 assert.equal(typeLayer('노말'),1);
 assert.equal(typeLayer('드래곤'),9);
 assert.equal(typeLayer('nonexistent'),0);
 assert.equal(particleRates(initialState()).노말,0);
});
