import {movePlanet} from './energySystem.js';
import {collectPendingItems} from './itemSystem.js';
import {rollEncounterSlots} from './raritySystem.js';
import {ENCOUNTER_SLOTS,UNCOMMON_BASE_CHANCE} from './wildData.js';
import {stellarUncommonBonus} from './stellarUpgrades.js';

// All preservation and reroll decisions for a planet transition are kept in one
// place. The caller supplies fresh initial state so no gameplay system is reset
// outside its approved transition boundary.
export function prepareNextPlanet(state,random=Math.random){
 const preserved=movePlanet(state);
 const items=collectPendingItems(state);
 const uncommonChance=Math.min(1,UNCOMMON_BASE_CHANCE+stellarUncommonBonus(preserved));
 const raritySlotResults=rollEncounterSlots(ENCOUNTER_SLOTS,{
  chances:{uncommon:uncommonChance},lifetimeKills:state.dexLifetimeKills,
  guaranteed:state.rarityGuarantees??[],banished:state.rarityBanishments??[],
  special:state.raritySpecialUnlocks??[],random
 });
 return {...preserved,...items,uncommonChance,
  uncommonStarterId:raritySlotResults.R10602??null,
  berryRareAppeared:raritySlotResults.R20502==='pikachu',
  raritySlotResults,rarityGuarantees:state.rarityGuarantees??[],
  rarityBanishments:state.rarityBanishments??[],
  raritySpecialUnlocks:state.raritySpecialUnlocks??[],
  dexDiscovered:[...state.dexDiscovered],dexLifetimeKills:{...state.dexLifetimeKills}
 };
}
