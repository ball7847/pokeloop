import test from 'node:test';
import assert from 'node:assert/strict';
import {LAKE_POKEMON} from '../src/core/wildCatalog.js';
import {battleEnergyRewards,getKillLimit,evolutionFor,evolutionChance} from '../src/core/wildData.js';
import {initialState} from '../src/core/gameState.js';

const byId = Object.fromEntries(LAKE_POKEMON.map(p => [p.id, p]));
const patched = {
  buizel: {hp:855},
  popplio: {hp:2789,speed:2700},
  sobble: {hp:2789,speed:2700},
  quaxly: {hp:2789,speed:2700},
  cutiefly: {hp:600},
  ribombee: {hp:1800},
  azurill: {hp:2000},
  marill: {hp:2830},
  azumarill: {hp:2830},
  wingull: {hp:2333},
  milotic: {hp:4950,energyReward:740,rewards:{hp:350,specialDefense:62}},
  tadbulb: {hp:2611,counter:50,rewards:{hp:127.2,counter:2.7,paralysis:2.7}},
  lotad: {hp:2400,rewards:{hp:135,specialAttack:16,regeneration:16}},
  bombirdier: {hp:1962},
  'wishiwashi-school': {speed:2000,rewards:{hp:174,defense:10,multiStrike:60}}
};
test('all approved region-three base stats and first-kill rewards are exact',()=>{
 for(const [id,changes] of Object.entries(patched)){
  assert.ok(byId[id],id);
  for(const [field,value] of Object.entries(changes))assert.deepEqual(byId[id][field],value,id+' '+field);
 }
 assert.equal(Object.keys(patched).length,15);
});
test('ordinary Wishiwashi is unchanged; boosted school form keeps one-kill limit',()=>{
 assert.equal(byId.wishiwashi.hp,225);
 assert.equal(byId.wishiwashi.speed,400);
 assert.deepEqual(byId.wishiwashi.rewards,{});
 assert.equal(byId.wishiwashi.energyReward,20);
 assert.equal(byId['wishiwashi-school'].maxKillsPerPlanet,1);
 assert.equal(getKillLimit(byId['wishiwashi-school']),1);
 assert.equal(byId['wishiwashi-school'].hp,4500);
 assert.equal(byId['wishiwashi-school'].multiStrike,9000);
 assert.equal(byId['wishiwashi-school'].energyReward,620);
 assert.equal(evolutionFor('wishiwashi').id,'wishiwashi-school');
 assert.equal(evolutionChance(byId['wishiwashi-school'],initialState()),1);
});
test('rare Milotic, Magikarp and Gyarados progression stays intact',()=>{
 assert.equal(byId.milotic.rarity,'rare');
 assert.equal(evolutionFor('feebas').id,'milotic');
 assert.equal(byId.feebas.maxKillsPerPlanet,1);
 assert.equal(byId.feebas.hp,95);
 assert.equal(byId.magikarp.maxKillsPerPlanet,1);
 assert.equal(evolutionFor('magikarp').id,'gyarados');
 assert.equal(byId.gyarados.rarity,'common');
 assert.equal(evolutionChance(byId.gyarados,initialState()),1);
 assert.deepEqual(battleEnergyRewards(byId.milotic,0),{물:740});
 assert.deepEqual(battleEnergyRewards(byId.milotic,1),{물:370});
 assert.deepEqual(battleEnergyRewards(byId['wishiwashi-school'],0),{물:620});
});
test('three uncommon water starters retain the same slot and unchanged reward types',()=>{
 const starters=['popplio','sobble','quaxly'].map(id=>byId[id]);
 assert.equal(new Set(starters.map(p=>p.encounterCode.slice(0,6))).size,1);
 for(const pokemon of starters){
  assert.equal(pokemon.rarity,'uncommon');
  assert.deepEqual(battleEnergyRewards(pokemon,0),{물:100});
 }
});
