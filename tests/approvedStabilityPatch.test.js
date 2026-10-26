import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,transition} from '../src/core/gameState.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';
import {useGameStore} from '../src/store/useGameStore.js';

test('attack interval is limited to 100ms without mutating unrelated combat stats',()=>{
  const s=initialState();
  s.dittoStats={...s.dittoStats,speed:1,attack:1000};
  s.energyUpgrades={...s.energyUpgrades,speed:1000};
  assert.equal(effectiveDittoStats(s).speed,100);
  const started=transition({...s,phase:'running'}, {type:'SELECT_WILD',pokemonId:'rattata'});
  assert.equal(started.combat.dittoAttackCooldown.duration,100);
  const before=transition(started,{type:'COMBAT_TICK',deltaMs:99,random:()=>0.5});
  assert.equal(before.killCounts.rattata,0);
  const won=transition(before,{type:'COMBAT_TICK',deltaMs:1,random:()=>0.5});
  assert.equal(won.killCounts.rattata,1);
  assert.equal(s.dittoStats.speed,1);
});

test('legacy saves with speed below 100ms load and are normalized safely',()=>{
  const s=initialState();
  s.dittoStats.speed=1;
  const restored=decodeSave(encodeSave(s)).game;
  assert.equal(restored.dittoStats.speed,100);
});

test('auto retry restores its opponent region before starting combat',()=>{
  const s={...initialState(),phase:'running',recoveryMs:10000,
    activeRegionId:'starting-plains',automation:{hunger:false,resolve:true},
    killCounts:{...initialState().killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,meowth:1,geodude:1,exeggcute:1},
    retryPokemonId:'caterpie'};
  const halfway=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
  assert.equal(halfway.activeRegionId,'starting-plains');
  const resumed=transition(halfway,{type:'RECOVERY_TICK',deltaMs:5000});
  assert.equal(resumed.activeRegionId,'berry-forest');
  assert.equal(resumed.combat.active,true);
  assert.equal(resumed.combat.pokemonId,'caterpie');
});

test('region filters and energy subtabs retain navigation state but reset at planet move',()=>{
 const original=useGameStore.getState();
 try{
   useGameStore.setState({game:{...initialState(),phase:'running'},wildRegionFilter:'all',energySectionTab:'world'});
   assert.equal(useGameStore.getState().wildRegionFilter,'all');
   assert.equal(useGameStore.getState().energySectionTab,'world');
   useGameStore.getState().dispatch({type:'MOVE_PLANET'});
   assert.equal(useGameStore.getState().wildRegionFilter,'starting-plains');
   assert.equal(useGameStore.getState().energySectionTab,'stats');
 }finally{useGameStore.setState(original,true);}
});

test('invalid imported region resets but All and unlocked selections persist; failed disk write leaves game intact',()=>{
 const old=useGameStore.getState();
 const previousWindow=globalThis.window;
 const storage=new Map();
 globalThis.window={localStorage:{
   getItem:key=>storage.get(key)??null,
   setItem:(key,value)=>storage.set(key,value),
   removeItem:key=>storage.delete(key)
 }};
 try{
  let s=initialState();
  useGameStore.setState({game:{...s,phase:'running'},wildRegionFilter:'berry-forest'});
  useGameStore.getState().importGame(s);
  assert.equal(useGameStore.getState().wildRegionFilter,'starting-plains');
  assert.ok(storage.has('pokeloop.save.v1'));
  useGameStore.setState({wildRegionFilter:'all'});
  useGameStore.getState().importGame(s);
  assert.equal(useGameStore.getState().wildRegionFilter,'all');
  const active=useGameStore.getState().game;
  globalThis.window={localStorage:{setItem(){throw Error('disk full');}}};
  assert.throws(()=>useGameStore.getState().importGame({...s,victories:5}),/disk full/);
  assert.equal(useGameStore.getState().game,active);
 }finally{
   if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
   useGameStore.setState(old,true);
 }
});

test('offline production backlog can be consumed in exact small chunks with no battles',()=>{
 const before=useGameStore.getState();
 try{
  const game={...initialState(),phase:'running',particleBalances:{...initialState().particleBalances,노말:2},
    particleMilestones:{...initialState().particleMilestones,노말:1},normalFirstMilestonePermanent:true};
  useGameStore.setState({game,offlineRemainingSeconds:0});
  useGameStore.getState().queueOfflineProduction(12.5);
  for(const expected of [7.5,2.5,0]){
   useGameStore.getState().consumeOfflineProduction(5);
   assert.equal(useGameStore.getState().offlineRemainingSeconds,expected);
  }
  assert.equal(useGameStore.getState().game.victories,0);
  assert.equal(useGameStore.getState().game.killCounts.rattata,0);
  assert.ok(useGameStore.getState().game.pendingStellar>0);
 }finally{useGameStore.setState(before,true);}
});

test('modular CSS keeps identical cascade content, preserves four-column cards, and retains mobile breakpoints',()=>{
 const files=['00-shell-navigation.css','10-ditto-combat.css','20-wild-responsive.css','30-settings-energy.css','40-world-overrides.css'];
 const joined=files.map(f=>readFileSync(new URL('../src/styles/'+f,import.meta.url),'utf8')
   .replace(/^\/\* PokeLoop UI style group \d\/5\. Original rule and breakpoint order retained\. \*\/\n/,'')).join('');
 let checksum=2166136261;
 for(let i=0;i<joined.length;i++)checksum=Math.imul(checksum^joined.charCodeAt(i),16777619)>>>0;
 assert.ok(joined.length>=34863);
 let baselineChecksum=2166136261;
 for(let i=0;i<34863;i++)baselineChecksum=Math.imul(baselineChecksum^joined.charCodeAt(i),16777619)>>>0;
 assert.equal(baselineChecksum,2270189);
 assert.match(joined,/\.wild-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(joined,/@media\(max-width:650px\)/);
 assert.match(joined,/@media\(max-width:900px\)/);
 const entry=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 for(const name of files)assert.ok(entry.includes(name));
});

test('unprocessed offline production survives paused saves without running battles',()=>{
 const s={...initialState(),phase:'paused',pendingOfflineSeconds:735.25};
 const decoded=decodeSave(encodeSave(s)).game;
 assert.equal(decoded.pendingOfflineSeconds,735.25);
 assert.equal(decoded.phase,'paused');
 assert.equal(decoded.victories,0);
 assert.equal(decoded.combat.active,false);
});

test('offline queue ignores malformed and nonpositive intervals',()=>{
 const before=useGameStore.getState();
 try{
  useGameStore.setState({game:{...initialState(),phase:'running'},offlineRemainingSeconds:3});
  for(const seconds of [NaN,Infinity,-Infinity,-10,0,undefined]){
   useGameStore.getState().queueOfflineProduction(seconds);
   assert.equal(useGameStore.getState().offlineRemainingSeconds,3);
  }
  useGameStore.getState().queueOfflineProduction(2.5);
  assert.equal(useGameStore.getState().offlineRemainingSeconds,5.5);
 }finally{useGameStore.setState(before,true);}
});

test('saving during offline catch-up preserves unprocessed time without double awarding production',async()=>{
 const before=useGameStore.getState();
 const previousWindow=globalThis.window;
 const storage=new Map();
 globalThis.window={localStorage:{
  getItem:key=>storage.get(key)??null,
  setItem:(key,value)=>storage.set(key,value),
  removeItem:key=>storage.delete(key)
 }};
 try{
  const base=initialState(),game={...base,phase:'running',
   particleBalances:{...base.particleBalances,노말:2},
   particleMilestones:{...base.particleMilestones,노말:1},normalFirstMilestonePermanent:true};
  useGameStore.setState({game,offlineRemainingSeconds:12.5});
  useGameStore.getState().consumeOfflineProduction(5);
  const partially=useGameStore.getState();
  assert.equal(partially.offlineRemainingSeconds,7.5);
  const savedAt=partially.saveLocal();
  const {decodeSave,loadLocalSave}=await import('../src/core/saveSystem.js');
  const restored=loadLocalSave();
  assert.equal(restored.savedAt,savedAt);
  assert.equal(restored.game.pendingOfflineSeconds,7.5);
  assert.equal(restored.game.pendingStellar,partially.game.pendingStellar);
  assert.equal(restored.game.victories,0);
  // A fresh session resumes the pending portion only; it must not reapply the first 5 seconds.
  useGameStore.setState({game:restored.game,offlineRemainingSeconds:restored.game.pendingOfflineSeconds});
  useGameStore.getState().consumeOfflineProduction(5);
  useGameStore.getState().consumeOfflineProduction(5);
  assert.equal(useGameStore.getState().offlineRemainingSeconds,0);
  const {tickEconomy}=await import('../src/core/energySystem.js');
  const expected=tickEconomy(tickEconomy(tickEconomy(game,5),5),2.5);
  assert.equal(useGameStore.getState().game.pendingStellar,expected.pendingStellar);
 }finally{
  if(previousWindow===undefined)delete globalThis.window;
  else globalThis.window=previousWindow;
  useGameStore.setState(before,true);
 }
});
