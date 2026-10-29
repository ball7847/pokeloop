import {createEncounterSlots,baseSlotId} from './raritySystem.js';
import {REGION,BERRY_REGION,LAKE_REGION,REGIONS,WILD_POKEMON,PLAINS_EVOLUTIONS,UNCOMMON_BASE_CHANCE,UNCOMMON_STARTERS,PLAINS_UNCOMMON,STARTER_IDS,BERRY_POKEMON,LAKE_POKEMON,ALL_POKEMON} from './wildCatalog.js';
export {REGION,BERRY_REGION,LAKE_REGION,REGIONS,WILD_POKEMON,PLAINS_EVOLUTIONS,UNCOMMON_BASE_CHANCE,UNCOMMON_STARTERS,PLAINS_UNCOMMON,STARTER_IDS,BERRY_POKEMON,LAKE_POKEMON,ALL_POKEMON} from './wildCatalog.js';
export const ENCOUNTER_SLOTS=Object.freeze(createEncounterSlots(ALL_POKEMON));
export const ENCOUNTER_SLOT_BY_ID=Object.freeze(Object.fromEntries(ENCOUNTER_SLOTS.map(slot=>[slot.id,slot])));
// Evolution children are stored separately from the 24 regular-rarity lineup.
// Regions have no population cap; evolved, legendary and divine encounters may be added independently.
export const EVOLUTIONS=Object.freeze(ALL_POKEMON.filter(p=>p.evolvesFrom));
const evolutionByParent=new Map(EVOLUTIONS.map(p=>[p.evolvesFrom,p]));
export const evolutionFor=id=>evolutionByParent.get(id)??null;
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
const berryIds=new Set(BERRY_POKEMON.map(p=>p.id));
const lakeIds=new Set(LAKE_POKEMON.map(p=>p.id));
export const regionForPokemon=id=>lakeIds.has(id)?LAKE_REGION.id:berryIds.has(id)?BERRY_REGION.id:REGION.id;
const selectedInSlot=(state,p)=>state?.raritySlotResults==null?
 (!p.rarity||p.rarity==='common'?true:
   (p.id==='pikachu'?state?.berryRareAppeared===true:state?.uncommonStarterId===p.id)):
 state.raritySlotResults[baseSlotId(p)]===p.id;
const region1Lineup=state=>[...WILD_POKEMON,...UNCOMMON_STARTERS,...PLAINS_UNCOMMON]
 .filter(p=>selectedInSlot(state,p))
 .sort((a,b)=>Number(a.encounterCode.slice(3,5))-Number(b.encounterCode.slice(3,5)));

const baseLineup=(state,regionId)=>regionId===BERRY_REGION.id?
 BERRY_POKEMON.filter(p=>!p.evolvesFrom&&selectedInSlot(state,p)):
 regionId===LAKE_REGION.id?LAKE_POKEMON.filter(p=>!p.evolvesFrom&&selectedInSlot(state,p)):
 region1Lineup(state);
// Recursive insertion also supports later second and third evolutionary stages.
export function appearedInRegion(state,regionId){
 const result=[];
 const insert=p=>{
   result.push(p);
   const next=evolutionFor(p.id);
   if(next&&state?.evolutionResults?.[next.id]===true&&regionForPokemon(next.id)===regionId)insert(next);
 };
 baseLineup(state,regionId).forEach(insert);
 return result;
}
// Region unlocking must not become harder just because a rare candidate appeared.
// The fixed baseline is the 10 standard slots in the starting region.
export const regionUnlockRequirement=()=>Math.ceil(WILD_POKEMON.length*.7);
export const isRegionUnlocked=(state,regionId)=>regionId===REGION.id||
 (regionId===BERRY_REGION.id&&baseLineup(state,REGION.id)
  .filter(p=>(state.killCounts?.[p.id]??0)>0).length>=regionUnlockRequirement(state))||
 (regionId===LAKE_REGION.id&&isRegionUnlocked(state,BERRY_REGION.id)&&
  BERRY_POKEMON.filter(p=>!p.evolvesFrom&&p.rarity!=='uncommon'&&(state.killCounts?.[p.id]??0)>0).length>=Math.ceil(BERRY_POKEMON.filter(p=>!p.evolvesFrom&&p.rarity!=='uncommon').length*.7));
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
 return region1Lineup(state);
}
// Existing battles award the same base to each Pokémon type. Explicit per-type
// overrides allow partial regional rewards without silently awarding all types.
export function battleEnergyRewards(pokemon,count=0){
  const rewards=pokemon.energyRewards??(pokemon.energyReward===undefined?{}:
    Object.fromEntries(pokemon.types.map(type=>[type,pokemon.energyReward])));
  return Object.fromEntries(Object.entries(rewards).map(([type,amount])=>[type,scaledReward('energy',amount,count)]));
}
export const spriteUrl=number=>'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+number+'.png';
const pokemonById=new Map(ALL_POKEMON.map(p=>[p.id,p]));
export const getWildPokemon=id=>pokemonById.get(id)??null;
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
