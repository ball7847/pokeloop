import {typeLayer} from './energySystem.js';
import {multiplyAmount} from './bigNumber.js';
import {createEncounterSlots,baseSlotId} from './raritySystem.js';
import {createWildRegistry,resolveEvolutionVictory} from './wildRegistry.js';
import {REGION_CONTENT,REGION,BERRY_REGION,LAKE_REGION,REGIONS,WILD_POKEMON,PLAINS_EVOLUTIONS,UNCOMMON_BASE_CHANCE,UNCOMMON_STARTERS,PLAINS_UNCOMMON,STARTER_IDS,BERRY_POKEMON,LAKE_POKEMON,ALL_POKEMON} from './wildCatalog.js';
export {REGION,BERRY_REGION,LAKE_REGION,REGIONS,WILD_POKEMON,PLAINS_EVOLUTIONS,UNCOMMON_BASE_CHANCE,UNCOMMON_STARTERS,PLAINS_UNCOMMON,STARTER_IDS,BERRY_POKEMON,LAKE_POKEMON,ALL_POKEMON} from './wildCatalog.js';
// A configured per-species limit is fixed: future general kill-limit upgrades
// can extend only species that use the normal default.
export function getKillLimit(pokemon, extraGeneralKills=0){
  if(pokemon?.maxKillsPerPlanet!==undefined){
    const fixed=pokemon.maxKillsPerPlanet;
    if(!Number.isSafeInteger(fixed)||fixed<1)throw new Error('Invalid fixed Pokémon kill limit: '+pokemon?.id);
    return fixed;
  }
  return (registry.regionOf(pokemon?.id)?.defaultKillLimit??REGION.defaultKillLimit)+Math.max(0,Math.floor(Number(extraGeneralKills)||0));
}
export const ENCOUNTER_SLOTS=Object.freeze(createEncounterSlots(ALL_POKEMON));
export const ENCOUNTER_SLOT_BY_ID=Object.freeze(Object.fromEntries(ENCOUNTER_SLOTS.map(slot=>[slot.id,slot])));
// Evolution children are stored separately from the 24 regular-rarity lineup.
// Regions have no population cap; evolved, legendary and divine encounters may be added independently.
export const EVOLUTIONS=Object.freeze(ALL_POKEMON.filter(p=>p.evolvesFrom));
const registry=createWildRegistry(REGION_CONTENT);
export const evolutionsFor=id=>registry.childrenOf(id);
export const evolutionFor=id=>evolutionsFor(id)[0]??null;
export const rollVictoryEvolution=(state,id,count,random)=>resolveEvolutionVictory(state,evolutionsFor(id),count,random,evolutionChance);
export function evolutionChance(pokemon,state){
  if(!pokemon)return 0;
  if(!pokemon.rarity||pokemon.rarity==='common')return 1;
  if(pokemon.rarity==='uncommon')return state.uncommonChance??UNCOMMON_BASE_CHANCE;
  // No natural rare chance has been designed yet. Allow explicit future state
  // configuration without inventing a rate for rare evolutions.
  if(pokemon.rarity==='rare')return Math.max(0,Math.min(1,state.rareChance??0));
  // Other future rarities require an explicitly configured probability; no invented defaults.
  return 0;
}
export const regionForPokemon=id=>registry.regionOf(id)?.id??REGION.id;
const selectedInSlot=(state,p)=>state?.raritySlotResults==null?
 (!p.rarity||p.rarity==='common'?true:
   (p.id==='pikachu'?state?.berryRareAppeared===true:state?.uncommonStarterId===p.id)):
 (state.raritySlotResults[baseSlotId(p)]===p.id ||
   (!Object.hasOwn(state.raritySlotResults,baseSlotId(p))&&(!p.rarity||p.rarity==='common')));
const baseLineup=(state,regionId)=>registry.baseLineup(state,regionId,selectedInSlot);
export const appearedInRegion=(state,regionId)=>registry.appeared(state,regionId,selectedInSlot);
export const regionUnlockRequirement=()=>registry.unlockRequirement(BERRY_REGION.id);
export const isRegionUnlocked=(state,regionId)=>registry.isUnlocked(state,regionId,selectedInSlot);
export function unlockedCountInRegion(state,regionId){
 const lineup=baseLineup(state,regionId);
 const distinct=lineup.filter(p=>(state.killCounts?.[p.id]??0)>0).length;
 return Math.min(lineup.length,INITIAL_UNLOCK_COUNT+distinct);
}
export function isPokemonUnlockedInState(state,id){
 const region=regionForPokemon(id);
 if(!isRegionUnlocked(state,region))return false;
 const pokemon=getWildPokemon(id);
 if(!pokemon)return false;
 if(pokemon.evolvesFrom){
   return state.evolutionResults?.[id]===true&&isPokemonUnlockedInState(state,pokemon.evolvesFrom);
 }
 const lineup=baseLineup(state,region);
 const index=lineup.findIndex(p=>p.id===id);
 return index>=0&&index<unlockedCountInRegion(state,region);
}
// Call at a future reincarnation event, once per cycle; do not reroll on page visits.
export function rollUncommonStarter(chance=UNCOMMON_BASE_CHANCE,random=Math.random){
 if(!Number.isFinite(chance)||chance<0||chance>1)throw new RangeError('Invalid uncommon chance');
 if(chance===0)return null;
 if(chance<1&&random()>=chance)return null;
 return UNCOMMON_STARTERS[Math.min(2,Math.max(0,Math.floor(random()*3)))].id;
}
export function getActiveWildPokemon(state){
 return baseLineup(state,REGION.id);
}
// Normal base reward plus 10% for each unlocked matching non-normal type.
export function battleEnergyRewards(pokemon,count=0,state={}){
 const base=pokemon.energyReward??0;
 if(base<=0)return {};
 const amount=scaledReward('energy',base,count);
 const rewards={노말:amount};
 for(const type of new Set(pokemon.types)){
  if(type!=='노말'&&typeLayer(type)>0&&typeLayer(type)<=(state.unlockedLayer??1))rewards[type]=multiplyAmount(amount,0.1);
 }
 return rewards;
}
export const spriteUrl=number=>'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+number+'.png';
export const getWildPokemon=id=>registry.pokemon(id);
export const INITIAL_UNLOCK_COUNT=3;
// The number of available encounters depends on UNIQUE first victories,
// not total victories and not the identity of a specific starter Pokemon.
export function unlockedPokemonCount(kills={},starterId=null){
 const lineup=getActiveWildPokemon({uncommonStarterId:starterId});
 const distinctVictories=lineup.reduce((count,p)=>count+((kills[p.id]||0)>0?1:0),0);
 return Math.min(lineup.length,INITIAL_UNLOCK_COUNT+distinctVictories);
}
export function isPokemonUnlocked(kills,id,starterId=null){
 const lineup=getActiveWildPokemon({uncommonStarterId:starterId});
 const index=lineup.findIndex(p=>p.id===id);
 return index>=0&&index<unlockedPokemonCount(kills,starterId);
}
export function rewardMultiplier(previousVictories,decay=REGION.rewardDecay){
 return 1/(1+Math.max(0,previousVictories)*decay);
}
export function scaledReward(stat,value,count){
 const divisor=1+count*REGION.rewardDecay;
 return stat==='speed'?value/divisor: value/divisor;
}
