import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,transition,createGameStore} from '../src/core/gameState.js';
import {updateCombatDisplay} from '../src/ui/combatUpdates.js';
const code=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const start=s=>transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
const tick=(s,deltaMs,random=()=>0.9999)=>transition(s,{type:'COMBAT_TICK',deltaMs,random});
test('event id remains stable across high-frequency ticks',()=>{
 const first=start(initialState());
 const next=tick(first,100);
 assert.equal(first.combat.lastEvent.id,next.combat.lastEvent.id);
 assert.equal(first.eventSerial,next.eventSerial);
 assert.notEqual(first.combat.lastEvent,next.combat.lastEvent);
});
test('new battle events have increasing identifiers and victories occur once',()=>{
 let s=start(initialState());const firstId=s.eventSerial;
 for(let i=0;i<90&&s.combat.active;i++)s=tick(s,100);
 assert.equal(s.victories,1);
 assert.equal(s.eventSerial,firstId+1);
 assert.equal(s.combat.lastEvent.id,s.eventSerial);
 assert.equal(tick(s,100),s);
 s=start(s);
 assert.equal(s.combat.lastEvent.id,firstId+2);
});
test('real elapsed time advances attack cooldowns across uneven frame durations',()=>{
 let s=start(initialState());
 s=tick(s,450);
 assert.equal(s.combat.enemy.attackCooldown.elapsed,450);
 s=tick(s,1600);
 assert.equal(s.combat.enemy.attackCooldown.elapsed,2050);
 assert.equal(s.combat.dittoAttackCooldown.elapsed,2050);
});
test('large frame gaps resolve attacks chronologically without double victory',()=>{
 let s=start(initialState());s=tick(s,4999);
 assert.ok(s.combat.active);
 s=tick(s,4999);
 assert.equal(s.victories,1);
 assert.equal(s.killCounts.rattata,1);
 assert.equal(tick(s,4999),s);
});
test('store subscriber receives action to distinguish frequent ticks',()=>{
 const store=createGameStore();const actions=[];
 store.subscribe((state,action)=>actions.push(action.type));
 store.dispatch({type:'SELECT_WILD',pokemonId:'rattata'});
 store.dispatch({type:'COMBAT_TICK',deltaMs:100});
 assert.deepEqual(actions,['SELECT_WILD','COMBAT_TICK']);
});
test('tick updates do not replace app, tabs, history or main HTML',()=>{
 assert.match(code,/action\?\.type === 'COMBAT_TICK' && state\.combat\.active/);
 assert.match(code,/updateCombatDisplay\(app,state\.combat\);\s*return/);
 assert.doesNotMatch(code,/lastLoggedEvent\s*=/);
 assert.match(code,/event\.id !== lastLoggedEventId/);
 assert.match(code,/performance\.now\(\)/);
});
test('combat display handles unmounted controls while other tabs are active',()=>{
 const root={querySelector:()=>null};
 assert.doesNotThrow(()=>updateCombatDisplay(root,start(initialState()).combat));
});
