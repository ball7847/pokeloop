import test from 'node:test';
import assert from 'node:assert/strict';
import {createEncounterSlots,effectiveSlotChance,rollEncounterSlots,RARITY_MAX_TARGETS} from '../src/core/raritySystem.js';
import {initialState,transition} from '../src/core/gameState.js';
import {STELLAR_UPGRADES} from '../src/core/stellarUpgrades.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';
import {appearedInRegion,ENCOUNTER_SLOTS,STARTER_IDS,REGION,BERRY_REGION} from '../src/core/wildData.js';

const defs=[
 {id:'a',encounterCode:'W010102-01',rarity:'uncommon'},
 {id:'b',encounterCode:'W010102-02',rarity:'uncommon'},
 {id:'c',encounterCode:'W010202',rarity:'uncommon'},
 {id:'d',encounterCode:'W010302',rarity:'uncommon'},
 {id:'e',encounterCode:'W010403',rarity:'rare'},
 {id:'f',encounterCode:'W010506',rarity:'transcendent'}
];
test('group by encounter code, each slot rolls independently, then picks one of N candidates',()=>{
 const slots=createEncounterSlots(defs);
 assert.equal(slots.length,5);
 assert.deepEqual(slots[0].candidates,['a','b']);
 const samples=[.2,.8,.1,.9,.1,.9];
 let consumed=0;
 const results=rollEncounterSlots(slots,{chances:{uncommon:.6,rare:.3},random:()=>samples[consumed++]});
 assert.equal(results.W010102,'b');
 assert.equal(results.W010202,'c');
 assert.equal(results.W010302,null);
 assert.equal(results.W010403,'e');
 assert.equal(results.W010506,null);
 assert.equal(consumed,5);
});
test('original rarity decay uses position after last permanently unlocked slot',()=>{
 const slots=createEncounterSlots(defs);
 const u=slots.filter(s=>s.rarity==='uncommon');
 assert.equal(effectiveSlotChance(u[0],.6,0,-1),.6);
 assert.ok(Math.abs(effectiveSlotChance(u[2],.6,2,0)-.6/1.1)<1e-12);
 assert.ok(Math.abs(effectiveSlotChance(u[2],.6,2,-1)-.6/1.1**2)<1e-12);
});
test('guarantee, exclusion and conditional transcendent appearance preserve slot exclusivity',()=>{
 const slots=createEncounterSlots(defs);
 const out=rollEncounterSlots(slots,{chances:{uncommon:0,rare:0},guaranteed:['b'],banished:['a','e'],special:['f'],random:()=>.1});
 assert.equal(out.W010102,'b');
 assert.equal(out.W010403,null);
 assert.equal(out.W010506,'f');
 const blocked=rollEncounterSlots(slots,{chances:{uncommon:0},guaranteed:['b'],banished:['W010102'],special:['f'],random:()=>.2});
 assert.equal(blocked.W010102,null);
});
test('SU013 cap and long-term target probabilities',()=>{
 assert.deepEqual(RARITY_MAX_TARGETS,{uncommon:.60,rare:.30,legendary:.15,divine:.075});
 assert.equal(initialState().uncommonChance,0);
 assert.equal(STELLAR_UPGRADES.노말[4].maxLevel,35);
 assert.equal(ENCOUNTER_SLOTS.find(s=>s.id==='W010802').candidates.length,3);
});
test('planet move locks starter candidate and Pikachu independently; save retains exact roll',()=>{
 let state=transition(initialState(),{type:'START'});
 assert.equal(state.raritySlotResults,null);
 const before=appearedInRegion(state,REGION.id);
 assert.equal(before.filter(p=>STARTER_IDS.includes(p.id)).length,0);
 state={...state,stellar:100,pendingStellar:1,permanentUpgrades:{SU013:20}};
 const sequence=[.15,.85,.05];let count=0;
 const moved=transition(state,{type:'MOVE_PLANET',random:()=>sequence[count++]});
 assert.equal(moved.planetMoves,1);
 assert.ok(count>=3);
 assert.equal(moved.uncommonChance,.25);
 assert.ok(moved.uncommonStarterId===null||STARTER_IDS.includes(moved.uncommonStarterId));
 assert.equal(typeof moved.berryRareAppeared,'boolean');
 assert.equal(appearedInRegion(moved,REGION.id).filter(p=>STARTER_IDS.includes(p.id)).length,moved.uncommonStarterId?1:0);
 assert.equal(appearedInRegion(moved,BERRY_REGION.id).some(p=>p.id==='pikachu'),moved.berryRareAppeared);
 const restored=decodeSave(encodeSave(moved)).game;
 assert.deepEqual(restored.raritySlotResults,moved.raritySlotResults);
 assert.equal(restored.uncommonStarterId,moved.uncommonStarterId);
 assert.equal(restored.berryRareAppeared,moved.berryRareAppeared);
 assert.deepEqual(appearedInRegion(restored,REGION.id).map(p=>p.id),appearedInRegion(moved,REGION.id).map(p=>p.id));
});
test('invalid slot selections in saved data are rejected',()=>{
 const original=transition(initialState(),{type:'START'});
 const snap=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(original)),v=>v.charCodeAt(0))));
 snap.game.raritySlotResults={W010602:'pikachu'};
 const broken=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(snap))));
 assert.throws(()=>decodeSave(broken),/희귀도 슬롯 판정/);
});

test('exclusion removes a common slot from the next planet only',()=>{
 let state=transition(initialState(),{type:'START'});
 assert.ok(appearedInRegion(state,REGION.id).some(p=>p.id==='rattata'));
 state={...state,rarityBanishments:['W010101'],pendingStellar:1};
 const moved=transition(state,{type:'MOVE_PLANET',random:()=>.9});
 assert.equal(moved.raritySlotResults.W010101,null);
 assert.ok(!appearedInRegion(moved,REGION.id).some(p=>p.id==='rattata'));
});
test('v13 legacy saves preserve old uncommon starter and berry flag',()=>{
 let state=transition(initialState(),{type:'START'});
 state={...state,uncommonStarterId:'bulbasaur',berryRareAppeared:true};
 const payload=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(state)),v=>v.charCodeAt(0))));
 payload.version=13;
 delete payload.game.raritySlotResults;
 delete payload.game.rarityGuarantees;
 delete payload.game.rarityBanishments;
 delete payload.game.raritySpecialUnlocks;
 const prior=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))));
 const restored=decodeSave(prior).game;
 assert.equal(restored.raritySlotResults.W010802,'bulbasaur');
 assert.equal(restored.raritySlotResults.W020502,'pikachu');
 assert.equal(appearedInRegion(restored,REGION.id).some(p=>p.id==='bulbasaur'),true);
 assert.equal(appearedInRegion(restored,BERRY_REGION.id).some(p=>p.id==='pikachu'),true);
});

test('rarity decay is globally ordered by region then in-region slot regardless of registration order',()=>{
 const shuffled=[
  {id:'late',rarity:'uncommon',encounterCode:'W020402'},
  {id:'first',rarity:'uncommon',encounterCode:'W010102'},
  {id:'later1',rarity:'uncommon',encounterCode:'W010702'},
  {id:'second',rarity:'uncommon',encounterCode:'W010202'}
 ];
 const slots=createEncounterSlots(shuffled);
 // last unlocked is second in region 1; later1 is one ahead, late is two ahead.
 const result=rollEncounterSlots(slots,{chances:{uncommon:.6},
  lifetimeKills:{second:1},random:()=>.55});
 assert.equal(result.W020402,null); // 60%/1.1 = 54.5% is below the .55 roll
 assert.equal(result.W010102,'first');
 assert.equal(result.W010702,'later1');
});
test('explicit conditional candidate is selected even if another member shares its slot',()=>{
 const slots=createEncounterSlots([
  {id:'one',rarity:'transcendent',encounterCode:'W030306-01'},
  {id:'two',rarity:'transcendent',encounterCode:'W030306-02'}
 ]);
 assert.equal(rollEncounterSlots(slots,{special:['two'],random:()=>0}).W030306,'two');
});
test('new catalog slots do not invalidate previously generated v14 saves',()=>{
 const old=transition(initialState(),{type:'START'});
 const encoded=encodeSave(old);
 const payload=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded),v=>v.charCodeAt(0))));
 payload.version=14;
 payload.game.raritySlotResults={R10602:'bulbasaur'};
 const modified=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))));
 const loaded=decodeSave(modified).game;
 assert.equal(loaded.raritySlotResults.W010802,'bulbasaur');
 assert.equal(loaded.raritySlotResults.W020502,null);
});
