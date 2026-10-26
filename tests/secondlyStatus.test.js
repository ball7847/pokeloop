import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/core/gameState.js';
import {startBattle,advanceBattle,resolveAttack} from '../src/core/combatEngine.js';
import {BERRY_REGION} from '../src/core/wildData.js';

const setup=({hp=100,poison=10,antidote=3,regeneration=5,enemyHp=100}={})=>{
 const state=initialState();
 const kills={...state.killCounts};
 for(const id of ['rattata','pidgey','mankey','spearow','zubat','meowth','geodude',
   'caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f'])kills[id]=1;
 const ready={...state,phase:'running',activeRegionId:BERRY_REGION.id,killCounts:kills,
   dittoStats:{...state.dittoStats,hp,attack:0,specialAttack:0,speed:5000,antidote,regeneration}};
 const started=startBattle(ready,'tangela');
 assert.equal(started.combat.active,true);
 return {...started,combat:{...started.combat,currentHp:hp,dittoHp:{current:hp,max:hp},
   playerStatus:{paralysis:0,poison},
   enemy:{...started.combat.enemy,hp:{current:enemyHp,max:130},
    attackCooldown:{elapsed:0,duration:5000}}}};
};
test('one second independently applies antidote, poison, then regeneration',()=>{
 let s=setup({hp:100,poison:10,antidote:3,regeneration:5,enemyHp:125});
 s=advanceBattle(s,500,()=>0.5);
 assert.equal(s.combat.currentHp,100);
 assert.equal(s.combat.playerStatus.poison,10);
 s=advanceBattle(s,500,()=>0.5);
 assert.equal(s.combat.currentHp,98);
 assert.equal(s.combat.playerStatus.poison,7);
 assert.equal(s.combat.enemy.hp.current,130);
 s=advanceBattle(s,1000,()=>0.5);
 assert.equal(s.combat.currentHp,99);
 assert.equal(s.combat.playerStatus.poison,4);
});
test('poison death prevents same-second regeneration and ends battle',()=>{
 let s=setup({hp:5,poison:10,antidote:0,regeneration:100});
 s=advanceBattle(s,1000,()=>0.5);
 assert.equal(s.combat.active,false);
 assert.equal(s.combat.lastEvent.type,'defeat');
 assert.equal(s.combat.currentHp,-5);
});
test('attack actions no longer independently trigger poison or antidote',()=>{
 const c={currentHp:100,dittoHp:{current:100,max:100},enemy:{hp:{current:100,max:100}},
   playerStatus:{paralysis:0,poison:10},enemyStatus:{paralysis:0,poison:0}};
 resolveAttack(c,'player',{attack:0,specialAttack:0,accuracy:0,antidote:3,multiStrike:0},
  {dodge:0},()=>0.5);
 assert.equal(c.currentHp,100);
 assert.equal(c.playerStatus.poison,10);
});
test('large combat ticks do not skip status seconds and cap HP',()=>{
 let s=setup({hp:100,poison:0,antidote:0,regeneration:5});
 s={...s,combat:{...s.combat,currentHp:91,dittoHp:{current:91,max:100}}};
 s=advanceBattle(s,2000,()=>0.5);
 assert.equal(s.combat.currentHp,100);
});
