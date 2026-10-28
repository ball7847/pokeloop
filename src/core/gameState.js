import {prepareNextPlanet} from './planetTransition.js';
import {ALL_POKEMON,UNCOMMON_BASE_CHANCE,REGION,isRegionUnlocked,regionForPokemon} from './wildData.js';
import {emptyCombat,startBattle,advanceBattle,fleeBattle} from './combatEngine.js';
import { DEFAULT_DITTO_STATS } from './dittoStats.js';
import {initialEconomy,tickEconomy,purchaseWithEnergy,buyPointCirculation} from './energySystem.js';
import {buyUpgrade,buyAutomation,toggleAutomation,DEFAULT_AUTOMATION,effectiveDittoStats} from './shopSystem.js';
import {buyStellarUpgrade} from './stellarUpgrades.js';
export const PHASE = Object.freeze({ READY:'ready', RUNNING:'running', PAUSED:'paused', FINISHED:'finished' });
export const initialState = () => ({
  phase:PHASE.READY, floor:1, encounterIndex:0, victories:0, runId:0, eventSerial:0,
  dittoStats:{...DEFAULT_DITTO_STATS},
  killCounts:Object.fromEntries(ALL_POKEMON.map(p=>[p.id,0])),
  activeRegionId:REGION.id,berryRareAppeared:false,evolutionResults:{},
  uncommonChance:UNCOMMON_BASE_CHANCE,uncommonStarterId:null,raritySlotResults:null,
  rarityGuarantees:[],rarityBanishments:[],raritySpecialUnlocks:[],dexDiscovered:[],
  dexLifetimeKills:{},itemRunProgress:{},itemLifetimeProgress:{},itemPending:[],itemOwned:[],
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
    case 'BUY_STELLAR_UPGRADE': {
      if(state.phase!==PHASE.RUNNING)return state;
      const purchased=buyStellarUpgrade(state,action.id);
      if(purchased===state||!state.combat.active)return purchased;
      const hp=effectiveDittoStats(purchased).hp;
      return {...purchased,combat:{...purchased.combat,maxHp:hp,dittoHp:{...purchased.combat.dittoHp,max:hp}}};
    }
    case 'BUY_CIRCULATION': return state.phase===PHASE.RUNNING?buyPointCirculation(state):state;
    case 'BUY_UPGRADE': return state.phase===PHASE.RUNNING?buyUpgrade(state,action.id):state;
    case 'BUY_AUTOMATION': return state.phase===PHASE.RUNNING?buyAutomation(state,action.id):state;
    case 'TOGGLE_AUTOMATION': return toggleAutomation(state,action.id);
    case 'RECOVERY_TICK': {
      if(state.phase!==PHASE.RUNNING||state.recoveryMs<=0||!Number.isFinite(action.deltaMs)||action.deltaMs<=0)return state;
      const remaining=Math.max(0,state.recoveryMs-Math.min(action.deltaMs,5000));
      const recovered={...state,recoveryMs:remaining};
      if(remaining===0&&state.retryPokemonId){
        const targetRegion=regionForPokemon(state.retryPokemonId);
        const next=startBattle({...recovered,retryPokemonId:null,activeRegionId:targetRegion},state.retryPokemonId);
        return next.combat.active?next:{...recovered,retryPokemonId:null};
      }
      return recovered;
    }
    case 'PURCHASE_WITH_ENERGY': return state.phase===PHASE.RUNNING&&!state.combat.active?purchaseWithEnergy(state,action.costs):state;
    case 'ECONOMY_TICK': return state.phase===PHASE.RUNNING?tickEconomy(state,action.deltaMs/1000):state;
    case 'MOVE_PLANET': {
      if(state.combat.active||state.recoveryMs>0||state.phase===PHASE.PAUSED||state.phase===PHASE.FINISHED)return state;
      const random=typeof action.random==='function'?action.random:Math.random;
      return {...initialState(),...prepareNextPlanet(state,random),
        phase:PHASE.RUNNING,runId:state.runId+1,eventSerial:state.eventSerial+1};
    }
    case 'SELECT_REGION': return !state.combat.active&&isRegionUnlocked(state,action.regionId)?{...state,activeRegionId:action.regionId}:state;
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
