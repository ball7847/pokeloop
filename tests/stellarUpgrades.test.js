import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';
import {buyStellarUpgrade,STELLAR_UPGRADES,stellarUpgradeCost,stellarUpgradeLevel,stellarBattleEnergyReward,stellarUncommonBonus} from '../src/core/stellarUpgrades.js';
import {movePlanet} from '../src/core/energySystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

test('Normal physical slots 1, 3, 5 retain SU011, SU012, SU013 identifiers',()=>{
 assert.deepEqual(Object.keys(STELLAR_UPGRADES.노말),['0','2','4','6','7']);
 assert.deepEqual(Object.values(STELLAR_UPGRADES.노말).map(x=>x.id),['SU011','SU012','SU013','SU014','SU015']);
});
test('SU012 baby doubles TOTAL effect without summing old levels',()=>{
 let s={...initialState(),phase:'running',stellar:1301};
 for(const [level,cost,hp,atk] of [[1,1,20,2],[2,300,30,3],[3,1000,50,5]]){
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
test('SU011 Normal battle energy additive level growth and factor 100 costs',()=>{
 let s={...initialState(),phase:'running',stellar:1010};
 assert.equal(stellarUpgradeCost(s,'SU011'),10);
 s=transition(s,{type:'BUY_STELLAR_UPGRADE',id:'SU011'});
 assert.equal(stellarUpgradeCost(s,'SU011'),1000);
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
 let s={...initialState(),phase:'running',stellar:301};
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

test('legacy v12 permanent upgrades migrate without discarding ownership or breaking save',()=>{
 const original={...initialState(),phase:'running',permanentUpgrades:{SU011:1,SU012:1,SU013:1}};
 const source=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(original)),c=>c.charCodeAt(0))));
 source.version=12;
 const bytes=new TextEncoder().encode(JSON.stringify(source));
 const encoded=btoa(String.fromCharCode(...bytes));
 const decoded=decodeSave(encoded).game;
 assert.deepEqual(decoded.permanentUpgrades,{SU011:1,SU012:1});
 assert.equal(effectiveDittoStats(decoded).hp,20);
 assert.equal(effectiveDittoStats(decoded).attack,2);
 assert.equal(stellarBattleEnergyReward(decoded,'노말',10),11);
 assert.equal(decodeSave(encodeSave(decoded)).game.permanentUpgrades.SU012,1);
});

test('SU014 and SU015 apply independently after additive flat rewards including SU012',()=>{
 const s={...initialState(),permanentUpgrades:{SU012:2,SU014:3,SU015:2},energyUpgrades:{hp:5,hpMultiplier:5,attack:3,attackMultiplier:5},dittoStats:{...initialState().dittoStats,hp:100,attack:50}};
 assert.equal(effectiveDittoStats(s).hp, (100+20+20)*1.20*1.30);
 assert.equal(effectiveDittoStats(s).attack,(50+3+2)*1.20*1.16);
});
test('SU014/SU015 costs and maximum levels are enforced',()=>{
 const s=initialState();
 assert.equal(stellarUpgradeCost(s,'SU014'),100);
 assert.equal(stellarUpgradeCost({...s,permanentUpgrades:{SU014:1}},'SU014'),250);
 assert.equal(stellarUpgradeCost({...s,permanentUpgrades:{SU014:2}},'SU014'),625);
 assert.equal(stellarUpgradeCost({...s,permanentUpgrades:{SU014:3}},'SU014'),1562.5);
 assert.equal(stellarUpgradeCost(s,'SU015'),133);
 assert.equal(stellarUpgradeCost({...s,permanentUpgrades:{SU015:1}},'SU015'),399);
 assert.equal(stellarUpgradeCost({...s,permanentUpgrades:{SU015:2}},'SU015'),1197);
 assert.equal(stellarUpgradeCost({...s,permanentUpgrades:{SU014:1000}},'SU014'),null);
 assert.equal(stellarUpgradeCost({...s,permanentUpgrades:{SU015:1250}},'SU015'),null);
 const loaded=decodeSave(encodeSave({...s,permanentUpgrades:{SU014:3,SU015:4}})).game;
 assert.equal(loaded.permanentUpgrades.SU014,3);
 assert.equal(loaded.permanentUpgrades.SU015,4);
});
