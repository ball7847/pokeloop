import test from 'node:test';
import assert from 'node:assert/strict';
import {initialEconomy,grantBattleEnergy,purchaseWithEnergy,tickEconomy,movePlanet,
  LAYERS,TYPES,particleRates} from './energySystem.js';
import {initialState,transition} from './gameState.js';
import {encodeSave,decodeSave} from './saveSystem.js';

test('18 types are assigned once across the 10 fixed layers',()=>{
  assert.equal(LAYERS.length,10);
  assert.equal(TYPES.length,18);
  assert.deepEqual(LAYERS.flatMap(l=>l.types).sort(),[...TYPES].sort());
});

test('battle rewards give energy to both types even if their layer is locked; no particles',()=>{
  const s=grantBattleEnergy(initialEconomy(),['노말','비행'],10);
  assert.equal(s.energyBalances['노말'],10);
  assert.equal(s.energyBalances['비행'],10);
  assert.equal(s.particleBalances['노말'],0);
  assert.equal(s.particleBank['비행'],0);
  assert.equal(s.unlockedLayer,1);
});

test('spending 1 energy creates 1 particle of that type and cannot overspend',()=>{
  let s=grantBattleEnergy(initialEconomy(),['노말','비행'],20);
  const before=s;
  s=purchaseWithEnergy(s,{노말:5,비행:7});
  assert.equal(s.energyBalances['노말'],15);
  assert.equal(s.energyBalances['비행'],13);
  assert.equal(s.particleBalances['노말'],5);
  assert.equal(s.particleEarned['노말'],5);
  assert.equal(s.particleBalances['비행'],0);
  assert.equal(s.particleBank['비행'],7);
  assert.equal(s.particleEarned['비행'],0);
  assert.deepEqual(purchaseWithEnergy(s,{노말:16}),s);
  assert.deepEqual(purchaseWithEnergy(s,{노말:1,불꽃:1}),s);
  assert.deepEqual(purchaseWithEnergy(s,{노말:-2}),s);
  assert.deepEqual(purchaseWithEnergy(s,{bad:2}),s);
  assert.equal(before.energyBalances['노말'],20);
});

test('particle accumulation, not energy accumulation, unlocks layer 2',()=>{
  let s=grantBattleEnergy(initialEconomy(),['노말','불꽃'],1025);
  assert.equal(s.unlockedLayer,1);
  s=purchaseWithEnergy(s,{불꽃:25});
  assert.equal(s.particleBank['불꽃'],25);
  s=purchaseWithEnergy(s,{노말:1025});
  assert.equal(s.unlockedLayer,2);
  assert.equal(s.particleMilestones['노말'],1);
  assert.equal(s.particleBank['불꽃'],0);
  assert.equal(s.particleBalances['불꽃'],25);
  assert.equal(s.particleEarned['불꽃'],25);
  assert.equal(s.energyBalances['불꽃'],1000);
});

test('upper layer particles produce lower layer particles with even splitting',()=>{
  const s=initialEconomy();
  s.unlockedLayer=3;
  s.particleBalances['전기']=300;
  s.particleMilestones['전기']=1;
  const rates=particleRates(s);
  assert.equal(rates['불꽃'],100);
  assert.equal(rates['물'],100);
  assert.equal(rates['풀'],100);
});

test('normal particles accumulate pending stellar, only travel converts to stellar energy',()=>{
  let s=grantBattleEnergy(initialEconomy(),['노말'],1025);
  s=purchaseWithEnergy(s,{노말:1025});
  s=tickEconomy(s,1);
  assert.ok(Number(s.pendingStellar)>0);
  assert.equal(s.stellar,0);
  const moved=movePlanet(s);
  assert.equal(moved.stellar,s.pendingStellar);
  assert.equal(moved.pendingStellar,0);
  assert.equal(moved.unlockedLayer,2);
  assert.equal(moved.particleMilestones['노말'],1);
  assert.equal(moved.energyBalances['노말'],0);
  assert.equal(moved.planetMoves,1);
});

test('v4 saved energy and particles restore independently',()=>{
  let s=initialState();
  s=grantBattleEnergy(s,['노말','비행'],1025);
  s=purchaseWithEnergy(s,{노말:1025,비행:40});
  s=tickEconomy(s,1);
  const restored=decodeSave(encodeSave(s)).game;
  assert.equal(restored.unlockedLayer,2);
  assert.equal(restored.particleBalances['노말'],s.particleBalances['노말']);
  assert.equal(restored.energyBalances['비행'],985);
  assert.equal(restored.particleBank['비행'],40);
  assert.equal(restored.pendingStellar,s.pendingStellar);
  const moved=transition(restored,{type:'MOVE_PLANET'});
  assert.equal(moved.planetMoves,1);
});

test('legacy v3 preserves old essence as energy and old layer energy as particle',()=>{
  let old=initialState();
  old=grantBattleEnergy(old,['노말'],5);
  const encoded=encodeSave(old);
  const raw=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded),x=>x.charCodeAt(0))));
  raw.version=3;
  raw.game.essences={노말:17};
  raw.game.energyBalances={노말:32};
  raw.game.energyEarned={노말:32};
  raw.game.energyBank={비행:9};
  raw.game.energyMilestones={노말:0};
  raw.game.essenceUpgrades={};
  const v3=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(raw))));
  const migrated=decodeSave(v3).game;
  assert.equal(migrated.energyBalances['노말'],17);
  assert.equal(migrated.particleBalances['노말'],32);
  assert.equal(migrated.particleEarned['노말'],32);
  assert.equal(migrated.particleBank['비행'],9);
});

test('configured species payouts remain unchanged after renaming to energy',async()=>{
  const {WILD_POKEMON,UNCOMMON_STARTERS}=await import('./wildData.js');
  assert.deepEqual(WILD_POKEMON.map(p=>[p.id,p.energyReward]),[
    ['rattata',1],['pidgey',2],['mankey',10],['spearow',3],['zubat',3]
  ]);
  assert.deepEqual(UNCOMMON_STARTERS.map(p=>p.energyReward),[132,132,132]);
});
