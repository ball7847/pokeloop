import {settleBattleOutcome} from '../../src/core/combatEngine.js';
import {getWildPokemon,getKillLimit} from '../../src/core/wildData.js';

// Test-only adapter: supplies an estimated final combat snapshot to the
// same outcome settlement used by real combat. Never called by gameplay.
export function settleExpectedBattle(state,id,estimate,encounterRandom=Math.random){
 const c=state.combat;
 if(!c?.active||c.pokemonId!==id)throw new Error('Expected settlement requires an active matching battle');
 if(estimate.result==='uncertain')return {...state,combat:{...c,lastEvent:{...c.lastEvent}}};
 if(estimate.result!=='victory'&&estimate.result!=='defeat')throw new Error('Unknown estimated battle result: '+estimate.result);
 if(estimate.result==='victory'&&(state.killCounts[id]??0)>=getKillLimit(getWildPokemon(id)))throw new Error('Kill cap exceeded');
 const hp=estimate.result==='defeat'?0:estimate.playerHp;
 const resolved={...c,currentHp:hp,dittoHp:{...c.dittoHp,current:hp},
  playerStatus:estimate.result==='victory'?(estimate.playerStatus??c.playerStatus):c.playerStatus};
 return settleBattleOutcome(state,resolved,estimate.result,encounterRandom);
}
