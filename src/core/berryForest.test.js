import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from './gameState.js';
import {BERRY_REGION,REGION,BERRY_POKEMON,battleEnergyRewards,appearedInRegion,isRegionUnlocked,isPokemonUnlockedInState} from './wildData.js';
import {resolveAttack,hitChance} from './combatEngine.js';
import {encodeSave,decodeSave} from './saveSystem.js';

const state=()=>({...initialState(),phase:'running'});
test('berry forest exact roster and no invented currency payouts',()=>{
 assert.deepEqual(BERRY_POKEMON.map(p=>[p.id,p.hp,p.attack,p.specialAttack,p.defense,p.speed,p.paralysis,p.poison,p.accuracy]),[
 ['caterpie',90,6,0,0,3000,0,0,100],
 ['weedle',80,7,0,0,3500,0,0,100],
 ['kakuna',90,5,0,5,5000,0,0,100],
 ['metapod',100,4,0,5.5,4500,0,0,100],
 ['pikachu',350,55,0,0,1000,43,0,100],
 ['jigglypuff',230,0,15,0,3900,0,0,100],
 ['nidoran-m',460,57,0,0,2730,0,0,80],
 ['nidoran-f',550,47,0,0,2750,0,40,100]
 ]);
 assert.deepEqual(BERRY_POKEMON.map(p=>p.rewards),[
 {hp:7},{hp:7},{hp:10,defense:1},{hp:10,defense:1},
 {attack:25,paralysis:3.2},{specialAttack:4.5},{attack:14.25},{hp:29,poison:1}
 ]);
 assert.ok(BERRY_POKEMON.every(p=>p.energyReward===undefined));
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='jigglypuff'),0),{노말:10});
 assert.deepEqual(battleEnergyRewards(BERRY_POKEMON.find(p=>p.id==='jigglypuff'),1),{노말:5});
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
 assert.equal(isPokemonUnlockedInState(s,'kakuna'),true);
 assert.equal(isPokemonUnlockedInState(s,'metapod'),false);
 assert.equal(isPokemonUnlockedInState(s,'pikachu'),false);
 s={...s,killCounts:{...s.killCounts,caterpie:1}};
 assert.equal(isPokemonUnlockedInState(s,'metapod'),true);
 assert.equal(appearedInRegion(s,BERRY_REGION.id).length,7);
 assert.equal(appearedInRegion({...s,berryRareAppeared:true},BERRY_REGION.id).length,8);
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
test('paralysis can cancel attacks, persists cumulatively, caps at 250',()=>{
 const c=combat();
 c.playerStatus.paralysis=250;
 const before=c.enemy.hp.current;
 const r=resolveAttack(c,'player',unit({attack:100,paralysis:50}),unit(),()=>0);
 assert.equal(r.cancelled,true);
 assert.equal(c.enemy.hp.current,before);
 const d=combat();
 for(let i=0;i<7;i++)resolveAttack(d,'player',unit({paralysis:43}),unit(),()=>.9);
 assert.equal(d.enemyStatus.paralysis,250);
});
test('poison is flat end-of-action damage even on miss or paralysis cancellation',()=>{
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

test('berry forest battles pay stat rewards, but no unconfigured type energy',()=>{
 let s=state();
 s={...s,dittoStats:{...s.dittoStats,attack:1000,speed:1},
  killCounts:{...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1}};
 s=transition(s,{type:'SELECT_REGION',regionId:BERRY_REGION.id});
 s=transition(s,{type:'SELECT_WILD',pokemonId:'caterpie'});
 assert.equal(s.combat.active,true);
 assert.equal(s.combat.enemy.hp.max,90);
 const beforeHp=s.dittoStats.hp;
 const beforeEnergy={...s.energyBalances};
 s=transition(s,{type:'COMBAT_TICK',deltaMs:5,random:()=>.5});
 assert.equal(s.killCounts.caterpie,1);
 assert.equal(s.dittoStats.hp,beforeHp+7);
 assert.deepEqual(s.energyBalances,beforeEnergy);
 assert.equal(isPokemonUnlockedInState(s,'metapod'),true);
});

test('Jigglypuff grants normal energy only with repetition decay, alongside existing special attack reward',()=>{
 let s=state();
 s={...s,activeRegionId:BERRY_REGION.id,
   killCounts:{...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,caterpie:1,weedle:1,kakuna:1,metapod:1},
   dittoStats:{...s.dittoStats,attack:10000,speed:1}};
 const before={...s.energyBalances};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'jigglypuff'});
 assert.equal(s.combat.active,true);
 assert.equal(s.combat.enemy.hp.max,230);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:5,random:()=>.6});
 assert.equal(s.killCounts.jigglypuff,1);
 assert.equal(s.energyBalances.노말,before.노말+10);
 assert.equal(s.energyBalances.페어리,before.페어리);
 assert.equal(s.dittoStats.specialAttack,4.5);
 s=transition(s,{type:'SELECT_WILD',pokemonId:'jigglypuff'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:5,random:()=>.6});
 assert.equal(s.killCounts.jigglypuff,2);
 assert.equal(s.energyBalances.노말,before.노말+15);
 assert.equal(s.energyBalances.페어리,before.페어리);
 assert.equal(s.dittoStats.specialAttack,6.75);
});
