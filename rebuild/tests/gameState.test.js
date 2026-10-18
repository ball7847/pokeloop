import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, transition, PHASE, createGameStore } from '../src/core/gameState.js';
test('start pause resume reset', () => {
 let s = initialState();
 s = transition(s,{type:'START'}); assert.equal(s.phase,PHASE.RUNNING);
 s = transition(s,{type:'PAUSE'}); assert.equal(s.phase,PHASE.PAUSED);
 s = transition(s,{type:'RESUME'}); assert.equal(s.phase,PHASE.RUNNING);
 s = transition(s,{type:'RESET'}); assert.equal(s.phase,PHASE.READY); assert.equal(s.floor,1);
});
test('duplicate encounter completion does not double-count', () => {
 let s = transition(initialState(),{type:'START'});
 s = transition(s,{type:'ENCOUNTER_WON',encounterIndex:0});
 s = transition(s,{type:'ENCOUNTER_WON',encounterIndex:0});
 assert.equal(s.victories,1); assert.equal(s.encounterIndex,1);
});
test('won event rejected when paused',()=>{
 let s = transition(transition(initialState(),{type:'START'}),{type:'PAUSE'});
 assert.equal(transition(s,{type:'ENCOUNTER_WON',encounterIndex:0}),s);
});
test('store publishes state changes',()=>{
 const store=createGameStore();let calls=0;const stop=store.subscribe(()=>calls++);
 store.dispatch({type:'START'});store.dispatch({type:'START'});stop();store.dispatch({type:'PAUSE'});
 assert.equal(calls,1);
});
