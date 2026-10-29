import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {stellarUncommonBonus,stellarUpgradeCost,STELLAR_UPGRADES} from '../src/core/stellarUpgrades.js';
import {appearedInRegion,REGION} from '../src/core/wildData.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

const move=(s,random=()=>.99)=>transition({...s,pendingStellar:1,phase:'running'}, {type:'MOVE_PLANET',random});
test('first planet remains at zero; second planet unlocks 5% and guarantees Psyduck',()=>{
 const start=initialState();
 assert.equal(start.uncommonChance,0);
 assert.equal(start.planetMoves,0);
 assert.equal(start.raritySlotResults,null);
 const second=move(start);
 assert.equal(second.planetMoves,1);
 assert.equal(second.uncommonChance,.05);
 assert.equal(second.raritySlotResults.W010302,'psyduck');
 assert.ok(appearedInRegion(second,REGION.id).some(p=>p.id==='psyduck'));
 assert.equal(second.raritySlotResults.W010602,null,'other uncommon slots still roll independently');
 assert.equal(second.raritySlotResults.W010802,null,'starter group is not guaranteed');
 const restored=decodeSave(encodeSave(second)).game;
 assert.equal(restored.raritySlotResults.W010302,'psyduck');
 assert.equal(restored.uncommonChance,.05);
});
test('third planet and onward Psyduck is random again, with permanent 5% base',()=>{
 const second=move(initialState());
 const third=move(second);
 assert.equal(third.planetMoves,2);
 assert.equal(third.uncommonChance,.05);
 assert.equal(third.raritySlotResults.W010302,null);
 const fourth=move(third,()=>0);
 assert.equal(fourth.planetMoves,3);
 assert.equal(fourth.raritySlotResults.W010302,'psyduck');
});
test('SU013 adds 1 percentage point per level, maximum 35 gives 40% total',()=>{
 assert.equal(STELLAR_UPGRADES.노말[4].maxLevel,35);
 for(const [level,total] of [[0,.05],[1,.06],[20,.25],[35,.4]]){
  const s={...initialState(),permanentUpgrades:{SU013:level}};
  assert.ok(Math.abs(stellarUncommonBonus(s)-level*.01)<1e-12);
  assert.ok(Math.abs(move(s).uncommonChance-total)<1e-12);
 }
 const maxed={...initialState(),permanentUpgrades:{SU013:35}};
 assert.equal(stellarUpgradeCost(maxed,'SU013'),null);
 assert.equal(transition({...maxed,phase:'running',stellar:100},{type:'BUY_STELLAR_UPGRADE',id:'SU013'}).permanentUpgrades.SU013,35);
});
test('second-planet forced Psyduck does not persist as a permanent guarantee',()=>{
 const second=move(initialState());
 assert.deepEqual(second.rarityGuarantees,[]);
 assert.equal(second.raritySlotResults.W010302,'psyduck');
 const third=move(second,()=>.99);
 assert.deepEqual(third.rarityGuarantees,[]);
 assert.equal(third.raritySlotResults.W010302,null);
});
