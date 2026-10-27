import test from 'node:test';
import assert from 'node:assert/strict';
import {initialEconomy,grantBattleEnergy,purchaseWithEnergy,tickEconomy,movePlanet,
  LAYERS,TYPES,particleRates} from '../src/core/energySystem.js';
import {initialState,transition} from '../src/core/gameState.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

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

test('configured species payouts include the Mankey balance adjustment',async()=>{
  const {WILD_POKEMON,UNCOMMON_STARTERS}=await import('../src/core/wildData.js');
  assert.deepEqual(WILD_POKEMON.map(p=>[p.id,p.energyReward]),[
    ['rattata',1],['pidgey',2],['mankey',2],['spearow',3],['zubat',3],['meowth',10],['geodude',1],['exeggcute',1],['sentret',15],['tauros',49]
  ]);
  assert.deepEqual(UNCOMMON_STARTERS.map(p=>p.energyReward),[132,132,132]);
});

test('energy uses the same 1/(1+previous kills) decay as stat rewards',async()=>{
  const {getWildPokemon,scaledReward}=await import('../src/core/wildData.js');
  for(const [id,base] of [['rattata',1],['pidgey',2],['mankey',2],
    ['spearow',3],['zubat',3],['bulbasaur',132],['charmander',132],['squirtle',132]]){
    const pokemon=getWildPokemon(id);
    assert.equal(pokemon.energyReward,base);
    assert.equal(scaledReward('energy',base,0),base);
    assert.equal(scaledReward('energy',base,1),base/2);
    assert.equal(scaledReward('energy',base,9),base/10);
  }
});

test('actual repeated battles grant decaying type energy, not fixed payouts',()=>{
  let state=initialState();
  state={...state,dittoStats:{...state.dittoStats,attack:10000,speed:1}};
  let expected=0;
  for(let killed=0;killed<10;killed++){
    state=transition(state,{type:'SELECT_WILD',pokemonId:'rattata'});
    assert.equal(state.combat.active,true);
    state=transition(state,{type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
    assert.equal(state.killCounts.rattata,killed+1);
    expected+=1/(killed+1);
    assert.ok(Math.abs(Number(state.energyBalances['노말'])-expected)<1e-8);
  }
  assert.equal(state.particleBalances['노말'],0);
  assert.equal(transition(state,{type:'SELECT_WILD',pokemonId:'rattata'}),state);
});


test('point circulation purchase is atomic, one-time, and banks locked type particles',()=>{
 let s={...initialState(),phase:'running',energyBalances:{...initialState().energyBalances,노말:10,벌레:10,비행:9}};
 assert.equal(transition(s,{type:'BUY_CIRCULATION',id:'point'}),s);
 assert.equal(s.particleBalances.노말,0);
 s={...s,energyBalances:{...s.energyBalances,비행:10}};
 const purchased=transition(s,{type:'BUY_CIRCULATION',id:'point'});
 assert.equal(purchased.pointCirculationUnlocked,true);
 for(const type of ['노말','벌레','비행'])assert.equal(purchased.energyBalances[type],0);
 assert.equal(purchased.particleBalances.노말,10);
 assert.equal(purchased.particleEarned.노말,10);
 assert.equal(purchased.particleBank.벌레,10);
 assert.equal(purchased.particleBank.비행,10);
 assert.equal(purchased.particleEarned.벌레,0);
 assert.equal(transition(purchased,{type:'BUY_CIRCULATION',id:'point'}),purchased);
 assert.equal(transition({...s,phase:'paused'},{type:'BUY_CIRCULATION',id:'point'}).pointCirculationUnlocked,false);
});
test('point circulation produces 0.5 normal energy per second without battle or first milestone',()=>{
 let s={...initialState(),phase:'running',pointCirculationUnlocked:true};
 s=transition(s,{type:'ECONOMY_TICK',deltaMs:1000});
 assert.equal(s.energyBalances.노말,0.5);
 assert.equal(s.unlockedLayer,1);
 assert.equal(s.particleBalances.노말,0);
 s=tickEconomy(s,5);
 assert.equal(s.energyBalances.노말,3);
 assert.equal(s.particleBalances.노말,0);
 const paused=transition({...s,phase:'paused'},{type:'ECONOMY_TICK',deltaMs:1000});
 assert.equal(paused.energyBalances.노말,3);
 assert.equal(tickEconomy(initialState(),1).energyBalances.노말,0);
});
test('point circulation survives save, old saves default off, planet move clears it',()=>{
 let s={...initialState(),phase:'running',pointCirculationUnlocked:true};
 const restored=decodeSave(encodeSave(s)).game;
 assert.equal(restored.pointCirculationUnlocked,true);
 const raw=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(s)),c=>c.charCodeAt(0))));
 raw.version=10;
 delete raw.game.pointCirculationUnlocked;
 const oldEncoded=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(raw))));
 assert.equal(decodeSave(oldEncoded).game.pointCirculationUnlocked,false);
 raw.version=11;
 const missing=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(raw))));
 assert.throws(()=>decodeSave(missing),/순환/);
 assert.equal(transition(restored,{type:'MOVE_PLANET'}).pointCirculationUnlocked,false);
});


test('stellar conversion yields 1 per second per 1000 normal particles before softcap',()=>{
 const s=initialEconomy();
 s.unlockedLayer=2;
 s.particleMilestones.노말=1;
 s.particleBalances.노말=1000;
 const next=tickEconomy(s,1);
 assert.ok(Math.abs(next.pendingStellar-1)<1e-9);
 assert.equal(next.stellar,0);
});
test('first stellar softcap starts at 100 pending, then quarters at 200',()=>{
 const s=initialEconomy();
 s.unlockedLayer=2;
 s.particleMilestones.노말=1;
 s.particleBalances.노말=1000;
 for(const [pending,expected] of [[0,1],[99,1],[100,0.5],[200,0.25]]){
   const next=tickEconomy({...s,pendingStellar:pending},1);
   assert.ok(Math.abs(next.pendingStellar-pending-expected)<1e-8,`pending ${pending}: ${next.pendingStellar}`);
 }
});
test('later planet moves retain lifetime stellar softcap baseline',()=>{
 const s=initialEconomy();
 s.unlockedLayer=2;
 s.particleMilestones.노말=1;
 s.particleBalances.노말=1000;
 s.planetMoves=1;
 s.totalStellarEarned=200;
 assert.ok(Math.abs(tickEconomy({...s,pendingStellar:100},1).pendingStellar-101)<1e-8);
 assert.ok(Math.abs(tickEconomy({...s,pendingStellar:200},1).pendingStellar-200.5)<1e-8);
});
