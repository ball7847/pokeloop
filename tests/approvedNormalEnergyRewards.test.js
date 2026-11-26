import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_POKEMON,LAKE_REGION,appearedInRegion,battleEnergyRewards} from '../src/core/wildData.js';
const expected={
  "rattata": 1,
  "pidgey": 2,
  "psyduck": 5.4,
  "mankey": 3.5,
  "spearow": 3,
  "fearow": 22,
  "zubat": 3,
  "ponyta": 27.7,
  "meowth": 10,
  "bulbasaur": 55,
  "charmander": 55,
  "squirtle": 55,
  "geodude": 12,
  "ekans": 35,
  "exeggcute": 16.6,
  "rookidee": 38,
  "sentret": 20,
  "zigzagoon": 66,
  "zigzagoon-galar": 66,
  "tauros": 49,
  "caterpie": 30,
  "metapod": 50,
  "weedle": 30,
  "kakuna": 50,
  "shroomish": 500,
  "breloom": 1860,
  "taillow": 127,
  "swellow": 300,
  "igglybuff": 139,
  "pikachu": 250,
  "nidoran-m": 269,
  "nidoran-f": 269,
  "tangela": 228,
  "bidoof": 400,
  "surskit": 328,
  "tropius": 1000,
  "buizel": 418,
  "magikarp": 200,
  "gyarados": 540,
  "popplio": 1230,
  "sobble": 1230,
  "quaxly": 1230,
  "cutiefly": 304,
  "ribombee": 2320,
  "azurill": 500,
  "marill": 1000,
  "azumarill": 2000,
  "wingull": 777,
  "feebas": 200,
  "milotic": 7400,
  "tadbulb": 938,
  "bombirdier": 962,
  "lotad": 1270,
  "wishiwashi": 200,
  "wishiwashi-school": 4000
};
test('all 55 approved base rewards including unchanged species',()=>{
 assert.deepEqual(Object.fromEntries(ALL_POKEMON.map(p=>[p.id,p.energyReward])),expected);
 for(const p of ALL_POKEMON){assert.deepEqual(battleEnergyRewards(p,0),{노말:expected[p.id]});assert.deepEqual(battleEnergyRewards(p,1),{노말:expected[p.id]/2});}
});
test('lake reorder preserves encounter identifiers',()=>{
 const lineup=appearedInRegion({evolutionResults:{'wishiwashi-school':true}},LAKE_REGION.id);
 assert.deepEqual(lineup.slice(-5).map(p=>p.id),['tadbulb','bombirdier','lotad','wishiwashi','wishiwashi-school']);
 assert.deepEqual(lineup.slice(-5).map(p=>p.encounterCode),['W030801','W031101','W030901','W031001','W031001-E1']);
});
