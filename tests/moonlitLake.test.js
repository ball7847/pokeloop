import test from 'node:test';
import {getWildPokemon} from '../src/core/wildData.js';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {LAKE_REGION,LAKE_POKEMON,appearedInRegion,isRegionUnlocked,ENCOUNTER_SLOTS,evolutionChance,evolutionFor,isPokemonUnlockedInState,battleEnergyRewards} from '../src/core/wildData.js';
import {resolveAttack,startBattle} from '../src/core/combatEngine.js';
import {resolveStats} from '../src/core/dittoStats.js';

const prepared=()=>{const s=initialState();return {...s,phase:'running',activeRegionId:LAKE_REGION.id,
 killCounts:{...s.killCounts,...Object.fromEntries(['rattata','pidgey','mankey','spearow','zubat','meowth','geodude','caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f','tangela'].map(id=>[id,1]))}}};
test('moonlit lake roster and 3-to-1 uncommon slot are registered',()=>{
 assert.equal(LAKE_POKEMON.length,18);
 const slot=ENCOUNTER_SLOTS.find(s=>s.id==='W030302');
 assert.deepEqual(slot.candidates,['popplio','sobble','quaxly']);
 assert.equal(ENCOUNTER_SLOTS.find(s=>s.id==='W030201').candidates.length,1);
 const s=prepared();assert.ok(isRegionUnlocked(s,LAKE_REGION.id));
 assert.deepEqual(appearedInRegion(s,LAKE_REGION.id).map(p=>p.id),['buizel','magikarp','cutiefly','azurill','wingull','feebas','tadbulb','lotad','wishiwashi']);
 const rare={...s,raritySlotResults:{W030302:'sobble',W030101:'buizel',W030201:'magikarp',W030401:'cutiefly',W030501:'azurill',W030601:'wingull',W030701:'feebas',W030801:'tadbulb',W030901:'lotad',W031001:'wishiwashi'}};
 assert.deepEqual(appearedInRegion(rare,LAKE_REGION.id).map(p=>p.id),['buizel','magikarp','sobble','cutiefly','azurill','wingull','feebas','tadbulb','lotad','wishiwashi']);
});
test('enemy intimidation halves player physical attack at battle start',()=>{
 const s=prepared();const unlocked={...s,evolutionResults:{gyarados:true},killCounts:{...s.killCounts,buizel:1,magikarp:1}};
 const battle=startBattle(unlocked,'gyarados');
 assert.equal(battle.combat.intimidationDebuffs.player,.5);
});
test('sound penetrates special defense, critical multiplies both damage channels',()=>{
 const actor=resolveStats({attack:100,specialAttack:100,sound:30,criticalChance:100,criticalMultiplier:200});
 const enemy=resolveStats({hp:1000,defense:20,specialDefense:50});
 const c={enemy:{hp:{current:1000}},currentHp:1000,dittoHp:{current:1000},
 playerStatus:{paralysis:0,poison:0},enemyStatus:{paralysis:0,poison:0}};
 resolveAttack(c,'player',actor,enemy,()=>0);
 assert.equal(c.enemy.hp.current,740); // (85-20 + 85-(50-30)) * 2 = 260 
});


test('region 3 dodge rebalance retains all other enemy stats and rewards',()=>{
 const magikarp=getWildPokemon('magikarp'),quaxly=getWildPokemon('quaxly');
 assert.equal(magikarp.dodge,100);
 assert.equal(quaxly.dodge,30);
 assert.equal(magikarp.energyReward,20);
 assert.deepEqual(magikarp.rewards,{});
 assert.deepEqual(quaxly.rewards,{attack:40,dodge:15,multiStrike:15});
});

test('Gyarados is common and guaranteed after Magikarp first defeat, regardless of uncommon chance',()=>{
 const gyarados=getWildPokemon('gyarados');
 assert.equal(gyarados.rarity,'common');
 assert.equal(gyarados.evolvesFrom,'magikarp');
 assert.equal(evolutionChance(gyarados,{uncommonChance:0}),1);
 assert.equal(evolutionChance(gyarados,{uncommonChance:0.35}),1);
 const state=prepared();
 const appeared={...state,evolutionResults:{...state.evolutionResults,gyarados:true},
  killCounts:{...state.killCounts,buizel:1,magikarp:1}};
 assert.deepEqual(appearedInRegion(appeared,LAKE_REGION.id).map(p=>p.id),
  ['buizel','magikarp','gyarados','cutiefly','azurill','wingull','feebas','tadbulb','lotad','wishiwashi']);
 assert.deepEqual(gyarados.rewards,{attack:20,intimidation:16});
 assert.equal(gyarados.energyReward,130);
});

test('new Lake base slots, exact stats and type energy rewards',()=>{
 const azurill=getWildPokemon('azurill'),wingull=getWildPokemon('wingull'),feebas=getWildPokemon('feebas');
 assert.deepEqual([azurill.hp,azurill.attack,azurill.speed,azurill.minDamagePercent,azurill.maxDamagePercent],[1000,100,4000,100,200]);
 assert.deepEqual(azurill.rewards,{hp:30,attack:10,minDamagePercent:1,maxDamagePercent:2});
 assert.deepEqual(battleEnergyRewards(azurill,0),{노말:50,페어리:50});
 assert.deepEqual([wingull.hp,wingull.specialAttack,wingull.speed,wingull.accuracy,wingull.regeneration],
   [1333,70,1533,333,0]);
 assert.equal(wingull.dodge,33);
 assert.deepEqual(wingull.rewards,{specialAttack:13,accuracy:13,dodge:3});
 assert.deepEqual(battleEnergyRewards(wingull,0),{물:55.6,비행:55.6});
 assert.deepEqual([feebas.hp,feebas.specialAttack,feebas.defense,feebas.specialDefense,feebas.regeneration,feebas.speed],
   [95,10,1250,79,95,3500]);
 assert.deepEqual(feebas.rewards,{});
 assert.deepEqual(battleEnergyRewards(feebas,0),{물:20});
 assert.deepEqual(ENCOUNTER_SLOTS.filter(slot=>slot.id.startsWith('W030')).map(slot=>slot.id),
   ['W030101','W030201','W030302','W030401','W030501','W030601','W030701','W030801','W030901','W031001']);
});
test('Azurill evolves through two independently rolled uncommon stages on first victories',()=>{
 const marill=getWildPokemon('marill'),azumarill=getWildPokemon('azumarill');
 assert.equal(evolutionFor('azurill').id,'marill');
 assert.equal(evolutionFor('marill').id,'azumarill');
 assert.equal(evolutionChance(marill,{uncommonChance:0}),0);
 assert.equal(evolutionChance(marill,{uncommonChance:.5}),.5);
 assert.equal(evolutionChance(azumarill,{uncommonChance:.5}),.5);
 assert.deepEqual([marill.hp,marill.attack,marill.speed,marill.minDamagePercent,marill.maxDamagePercent],[1830,100,3000,150,200]);
 assert.deepEqual(marill.rewards,{hp:70,attack:20,minDamagePercent:1.5,maxDamagePercent:3});
 assert.deepEqual([azumarill.hp,azumarill.attack,azumarill.speed,azumarill.minDamagePercent,azumarill.maxDamagePercent],[1840,250,2800,200,200]);
 assert.deepEqual(azumarill.rewards,{hp:100,attack:50,minDamagePercent:5,maxDamagePercent:5});
 assert.deepEqual(battleEnergyRewards(marill,0),{물:75,페어리:75});
 assert.deepEqual(battleEnergyRewards(azumarill,0),{물:200,페어리:200});
 const state=prepared(), kills={...state.killCounts,buizel:1,magikarp:1,cutiefly:1,azurill:1,marill:1};
 const linked={...state,killCounts:kills,evolutionResults:{marill:true,azumarill:true}};
 assert.deepEqual(appearedInRegion(linked,LAKE_REGION.id).map(p=>p.id),
   ['buizel','magikarp','cutiefly','azurill','marill','azumarill','wingull','feebas','tadbulb','lotad','wishiwashi']);
 assert.equal(isPokemonUnlockedInState(linked,'azumarill'),true);
 const blocked={...linked,evolutionResults:{...linked.evolutionResults,marill:false}};
 assert.equal(isPokemonUnlockedInState(blocked,'azumarill'),false);
});
test('rare Milotic is registered but cannot roll naturally until rare odds are configured',()=>{
 const feebas=getWildPokemon('feebas'),milotic=getWildPokemon('milotic');
 assert.equal(evolutionFor(feebas.id).id,'milotic');
 assert.equal(milotic.rarity,'rare');
 assert.equal(evolutionChance(milotic,prepared()),0);
 assert.equal(evolutionChance(milotic,{rareChance:0.12}),0.12);
 assert.deepEqual([milotic.hp,milotic.specialAttack,milotic.defense,milotic.specialDefense,milotic.regeneration,milotic.speed],
   [3950,100,118.5,125,35,1750]);
 assert.deepEqual(milotic.rewards,{hp:100,specialDefense:40});
 assert.deepEqual(battleEnergyRewards(milotic,0),{물:350});
});
