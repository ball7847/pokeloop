// Original-style bonus rolls begin at the listed planet and end when any
// candidate in the target encounter slot has been discovered (not defeated).
// Bonuses are additional rolls after a failed natural roll, not guarantees.
export const PLANET_ENCOUNTER_BONUSES=Object.freeze([
 Object.freeze({planet:2,slotId:'W010302',multiplier:20}), // Psyduck
 Object.freeze({planet:4,slotId:'W010602',multiplier:15}), // Ponyta
 Object.freeze({planet:6,slotId:'W011502',multiplier:10})  // Zigzagoon / Galarian Zigzagoon
]);

export function activePlanetEncounterBonuses(planetNumber,discovered=[],slots=[]){
 const discoveredSet=new Set(discovered);
 const slotById=new Map(slots.map(slot=>[slot.id,slot]));
 const bonuses={};
 for(const rule of PLANET_ENCOUNTER_BONUSES){
  const slot=slotById.get(rule.slotId);
  if(!slot)throw new Error('Unknown planet encounter bonus slot: '+rule.slotId);
  if(!Number.isInteger(rule.planet)||rule.planet<1||!Number.isFinite(rule.multiplier)||rule.multiplier<=0)
   throw new Error('Invalid planet encounter bonus for '+rule.slotId);
  if(planetNumber>=rule.planet&&!slot.candidates.some(id=>discoveredSet.has(id)))
   bonuses[slot.id]=rule.multiplier;
 }
 return bonuses;
}
