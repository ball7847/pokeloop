import test from 'node:test';
import assert from 'node:assert/strict';
import {initialEconomy,grantBattleEssence,tickEconomy,movePlanet,LAYERS,TYPES,energyRates} from './energySystem.js';
import {initialState,transition} from './gameState.js';
import {encodeSave,decodeSave} from './saveSystem.js';

test('18 types belong to exactly one of the 10 fixed layers',()=>{
  assert.equal(LAYERS.length,10);assert.equal(TYPES.length,18);
  assert.deepEqual(LAYERS.flatMap(x=>x.types).sort(),[...TYPES].sort());
});
test('dual type rewards: unlocked essence and energy; locked types bank 100% without essence',()=>{
  let s=initialEconomy();
  s=grantBattleEssence(s,['노말','비행'],10);
  assert.equal(s.essences['노말'],10);
  assert.equal(s.energyBalances['노말'],10);
  assert.equal(s.essences['비행'],0);
  assert.equal(s.energyBank['비행'],10);
  assert.equal(s.energyEarned['비행'],0);
});
test('first milestone opens the second layer, preserves energy and releases its bank',()=>{
  let s=grantBattleEssence(initialEconomy(),['불꽃'],25);
  s=grantBattleEssence(s,['노말'],1025);
  assert.equal(s.unlockedLayer,2);
  assert.equal(s.energyMilestones['노말'],1);
  assert.equal(s.energyBank['불꽃'],0);
  assert.equal(s.energyBalances['불꽃'],25);
  assert.equal(s.essences['불꽃'],0);
});
test('layer outputs are split equally across recipient types',()=>{
  let s=initialEconomy();
  s.unlockedLayer=3;
  s.energyBalances['전기']=300;
  s.energyMilestones['전기']=1;
  const rates=energyRates(s);
  assert.equal(rates['불꽃'],100);
  assert.equal(rates['물'],100);
  assert.equal(rates['풀'],100);
});
test('stellar grows into pending and is claimed only on planet travel',()=>{
  let s=grantBattleEssence(initialEconomy(),['노말'],1025);
  s=tickEconomy(s,1);
  assert.ok(s.pendingStellar>0);
  assert.equal(s.stellar,0);
  const next=movePlanet(s);
  assert.equal(next.stellar,s.pendingStellar);
  assert.equal(next.pendingStellar,0);
  assert.equal(next.unlockedLayer,2);
  assert.equal(next.energyMilestones['노말'],1);
  assert.equal(next.essences['노말'],0);
  assert.equal(next.planetMoves,1);
});
test('save v3 round trip and planet travel preserve economy',()=>{
  let s=initialState();
  s=grantBattleEssence(s,['노말','비행'],1025);
  s=tickEconomy(s,1);
  const out=decodeSave(encodeSave(s)).game;
  assert.equal(out.unlockedLayer,2);
  assert.equal(out.energyBalances['노말'],s.energyBalances['노말']);
  assert.equal(out.energyBank['비행'],s.energyBank['비행']);
  assert.equal(out.pendingStellar,s.pendingStellar);
  const moved=transition(out,{type:'MOVE_PLANET'});
  assert.equal(moved.planetMoves,1);
  assert.equal(moved.phase,'running');
});

test('configured encounter essence payouts match species and sixth-slot starters',async()=>{
  const {WILD_POKEMON,UNCOMMON_STARTERS}=await import('./wildData.js');
  assert.deepEqual(WILD_POKEMON.map(p=>[p.id,p.essenceReward]),[
    ['rattata',1],['pidgey',2],['mankey',10],['spearow',3],['zubat',3]
  ]);
  assert.deepEqual(UNCOMMON_STARTERS.map(p=>p.essenceReward),[132,132,132]);
  const p=UNCOMMON_STARTERS[0];
  const s=grantBattleEssence(initialEconomy(),p.types,p.essenceReward);
  assert.equal(s.energyBank['풀'],132);
  assert.equal(s.energyBank['독'],132);
  assert.equal(s.essences['풀'],0);
});
