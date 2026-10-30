import test from 'node:test';
import assert from 'node:assert/strict';
import {getKillLimit,getWildPokemon,LAKE_REGION} from '../src/core/wildData.js';
import {initialState} from '../src/core/gameState.js';
import {startBattle,advanceBattle} from '../src/core/combatEngine.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

const prepared=id=>{
 const s=initialState();
 return {...s,phase:'running',activeRegionId:LAKE_REGION.id,
  killCounts:{...s.killCounts,
   ...Object.fromEntries(['rattata','pidgey','mankey','spearow','zubat','meowth','geodude','caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f','tangela','buizel','cutiefly','azurill','wingull'].map(id=>[id,1])),
   [id]:0},
  dittoStats:{...s.dittoStats,hp:100000,attack:100000,accuracy:1000,speed:100}
 };
};

test('only configured species have immutable kill limit; normal limit is extendable',()=>{
 for(const id of ['magikarp','feebas']){
  const p=getWildPokemon(id);
  assert.equal(p.maxKillsPerPlanet,1);
  assert.equal(getKillLimit(p),1);
  assert.equal(getKillLimit(p,999),1);
 }
 assert.equal(getKillLimit(getWildPokemon('buizel')),10);
 assert.equal(getKillLimit(getWildPokemon('buizel'),5),15);
 assert.equal(getKillLimit(getWildPokemon('gyarados'),5),15);
 assert.equal(getKillLimit(getWildPokemon('milotic'),5),15);
});

test('Magikarp and Feebas pay rewards only once; normal automatic chaining cannot restart them',()=>{
 for(const id of ['magikarp','feebas']){
  let s=prepared(id);
  s={...s,automation:{...s.automation,hunger:true}};
  s=startBattle(s,id);
  assert.equal(s.combat.active,true,'initial battle starts: '+id);
  s=advanceBattle(s,100,()=>0);
  assert.equal(s.killCounts[id],1,'first victory counted: '+id);
  assert.equal(s.combat.active,false,'no auto replay: '+id);
  const energy=s.energyBalances.물;
  const wins=s.victories;
  const attempt=startBattle(s,id);
  assert.equal(attempt,s,'second attempt blocked: '+id);
  assert.equal(attempt.victories,wins);
  assert.equal(attempt.energyBalances.물,energy);
  assert.equal(decodeSave(encodeSave(s)).game.killCounts[id],1,'saved limit state: '+id);
 }
});

test('existing saves with two or more kills retain their history but further challenges remain blocked',()=>{
 const p=getWildPokemon('magikarp');
 const s={...prepared('magikarp'),killCounts:{...prepared('magikarp').killCounts,magikarp:4}};
 assert.equal(getKillLimit(p),1);
 assert.equal(startBattle(s,'magikarp'),s);
 assert.equal(decodeSave(encodeSave(s)).game.killCounts.magikarp,4);
});
