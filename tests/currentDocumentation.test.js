import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {UPGRADES} from '../src/core/shopSystem.js';
import {ALL_POKEMON,LAKE_REGION,appearedInRegion,battleEnergyRewards,getWildPokemon} from '../src/core/wildData.js';
import {particleMilestoneThreshold,productionMultiplier,LAYER_VICTORY_REQUIREMENTS} from '../src/core/energySystem.js';
import {PLANET_ENCOUNTER_BONUSES} from '../src/core/planetEncounterBonuses.js';
import {decimal} from '../src/core/bigNumber.js';
const doc=readFileSync(new URL('../development/IMPLEMENTED_SYSTEMS.md',import.meta.url),'utf8');
const rows=key=>doc.split('<!-- '+key+'-start -->')[1].split('<!-- '+key+'-end -->')[0].split('\n').filter(l=>l.startsWith('|')).slice(2).map(l=>l.split('|').slice(1,-1));
test('documented shop catalog matches actual cost, growth and per-level effects',()=>{
 const table=rows('catalog-upgrades');
 assert.equal(table.length,UPGRADES.length);
 for(const [id,name,types,base,growth,effect] of table){
  const u=UPGRADES.find(x=>x.id===id);assert.ok(u,id);
  assert.equal(name,u.name);assert.equal(types,(u.types??[u.type]).join('+'));
  assert.equal(Number(base),u.base);assert.equal(Number(growth),u.growth);
  const expected=u.unit==='ms'?'-'+u.bonus+'ms':u.unit==='percent'?'+'+Math.round(u.bonus*100)+'%':'+'+u.bonus;
  assert.equal(effect,expected,id);
 }
});
test('documented base normal rewards cover all species',()=>{
 const table=rows('energy-rewards');assert.equal(table.length,ALL_POKEMON.length);
 const expected=Object.fromEntries(table.map(([id,v])=>[id,Number(v)]));
 assert.deepEqual(expected,Object.fromEntries(ALL_POKEMON.map(p=>[p.id,p.energyReward])));
 for(const p of ALL_POKEMON){assert.deepEqual(battleEnergyRewards(p,0),{노말:expected[p.id]});assert.deepEqual(battleEnergyRewards(p,1),{노말:expected[p.id]/2});}
});
test('documented milestones match code, and approved layer/planet rules are unchanged',()=>{
 for(const [level,threshold,multiplier] of rows('milestones')){
  assert.ok(decimal(particleMilestoneThreshold(Number(level)-1)).eq(decimal(threshold)));
  assert.ok(decimal(productionMultiplier(Number(level))).eq(decimal(multiplier)));
 }
 assert.equal(particleMilestoneThreshold(10),null);
 assert.deepEqual(LAYER_VICTORY_REQUIREMENTS,{2:'tauros',3:'pikachu'});
 assert.deepEqual(PLANET_ENCOUNTER_BONUSES.map(x=>[x.planet,x.multiplier]),[[2,20],[4,15],[6,10],[8,10]]);
});

test('lake reorder preserves encounter identifiers',()=>{
 const lineup=appearedInRegion({evolutionResults:{'wishiwashi-school':true}},LAKE_REGION.id);
 assert.deepEqual(lineup.slice(-5).map(p=>p.id),['tadbulb','bombirdier','lotad','wishiwashi','wishiwashi-school']);
 assert.deepEqual(lineup.slice(-5).map(p=>p.encounterCode),['W030801','W031101','W030901','W031001','W031001-E1']);
});

test('Tropius speed and regeneration change without changing the other stats or rewards',()=>{
 const p=getWildPokemon('tropius');
 assert.ok(p);
 assert.equal(p.hp,990);
 assert.equal(p.attack,68);
 assert.equal(p.specialAttack,72);
 assert.equal(p.regeneration,46);
 assert.equal(p.speed,4570);
 assert.equal(p.energyReward,1000);
 assert.deepEqual(p.rewards,{hp:50,attack:10,specialAttack:10,regeneration:10});
});
