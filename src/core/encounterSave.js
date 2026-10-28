import {ENCOUNTER_SLOTS,ALL_POKEMON} from './wildData.js';

// Older saves hold starter and Pikachu flags, while modern saves hold slot IDs.
// Missing slots in a newer catalog stay unavailable until the next planet move;
// adding new regions must never invalidate a previously valid save.
export function migrateEncounterSave(original,version,slots=ENCOUNTER_SLOTS,pokemon=ALL_POKEMON){
 const slotMap=new Map(slots.map(slot=>[slot.id,slot]));
 let results=original.raritySlotResults??null;
 if(version<14){
  results=Object.fromEntries(slots.map(slot=>[slot.id,
   slot.rarity==='common'?slot.candidates[0]:null]));
  if(original.uncommonStarterId!==null&&original.uncommonStarterId!==undefined)
   results.R10602=original.uncommonStarterId;
  if(original.berryRareAppeared===true)results.R20502='pikachu';
 }
 if(results!==null){
  if(typeof results!=='object'||Array.isArray(results)||
    Object.entries(results).some(([id,value])=>!slotMap.has(id)||
      (value!==null&&!slotMap.get(id).candidates.includes(value))))
   throw new Error('희귀도 슬롯 판정 기록이 올바르지 않습니다.');
  results=Object.fromEntries(slots.map(slot=>[slot.id,results[slot.id]??null]));
 }
 const validIds=new Set([...slotMap.keys(),...pokemon.map(p=>p.id)]);
 const options={};
 for(const key of ['rarityGuarantees','rarityBanishments','raritySpecialUnlocks']){
  const ids=version>=14?(original[key]??[]):[];
  if(!Array.isArray(ids)||ids.length>validIds.size||
   ids.some(id=>typeof id!=='string'||!validIds.has(id))||new Set(ids).size!==ids.length)
   throw new Error('희귀도 출현 옵션이 올바르지 않습니다: '+key);
  options[key]=[...ids];
 }
 return {raritySlotResults:results,...options};
}
