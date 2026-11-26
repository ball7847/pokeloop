import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {startBattle,advanceBattle} from '../src/core/combatEngine.js';
import {unlockLayerForVictory,movePlanet} from '../src/core/energySystem.js';
import {upgradeCosts,upgradeCost} from '../src/core/shopSystem.js';
import {encodeSave,decodeSave} from '../src/core/saveCodec.js';
test('approved costs for all 17 upgrades',()=>{
 const costs={hp:{노말:1},attack:{노말:1},hpMultiplier:{노말:10,물:10},attackMultiplier:{노말:10,불꽃:10},antidote:{물:10,풀:10},regeneration:{노말:22,풀:22},speedFlat:{전기:10}};
 for(const id of ['specialAttack','defense','specialDefense','specialAttackMultiplier','defenseMultiplier','specialDefenseMultiplier','speed','poisonMultiplier','regenerationMultiplier','honeyMultiplier'])costs[id]={노말:999999};
 for(const [id,cost] of Object.entries(costs))assert.deepEqual(upgradeCosts(id,0),cost);
});
test('actual first victories unlock sequential layers before reward; save and planet carry',()=>{
 let s=initialState();
 s={...s,phase:'running',dittoStats:{...s.dittoStats,hp:100000,attack:100000,speed:100},killCounts:{...s.killCounts,...Object.fromEntries(['rattata','pidgey','mankey','spearow','zubat','meowth','geodude','exeggcute','sentret'].map(id=>[id,1]))}};
 assert.equal(unlockLayerForVictory(s,'pikachu',0),s);
 assert.equal(unlockLayerForVictory(s,'tauros',1),s);
 s=startBattle(s,'tauros');
 assert.equal(s.combat.active,true);
 s=advanceBattle(s,100,()=>0.5);
 assert.equal(s.killCounts.tauros,1);
 assert.equal(s.unlockedLayer,2);
 assert.equal(s.energyBalances.노말,49);
 s={...s,activeRegionId:'berry-forest',raritySlotResults:{...s.raritySlotResults,W020502:'pikachu'},killCounts:{...s.killCounts,caterpie:1,weedle:1,taillow:1,igglybuff:1}};
 s=startBattle(s,'pikachu');
 assert.equal(s.combat.active,true);
 assert.deepEqual(s.combat.enemy.energyRewards,{노말:250,전기:25});
 s=advanceBattle(s,100,()=>0.5);
 assert.equal(s.killCounts.pikachu,1);
 assert.equal(s.unlockedLayer,3);
 assert.equal(s.energyBalances.전기,25);
 assert.equal(s.energyBalances.노말,299);
 assert.equal(unlockLayerForVictory(s,'pikachu',1),s);
 assert.equal(unlockLayerForVictory(s,'tauros',0),s);
 assert.equal(decodeSave(encodeSave(s)).game.unlockedLayer,3);
 assert.equal(movePlanet({...s,pendingStellar:1}).unlockedLayer,3);
});

 test('approved amplifier and flat recovery cost growth',()=>{
 for(const id of ['hpMultiplier','attackMultiplier']){assert.equal(upgradeCost(id,1),18);assert.equal(upgradeCost(id,2),32.4);}
 assert.deepEqual(upgradeCosts('regeneration',1),{노말:33,풀:33});
 assert.deepEqual(upgradeCosts('regenerationMultiplier',1),{노말:1799998.2});
 });
