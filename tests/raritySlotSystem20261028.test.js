import test from 'node:test';
import assert from 'node:assert/strict';
import {createEncounterSlots,effectiveSlotChance,rollEncounterSlots,RARITY_MAX_TARGETS} from '../src/core/raritySystem.js';
import {initialState,transition} from '../src/core/gameState.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';
import {appearedInRegion,ENCOUNTER_SLOTS,STARTER_IDS,REGION,BERRY_REGION} from '../src/core/wildData.js';

const defs=[
 {id:'a',encounterCode:'R10102-01',rarity:'uncommon'},
 {id:'b',encounterCode:'R10102-02',rarity:'uncommon'},
 {id:'c',encounterCode:'R10202',rarity:'uncommon'},
 {id:'d',encounterCode:'R10302',rarity:'uncommon'},
 {id:'e',encounterCode:'R10403',rarity:'rare'},
 {id:'f',encounterCode:'R10506',rarity:'transcendent'}
];
test('group by encounter code, each slot rolls independently, then picks one of N candidates',()=>{
 const slots=createEncounterSlots(defs);
 assert.equal(slots.length,5);
 assert.deepEqual(slots[0].candidates,['a','b']);
 const samples=[.2,.8,.1,.9,.1,.9];
 let consumed=0;
 const results=rollEncounterSlots(slots,{chances:{uncommon:.6,rare:.3},random:()=>samples[consumed++]});
 assert.equal(results.R10102,'b');
 assert.equal(results.R10202,'c');
 assert.equal(results.R10302,null);
 assert.equal(results.R10403,'e');
 assert.equal(results.R10506,null);
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
 assert.equal(out.R10102,'b');
 assert.equal(out.R10403,null);
 assert.equal(out.R10506,'f');
 const blocked=rollEncounterSlots(slots,{chances:{uncommon:0},guaranteed:['b'],banished:['R10102'],special:['f'],random:()=>.2});
 assert.equal(blocked.R10102,null);
});
test('existing SU013 level cap and configured target probabilities stay unchanged',()=>{
 assert.deepEqual(RARITY_MAX_TARGETS,{uncommon:.60,rare:.30,legendary:.15,divine:.075});
 assert.equal(initialState().uncommonChance,0);
 assert.equal(ENCOUNTER_SLOTS.find(s=>s.id==='R10602').candidates.length,3);
});
test('planet move locks starter candidate and Pikachu independently; save retains exact roll',()=>{
 let state=transition(initialState(),{type:'START'});
 assert.equal(state.raritySlotResults,null);
 const before=appearedInRegion(state,REGION.id);
 assert.equal(before.filter(p=>STARTER_IDS.includes(p.id)).length,0);
 state={...state,stellar:100,permanentUpgrades:{SU013:20}};
 const sequence=[.15,.85,.05];let count=0;
 const moved=transition(state,{type:'MOVE_PLANET',random:()=>sequence[count++]});
 assert.equal(moved.planetMoves,1);
 assert.equal(count,3);
 assert.equal(moved.uncommonChance,.2);
 assert.equal(moved.uncommonStarterId,'squirtle');
 assert.equal(moved.berryRareAppeared,true);
 assert.equal(appearedInRegion(moved,REGION.id).filter(p=>STARTER_IDS.includes(p.id)).length,1);
 assert.equal(appearedInRegion(moved,BERRY_REGION.id).some(p=>p.id==='pikachu'),true);
 const restored=decodeSave(encodeSave(moved)).game;
 assert.deepEqual(restored.raritySlotResults,moved.raritySlotResults);
 assert.equal(restored.uncommonStarterId,moved.uncommonStarterId);
 assert.equal(restored.berryRareAppeared,moved.berryRareAppeared);
 assert.deepEqual(appearedInRegion(restored,REGION.id).map(p=>p.id),appearedInRegion(moved,REGION.id).map(p=>p.id));
});
test('invalid slot selections in saved data are rejected',()=>{
 const original=transition(initialState(),{type:'START'});
 const snap=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(original)),v=>v.charCodeAt(0))));
 snap.game.raritySlotResults={R10602:'pikachu'};
 const broken=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(snap))));
 assert.throws(()=>decodeSave(broken),/희귀도 슬롯 판정/);
});
