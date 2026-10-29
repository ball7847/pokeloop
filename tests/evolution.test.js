import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {appearedInRegion,isPokemonUnlockedInState,unlockedCountInRegion,
  regionUnlockRequirement,evolutionChance,getWildPokemon,BERRY_REGION,REGION,ENCOUNTER_SLOTS} from '../src/core/wildData.js';
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
 assert.deepEqual(appearedInRegion(s,berry).map(p=>p.id),['caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f','tangela','bidoof','surskit','tropius']);
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

test('Fearow and Swellow inherit parent slots without adding independent rarity slots',()=>{
 const fearow=getWildPokemon('fearow'),swellow=getWildPokemon('swellow');
 assert.deepEqual([fearow.number,fearow.rarity,fearow.evolvesFrom,fearow.encounterCode],[22,'uncommon','spearow','W010401-E1']);
 assert.deepEqual([fearow.hp,fearow.attack,fearow.speed,fearow.accuracy,fearow.criticalChance,fearow.criticalMultiplier],[122,8.8,1000,150,8,225]);
 assert.deepEqual(fearow.rewards,{accuracy:8,criticalMultiplier:3});
 assert.deepEqual([swellow.number,swellow.rarity,swellow.evolvesFrom,swellow.encounterCode],[277,'uncommon','taillow','W020301-E1']);
 assert.deepEqual([swellow.hp,swellow.attack,swellow.specialAttack,swellow.speed,swellow.accuracy],[600,15,15,825,277]);
 assert.deepEqual(swellow.rewards,{accuracy:14});
 assert.equal(ENCOUNTER_SLOTS.some(slot=>slot.id==='W010401-E1'||slot.id==='W020301-E1'),false);
 const s=prepare();
 assert.equal(appearedInRegion(s,REGION.id).some(p=>p.id==='fearow'),false);
 assert.equal(appearedInRegion(s,berry).some(p=>p.id==='swellow'),false);
 const appeared={...s,evolutionResults:{fearow:true,swellow:true}};
 assert.equal(appearedInRegion(appeared,REGION.id).findIndex(p=>p.id==='fearow'),
   appearedInRegion(appeared,REGION.id).findIndex(p=>p.id==='spearow')+1);
 assert.equal(appearedInRegion(appeared,berry).findIndex(p=>p.id==='swellow'),
   appearedInRegion(appeared,berry).findIndex(p=>p.id==='taillow')+1);
});

test('uncommon evolutions roll once after first parent victory and persist through save',()=>{
 for(const [parent,child,region] of [['spearow','fearow',REGION.id],['taillow','swellow',berry]]){
  let s=prepare();
  s.activeRegionId=region;
  s.uncommonChance=0.5;
  s.killCounts[parent]=0;
  s.killCounts.zubat=1; // Maintain the seven-first-kills prerequisite for Berry Forest.
  s.dittoStats={...s.dittoStats,hp:10000,attack:10000,speed:100};
  s=transition(s,{type:'SELECT_WILD',pokemonId:parent});
  assert.equal(s.combat.active,true,parent);
  s=transition(s,{type:'COMBAT_TICK',deltaMs:5000,random:()=>0});
  assert.equal(s.killCounts[parent],1,parent);
  assert.equal(s.evolutionResults[child],true,child);
  assert.equal(isPokemonUnlockedInState(s,child),true,child);
  assert.equal(decodeSave(encodeSave(s)).game.evolutionResults[child],true,child);
  const before=s.evolutionResults[child];
  s=transition(s,{type:'SELECT_WILD',pokemonId:parent});
  s=transition(s,{type:'COMBAT_TICK',deltaMs:5000,random:()=>0.99});
  assert.equal(s.evolutionResults[child],before,'a repeat kill must not reroll evolution');
 }
});
test('failed uncommon evolution rolls remain absent and are saved',()=>{
 let s=prepare();
 s.uncommonChance=0;
 s.activeRegionId=berry;
 s.dittoStats={...s.dittoStats,hp:10000,attack:10000,speed:100};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'taillow'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:5000,random:()=>0});
 assert.equal(s.evolutionResults.swellow,false);
 assert.equal(appearedInRegion(s,berry).some(p=>p.id==='swellow'),false);
 assert.equal(decodeSave(encodeSave(s)).game.evolutionResults.swellow,false);
});
