import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {UPGRADE_BY_ID,upgradeCosts,effectiveDittoStats,effectiveEnemySpeed} from '../src/core/shopSystem.js';
import {auditTypeEnergy} from '../scripts/auditTypeEnergy.mjs';
import {getWildPokemon,getKillLimit} from '../src/core/wildData.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

test('hybrid economy supply audit distinguishes guaranteed common and optional species',()=>{
 const {byType,rows}=auditTypeEnergy();
 assert.equal(byType.length,18);
 assert.equal(rows.length>50,true);
 const flying=byType.find(x=>x.type==='비행');
 const dark=byType.find(x=>x.type==='악');
 assert.equal(rows.find(x=>x.id==='bombirdier').first.비행,undefined,'unassigned Bombirdier energy remains unset');
 assert.ok(flying.possibleFirstSupply>=flying.guaranteedFirstSupply);
 assert.ok(dark.possibleMaxSupply>=dark.guaranteedMaxSupply);
 assert.equal(rows.find(x=>x.id==='wishiwashi-school').limit,1);
 assert.equal(rows.find(x=>x.id==='wishiwashi-school').maximum.물,620);
 assert.equal(getKillLimit(getWildPokemon('feebas')),1);
});

test('later-layer sinks spend only their own type and make exactly that many particles',()=>{
 const cases=[['iceSlow','얼음',8,80],['ghostDodge','고스트',8,100],['dragonPower','드래곤',9,400]];
 for(const [id,type,layer,cost] of cases){
  const initial=initialState();
  const funded={...initial,phase:'running',unlockedLayer:layer,
   energyBalances:{...initial.energyBalances,[type]:10000}};
  const denied=transition({...funded,unlockedLayer:layer-1},{type:'BUY_UPGRADE',id});
  assert.equal(denied.energyUpgrades[id],undefined);
  const purchased=transition(funded,{type:'BUY_UPGRADE',id});
  assert.equal(purchased.energyUpgrades[id],1,id);
  assert.equal(purchased.energyBalances[type],10000-cost);
  assert.equal(purchased.particleEarned[type],cost);
  assert.equal(purchased.particleBalances[type],cost);
  assert.equal(UPGRADE_BY_ID[id].unlockLayer,layer);
  assert.deepEqual(upgradeCosts(id,0),{[type]:cost});
  assert.equal(decodeSave(encodeSave(purchased)).game.energyUpgrades[id],1);
 }
});

test('new upgrades apply bounded dodge and attack multipliers; enemy slow does not reduce base speed',()=>{
 let s=initialState();
 s={...s,energyUpgrades:{ghostDodge:200,dragonPower:3,iceSlow:250}};
 const p=effectiveDittoStats(s);
 assert.equal(p.dodge,80);
 assert.equal(p.attack,1.06);
 assert.equal(p.specialAttack,0);
 assert.equal(effectiveEnemySpeed(s,1500),3000);
 assert.equal(effectiveEnemySpeed(initialState(),1500),1500);
 s={...s,dittoStats:{...s.dittoStats,dodge:90,specialAttack:100}};
 assert.equal(effectiveDittoStats(s).dodge,90);
 assert.equal(effectiveDittoStats(s).specialAttack,106);
});
