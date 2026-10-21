import {resolveStats} from './dittoStats.js';
export const REGION=Object.freeze({id:'starting-plains',name:'시작의 평원',capacity:20,defaultKillLimit:10,rewardDecay:1});
export const BERRY_REGION=Object.freeze({id:'berry-forest',name:'베리숲',capacity:20,defaultKillLimit:10,rewardDecay:1});
export const REGIONS=Object.freeze([REGION,BERRY_REGION]);
const entries=[
{id:'rattata',number:19,name:'꼬렛',types:['노말'],energyReward:1,hp:3,attack:2,speed:2100,rewards:{attack:1}},
{id:'pidgey',number:16,name:'구구',types:['노말','비행'],energyReward:2,hp:6,attack:2.5,speed:2400,rewards:{hp:1}},
{id:'mankey',number:56,name:'망키',types:['격투'],energyReward:10,hp:20,attack:4,speed:1800,rewards:{hp:5.6,attack:2}},
{id:'spearow',number:21,name:'깨비참',types:['노말','비행'],energyReward:3,hp:12,attack:2.1,speed:1800,rewards:{hp:2.1,attack:1}},
{id:'zubat',number:41,name:'주뱃',types:['독','비행'],energyReward:3,hp:10,attack:1.45,speed:1100,rewards:{attack:1,speed:-20}}
];
export const WILD_POKEMON=Object.freeze(entries.map(p=>Object.freeze({...p,...resolveStats(p)})));
export const UNCOMMON_BASE_CHANCE=0;
export const UNCOMMON_STARTERS=Object.freeze([{id:'bulbasaur',number:1,name:'이상해씨',types:['풀','독'],energyReward:132},{id:'charmander',number:4,name:'파이리',types:['불꽃'],energyReward:132},{id:'squirtle',number:7,name:'꼬부기',types:['물'],energyReward:132}].map(p=>Object.freeze({...p,...resolveStats({hp:100,attack:10,speed:3000}),rarity:'uncommon',rewards:{hp:10,attack:1,speed:-30}})));
export const STARTER_IDS=Object.freeze(UNCOMMON_STARTERS.map(p=>p.id));
const berryEntries=[
{id:'caterpie',number:10,name:'캐터피',types:['벌레'],hp:90,attack:6,speed:3000,rewards:{hp:7}},
{id:'weedle',number:13,name:'뿔충이',types:['벌레','독'],hp:80,attack:7,speed:3500,rewards:{hp:7}},
{id:'kakuna',number:14,name:'딱충이',types:['벌레','독'],hp:90,attack:5,defense:5,speed:5000,rewards:{hp:10,defense:1}},
{id:'metapod',number:11,name:'단데기',types:['벌레'],hp:100,attack:4,defense:5.5,speed:4500,rewards:{hp:10,defense:1}},
{id:'pikachu',number:25,name:'피카츄',types:['전기'],rarity:'uncommon',hp:350,attack:55,speed:1000,paralysis:43,rewards:{attack:25,paralysis:3.2}},
{id:'jigglypuff',number:39,name:'푸린',types:['노말','페어리'],hp:230,specialAttack:15,speed:3900,energyReward:10,rewards:{specialAttack:4.5}},
{id:'nidoran-m',number:32,name:'니드런♂',types:['독'],energyReward:6.9,hp:460,attack:29.5,speed:2730,accuracy:80,rewards:{attack:14.25}},
{id:'nidoran-f',number:29,name:'니드런♀',types:['독'],energyReward:6.9,hp:550,attack:14.7,speed:2750,poison:40,rewards:{hp:29,poison:1}}
];
// Region 2 energy remains unset except for explicitly configured per-type payouts.
export const BERRY_POKEMON=Object.freeze(berryEntries.map(p=>Object.freeze({...p,...resolveStats(p)})));
export const ALL_POKEMON=Object.freeze([...WILD_POKEMON,...UNCOMMON_STARTERS,...BERRY_POKEMON]);
export const regionForPokemon=id=>BERRY_POKEMON.some(p=>p.id===id)?BERRY_REGION.id:REGION.id;
export const appearedInRegion=(state,regionId)=>regionId===BERRY_REGION.id?
 BERRY_POKEMON.filter(p=>p.id!=='pikachu'||state?.berryRareAppeared===true):
 [...WILD_POKEMON,...UNCOMMON_STARTERS.filter(p=>p.id===state?.uncommonStarterId)];
export const regionUnlockRequirement=state=>Math.ceil(appearedInRegion(state,REGION.id).length*.7);
export const isRegionUnlocked=(state,regionId)=>regionId===REGION.id||
 (regionId===BERRY_REGION.id&&appearedInRegion(state,REGION.id)
  .filter(p=>(state.killCounts?.[p.id]??0)>0).length>=regionUnlockRequirement(state));
export function unlockedCountInRegion(state,regionId){
 const lineup=appearedInRegion(state,regionId);
 const distinct=lineup.filter(p=>(state.killCounts?.[p.id]??0)>0).length;
 return Math.min(lineup.length,INITIAL_UNLOCK_COUNT+distinct);
}
export function isPokemonUnlockedInState(state,id){
 const region=regionForPokemon(id);
 if(!isRegionUnlocked(state,region))return false;
 const lineup=appearedInRegion(state,region);
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
 return [...WILD_POKEMON,...UNCOMMON_STARTERS.filter(p=>p.id===state?.uncommonStarterId)];
}
// Existing battles award the same base to each Pokémon type. Explicit per-type
// overrides allow partial regional rewards without silently awarding all types.
export function battleEnergyRewards(pokemon,count=0){
  const rewards=pokemon.energyRewards??(pokemon.energyReward===undefined?{}:
    Object.fromEntries(pokemon.types.map(type=>[type,pokemon.energyReward])));
  return Object.fromEntries(Object.entries(rewards).map(([type,amount])=>[type,scaledReward('energy',amount,count)]));
}
export const spriteUrl=number=>'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+number+'.png';
export const getWildPokemon=id=>ALL_POKEMON.find(p=>p.id===id)||null;
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
