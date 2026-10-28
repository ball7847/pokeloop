import test from 'node:test';
import assert from 'node:assert/strict';
import {createEncounterSlots,rollEncounterSlots} from '../src/core/raritySystem.js';
import {migrateEncounterSave} from '../src/core/encounterSave.js';
import {ENCOUNTER_SLOTS,ALL_POKEMON} from '../src/core/wildData.js';
import {initialState,transition} from '../src/core/gameState.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

// Future regions and candidates are fixtures, not new game content.
const slotCode=(region,position,rarity)=>'R'+region+String(position).padStart(2,'0')+String(rarity).padStart(2,'0');
const fixtures=()=>{
 const result=[];
 for(let region=1;region<=20;region++){
  for(const [rarity,rarityCode,count] of [['common',1,10],['uncommon',2,8],['rare',3,6]]){
   for(let position=1;position<=count;position++){
    const code=slotCode(region,position,rarityCode);
    const groupSize=position===2&&rarity==='uncommon'?3:1;
    for(let candidate=0;candidate<groupSize;candidate++)
     result.push({id:rarity+'-'+region+'-'+position+'-'+candidate,rarity,
      encounterCode:code+(groupSize>1?'-0'+(candidate+1):'')});
   }
  }
 }
 return result;
};
test('20-region 480-slot roster preserves per-region counts and N-of-one groups',()=>{
 const species=fixtures();
 const slots=createEncounterSlots(species);
 assert.equal(slots.length,480);
 assert.equal(species.length,520);
 for(let region=1;region<=20;region++){
  const byRegion=slots.filter(slot=>Number(/^R(\d+)(\d{4})$/.exec(slot.id)?.[1])===region);
  assert.equal(byRegion.filter(s=>s.rarity==='common').length,10);
  assert.equal(byRegion.filter(s=>s.rarity==='uncommon').length,8);
  assert.equal(byRegion.filter(s=>s.rarity==='rare').length,6);
  assert.equal(byRegion.find(s=>s.id===slotCode(region,2,2)).candidates.length,3);
 }
 const picked=rollEncounterSlots(slots,{chances:{uncommon:1,rare:1},random:()=>0});
 assert.equal(Object.keys(picked).length,480);
 assert.equal(Object.values(picked).filter(Boolean).length,480);
 assert.equal(new Set(Object.values(picked)).size,480);
 for(let region=1;region<=20;region++)
  assert.equal(picked[slotCode(region,2,2)],'uncommon-'+region+'-2-0');
});
test('global rare progress ignores cross-rarity unlocks and sorts even when input is reversed',()=>{
 const species=fixtures();
 const all=createEncounterSlots(species).reverse();
 const rare=all.filter(s=>s.rarity==='rare').sort((a,b)=>a.id.localeCompare(b.id));
 const last=slotCode(19,6,3);
 const after=slotCode(20,1,3);
 const result=rollEncounterSlots(all,{chances:{rare:.3,uncommon:0},
  lifetimeKills:{['rare-19-6-0']:1,['uncommon-20-8-0']:1},random:()=>.29});
 assert.equal(result[last],'rare-19-6-0');
 assert.equal(result[after],'rare-20-1-0');
 assert.equal(result[slotCode(20,2,3)],null);
 assert.equal(result[slotCode(20,2,2)],null);
 assert.ok(rare.length>100);
});
test('save migration expands an older catalog without rerolling any existing slot',()=>{
 const future=createEncounterSlots(fixtures());
 const starter=ENCOUNTER_SLOTS.find(s=>s.id==='R10602');
 const expanded=[...ENCOUNTER_SLOTS,...future.filter(s=>!ENCOUNTER_SLOTS.some(existing=>existing.id===s.id))];
 const old=Object.fromEntries(ENCOUNTER_SLOTS.map(slot=>[slot.id,
  slot.rarity==='common'?slot.candidates[0]:null]));
 old[starter.id]='charmander';
 const migrated=migrateEncounterSave({raritySlotResults:old,rarityGuarantees:[],rarityBanishments:[],raritySpecialUnlocks:[]},
  14,expanded,ALL_POKEMON);
 assert.equal(migrated.raritySlotResults.R10602,'charmander');
 assert.equal(Object.keys(migrated.raritySlotResults).length,expanded.length);
 for(const [id,value] of Object.entries(old))assert.equal(migrated.raritySlotResults[id],value);
 assert.equal(migrated.raritySlotResults[slotCode(20,2,3)],null);
});
test('existing real save remains equivalent across round-trip and no unapproved balance changes',()=>{
 let state=transition(initialState(),{type:'START'});
 state={...state,permanentUpgrades:{SU013:40},stellar:10};
 let rolls=0;
 const moved=transition(state,{type:'MOVE_PLANET',random:()=>{rolls++;return .2;}});
 assert.ok(rolls>=1);
 assert.equal(moved.uncommonChance,.4);
 const restored=decodeSave(encodeSave(moved)).game;
 assert.deepEqual(restored.raritySlotResults,moved.raritySlotResults);
 assert.deepEqual(restored.permanentUpgrades,moved.permanentUpgrades);
 assert.deepEqual(restored.dexLifetimeKills,moved.dexLifetimeKills);
 assert.equal(restored.planetMoves,moved.planetMoves);
});
