import {resolveStats} from './dittoStats.js';
export const REGION = Object.freeze({ id:'starting-plains', name:'시작의 평원', capacity:20, defaultKillLimit:10, rewardDecay:1 });
const WILD_OVERRIDES = [
  {id:'rattata',number:19,name:'꼬렛',hp:3,attack:2,speed:2000,rewards:{attack:1}},
  {id:'pidgey',number:16,name:'구구',hp:6,attack:2.5,speed:2000,rewards:{hp:1}},
  {id:'mankey',number:56,name:'망키',hp:15,attack:4,speed:3000,rewards:{attack:1,hp:1}}
];
export const WILD_POKEMON = Object.freeze(WILD_OVERRIDES.map(p=>Object.freeze({
  ...p,...resolveStats(p)
})));
export const spriteUrl = number => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + number + '.png';
export const getWildPokemon = id => WILD_POKEMON.find(p=>p.id===id) || null;
export const isPokemonUnlocked = (kills,id) => {
  const i=WILD_POKEMON.findIndex(p=>p.id===id);
  return i===0 || i>0 && (kills[WILD_POKEMON[i-1].id]||0)>0;
};
// Rejected Draft base rewardDecay=1: Nth victory awards base/(1+(N-1)*decay).
export function rewardMultiplier(previousVictories,decay=REGION.rewardDecay){
  return 1/(1+Math.max(0,previousVictories)*decay);
}
