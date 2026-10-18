import {WILD_POKEMON,UNCOMMON_BASE_CHANCE} from './wildData.js';
import {emptyCombat,startBattle,advanceBattle,fleeBattle} from './combatEngine.js';
import { DEFAULT_DITTO_STATS } from './dittoStats.js';
export const PHASE = Object.freeze({ READY:'ready', RUNNING:'running', PAUSED:'paused', FINISHED:'finished' });
export const initialState = () => ({
  phase:PHASE.READY, floor:1, encounterIndex:0, victories:0, runId:0, eventSerial:0,
  dittoStats:{...DEFAULT_DITTO_STATS},
  killCounts:Object.fromEntries(WILD_POKEMON.map(p=>[p.id,0])),
  uncommonChance:UNCOMMON_BASE_CHANCE,uncommonStarterId:null,dexDiscovered:[],
  energyBalances:{},discoveredEnergies:[],
  combat:emptyCombat(DEFAULT_DITTO_STATS.hp)
});
export function transition(state, action) {
  switch(action.type) {
    case 'START': return state.phase===PHASE.READY ? {...state,phase:PHASE.RUNNING}:state;
    case 'PAUSE': return state.phase===PHASE.RUNNING ? {...state,phase:PHASE.PAUSED}:state;
    case 'RESUME': return state.phase===PHASE.PAUSED ? {...state,phase:PHASE.RUNNING}:state;
    case 'RESET': return {...initialState(),runId:state.runId+1};
    case 'SELECT_WILD': return startBattle(state,action.pokemonId);
    case 'COMBAT_TICK': return advanceBattle(state,action.deltaMs,action.random);
    case 'FLEE': return fleeBattle(state);
    case 'ENCOUNTER_WON':
      if(state.phase!==PHASE.RUNNING || action.encounterIndex!==state.encounterIndex)return state;
      return {...state,victories:state.victories+1,encounterIndex:state.encounterIndex+1};
    case 'NEXT_FLOOR': return state.phase===PHASE.RUNNING?{...state,floor:state.floor+1,encounterIndex:0}:state;
    case 'FINISH': return state.phase===PHASE.RUNNING?{...state,phase:PHASE.FINISHED}:state;
    default:return state;
  }
}
export function createGameStore() {
 let state=initialState();const listeners=new Set();
 return {getState:()=>state,subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn)},dispatch(action){const next=transition(state,action);if(next!==state){state=next;listeners.forEach(fn=>fn(state,action))}return state}};
}
