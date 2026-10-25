import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from './gameState.js';
import {BERRY_REGION,REGION,BERRY_POKEMON,battleEnergyRewards,appearedInRegion,isRegionUnlocked,isPokemonUnlockedInState} from './wildData.js';
import {resolveAttack,hitChance} from './combatEngine.js';
import {encodeSave,decodeSave} from './saveSystem.js';
import {eventMessage} from '../store/useGameStore.js';

const state=()=>({...initialState(),phase:'running'});
test('berry forest roster, stats, rewards and energy payout',()=>{
 assert.deepEqual(BERRY_POKEMON.map(p=>[p.id,p.hp,p.attack,p.specialAttack,p.defense,p.speed,p.paralysis,p.poison,p.accuracy,p.maxDamagePercent]),[
 ['caterpie',45,3,0,0,3000,0,0,100,100],
 ['weedle',40,3.5,0,0,3500,0,0,100,100],
 ['kakuna',90,10,0,5,5000,0,0,100,100],
 ['metapod',100,10,0,5.5,4500,0,0,100,100],
 ['taillow',40,5.5,0,0,1100,0,0,100,100],
 ['pikachu',350,55,0,0,1000,43,0,100,100],
 ['igglybuff',90,3,4,0,3000,0,0,100,100],
 ['nidoran-m',92,28.5,0,0,2730,0,0,80,150],
 ['nidoran-f',110,14.7,0,0,2750,0,4.7,100,100]
 ]);
 assert.deepEqual(BERRY_POKEMON.map(p=>p.rewards),[
 {hp:7},{hp:7},{hp:10,defense:1},{hp:10,defense:1},{attack:1.5,speed:-30},
 {attack:25,paralysis:3.2},{specialAttack:2},{attack:3.2,maxDamagePercent:3.2},{hp:12.9,poison:1}
 ]);
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='caterpie')),{벌레:3});
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='weedle')),{벌레:3,독:3});
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='metapod')),{벌레:5});
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='kakuna')),{벌레:5,독:5});
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='taillow')),{노말:10,비행:10});
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='igglybuff')),{노말:17.4,페어리:17.4});
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='igglybuff'),1),{노말:8.7,페어리:8.7});
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='pikachu')),{});
 for(const id of ['nidoran-m','nidoran-f']){
   const p=BERRY_POKEMON.find(p=>p.id===id);
   assert.deepEqual(battleEnergyRewards(p,0),{독:6.9});
   assert.deepEqual(battleEnergyRewards(p,1),{독:3.45});
 }
});
test('region 2 unlocks after 70% of appeared unique regional species and first three only',()=>{
 let s=state();
 assert.equal(isRegionUnlocked(s,BERRY_REGION.id),false);
 assert.equal(transition(s,{type:'SELECT_REGION',regionId:BERRY_REGION.id}),s);
 for(const id of ['rattata','pidgey','mankey']){
   s={...s,killCounts:{...s.killCounts,[id]:1}};
 }
 assert.equal(isRegionUnlocked(s,BERRY_REGION.id),false);
 s={...s,killCounts:{...s.killCounts,spearow:1}};
 assert.equal(isRegionUnlocked(s,BERRY_REGION.id),true);
 s=transition(s,{type:'SELECT_REGION',regionId:BERRY_REGION.id});
 assert.equal(s.activeRegionId,BERRY_REGION.id);
 assert.equal(isPokemonUnlockedInState(s,'caterpie'),true);
 assert.equal(isPokemonUnlockedInState(s,'weedle'),true);
 assert.equal(isPokemonUnlockedInState(s,'taillow'),true);
 assert.equal(isPokemonUnlockedInState(s,'igglybuff'),false);
 assert.equal(isPokemonUnlockedInState(s,'kakuna'),false);
 assert.equal(isPokemonUnlockedInState(s,'metapod'),false);
 assert.equal(isPokemonUnlockedInState(s,'pikachu'),false);
 s={...s,killCounts:{...s.killCounts,caterpie:1}};
 assert.equal(isPokemonUnlockedInState(s,'metapod'),false);
 assert.equal(isPokemonUnlockedInState(s,'igglybuff'),true);
 assert.equal(isPokemonUnlockedInState(s,'nidoran-m'),false);
 assert.equal(appearedInRegion(s,BERRY_REGION.id).length,6);
 assert.equal(appearedInRegion({...s,berryRareAppeared:true},BERRY_REGION.id).length,7);
 let rare={...state(),uncommonStarterId:'bulbasaur'};
 assert.equal(isRegionUnlocked({...rare,killCounts:{...rare.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1}},BERRY_REGION.id),false);
});
function combat(){
 return {currentHp:500,dittoHp:{current:500,max:500},enemy:{hp:{current:500,max:500}},
 playerStatus:{paralysis:0,poison:0},enemyStatus:{paralysis:0,poison:0}};
}
const unit=(fields={})=>({attack:0,specialAttack:0,defense:0,specialDefense:0,
 paralysis:0,poison:0,accuracy:100,dodge:0,minDamagePercent:100,...fields});
test('physical and special damage apply separately and resistances are independent',()=>{
 const c=combat();
 resolveAttack(c,'player',unit({attack:20,specialAttack:15}),unit({defense:5,specialDefense:10}),()=>.5);
 assert.equal(c.enemy.hp.current,480);
});
test('accuracy above 100 reduces target dodge, accuracy below 100 can miss',()=>{
 assert.equal(hitChance(unit({accuracy:200}),unit({dodge:10})),.95);
 assert.equal(hitChance(unit({accuracy:80}),unit()),.8);
 const c=combat();
 resolveAttack(c,'player',unit({attack:100,accuracy:80}),unit(),()=>.95);
 assert.equal(c.enemy.hp.current,500);
});
test('paralysis triggers a next-turn delay, not attack cancellation, and has no stack cap',()=>{
 const c=combat();
 c.playerStatus.paralysis=500;
 const r=resolveAttack(c,'player',unit({attack:100,paralysis:50}),unit(),()=>0);
 assert.equal(r.cancelled,false);
 assert.equal(r.hit,true);
 assert.equal(r.paralysisTriggered,true);
 assert.equal(r.delayMs,500);
 assert.equal(c.playerStatus.paralysis,0);
 assert.equal(c.enemy.hp.current,400);
 const d=combat();
 for(let i=0;i<7;i++)resolveAttack(d,'player',unit({paralysis:43}),unit(),()=>.9);
 assert.equal(d.enemyStatus.paralysis,301);
 const notTriggered=resolveAttack(d,'enemy',unit({attack:0}),unit(),()=>.9);
 assert.equal(notTriggered.delayMs,0);
 assert.equal(d.enemyStatus.paralysis,301);
});
test('poison is flat end-of-action damage even on miss or paralysis trigger',()=>{
 const c=combat();c.playerStatus.poison=40;
 resolveAttack(c,'player',unit({attack:100,accuracy:0}),unit(),()=>.7);
 assert.equal(c.currentHp,460);
 c.playerStatus.paralysis=250;
 resolveAttack(c,'player',unit({attack:100}),unit(),()=>0);
 assert.equal(c.currentHp,420);
 const d=combat();
 resolveAttack(d,'enemy',unit({poison:40}),unit(),()=>.8);
 assert.equal(d.playerStatus.poison,40);
 resolveAttack(d,'player',unit({attack:0}),unit(),()=>.5);
 assert.equal(d.currentHp,460);
});
test('v6 region, new stat rewards, and berry first victories survive save',()=>{
 let s=state();
 s={...s,activeRegionId:BERRY_REGION.id,
 killCounts:{...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,caterpie:1},
 dittoStats:{...s.dittoStats,poison:1.5,paralysis:3.2,specialAttack:4.5},
 berryRareAppeared:true};
 const restored=decodeSave(encodeSave(s)).game;
 assert.equal(restored.activeRegionId,BERRY_REGION.id);
 assert.equal(restored.berryRareAppeared,true);
 assert.equal(restored.killCounts.caterpie,1);
 assert.equal(restored.dittoStats.poison,1.5);
 assert.equal(restored.dittoStats.paralysis,3.2);
 assert.equal(restored.dittoStats.specialAttack,4.5);
});

test('berry forest battles pay configured type energy and stat rewards',()=>{
 let s=state();
 s={...s,dittoStats:{...s.dittoStats,attack:1000,speed:1},
  killCounts:{...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1}};
 s=transition(s,{type:'SELECT_REGION',regionId:BERRY_REGION.id});
 s=transition(s,{type:'SELECT_WILD',pokemonId:'caterpie'});
 assert.equal(s.combat.active,true);
 assert.equal(s.combat.enemy.hp.max,45);
 const beforeHp=s.dittoStats.hp;
 const beforeAttack=s.dittoStats.attack;
 const beforeEnergy={...s.energyBalances};
 s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>.5});
 assert.equal(s.killCounts.caterpie,1);
 assert.equal(s.dittoStats.hp,beforeHp+7);
 assert.equal(s.dittoStats.attack,beforeAttack);
 assert.equal(s.energyBalances.벌레,beforeEnergy.벌레+3);
 assert.equal(isPokemonUnlockedInState(s,'metapod'),true);
});

test('Igglybuff grants normal and fairy energy with repetition decay and special attack reward',()=>{
 let s=state();
 s={...s,activeRegionId:BERRY_REGION.id,
   killCounts:{...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,caterpie:1,weedle:1,kakuna:1,metapod:1},
   dittoStats:{...s.dittoStats,attack:10000,speed:1}};
 const before={...s.energyBalances};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'igglybuff'});
 assert.equal(s.combat.active,true);
 assert.equal(s.combat.enemy.hp.max,90);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>.6});
 assert.equal(s.killCounts.igglybuff,1);
 assert.equal(s.energyBalances.노말,before.노말+17.4);
 assert.equal(s.energyBalances.페어리,before.페어리+17.4);
 assert.equal(s.dittoStats.specialAttack,2);
 s=transition(s,{type:'SELECT_WILD',pokemonId:'igglybuff'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>.6});
 assert.equal(s.killCounts.igglybuff,2);
 assert.ok(Math.abs(s.energyBalances.노말-(before.노말+26.1))<1e-8);
 assert.ok(Math.abs(s.energyBalances.페어리-(before.페어리+26.1))<1e-8);
 assert.equal(s.dittoStats.specialAttack,3);
});

test('Nidoran males and females grant poison energy with normal diminishing returns and keep stat rewards',()=>{
 for(const [id,rewardField,rewardValue] of [['nidoran-m','attack',3.2],['nidoran-f','hp',12.9]]){
   let s=state();
   s={...s,activeRegionId:BERRY_REGION.id,
     killCounts:{...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,caterpie:1,weedle:1,kakuna:1,metapod:1,igglybuff:1},
     dittoStats:{...s.dittoStats,hp:10000,attack:10000,speed:1}};
   const initialEnergy={...s.energyBalances};
   const initialReward=s.dittoStats[rewardField];
   for(let count=1;count<=2;count++){
     s=transition(s,{type:'SELECT_WILD',pokemonId:id});
     assert.equal(s.combat.active,true);
     assert.equal(s.combat.enemy.statistics.attack,id==='nidoran-m'?28.5:14.7);
     s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>.6});
     assert.equal(s.killCounts[id],count);
     assert.equal(s.combat.active,false);
   }
   assert.ok(Math.abs(s.energyBalances.독-(initialEnergy.독+10.35))<1e-8);
   assert.equal(s.energyBalances.노말,initialEnergy.노말);
   assert.equal(s.dittoStats[rewardField],initialReward+rewardValue+rewardValue/2);
 }
});


test('antidote reduces poison before end-of-action damage, never below zero',()=>{
 const c=combat();
 c.playerStatus.poison=14;
 resolveAttack(c,'player',unit({attack:0,antidote:3}),unit(),()=>.5);
 assert.equal(c.playerStatus.poison,11);
 assert.equal(c.currentHp,489);
 resolveAttack(c,'player',unit({attack:0,antidote:20}),unit(),()=>.5);
 assert.equal(c.playerStatus.poison,0);
 assert.equal(c.currentHp,489);
});
test('antidote works even on misses and paralysis-triggered attacks, for both sides',()=>{
 const c=combat();
 c.playerStatus.poison=10;
 resolveAttack(c,'player',unit({accuracy:0,antidote:2}),unit(),()=>.9);
 assert.equal(c.playerStatus.poison,8);
 assert.equal(c.currentHp,492);
 c.playerStatus.paralysis=250;
 resolveAttack(c,'player',unit({attack:20,antidote:3}),unit(),()=>0);
 assert.equal(c.playerStatus.poison,5);
 assert.equal(c.currentHp,487);
 c.enemyStatus.poison=14;
 resolveAttack(c,'enemy',unit({attack:0,antidote:4}),unit(),()=>.5);
 assert.equal(c.enemyStatus.poison,10);
 assert.equal(c.enemy.hp.current,470);
});
test('antidote is saved and older v7 saves default to 0',()=>{
 let s=state();
 s={...s,energyBalances:{...s.energyBalances,독:100}};
 s=transition(s,{type:'BUY_UPGRADE',id:'antidote'});
 const restored=decodeSave(encodeSave(s)).game;
 assert.equal(restored.energyUpgrades.antidote,1);
 assert.equal(restored.dittoStats.antidote,0);
 const json=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(s)),x=>x.charCodeAt(0))));
 json.version=7;
 delete json.game.dittoStats.antidote;
 delete json.game.energyUpgrades.antidote;
 const old=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(json))));
 const migrated=decodeSave(old).game;
 assert.equal(migrated.dittoStats.antidote,0);
 assert.equal(migrated.energyUpgrades.antidote??0,0);
});


test('Caterpie and Weedle grant HP +7 without attack rewards, with diminishing returns',()=>{
 for(const id of ['caterpie','weedle']){
  let s=state();
  s={...s,dittoStats:{...s.dittoStats,attack:1000,speed:1},killCounts:{...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1}};
  s=transition(s,{type:'SELECT_REGION',regionId:BERRY_REGION.id});
  const initialHp=s.dittoStats.hp,initialAttack=s.dittoStats.attack;
  for(let i=0;i<2;i++){
   s=transition(s,{type:'SELECT_WILD',pokemonId:id});
   assert.equal(s.combat.active,true,id+' unlock/encounter');
   s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>.5});
   assert.equal(s.killCounts[id],i+1);
  }
  assert.ok(Math.abs(s.dittoStats.hp-initialHp-10.5)<1e-8);
  assert.equal(s.dittoStats.attack,initialAttack);
 }
});

test('victory log labels defense rather than undefined and speed uses milliseconds',()=>{
 assert.equal(eventMessage({type:'victory',name:'딱충이',count:5,rewards:{hp:2,defense:0.2}}),'딱충이 5회 처치 · HP +2, 방어 +0.2');
 assert.equal(eventMessage({type:'victory',name:'주뱃',count:1,rewards:{speed:-20}}),'주뱃 1회 처치 · 스피드 −20ms');
});
