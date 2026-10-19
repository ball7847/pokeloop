import {WILD_POKEMON,UNCOMMON_BASE_CHANCE} from './wildData.js';
import {emptyCombat,startBattle,advanceBattle,fleeBattle} from './combatEngine.js';
import { DEFAULT_DITTO_STATS } from './dittoStats.js';
import {initialEconomy,tickEconomy,movePlanet,purchaseWithEnergy} from './energySystem.js';
import {buyUpgrade,buyAutomation,toggleAutomation,DEFAULT_AUTOMATION} from './shopSystem.js';
export const PHASE = Object.freeze({ READY:'ready', RUNNING:'running', PAUSED:'paused', FINISHED:'finished' });
export const initialState = () => ({
  phase:PHASE.READY, floor:1, encounterIndex:0, victories:0, runId:0, eventSerial:0,
  dittoStats:{...DEFAULT_DITTO_STATS},
  killCounts:Object.fromEntries(WILD_POKEMON.map(p=>[p.id,0])),
  uncommonChance:UNCOMMON_BASE_CHANCE,uncommonStarterId:null,dexDiscovered:[],
  ...initialEconomy(),
  automation:{...DEFAULT_AUTOMATION},recoveryMs:0,retryPokemonId:null,
  combat:emptyCombat(DEFAULT_DITTO_STATS.hp)
});
export function transition(state, action) {
  switch(action.type) {
    case 'START': return state.phase===PHASE.READY ? {...state,phase:PHASE.RUNNING}:state;
    case 'PAUSE': return state.phase===PHASE.RUNNING ? {...state,phase:PHASE.PAUSED}:state;
    case 'RESUME': return state.phase===PHASE.PAUSED ? {...state,phase:PHASE.RUNNING}:state;
    case 'RESET': return {...initialState(),runId:state.runId+1};
    case 'BUY_UPGRADE': return state.phase===PHASE.RUNNING?buyUpgrade(state,action.id):state;
    case 'BUY_AUTOMATION': return state.phase===PHASE.RUNNING?buyAutomation(state,action.id):state;
    case 'TOGGLE_AUTOMATION': return toggleAutomation(state,action.id);
    case 'RECOVERY_TICK': {
      if(state.phase!==PHASE.RUNNING||state.recoveryMs<=0||!Number.isFinite(action.deltaMs)||action.deltaMs<=0)return state;
      const remaining=Math.max(0,state.recoveryMs-Math.min(action.deltaMs,5000));
      const recovered={...state,recoveryMs:remaining};
      if(remaining===0&&state.retryPokemonId){
        const next=startBattle({...recovered,retryPokemonId:null},state.retryPokemonId);
        return next.combat.active?next:{...recovered,retryPokemonId:null};
      }
      return recovered;
    }
    case 'PURCHASE_WITH_ENERGY': return state.phase===PHASE.RUNNING&&!state.combat.active?purchaseWithEnergy(state,action.costs):state;
    case 'ECONOMY_TICK': return state.phase===PHASE.RUNNING?tickEconomy(state,action.deltaMs/1000):state;
    case 'MOVE_PLANET': {
      if(state.combat.active||state.recoveryMs>0||state.phase===PHASE.PAUSED||state.phase===PHASE.FINISHED)return state;
      const preserved=movePlanet(state);
      return {...initialState(),...preserved,phase:PHASE.RUNNING,runId:state.runId+1,eventSerial:state.eventSerial+1};
    }
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
