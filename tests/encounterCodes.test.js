import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_POKEMON,WILD_POKEMON,UNCOMMON_STARTERS,BERRY_POKEMON,appearedInRegion,REGION,BERRY_REGION,battleEnergyRewards,getWildPokemon} from '../src/core/wildData.js';
import {initialState} from '../src/core/gameState.js';

test('every registered Pokémon has a unique stable regional encounter code',()=>{
 assert.equal(ALL_POKEMON.length,52);
 const codes=ALL_POKEMON.map(p=>p.encounterCode);
 assert.ok(codes.every(code=>typeof code==='string'&&/^W\d{2}\d{2}\d{2}(?:-\d{2}|-E\d+)?$/.test(code)));
 assert.equal(new Set(codes).size,codes.length);
});
test('region 1 slot 6 starters and shifted common slots retain their codes',()=>{
 assert.deepEqual(WILD_POKEMON.map(p=>p.encounterCode),[
 'W010101','W010201','W010401','W010501','W010701',
 'W010901','W011001','W011201','W011401','W011601']);
 assert.deepEqual(UNCOMMON_STARTERS.map(p=>p.encounterCode),[
 'W010802-01','W010802-02','W010802-03']);
});
test('region 2 conditional and evolved species inherit fixed region slots',()=>{
 const codes=Object.fromEntries(BERRY_POKEMON.map(p=>[p.id,p.encounterCode]));
 assert.deepEqual(codes,{
  caterpie:'W020101',weedle:'W020201',kakuna:'W020201-E1',
  metapod:'W020101-E1',taillow:'W020301',swellow:'W020301-E1',pikachu:'W020502',
  igglybuff:'W020401','nidoran-m':'W020601','nidoran-f':'W020701',tangela:'W020801',bidoof:'W020901',surskit:'W021001',tropius:'W021101'
 });
 const base=initialState();
 assert.deepEqual(appearedInRegion(base,BERRY_REGION.id).map(p=>p.encounterCode),[
  'W020101','W020201','W020301','W020401','W020601','W020701','W020801','W020901','W021001','W021101'
 ]);
 const appeared={...base,berryRareAppeared:true,evolutionResults:{metapod:true,kakuna:true}};
 assert.deepEqual(appearedInRegion(appeared,BERRY_REGION.id).map(p=>p.encounterCode),[
 'W020101','W020101-E1','W020201','W020201-E1','W020301',
 'W020401','W020502','W020601','W020701','W020801','W020901','W021001','W021101']);
 const evolved={...appeared,evolutionResults:{...appeared.evolutionResults,swellow:true,fearow:true}};
 assert.ok(appearedInRegion(evolved,BERRY_REGION.id).some(p=>p.encounterCode==='W020301-E1'));
 assert.ok(appearedInRegion(evolved,REGION.id).some(p=>p.encounterCode==='W010401-E1'));
 assert.equal(appearedInRegion(base,REGION.id).length,10);
});

test('approved energy rebalance keeps correct per-type payouts and other stats',()=>{
 for(const starter of UNCOMMON_STARTERS){
  assert.equal(starter.energyReward,55);
  assert.deepEqual(starter.rewards,{hp:10,attack:1,speed:-30});
  for(const value of Object.values(battleEnergyRewards(starter,0)))assert.equal(value,55);
 }
 for(const [id,energy] of [['fearow',10],['swellow',30]]){
  const p=getWildPokemon(id);
  assert.equal(p.energyReward,energy);
  assert.deepEqual(battleEnergyRewards(p,0),{'노말':energy,'비행':energy});
  assert.deepEqual(battleEnergyRewards(p,1),{'노말':energy/2,'비행':energy/2});
 }
 assert.deepEqual(getWildPokemon('fearow').rewards,{accuracy:8,criticalMultiplier:3});
 assert.deepEqual(getWildPokemon('swellow').rewards,{accuracy:14});
});
