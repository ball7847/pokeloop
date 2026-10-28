import test from 'node:test';
import assert from 'node:assert/strict';
import {AUTOMATIONS} from '../src/core/shopSystem.js';
import {POINT_CIRCULATION} from '../src/core/energySystem.js';
import {initialState,transition} from '../src/core/gameState.js';
import {decodeSave,encodeSave} from '../src/core/saveSystem.js';

test('abilities have stable AB codes and retain internal ids, costs and effects',()=>{
 assert.deepEqual(AUTOMATIONS.map(({abilityId,name,id,cost})=>({abilityId,name,id,cost})),[
  {abilityId:'AB01',name:'먹보',id:'hunger',cost:1},
  {abilityId:'AB02',name:'불굴의마음',id:'resolve',cost:5}
 ]);
 assert.equal(POINT_CIRCULATION.abilityId,'AB03');
 assert.equal(POINT_CIRCULATION.name,'슬로스타트');
 assert.equal(POINT_CIRCULATION.id,'point');
 assert.deepEqual(POINT_CIRCULATION.costs,{노말:10,벌레:10,비행:10});
 assert.deepEqual(POINT_CIRCULATION.production,{노말:0.5});
});

test('legacy ability ownership and production persist under previous save keys',()=>{
 const state={...initialState(),phase:'running',qolUnlocks:['hunger','resolve'],automation:{hunger:true,resolve:false},pointCirculationUnlocked:true};
 const saved=decodeSave(encodeSave(state)).game;
 assert.equal(saved.automation.hunger,true);
 assert.equal(saved.automation.resolve,false);
 assert.equal(saved.pointCirculationUnlocked,true);
 assert.deepEqual(saved.qolUnlocks,['hunger','resolve']);
});
