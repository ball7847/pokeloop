import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {battleEnergyRewards,getWildPokemon} from '../src/core/wildData.js';
import {eventMessage} from '../src/store/useGameStore.js';

function defeatEnemy(state,id){
  let s=transition(state,{type:'SELECT_WILD',pokemonId:id});
  assert.equal(s.combat.active,true);
  for(let i=0;i<100&&s.combat.active;i++)
    s=transition(s,{type:'COMBAT_TICK',deltaMs:500,random:()=>0.5});
  assert.equal(s.combat.active,false);
  assert.equal(s.combat.lastEvent.type,'victory');
  return s;
}

test('Mankey pays 3.5 Fighting energy first and 1.75 second, both in log',()=>{
  const p=getWildPokemon('mankey');
  assert.equal(p.energyReward,3.5);
  let s=transition(initialState(),{type:'START'});
  s={...s,dittoStats:{...s.dittoStats,hp:1000,attack:100,speed:100}};
  s=defeatEnemy(s,'mankey');
  assert.deepEqual(s.combat.lastEvent.energyRewards,{'격투':3.5});
  assert.match(eventMessage(s.combat.lastEvent),/^망키 1회 처치 · HP \+5\.6, 공격 \+2, 격투 에너지 \+2$/);
  assert.equal(s.energyBalances['격투'],5.25.5);
  s=defeatEnemy(s,'mankey');
  assert.deepEqual(s.combat.lastEvent.energyRewards,{'격투':1.75});
  assert.match(eventMessage(s.combat.lastEvent),/망키 2회 처치 .*격투 에너지 \+1/);
  assert.equal(s.energyBalances['격투'],3);
  assert.deepEqual(battleEnergyRewards(p,2),{'격투':3.5/3});
});

test('dual-type awards are logged separately and zero energy is omitted',()=>{
  let s=transition(initialState(),{type:'START'});
  s={...s,dittoStats:{...s.dittoStats,hp:1000,attack:100,speed:100}};
  s=defeatEnemy(s,'pidgey');
  assert.deepEqual(s.combat.lastEvent.energyRewards,{'노말':2,'비행':2});
  const log=eventMessage(s.combat.lastEvent);
  assert.match(log,/노말 에너지 \+2, 비행 에너지 \+2/);
  assert.equal(eventMessage({type:'victory',name:'테스트',count:1,rewards:{},energyRewards:{'노말':0}}),'테스트 1회 처치');
});
