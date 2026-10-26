import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/core/gameState.js';
import {resolveAttack} from '../src/core/combatEngine.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';
import {WILD_POKEMON,REGION,BERRY_REGION,regionUnlockRequirement,isRegionUnlocked,battleEnergyRewards} from '../src/core/wildData.js';

const ids=['rattata','pidgey','mankey','spearow','zubat','meowth','geodude','exeggcute','sentret','tauros'];
test('region 1 extends to 10 common species with configured stats, energy and first-kill rewards',()=>{
 assert.deepEqual(WILD_POKEMON.map(p=>p.id),ids);
 const expected=[
 ['meowth',20,1.8,1100,1000,{attack:1.5,multiStrike:4},{노말:10}],
 ['geodude',40,20,6000,0,{attack:2,defense:1},{바위:1,땅:1}],
 ['exeggcute',60,4,4700,0,{specialAttack:3},{풀:1,에스퍼:1}],
 ['sentret',100,4.6,2400,0,{hp:16.1},{노말:15}],
 ['tauros',225,20,1500,0,{hp:15,attack:5,defense:1,specialDefense:1},{노말:49}]
 ];
 for(const [id,hp,attack,speed,multiStrike,rewards,energy] of expected){
  const p=WILD_POKEMON.find(x=>x.id===id);
  assert.deepEqual([p.hp,p.attack,p.speed,p.multiStrike],[hp,attack,speed,multiStrike]);
  assert.deepEqual(p.rewards,rewards);
  assert.deepEqual(battleEnergyRewards(p),energy);
 }
 assert.equal(WILD_POKEMON[6].defense,10);
 assert.equal(WILD_POKEMON[7].specialAttack,30);
 assert.equal(WILD_POKEMON[9].defense,9.5);
 assert.equal(WILD_POKEMON[9].specialDefense,7);
});
test('70% uses appeared non-evolution species; uncommon encounter changes denominator',()=>{
 const s=initialState();
 assert.equal(regionUnlockRequirement(s),7);
 const counted=ids.slice(0,7);
 const kills=Object.fromEntries(counted.map(id=>[id,1]));
 assert.equal(isRegionUnlocked({...s,killCounts:kills},BERRY_REGION.id),true);
 assert.equal(isRegionUnlocked({...s,killCounts:Object.fromEntries(counted.slice(0,6).map(id=>[id,1]))},BERRY_REGION.id),false);
 const appeared={...s,uncommonStarterId:'bulbasaur'};
 assert.equal(regionUnlockRequirement(appeared),8);
 assert.equal(isRegionUnlocked({...appeared,killCounts:kills},BERRY_REGION.id),false);
 assert.equal(isRegionUnlocked({...appeared,killCounts:{...kills,bulbasaur:1}},BERRY_REGION.id),true);
 assert.equal(REGION.defaultKillLimit,10);
});
const stats=(fields={})=>({attack:0,specialAttack:0,defense:0,specialDefense:0,paralysis:0,poison:0,antidote:0,accuracy:100,dodge:0,minDamagePercent:100,maxDamagePercent:100,multiStrike:0,...fields});
const combat=()=>({currentHp:500,dittoHp:{current:500,max:500},enemy:{hp:{current:500,max:500}},playerStatus:{paralysis:0,poison:20},enemyStatus:{paralysis:0,poison:0}});
test('1000 multi-strike gives one immediate bonus hit with one poison tick',()=>{
 const c=combat(),events=[];
 resolveAttack(c,'player',stats({attack:10,multiStrike:1000}),stats(),()=>0.5,events);
 assert.equal(c.enemy.hp.current,480);
 assert.equal(c.currentHp,480);
 assert.equal(events.filter(x=>x.kind==='physical').length,2);
 assert.equal(events.filter(x=>x.kind==='poison').length,1);
});
test('1500 multi-strike adds one guaranteed and one 50% chance; survives save',()=>{
 for(const [roll,expected] of [[0.2,3],[0.8,2]]){
  const c=combat();
  resolveAttack(c,'player',stats({attack:10,multiStrike:1500}),stats(),()=>roll);
  assert.equal(c.enemy.hp.current,500-expected*10);
  assert.equal(c.currentHp,480);
 }
 const s=initialState();s.dittoStats.multiStrike=4;
 assert.equal(decodeSave(encodeSave(s)).game.dittoStats.multiStrike,4);
});
