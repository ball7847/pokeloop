import test from 'node:test';
import assert from 'node:assert/strict';
import {getWildPokemon,getKillLimit,evolutionFor,evolutionChance,appearedInRegion,battleEnergyRewards,LAKE_REGION,LAKE_POKEMON} from '../src/core/wildData.js';
import {initialState} from '../src/core/gameState.js';
import {startBattle,advanceBattle} from '../src/core/combatEngine.js';

test('Wishiwashi is common slot 10 and School Form is its guaranteed common evolution',()=>{
 const solo=getWildPokemon('wishiwashi'),school=getWildPokemon('wishiwashi-school');
 assert.deepEqual([solo.number,solo.encounterCode,solo.hp,solo.attack,solo.defense,solo.specialAttack,solo.specialDefense,solo.speed],[746,'W031001',225,2,2,2,2.5,400]);
 assert.deepEqual(solo.rewards,{});
 assert.deepEqual(battleEnergyRewards(solo),{물:20});
 assert.deepEqual([school.number,school.encounterCode,school.hp,school.attack,school.defense,school.specialAttack,school.specialDefense,school.speed,school.multiStrike],[746,'W031001-E1',4500,40,40,40,50,4000,9000]);
 assert.deepEqual(school.rewards,{hp:174,multiStrike:60});
 assert.deepEqual(battleEnergyRewards(school),{물:620});
 assert.equal(school.rarity,'common');
 assert.equal(school.evolvesFrom,'wishiwashi');
 assert.equal(evolutionFor('wishiwashi').id,school.id);
 assert.equal(evolutionChance(school,{uncommonChance:0}),1);
 assert.equal(getKillLimit(solo),10);
 assert.equal(getKillLimit(school),1);
 assert.equal(getKillLimit(school,200),1);
 assert.equal(LAKE_POKEMON.filter(p=>!p.evolvesFrom&&!p.rarity).length,9);
});
test('School Form appears after first solo victory without rarity roll, then can only be killed once',()=>{
 const base=initialState();
 let s={...base,phase:'running',activeRegionId:LAKE_REGION.id,
 killCounts:{...base.killCounts,...Object.fromEntries(['rattata','pidgey','mankey','spearow','zubat','meowth','geodude','caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f','tangela','buizel','magikarp','cutiefly','azurill','wingull','feebas','tadbulb','lotad'].map(id=>[id,1]))},
 dittoStats:{...base.dittoStats,hp:100000,attack:100000,specialAttack:100000,accuracy:1000,speed:100}};
 assert.equal(appearedInRegion(s,LAKE_REGION.id).some(p=>p.id==='wishiwashi-school'),false);
 s=startBattle(s,'wishiwashi');
 assert.equal(s.combat.active,true);
 s=advanceBattle(s,500,()=>0);
 assert.equal(s.killCounts.wishiwashi,1);
 assert.equal(s.evolutionResults['wishiwashi-school'],true);
 assert.equal(appearedInRegion(s,LAKE_REGION.id).some(p=>p.id==='wishiwashi-school'),true);
 s=startBattle(s,'wishiwashi-school');
 assert.equal(s.combat.active,true);
 s=advanceBattle(s,500,()=>0);
 assert.equal(s.killCounts['wishiwashi-school'],1);
 assert.equal(startBattle(s,'wishiwashi-school'),s);
});
