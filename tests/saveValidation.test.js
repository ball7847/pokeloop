import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/core/gameState.js';
import {encodeSave,decodeSave} from '../src/core/saveCodec.js';
import {saveProgressIssues} from '../src/core/saveValidation.js';
import {purchaseWithEnergy,tickEconomy} from '../src/core/energySystem.js';
const restore=s=>decodeSave(encodeSave(s)).game;
test('recover provable dex history and evolution without reroll or fabricated parent kill',()=>{
 const s=initialState();s.killCounts.metapod=2;s.dexLifetimeKills.metapod=1;
 const r=restore(s);
 assert.equal(r.dexLifetimeKills.metapod,2);
 assert.ok(r.dexDiscovered.includes('metapod'));
 assert.equal(r.evolutionResults.metapod,true);
 assert.equal(r.killCounts.caterpie,0);
 assert.ok(saveProgressIssues(r).includes('evolution-parent:metapod'));
 assert.deepEqual(restore(r).dexLifetimeKills,r.dexLifetimeKills);
});
test('preserve historical cap and conflicting slot history; restore unambiguous absent selection',()=>{
 const s=initialState();s.killCounts.magikarp=4;s.killCounts.psyduck=1;
 s.raritySlotResults={W010802:'charmander'};
 const r=restore(s);
 assert.equal(r.killCounts.magikarp,4);
 assert.ok(Object.values(r.raritySlotResults).includes('psyduck'));
 assert.equal(r.uncommonStarterId,'charmander');
 assert.ok(saveProgressIssues(r).includes('historical-kill-cap:magikarp'));
});
test('repair ledger lower bounds and earned milestones without deleting old locked balances',()=>{
 const s=initialState();s.particleBalances.노말='1e11';s.energyBalances.물=9;
 s.particleBalances.물=3;s.stellar=10;s.totalStellarEarned=2;
 const r=restore(s);
 assert.equal(Number(r.particleEarned.노말),1e11);
 assert.equal(r.particleMilestones.노말,3);
 assert.equal(r.normalFirstMilestonePermanent,true);
 assert.equal(r.totalStellarEarned,10);
 assert.equal(r.energyBalances.물,9);
 assert.equal(r.particleEarned.물,3);
 assert.equal(r.particleMilestones.물,0);
 assert.equal(purchaseWithEnergy(r,{물:1}),r);
 assert.equal(tickEconomy(r,1).particleBalances.물,3);
 assert.ok(saveProgressIssues(r).includes('locked-currency:물'));
});
test('preserve historical milestones and permanent normal milestone after planet reset',()=>{
 const s=initialState();s.normalFirstMilestonePermanent=true;
 const r=restore(s);assert.equal(r.particleMilestones.노말,1);
 assert.equal(r.particleEarned.노말,0);
 const old=initialState();old.particleMilestones.노말=3;
 assert.equal(restore(old).particleMilestones.노말,3);
});
test('malformed encounter containers produce controlled validation errors',()=>{
 for(const value of [123,'bad',{}]){
  const s=initialState();s.rarityGuarantees=value;
  assert.throws(()=>restore(s),/희귀도 출현 옵션/);
 }
 const s=initialState();s.raritySlotResults=[];
 assert.throws(()=>restore(s),/희귀도 슬롯 판정/);
});
