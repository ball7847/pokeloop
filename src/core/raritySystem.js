// Rejected Draft-style independent rarity checks, adapted to PokeLoop encounter slots.
// A slot is rolled once per planet; a successful N-candidate slot chooses exactly one.
export const RARITY_KEYS=Object.freeze(['common','uncommon','rare','legendary','divine','transcendent']);
export const RARITY_DECAY=Object.freeze({uncommon:1.1,rare:1.15,legendary:1.05,divine:2});
export const RARITY_MAX_TARGETS=Object.freeze({uncommon:.60,rare:.30,legendary:.15,divine:.075});
// These are future design targets, NOT current upgrades or automatic starting chances.
export const baseSlotId=pokemon=>pokemon.encounterCode.split('-')[0];
export const createEncounterSlots=pokemon=>{
 const grouped=new Map();
 for(const p of pokemon){
  if(p.evolvesFrom)continue; // Evolution uses separate on-first-victory mechanics.
  const id=baseSlotId(p);
  const rarity=p.rarity??'common';
  if(!RARITY_KEYS.includes(rarity))throw new Error('Unsupported rarity: '+rarity);
  const existing=grouped.get(id);
  if(existing){
   if(existing.rarity!==rarity)throw new Error('Mixed rarity in encounter slot: '+id);
   existing.candidates.push(p.id);
  }else grouped.set(id,{id,rarity,candidates:[p.id]});
 }
 return [...grouped.values()].map(slot=>Object.freeze({...slot,candidates:Object.freeze(slot.candidates)}));
};
export function effectiveSlotChance(slot,baseChance,slotIndex,lastUnlockedIndex){
 if(slot.rarity==='common')return 1;
 if(slot.rarity==='transcendent')return 0; // Only via explicit special condition.
 const chance=Math.max(0,Math.min(1,baseChance??0));
 const decay=RARITY_DECAY[slot.rarity]??1;
 const distance=slotIndex-lastUnlockedIndex;
 return chance/Math.pow(decay,Math.max(0,distance-1));
}
export function rollEncounterSlots(slots,{chances={},lifetimeKills={},guaranteed=[],banished=[],special=[],random=Math.random}={}){
 const guaranteedSet=new Set(guaranteed),banishedSet=new Set(banished),specialSet=new Set(special);
 const byRarity=new Map();
 for(const slot of slots){
  if(!byRarity.has(slot.rarity))byRarity.set(slot.rarity,[]);
  byRarity.get(slot.rarity).push(slot);
 }
 const result={};
 for(const slot of slots){
  const siblings=byRarity.get(slot.rarity);
  const index=siblings.indexOf(slot);
  const lastUnlocked=siblings.reduce((last,entry,i)=>entry.candidates.some(id=>(lifetimeKills[id]??0)>0)?i:last,-1);
  const forced=specialSet.has(slot.id)||slot.candidates.some(id=>specialSet.has(id));
  const selectedGuaranteed=slot.candidates.filter(id=>guaranteedSet.has(id)&&!banishedSet.has(id));
  const allBanned=banishedSet.has(slot.id)||slot.candidates.every(id=>banishedSet.has(id));
  const eligible=slot.candidates.filter(id=>!banishedSet.has(id));
  // Original sequencing: independent natural roll, guarantee/conditional additions, exclusion last.
  const rate=effectiveSlotChance(slot,chances[slot.rarity],index,lastUnlocked);
  const natural=slot.rarity!=='transcendent'&&
   (slot.rarity==='common'||(rate>0&&(rate>=1||random()<rate)));
  if(allBanned||(!natural&&!forced&&!selectedGuaranteed.length)){result[slot.id]=null;continue;}
  const pool=selectedGuaranteed.length?selectedGuaranteed:eligible;
  result[slot.id]=pool.length===1?pool[0]:pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]??null;
 }
 return result;
}
