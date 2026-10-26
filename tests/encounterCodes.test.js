import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_POKEMON,WILD_POKEMON,UNCOMMON_STARTERS,BERRY_POKEMON,appearedInRegion,REGION,BERRY_REGION} from '../src/core/wildData.js';
import {initialState} from '../src/core/gameState.js';

test('every registered Pokémon has a unique stable regional encounter code',()=>{
 assert.equal(ALL_POKEMON.length,26);
 const codes=ALL_POKEMON.map(p=>p.encounterCode);
 assert.ok(codes.every(code=>typeof code==='string'&&/^R\d+\d{2}\d{2}(?:-\d{2}|-E\d+)?$/.test(code)));
 assert.equal(new Set(codes).size,codes.length);
});
test('region 1 slot 6 starters and shifted common slots retain their codes',()=>{
 assert.deepEqual(WILD_POKEMON.map(p=>p.encounterCode),[
 'R10101','R10201','R10301','R10401','R10501',
 'R10701','R10801','R10901','R11001','R11101']);
 assert.deepEqual(UNCOMMON_STARTERS.map(p=>p.encounterCode),[
 'R10602-01','R10602-02','R10602-03']);
});
test('region 2 conditional and evolved species inherit fixed region slots',()=>{
 const codes=Object.fromEntries(BERRY_POKEMON.map(p=>[p.id,p.encounterCode]));
 assert.deepEqual(codes,{
  caterpie:'R20101',weedle:'R20201',kakuna:'R20201-E1',
  metapod:'R20101-E1',taillow:'R20301',pikachu:'R20502',
  igglybuff:'R20401','nidoran-m':'R20601','nidoran-f':'R20701',tangela:'R20801',bidoof:'R20901',surskit:'R21001',tropius:'R21101'
 });
 const base=initialState();
 assert.deepEqual(appearedInRegion(base,BERRY_REGION.id).map(p=>p.encounterCode),[
  'R20101','R20201','R20301','R20401','R20601','R20701','R20801','R20901','R21001','R21101'
 ]);
 const appeared={...base,berryRareAppeared:true,evolutionResults:{metapod:true,kakuna:true}};
 assert.deepEqual(appearedInRegion(appeared,BERRY_REGION.id).map(p=>p.encounterCode),[
 'R20101','R20101-E1','R20201','R20201-E1','R20301',
 'R20401','R20502','R20601','R20701','R20801','R20901','R21001','R21101']);
 assert.equal(appearedInRegion(base,REGION.id).length,10);
});