import test from 'node:test';
import assert from 'node:assert/strict';
import {LAKE_POKEMON} from '../src/core/wildCatalog.js';
import {getWildPokemon,battleEnergyRewards,appearedInRegion} from '../src/core/wildData.js';
import {initialState} from '../src/core/gameState.js';

test('lake slots 8 and 9 have correct canonical species, single electric Tadbulb and independent energy awards',()=>{
 const tadbulb=getWildPokemon('tadbulb'),lotad=getWildPokemon('lotad');
 assert.deepEqual({number:tadbulb.number,code:tadbulb.encounterCode,types:tadbulb.types,hp:tadbulb.hp,attack:tadbulb.attack,defense:tadbulb.defense,specialAttack:tadbulb.specialAttack,speed:tadbulb.speed,counter:tadbulb.counter,paralysis:tadbulb.paralysis,rewards:tadbulb.rewards},{number:938,code:'W030801',types:['전기'],hp:1611,attack:31,defense:41,specialAttack:59,speed:9380,counter:30,paralysis:300,rewards:{hp:27.2,counter:2.7,paralysis:2.7}});
 assert.deepEqual(battleEnergyRewards(tadbulb),{전기:27.2});
 assert.deepEqual({number:lotad.number,code:lotad.encounterCode,types:lotad.types,hp:lotad.hp,specialAttack:lotad.specialAttack,speed:lotad.speed,regeneration:lotad.regeneration,rewards:lotad.rewards},{number:270,code:'W030901',types:['물','풀'],hp:1400,specialAttack:80,speed:2200,regeneration:112,rewards:{specialAttack:16,regeneration:16}});
 assert.deepEqual(battleEnergyRewards(lotad),{물:56,풀:56});
 assert.equal(LAKE_POKEMON.filter(p=>!p.evolvesFrom&&!p.rarity).length,8);
});
test('Wingull loses regeneration and gains 33 dodge with 3 dodge reward',()=>{
 const p=getWildPokemon('wingull');
 assert.equal(p.regeneration,0);
 assert.equal(p.dodge,33);
 assert.deepEqual(p.rewards,{specialAttack:13,accuracy:13,dodge:3});
 assert.deepEqual(battleEnergyRewards(p),{물:55.6,비행:55.6});
});
test('new base slots appear after former seventh slot in region encounter sequence',()=>{
 const state=initialState();
 const ids=appearedInRegion(state,'moonlit-lake').map(x=>x.id);
 assert.deepEqual(ids.slice(-2),['tadbulb','lotad']);
});

test('legacy saved slot outcomes still expose newly added common slots without rerolling old slots',()=>{
 const state=initialState();
 const saved={...state,raritySlotResults:{
  W030101:'buizel',W030201:'magikarp',W030302:null,W030401:'cutiefly',
  W030501:'azurill',W030601:'wingull',W030701:'feebas'
 }};
 const ids=appearedInRegion(saved,'moonlit-lake').map(p=>p.id);
 assert.deepEqual(ids.slice(-2),['tadbulb','lotad']);
 assert.equal(ids.includes('popplio'),false);
});
