import {resolveStats} from './dittoStats.js';
export const REGION=Object.freeze({id:'starting-plains',name:'시작의 평원',defaultKillLimit:10,rewardDecay:1});
export const BERRY_REGION=Object.freeze({id:'berry-forest',name:'베리숲',defaultKillLimit:10,rewardDecay:1});
export const REGIONS=Object.freeze([REGION,BERRY_REGION]);
const entries=[
{id:'rattata',number:19,name:'꼬렛',types:['노말'],energyReward:1,hp:3,attack:2,speed:2100,rewards:{attack:1}},
{id:'pidgey',number:16,name:'구구',types:['노말','비행'],energyReward:2,hp:6,attack:2.5,speed:2400,rewards:{hp:1}},
{id:'mankey',number:56,name:'망키',types:['격투'],energyReward:2,hp:24,attack:7,speed:1800,rewards:{hp:5.6,attack:2}},
{id:'spearow',number:21,name:'깨비참',types:['노말','비행'],energyReward:3,hp:13.3,attack:2,speed:1300,rewards:{hp:2.1,attack:1}},
{id:'zubat',number:41,name:'주뱃',types:['독','비행'],energyReward:3,hp:10,attack:1.2,speed:800,rewards:{attack:1,speed:-20}},
{id:'meowth',number:52,name:'나옹',types:['노말'],energyReward:10,hp:20,attack:1.8,speed:1100,multiStrike:1000,rewards:{attack:1.5,multiStrike:4}},
{id:'geodude',number:74,name:'꼬마돌',types:['바위','땅'],energyReward:1,hp:40,attack:20,defense:10,speed:6000,rewards:{attack:2,defense:1}},
{id:'exeggcute',number:102,name:'아라리',types:['풀','에스퍼'],energyReward:1,hp:60,attack:4,specialAttack:30,speed:4700,rewards:{specialAttack:3}},
{id:'sentret',number:161,name:'꼬리선',types:['노말'],energyReward:15,hp:100,attack:4.6,speed:2400,rewards:{hp:16.1}},
{id:'tauros',number:128,name:'켄타로스',types:['노말'],energyReward:49,hp:225,attack:20,defense:9.5,specialDefense:7,speed:1500,rewards:{hp:15,attack:5,defense:1,specialDefense:1}}
];
// Encounter codes identify regional slots independently from species IDs.
const region1Codes=Object.freeze(['R10101','R10201','R10301','R10401','R10501','R10701','R10801','R10901','R11001','R11101']);
export const WILD_POKEMON=Object.freeze(entries.map((p,i)=>Object.freeze({...p,...resolveStats(p),encounterCode:region1Codes[i]})));
export const UNCOMMON_BASE_CHANCE=0;
export const UNCOMMON_STARTERS=Object.freeze([{id:'bulbasaur',number:1,name:'이상해씨',types:['풀','독'],energyReward:132},{id:'charmander',number:4,name:'파이리',types:['불꽃'],energyReward:132},{id:'squirtle',number:7,name:'꼬부기',types:['물'],energyReward:132}].map((p,i)=>Object.freeze({...p,...resolveStats({hp:100,attack:10,speed:3000}),encounterCode:'R10602-0'+(i+1),rarity:'uncommon',rewards:{hp:10,attack:1,speed:-30}})));
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
{id:'surskit',number:283,name:'비구술',types:['벌레','물'],energyReward:28,hp:40,attack:30,defense:32,specialAttack:50,specialDefense:52,speed:650,rewards:{speed:-28}}
];
// Region 2 slots remain fixed even when conditional Pokémon have not appeared.
// Evolutions inherit their parent's slot and use -E1 for the first evolution.
const berryEncounterCodes=Object.freeze({
  caterpie:'R20101',metapod:'R20101-E1',
  weedle:'R20201',kakuna:'R20201-E1',
  taillow:'R20301',pikachu:'R20502',
  igglybuff:'R20401','nidoran-m':'R20601','nidoran-f':'R20701',tangela:'R20801',bidoof:'R20901',surskit:'R21001'
});
// Region 2 awards each configured energyReward to each of the Pokémon's types.
export const BERRY_POKEMON=Object.freeze(berryEntries.map(p=>Object.freeze({...p,...resolveStats(p),encounterCode:berryEncounterCodes[p.id]})));
export const ALL_POKEMON=Object.freeze([...WILD_POKEMON,...UNCOMMON_STARTERS,...BERRY_POKEMON]);
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
const region1Lineup=state=>[...WILD_POKEMON.slice(0,5),...UNCOMMON_STARTERS.filter(p=>p.id===state?.uncommonStarterId),...WILD_POKEMON.slice(5)];
const baseLineup=(state,regionId)=>regionId===BERRY_REGION.id?
 BERRY_POKEMON.filter(p=>!p.evolvesFrom&&(p.id!=='pikachu'||state?.berryRareAppeared===true)):
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
export const regionUnlockRequirement=state=>Math.ceil(baseLineup(state,REGION.id).length*.7);
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
