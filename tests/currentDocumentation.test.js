import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {UPGRADES} from '../src/core/shopSystem.js';
import {ALL_POKEMON} from '../src/core/wildData.js';
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
 assert.deepEqual(Object.fromEntries(table.map(([id,v])=>[id,Number(v)])),Object.fromEntries(ALL_POKEMON.map(p=>[p.id,p.energyReward])));
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
