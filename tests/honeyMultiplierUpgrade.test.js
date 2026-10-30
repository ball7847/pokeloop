import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {UPGRADES,upgradeCosts,effectiveDittoStats,DEFAULT_AUTO_BUY_SELECTION} from '../src/core/shopSystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

test('honey multiplier is a standard bug-energy upgrade with 1.5 cost growth',()=>{
 const item=UPGRADES.find(x=>x.id==='honeyMultiplier');
 assert.deepEqual({name:item.name,type:item.type,base:item.base,growth:item.growth,bonus:item.bonus,unit:item.unit,stat:item.stat},
 {name:'꿀 증폭',type:'벌레',base:40,growth:1.5,bonus:.05,unit:'percent',stat:'꿀'});
 assert.deepEqual([0,1,2,3,4].map(level=>upgradeCosts('honeyMultiplier',level)['벌레']),[40,60,90,135,202.5]);
 assert.equal(DEFAULT_AUTO_BUY_SELECTION.honeyMultiplier,true);
});
test('honey upgrade increases effective honey additively per level without changing base honey',()=>{
 const s=initialState();
 const base={...s,dittoStats:{...s.dittoStats,honey:100}};
 assert.equal(effectiveDittoStats(base).honey,100);
 assert.equal(effectiveDittoStats({...base,energyUpgrades:{honeyMultiplier:1}}).honey,105);
 assert.equal(effectiveDittoStats({...base,energyUpgrades:{honeyMultiplier:10}}).honey,150);
 assert.equal(effectiveDittoStats({...s,energyUpgrades:{honeyMultiplier:10}}).honey,0);
});
test('purchase spends bug energy, preserves game state and survives save roundtrip',()=>{
 let s={...initialState(),phase:'running',energyBalances:{...initialState().energyBalances,벌레:100},dittoStats:{...initialState().dittoStats,honey:100}};
 s=transition(s,{type:'BUY_UPGRADE',id:'honeyMultiplier'});
 assert.equal(s.energyBalances['벌레'],60);
 assert.equal(s.energyUpgrades.honeyMultiplier,1);
 assert.equal(s.dittoStats.honey,100);
 assert.equal(effectiveDittoStats(s).honey,105);
 assert.equal(decodeSave(encodeSave(s)).game.energyUpgrades.honeyMultiplier,1);
 s=transition(s,{type:'BUY_UPGRADE',id:'honeyMultiplier'});
 assert.equal(s.energyBalances['벌레'],0);
 assert.equal(s.energyUpgrades.honeyMultiplier,2);
 assert.ok(Math.abs(effectiveDittoStats(s).honey-110)<1e-9);
});
