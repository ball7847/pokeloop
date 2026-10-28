import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';
import {buyStellarUpgrade,STELLAR_UPGRADES,stellarUpgradeCost,stellarUpgradeLevel,stellarBattleEnergyReward,stellarUncommonBonus} from '../src/core/stellarUpgrades.js';
import {movePlanet} from '../src/core/energySystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

test('Normal physical slots 1, 3, 5 retain SU011, SU012, SU013 identifiers',()=>{
 assert.deepEqual(Object.keys(STELLAR_UPGRADES.노말),['0','2','4']);
 assert.deepEqual(Object.values(STELLAR_UPGRADES.노말).map(x=>x.id),['SU011','SU012','SU013']);
});
test('SU012 baby doubles TOTAL effect without summing old levels',()=>{
 let s={...initialState(),phase:'running',stellar:111};
 for(const [level,cost,hp,atk] of [[1,1,20,2],[2,10,30,3],[3,100,50,5]]){
  assert.equal(stellarUpgradeCost(s,'SU012'),cost);
  s=transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU012'});
  assert.equal(stellarUpgradeLevel(s,'SU012'),level);
  assert.equal(effectiveDittoStats(s).hp,hp);
  assert.equal(effectiveDittoStats(s).attack,atk);
 }
 assert.equal(s.stellar,0);
 assert.equal(stellarUpgradeCost(s,'SU012'),null);
 assert.equal(transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU012'}),s);
});
test('SU011 Normal battle energy additive level growth and factor 10 costs',()=>{
 let s={...initialState(),phase:'running',stellar:110};
 assert.equal(stellarUpgradeCost(s,'SU011'),10);
 s=transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU011'});
 assert.equal(stellarUpgradeCost(s,'SU011'),100);
 s=transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU011'});
 assert.equal(stellarBattleEnergyReward(s,'노말',10),12);
 assert.equal(stellarBattleEnergyReward(s,'불꽃',10),10);
 assert.equal(s.stellar,0);
});
test('SU013 uncommon chance additive and factor 22 costs',()=>{
 let s={...initialState(),phase:'running',stellar:23};
 assert.equal(stellarUpgradeCost(s,'SU013'),1);
 s=transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU013'});
 assert.equal(stellarUpgradeCost(s,'SU013'),22);
 s=transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU013'});
 assert.equal(stellarUncommonBonus(s),0.02);
 assert.equal(stellarUpgradeCost(s,'SU013'),484);
 const after=transition(s,{type:'MOVE_PLANET',random:()=>0});
 assert.equal(after.uncommonChance,0.02);
 assert.equal(after.uncommonStarterId,'bulbasaur');
 assert.equal(after.berryRareAppeared,true);
});
test('uncommon roll does not force rare encounters if random misses',()=>{
 const s={...initialState(),phase:'running',permanentUpgrades:{SU013:1}};
 const next=transition(s,{type:'MOVE_PLANET',random:()=>0.5});
 assert.equal(next.uncommonChance,0.01);
 assert.equal(next.uncommonStarterId,null);
 assert.equal(next.berryRareAppeared,false);
});
test('stellar upgrades survive planet move and saved roundtrip',()=>{
 let s={...initialState(),phase:'running',stellar:11};
 s=transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU012'});
 s=transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU012'});
 s=movePlanet(s);
 assert.equal(s.permanentUpgrades.SU012,2);
 const loaded=decodeSave(encodeSave({...initialState(),...s})).game;
 assert.equal(loaded.permanentUpgrades.SU012,2);
 assert.equal(effectiveDittoStats(loaded).hp,30);
});
test('unaffordable, maxed, unknown and paused attempts are no-ops',()=>{
 const s={...initialState(),phase:'running'};
 assert.equal(buyStellarUpgrade(s,'SU011'),s);
 assert.equal(buyStellarUpgrade(s,'SU999'),s);
 assert.equal(transition({...s,stellar:10,phase:'paused'},{type:'BUY_STELLAR_UPGRADE',id:'SU011'}).stellar,10);
});
