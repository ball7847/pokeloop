import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {resolveAttack} from '../src/core/combatEngine.js';
import {BERRY_REGION} from '../src/core/wildData.js';

const unit=(fields={})=>({hp:10000,attack:0,specialAttack:0,defense:0,specialDefense:0,poison:0,paralysis:0,antidote:0,accuracy:100,dodge:0,minDamagePercent:100,...fields});
const battle=()=>({currentHp:10000,dittoHp:{current:10000,max:10000},enemy:{hp:{current:10000,max:10000}},playerStatus:{poison:0,paralysis:0},enemyStatus:{poison:0,paralysis:0}});
test('25% roll delays the following attack by the FULL stack, and consumes it',()=>{
 const c=battle();c.playerStatus.paralysis=500;
 const proc=resolveAttack(c,'player',unit({attack:1}),unit(),()=>0.249);
 assert.equal(proc.paralysisTriggered,true);
 assert.equal(proc.delayMs,500);
 assert.equal(proc.hit,true);
 assert.equal(c.playerStatus.paralysis,0);
 const again=resolveAttack(c,'player',unit({attack:1}),unit(),()=>0);
 assert.equal(again.delayMs,0);
});
test('roll of 25% or greater retains unlimited stack and attack still proceeds',()=>{
 const c=battle();c.playerStatus.paralysis=1000;
 const noProc=resolveAttack(c,'player',unit({attack:1}),unit(),()=>0.25);
 assert.equal(noProc.paralysisTriggered,false);
 assert.equal(noProc.delayMs,0);
 assert.equal(c.playerStatus.paralysis,1000);
 assert.equal(c.enemy.hp.current,9999);
});
test('enemy attacks gain a one-use 500ms delay while base speed stays unchanged',()=>{
 let s=initialState();
 s.phase='running';
 s.activeRegionId=BERRY_REGION.id;
 s.killCounts={...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1};
 s.dittoStats={...s.dittoStats,hp:10000,attack:0,defense:10000,speed:10000};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'caterpie'});
 assert.equal(s.combat.active,true);
 const poisoned=structuredClone(s);
 poisoned.combat.enemyStatus.paralysis=500;
 s=transition(poisoned,{type:'COMBAT_TICK',deltaMs:3000,random:()=>0});
 assert.equal(s.combat.enemy.attackCooldown.duration,3500);
 assert.equal(s.combat.enemyStatus.paralysis,0);
 assert.equal(s.combat.enemy.statistics.speed,3000);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:3500,random:()=>0});
 assert.equal(s.combat.enemy.attackCooldown.duration,3000);
});
test('player attacks gain a one-use 500ms delay, without changing permanent speed',()=>{
 let s=initialState();
 s.phase='running';
 s.dittoStats={...s.dittoStats,hp:10000,attack:0,defense:10000};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
 const status=structuredClone(s);
 status.combat.playerStatus.paralysis=500;
 s=transition(status,{type:'COMBAT_TICK',deltaMs:3000,random:()=>0});
 assert.equal(s.combat.dittoAttackCooldown.duration,3500);
 assert.equal(s.combat.playerStatus.paralysis,0);
 assert.equal(s.dittoStats.speed,3000);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:3500,random:()=>0});
 assert.equal(s.combat.dittoAttackCooldown.duration,3000);
});
