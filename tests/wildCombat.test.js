import test from 'node:test';
import assert from 'node:assert/strict';
import {REGION,WILD_POKEMON,rewardMultiplier,isPokemonUnlocked} from '../src/core/wildData.js';
import {initialState,transition} from '../src/core/gameState.js';
const select=(s,id)=>transition(s,{type:'SELECT_WILD',pokemonId:id});
const tick=(s,ms=100,roll=()=>0.9999)=>transition(s,{type:'COMBAT_TICK',deltaMs:ms,random:roll});
test('starting region has 5 ordered pokemon in 20 slots',()=>{
 assert.equal(Object.hasOwn(REGION,'capacity'),false);assert.equal(REGION.defaultKillLimit,10);
 assert.deepEqual(WILD_POKEMON.map(x=>x.name),['꼬렛','구구','망키','깨비참','주뱃']);
 assert.equal(WILD_POKEMON.length,5);
});
test('reward formula matches Rejected Draft diminishing returns',()=>{
 assert.equal(rewardMultiplier(0),1);assert.equal(rewardMultiplier(1),0.5);
 assert.ok(Math.abs(rewardMultiplier(2)-1/3)<1e-10);assert.equal(rewardMultiplier(9),0.1);
});
test('first three encounters are accessible immediately; fourth requires first unique victory',()=>{
 const s=initialState();
 for(const id of ['rattata','pidgey','mankey']){
  assert.equal(isPokemonUnlocked(s.killCounts,id),true);
  assert.equal(select(s,id).combat.active,true);
 }
 for(const id of ['spearow','zubat']){
  assert.equal(isPokemonUnlocked(s.killCounts,id),false);
  assert.equal(select(s,id),s);
 }
});
test('wild battle shows both UIs and resolves a single victory with reward',()=>{
 let s=select(initialState(),'rattata');assert.equal(s.combat.active,true);
 assert.equal(s.combat.enemy.hp.max,3);
 for(let i=0;i<100&&s.combat.active;i++)s=tick(s);
 assert.equal(s.victories,1);assert.equal(s.killCounts.rattata,1);
 assert.equal(s.dittoStats.attack,2);assert.equal(s.dittoStats.hp,10);
 assert.equal(s.combat.active,false);
 assert.equal(isPokemonUnlocked(s.killCounts,'spearow'),true);
 assert.equal(isPokemonUnlocked(s.killCounts,'zubat'),false);
 const after=tick(s);assert.equal(after,s);assert.equal(after.victories,1);
});
test('repeated same enemy applies diminishing fractional rewards and 10 kill cap',()=>{
 let s=initialState();
 for(let round=0;round<10;round++){
  s=select(s,'rattata');assert.equal(s.combat.active,true);
  for(let i=0;i<250 && s.combat.active;i++)s=tick(s);
  assert.equal(s.combat.active,false);
 }
 assert.equal(s.killCounts.rattata,10);assert.equal(s.victories,10);
 const earned=Array.from({length:10},(_,i)=>1/(i+1)).reduce((a,b)=>a+b,0);
 assert.ok(Math.abs(s.dittoStats.attack-(1+earned))<1e-10);
 assert.equal(select(s,'rattata'),s);
});
test('battle HP is separate, flee has no reward, pause freezes combat',()=>{
 let s=select(initialState(),'rattata');
 s=tick(s,100,()=>0);assert.equal(s.dittoStats.hp,10);
 s=transition(s,{type:'PAUSE'});
 const paused=tick(s);assert.equal(paused,s);
 s=transition(s,{type:'RESUME'});
 s=transition(s,{type:'FLEE'});assert.equal(s.combat.active,false);
 assert.equal(s.killCounts.rattata,0);assert.equal(s.victories,0);
});
test('a player defeat never rewards or doubles victory',()=>{
 let s=select(initialState(),'mankey');assert.equal(s.combat.active,true);
 // Force one unlocked enemy with zero damage to exercise player defeat.
 s=select(initialState(),'rattata');
 s={...s,dittoStats:{...s.dittoStats,attack:0},combat:{...s.combat,currentHp:1,dittoHp:{current:1,max:10}}};
 for(let i=0;i<25 && s.combat.active;i++)s=tick(s);
 assert.equal(s.combat.active,false);assert.equal(s.victories,0);
 assert.equal(s.dittoStats.hp,10);
});
