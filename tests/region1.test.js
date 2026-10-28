import test from 'node:test';
import assert from 'node:assert/strict';
import {WILD_POKEMON,UNCOMMON_STARTERS,appearedInRegion,REGION,rollUncommonStarter,getActiveWildPokemon,isPokemonUnlocked,unlockedPokemonCount,INITIAL_UNLOCK_COUNT} from '../src/core/wildData.js';
import {initialState,transition} from '../src/core/gameState.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';
test('region 1 position 3-5 stats and rewards',()=>{
 assert.deepEqual(WILD_POKEMON.map(p=>p.id),['rattata','pidgey','mankey','spearow','zubat','meowth','geodude','exeggcute','sentret','tauros']);
 assert.deepEqual([WILD_POKEMON[2].hp,WILD_POKEMON[2].attack,WILD_POKEMON[2].speed],[24,7,1800]);
 assert.deepEqual(WILD_POKEMON[2].rewards,{hp:5.6,attack:2});
 assert.deepEqual([WILD_POKEMON[3].hp,WILD_POKEMON[3].attack,WILD_POKEMON[3].speed],[13.3,2,1300]);
 assert.deepEqual(WILD_POKEMON[3].rewards,{hp:2.1,attack:1});
 assert.deepEqual([WILD_POKEMON[4].hp,WILD_POKEMON[4].attack,WILD_POKEMON[4].speed],[10,1.2,800]);
 assert.deepEqual(WILD_POKEMON[4].rewards,{attack:1,speed:-20});
});
test('Zubat victory reduces attack interval and records dex',()=>{
 let s=initialState();s.killCounts={...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,meowth:1,geodude:1,exeggcute:1};
 s.dittoStats={...s.dittoStats,attack:100,speed:3000};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'zubat'});
 assert.equal(s.combat.active,true);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:3000,random:()=>0.99});
 assert.equal(s.victories,1);assert.equal(s.dittoStats.speed,2980);
 assert.equal(s.killCounts.zubat,1);assert.ok(s.dexDiscovered.includes('zubat'));
});
test('starter slot defaults absent and requires single chosen species',()=>{
 assert.equal(rollUncommonStarter(),null);assert.equal(UNCOMMON_STARTERS.length,3);
 assert.deepEqual(UNCOMMON_STARTERS.map(p=>p.id),['bulbasaur','charmander','squirtle']);
 for(const p of UNCOMMON_STARTERS){
  assert.deepEqual([p.hp,p.attack,p.speed],[100,10,3000]);
  assert.deepEqual(p.rewards,{hp:10,attack:1,speed:-30});
 }
 assert.equal(rollUncommonStarter(1,()=>0),'bulbasaur');
 assert.equal(rollUncommonStarter(1,()=>0.5),'charmander');
 assert.equal(rollUncommonStarter(1,()=>0.999),'squirtle');
 const s=initialState();assert.equal(getActiveWildPokemon(s).length,10);
 assert.equal(transition(s,{type:'SELECT_WILD',pokemonId:'bulbasaur'}),s);
 s.uncommonStarterId='charmander';s.killCounts.rattata=1;s.killCounts.pidgey=1;s.killCounts.mankey=1;
 assert.equal(getActiveWildPokemon(s).length,11);
 assert.equal(transition(s,{type:'SELECT_WILD',pokemonId:'bulbasaur'}),s);
 assert.equal(transition(s,{type:'SELECT_WILD',pokemonId:'charmander'}).combat.enemy.name,'파이리');
});
test('save preserves 6th slot and discovery; old saves default missing fields',()=>{
 const s=initialState();s.uncommonStarterId='squirtle';s.uncommonChance=.25;s.killCounts.spearow=2;s.dexDiscovered=['spearow'];
 const restored=decodeSave(encodeSave(s)).game;
 assert.equal(restored.uncommonStarterId,'squirtle');assert.equal(restored.uncommonChance,.25);
 assert.equal(restored.killCounts.spearow,2);assert.deepEqual(restored.dexDiscovered,['spearow']);
});

test('unique first defeats unlock next in encounter order, including non-sequential victories',()=>{
 const kills={};
 assert.equal(INITIAL_UNLOCK_COUNT,3);
 assert.equal(unlockedPokemonCount(kills),3);
 assert.deepEqual(WILD_POKEMON.filter(p=>isPokemonUnlocked(kills,p.id)).map(p=>p.id),['rattata','pidgey','mankey']);
 kills.mankey=1;
 assert.equal(unlockedPokemonCount(kills),4);
 assert.equal(isPokemonUnlocked(kills,'spearow'),true);
 assert.equal(isPokemonUnlocked(kills,'zubat'),false);
 kills.mankey=10;
 assert.equal(unlockedPokemonCount(kills),4,'repeat defeats do not unlock extras');
 kills.rattata=1;
 assert.equal(unlockedPokemonCount(kills),5);
 assert.equal(isPokemonUnlocked(kills,'zubat'),true);
 kills.pidgey=3;
 assert.equal(unlockedPokemonCount(kills),6,'third distinct victory opens the sixth encounter');
});
test('absent uncommon slot is excluded and present starter requires another distinct first victory',()=>{
 const kills={rattata:1,pidgey:1,mankey:1};
 assert.equal(unlockedPokemonCount(kills),6);
 assert.equal(isPokemonUnlocked(kills,'charmander'),false,'absent starter cannot be selected');
 assert.equal(unlockedPokemonCount(kills,'charmander'),6);
 assert.equal(isPokemonUnlocked(kills,'charmander','charmander'),true);
 assert.equal(isPokemonUnlocked(kills,'bulbasaur','charmander'),false);
});
test('first victories survive saves and the unlock count restores automatically',()=>{
 const state=initialState();
 state.killCounts.mankey=4;
 const restored=decodeSave(encodeSave(state)).game;
 assert.equal(unlockedPokemonCount(restored.killCounts,restored.uncommonStarterId),4);
 assert.equal(isPokemonUnlocked(restored.killCounts,'spearow',restored.uncommonStarterId),true);
 assert.equal(isPokemonUnlocked(restored.killCounts,'zubat',restored.uncommonStarterId),false);
});

test('slot 6 inserts the appeared uncommon starter before Meowth and preserves fixed codes',()=>{
 const base=initialState();
 assert.deepEqual(appearedInRegion(base,REGION.id).map(p=>p.id),WILD_POKEMON.map(p=>p.id));
 assert.deepEqual(WILD_POKEMON.map(p=>p.encounterCode),['R10101','R10201','R10401','R10501','R10701','R10901','R11001','R11101','R11201','R11401']);
 assert.deepEqual(UNCOMMON_STARTERS.map(p=>p.encounterCode),['R10802-01','R10802-02','R10802-03']);
 for(const id of ['bulbasaur','charmander','squirtle']){
  const s={...base,uncommonStarterId:id};
  const lineup=appearedInRegion(s,REGION.id);
  assert.equal(lineup[5].id,id);
  assert.equal(lineup[6].id,'meowth');
  assert.equal(unlockedPokemonCount({rattata:1,pidgey:1,mankey:1},id),6);
  assert.equal(isPokemonUnlocked({rattata:1,pidgey:1,mankey:1},id,id),true);
  assert.equal(isPokemonUnlocked({rattata:1,pidgey:1,mankey:1},'meowth',id),false);
  assert.equal(isPokemonUnlocked({rattata:1,pidgey:1,mankey:1,spearow:1},'meowth',id),true);
 }
 assert.equal(isPokemonUnlocked({rattata:1,pidgey:1,mankey:1},'meowth'),true);
});
