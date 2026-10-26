import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {appearedInRegion,isPokemonUnlockedInState,unlockedCountInRegion,
  regionUnlockRequirement,evolutionChance,getWildPokemon,BERRY_REGION,REGION} from '../src/core/wildData.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

const berry=BERRY_REGION.id;
const prepare=()=>{
 const state=initialState();
 state.phase='running';
 state.activeRegionId=berry;
 state.killCounts={...state.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,meowth:1,geodude:1,exeggcute:1,caterpie:0};
 state.dittoStats={...state.dittoStats,hp:1000,attack:200};
 return state;
};
test('evolution forms are excluded from base lineup and first-victory unlock count',()=>{
 const s=prepare();
 const before=unlockedCountInRegion(s,berry);
 const req=regionUnlockRequirement(s);
 assert.deepEqual(appearedInRegion(s,berry).map(p=>p.id),['caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f','tangela','bidoof','surskit']);
 assert.equal(isPokemonUnlockedInState(s,'metapod'),false);
 s.evolutionResults={metapod:true};
 s.killCounts.metapod=1;
 assert.equal(unlockedCountInRegion(s,berry),before);
 assert.equal(regionUnlockRequirement(s),req);
 assert.deepEqual(appearedInRegion(s,berry).slice(0,3).map(p=>p.id),['caterpie','metapod','weedle']);
 assert.equal(isPokemonUnlockedInState(s,'metapod'),true);
});
test('first defeat of caterpie reveals metapod once, with independent kill count',()=>{
 let s=prepare();
 s=transition(s,{type:'SELECT_WILD',pokemonId:'caterpie'});
 assert.equal(s.combat.active,true);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:3000,random:()=>0.5});
 assert.equal(s.killCounts.caterpie,1);
 assert.equal(s.evolutionResults.metapod,true);
 assert.equal(s.killCounts.metapod,0);
 assert.equal(isPokemonUnlockedInState(s,'metapod'),true);
 const count=unlockedCountInRegion(s,berry);
 s=transition(s,{type:'SELECT_WILD',pokemonId:'metapod'});
 assert.equal(s.combat.active,true);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:3000,random:()=>0.5});
 assert.equal(s.killCounts.metapod,1);
 assert.equal(unlockedCountInRegion(s,berry),count);
});
test('weedle first defeat reveals kakuna and saves the result',()=>{
 let s=prepare();
 s.killCounts.weedle=0;
 s=transition(s,{type:'SELECT_WILD',pokemonId:'weedle'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:3000,random:()=>0.3});
 assert.equal(s.evolutionResults.kakuna,true);
 assert.equal(decodeSave(encodeSave(s)).game.evolutionResults.kakuna,true);
});
test('evolution chance derives from target rarity and can fail independently',()=>{
 const s=initialState();
 assert.equal(evolutionChance(getWildPokemon('metapod'),s),1);
 assert.equal(evolutionChance({rarity:'uncommon'},s),s.uncommonChance);
 assert.equal(evolutionChance({rarity:'rare'},s),0);
 assert.equal(evolutionChance(null,s),0);
});
