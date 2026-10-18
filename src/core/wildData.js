import {resolveStats} from './dittoStats.js';
export const REGION=Object.freeze({id:'starting-plains',name:'시작의 평원',capacity:20,defaultKillLimit:10,rewardDecay:1});
const entries=[
{id:'rattata',number:19,name:'꼬렛',hp:3,attack:2,speed:2100,rewards:{attack:1}},
{id:'pidgey',number:16,name:'구구',hp:6,attack:2.5,speed:2400,rewards:{hp:1}},
{id:'mankey',number:56,name:'망키',hp:20,attack:4,speed:1750,rewards:{hp:5.6,attack:5.7}},
{id:'spearow',number:21,name:'깨비참',hp:12,attack:2.1,speed:1800,rewards:{hp:2.1}},
{id:'zubat',number:41,name:'주뱃',hp:10,attack:1.45,speed:1100,rewards:{attack:1,speed:-20}}
];
export const WILD_POKEMON=Object.freeze(entries.map(p=>Object.freeze({...p,...resolveStats(p)})));
export const UNCOMMON_BASE_CHANCE=0;
export const UNCOMMON_STARTERS=Object.freeze([{id:'bulbasaur',number:1,name:'이상해씨'},{id:'charmander',number:4,name:'파이리'},{id:'squirtle',number:7,name:'꼬부기'}].map(p=>Object.freeze({...p,...resolveStats({hp:100,attack:10,speed:3000}),rarity:'uncommon',rewards:{hp:10,attack:1,speed:-30}})));
export const STARTER_IDS=Object.freeze(UNCOMMON_STARTERS.map(p=>p.id));
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
export const spriteUrl=number=>'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+number+'.png';
export const getWildPokemon=id=>[...WILD_POKEMON,...UNCOMMON_STARTERS].find(p=>p.id===id)||null;
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
