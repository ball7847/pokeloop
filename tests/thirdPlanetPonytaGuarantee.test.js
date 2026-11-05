import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {appearedInRegion,REGION} from '../src/core/wildData.js';

const move=(state,random)=>transition({...state,pendingStellar:1},{type:'MOVE_PLANET',random});
const ids=state=>appearedInRegion(state,REGION.id).map(p=>p.id);

test('second planet guarantees Psyduck, third guarantees Ponyta only',()=>{
 let state=transition(initialState(),{type:'START'});
 assert.equal(ids(state).includes('psyduck'),false);
 assert.equal(ids(state).includes('ponyta'),false);
 state=move(state,()=>.99);
 assert.equal(state.planetMoves,1);
 assert.equal(ids(state).includes('psyduck'),true);
 assert.equal(ids(state).includes('ponyta'),false);
 state=move(state,()=>.99);
 assert.equal(state.planetMoves,2);
 assert.equal(ids(state).includes('ponyta'),true);
 assert.equal(ids(state).includes('psyduck'),false);
 state=move(state,()=>.99);
 assert.equal(state.planetMoves,3);
 assert.equal(ids(state).includes('ponyta'),false);
 assert.equal(ids(state).includes('psyduck'),false);
});

test('third-planet guarantee does not disable other independent uncommon rolls',()=>{
 let state=transition(initialState(),{type:'START'});
 state=move(state,()=>.99);
 state=move(state,()=>0);
 assert.equal(state.planetMoves,2);
 assert.equal(ids(state).includes('ponyta'),true);
 assert.equal(ids(state).includes('psyduck'),true);
 assert.equal(ids(state).includes('ekans'),true);
 assert.equal(ids(state).includes('rookidee'),true);
 assert.equal(ids(state).includes('zigzagoon'),true);
 assert.equal(ids(state).includes('zigzagoon-galar'),false);
});

test('existing explicit rarity guarantees are preserved on third planet',()=>{
 let state=transition(initialState(),{type:'START'});
 state={...state,rarityGuarantees:['ekans']};
 state=move(state,()=>.99);
 state=move(state,()=>.99);
 assert.equal(ids(state).includes('ponyta'),true);
 assert.equal(ids(state).includes('ekans'),true);
 assert.equal(ids(state).includes('psyduck'),false);
});
