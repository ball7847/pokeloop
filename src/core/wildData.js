import {createEncounterSlots,baseSlotId} from './raritySystem.js';
import {resolveStats} from './dittoStats.js';
export const REGION=Object.freeze({id:'starting-plains',name:'시작의 평원',defaultKillLimit:10,rewardDecay:1});
export const BERRY_REGION=Object.freeze({id:'berry-forest',name:'베리숲',defaultKillLimit:10,rewardDecay:1});
export const REGIONS=Object.freeze([REGION,BERRY_REGION]);
const entries=[
{id:'rattata',number:19,name:'꼬렛',types:['노말'],energyReward:1,hp:3,attack:2,speed:2100,rewards:{attack:1}},
{id:'pidgey',number:16,name:'구구',types:['노말','비행'],energyReward:2,hp:6,attack:2.5,speed:2400,rewards:{hp:1}},
{id:'mankey',number:56,name:'망키',types:['격투'],energyReward:3.5,hp:24,attack:7,speed:1800,rewards:{hp:5.6,attack:2}},
{id:'spearow',number:21,name:'깨비참',types:['노말','비행'],energyReward:3,hp:13.3,attack:2,speed:1300,rewards:{hp:2.1,attack:1}},
{id:'zubat',number:41,name:'주뱃',types:['독','비행'],energyReward:3,hp:10,attack:1.2,speed:800,rewards:{attack:1,speed:-20}},
{id:'meowth',number:52,name:'나옹',types:['노말'],energyReward:10,hp:20,attack:1.8,speed:1100,multiStrike:1000,rewards:{attack:1.5,multiStrike:4}},
{id:'geodude',number:74,name:'꼬마돌',types:['바위','땅'],energyReward:1,hp:40,attack:20,defense:10,speed:6000,rewards:{attack:2,defense:1}},
{id:'exeggcute',number:102,name:'아라리',types:['풀','에스퍼'],energyReward:1,hp:60,attack:4,specialAttack:30,speed:4700,rewards:{specialAttack:3}},
{id:'sentret',number:161,name:'꼬리선',types:['노말'],energyReward:15,hp:100,attack:4.6,speed:2400,rewards:{hp:16.1}},
{id:'tauros',number:128,name:'켄타로스',types:['노말'],energyReward:49,hp:225,attack:20,defense:9.5,specialDefense:7,speed:1500,rewards:{hp:15,attack:5,defense:1,specialDefense:1}}
];
// Encounter codes identify regional slots independently from species IDs.
const region1Codes=Object.freeze(['W010101','W010201','W010401','W010501','W010701','W010901','W011001','W011201','W011401','W011601']);
export const WILD_POKEMON=Object.freeze(entries.map((p,i)=>Object.freeze({...p,...resolveStats(p),encounterCode:region1Codes[i]})));
export const UNCOMMON_BASE_CHANCE=0;
export const UNCOMMON_STARTERS=Object.freeze([{id:'bulbasaur',number:1,name:'이상해씨',types:['풀','독'],energyReward:132},{id:'charmander',number:4,name:'파이리',types:['불꽃'],energyReward:132},{id:'squirtle',number:7,name:'꼬부기',types:['물'],energyReward:132}].map((p,i)=>Object.freeze({...p,...resolveStats({hp:100,attack:10,speed:3000}),encounterCode:'W010802-0'+(i+1),rarity:'uncommon',rewards:{hp:10,attack:1,speed:-30}})));
export const PLAINS_UNCOMMON=Object.freeze([
 {id:'psyduck',number:54,name:'고라파덕',types:['물'],rarity:'uncommon',encounterCode:'W010302',hp:50,attack:5.2,speed:1400,energyReward:5.5,rewards:{hp:8,attack:2.6}},
 {id:'ponyta',number:77,name:'포니타',types:['불꽃'],rarity:'uncommon',encounterCode:'W010602',hp:77,attack:8.5,speed:800,energyReward:7.7,rewards:{attack:4.1,speed:-20}},
 {id:'ekans',number:23,name:'아보',types:['독'],rarity:'uncommon',encounterCode:'W011102',hp:88,attack:20,speed:2000,dodge:880,poison:20,antidote:100,energyReward:8,rewards:{dodge:20,poison:8}},
 {id:'rookidee',number:821,name:'파라꼬',types:['비행'],rarity:'uncommon',encounterCode:'W011302',hp:176,attack:27,defense:15,specialDefense:15,speed:2300,accuracy:200,energyReward:8,rewards:{hp:8,defense:8,specialDefense:8,accuracy:4}},
 {id:'zigzagoon',number:263,name:'지그제구리',types:['노말'],rarity:'uncommon',encounterCode:'W011502-01',hp:138,attack:13,speed:1100,dodge:260,energyReward:13.4,rewards:{dodge:13}},
 {id:'zigzagoon-galar',number:263,spriteNumber:10174,name:'지그제구리(가라르의 모습)',types:['악','노말'],rarity:'uncommon',encounterCode:'W011502-02',hp:138,attack:26,speed:1100,dodge:130,energyReward:3.4,rewards:{attack:2.6,dodge:13}}
].map(p=>Object.freeze({...p,...resolveStats(p)})));
export const STARTER_IDS=Object.freeze(UNCOMMON_STARTERS.map(p=>p.id));
const berryEntries=[
{id:'caterpie',number:10,name:'캐터피',types:['벌레'],energyReward:3,hp:90,attack:12,speed:3000,rewards:{hp:7}},
{id:'metapod',evolvesFrom:'caterpie',rarity:'common',number:11,name:'단데기',types:['벌레'],energyReward:5,hp:150,attack:20,defense:11,speed:4500,rewards:{hp:10,defense:1}},
{id:'weedle',number:13,name:'뿔충이',types:['벌레','독'],energyReward:3,hp:80,attack:14,speed:3500,rewards:{hp:7}},
{id:'kakuna',evolvesFrom:'weedle',rarity:'common',number:14,name:'딱충이',types:['벌레','독'],energyReward:5,hp:160,attack:20,defense:10,speed:5000,rewards:{hp:10,defense:1}},
{id:'taillow',number:276,name:'테일로',types:['노말','비행'],energyReward:27.6,hp:80,attack:11,speed:1100,rewards:{attack:2.76,speed:-20}},
{id:'igglybuff',number:174,name:'푸푸린',types:['노말','페어리'],energyReward:39,hp:180,attack:6,specialAttack:20,specialDefense:4,speed:2000,rewards:{hp:18,specialAttack:5}},
{id:'pikachu',number:25,name:'피카츄',types:['전기'],rarity:'uncommon',energyReward:25,hp:250,attack:25,specialAttack:25,speed:1025,paralysis:250,rewards:{attack:25,paralysis:25}},
{id:'nidoran-m',number:32,name:'니드런♂',types:['독'],energyReward:6.9,hp:230,attack:57,speed:2730,accuracy:80,minDamagePercent:50,maxDamagePercent:150,rewards:{attack:5.7,maxDamagePercent:3.2}},
{id:'nidoran-f',number:29,name:'니드런♀',types:['독'],energyReward:6.9,hp:220,attack:21,speed:2750,poison:10,rewards:{hp:12.9,poison:1}},
{id:'tangela',number:114,name:'덩쿠리',types:['풀'],energyReward:11.4,hp:195,specialAttack:15.5,regeneration:5,speed:1600,rewards:{hp:11.4,regeneration:1.14}},
{id:'bidoof',number:399,name:'비버니',types:['노말'],energyReward:40,hp:390,attack:25,specialAttack:15,speed:2900,rewards:{hp:20,attack:4}},
{id:'surskit',number:283,name:'비구술',types:['벌레','물'],energyReward:28,hp:40,attack:30,defense:32,specialAttack:50,specialDefense:52,speed:990,rewards:{speed:-28}},
{id:'tropius',number:357,name:'트로피우스',types:['풀','비행'],energyReward:100,hp:990,attack:68,specialAttack:72,regeneration:46,speed:5100,rewards:{hp:50,attack:10,specialAttack:10,regeneration:10}}
];
// Region 2 slots remain fixed even when conditional Pokémon have not appeared.
// Evolutions inherit their parent's slot and use -E1 for the first evolution.
const berryEncounterCodes=Object.freeze({
  caterpie:'W020101',metapod:'W020101-E1',
  weedle:'W020201',kakuna:'W020201-E1',
  taillow:'W020301',pikachu:'W020502',
  igglybuff:'W020401','nidoran-m':'W020601','nidoran-f':'W020701',tangela:'W020801',bidoof:'W020901',surskit:'W021001',tropius:'W021101'
});
// Region 2 awards each configured energyReward to each of the Pokémon's types.
export const BERRY_POKEMON=Object.freeze(berryEntries.map(p=>Object.freeze({...p,...resolveStats(p),encounterCode:berryEncounterCodes[p.id]})));
export const ALL_POKEMON=Object.freeze([...WILD_POKEMON,...UNCOMMON_STARTERS,...PLAINS_UNCOMMON,...BERRY_POKEMON]);
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
  // Future rarities require an explicitly configured probability; no invented defaults.
  return 0;
}
const berryIds=new Set(BERRY_POKEMON.map(p=>p.id));
export const regionForPokemon=id=>berryIds.has(id)?BERRY_REGION.id:REGION.id;
const selectedInSlot=(state,p)=>state?.raritySlotResults==null?
 (!p.rarity||p.rarity==='common'?true:
   (p.id==='pikachu'?state?.berryRareAppeared===true:state?.uncommonStarterId===p.id)):
 state.raritySlotResults[baseSlotId(p)]===p.id;
const region1Lineup=state=>[...WILD_POKEMON,...UNCOMMON_STARTERS,...PLAINS_UNCOMMON]
 .filter(p=>selectedInSlot(state,p))
 .sort((a,b)=>Number(a.encounterCode.slice(3,5))-Number(b.encounterCode.slice(3,5)));

const baseLineup=(state,regionId)=>regionId===BERRY_REGION.id?
 BERRY_POKEMON.filter(p=>!p.evolvesFrom&&selectedInSlot(state,p)):
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
  .filter(p=>(state.killCounts?.[p.id]??0)>0).length>=regionUnlockRequirement(state));
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
