import {ENCOUNTER_SLOTS,ALL_POKEMON} from './wildData.js';

// Older saves hold starter and Pikachu flags, while modern saves hold slot IDs.
// Missing slots in a newer catalog stay unavailable until the next planet move;
// adding new regions must never invalidate a previously valid save.
const LEGACY_PLAINS_SLOTS=Object.freeze({
 R10301:'R10401',R10401:'R10501',R10501:'R10701',R10602:'R10802',
 R10701:'R10901',R10801:'R11001',R10901:'R11101',R11001:'R11201',R11101:'R11401'
});
const V15_PLAINS_SLOTS=Object.freeze({R11101:'R11201',R11201:'R11401',R11302:'R11502',R11401:'R11601'});
const remapLegacySlot=id=>LEGACY_PLAINS_SLOTS[id]??id;
const remapV15Slot=id=>V15_PLAINS_SLOTS[id]??id;
export function migrateEncounterSave(original,version,slots=ENCOUNTER_SLOTS,pokemon=ALL_POKEMON){
 const slotMap=new Map(slots.map(slot=>[slot.id,slot]));
 let results=original.raritySlotResults??null;
 if(version<14){
  results=Object.fromEntries(slots.map(slot=>[slot.id,
   slot.rarity==='common'?slot.candidates[0]:null]));
  if(original.uncommonStarterId!==null&&original.uncommonStarterId!==undefined)
   results.R10802=original.uncommonStarterId;
  if(original.berryRareAppeared===true)results.R20502='pikachu';
 }
 if(results!==null){
  if(version>=14&&version<=15){
   results=Object.fromEntries(Object.entries(results).map(([id,value])=>[version===14?remapV15Slot(remapLegacySlot(id)):remapV15Slot(id),value]));
  }
  if(typeof results!=='object'||Array.isArray(results)||
    Object.entries(results).some(([id,value])=>!slotMap.has(id)||
      (value!==null&&!slotMap.get(id).candidates.includes(value))))
   throw new Error('희귀도 슬롯 판정 기록이 올바르지 않습니다.');
  results=Object.fromEntries(slots.map(slot=>[slot.id,results[slot.id]??null]));
 }
 const validIds=new Set([...slotMap.keys(),...pokemon.map(p=>p.id)]);
 const options={};
 for(const key of ['rarityGuarantees','rarityBanishments','raritySpecialUnlocks']){
  const ids=version>=14?(original[key]??[]).map(id=>version===14?remapV15Slot(remapLegacySlot(id)):version===15?remapV15Slot(id):id):[];
  if(!Array.isArray(ids)||ids.length>validIds.size||
   ids.some(id=>typeof id!=='string'||!validIds.has(id))||new Set(ids).size!==ids.length)
   throw new Error('희귀도 출현 옵션이 올바르지 않습니다: '+key);
  options[key]=[...ids];
 }
 return {raritySlotResults:results,...options};
}
