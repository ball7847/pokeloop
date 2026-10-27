import {compareAmount,subtractAmount,multiplyAmount} from './bigNumber.js';

// Physical slot indices are 0-based. The SU number counts only occupied
// positions, not empty honeycomb cells.
export const STELLAR_UPGRADES=Object.freeze({
  노말:Object.freeze({
    0:Object.freeze({id:'SU011',name:'HP 강화 I',cost:1,description:'HP +10',stat:'hp',bonus:10}),
    1:Object.freeze({id:'SU012',name:'공격 강화 I',cost:1,description:'공격 +1',stat:'attack',bonus:1}),
    3:Object.freeze({id:'SU013',name:'노말에너지 증폭 I',cost:1,description:'전투 노말에너지 획득량 +10%',energyType:'노말',multiplier:1.1})
  })
});
export const STELLAR_UPGRADE_BY_ID=Object.freeze(Object.fromEntries(
  Object.values(STELLAR_UPGRADES).flatMap(slots=>Object.values(slots)).map(node=>[node.id,node])
));
export function ownsStellarUpgrade(state,id){
  return state.permanentUpgrades?.[id]===1;
}
export function buyStellarUpgrade(state,id){
  const node=STELLAR_UPGRADE_BY_ID[id];
  if(!node||ownsStellarUpgrade(state,id)||compareAmount(state.stellar??0,node.cost)<0)return state;
  return {...state,stellar:subtractAmount(state.stellar,node.cost),
    permanentUpgrades:{...state.permanentUpgrades,[id]:1}};
}
export function stellarBattleEnergyReward(state,type,amount){
  return type==='노말'&&ownsStellarUpgrade(state,'SU013')?multiplyAmount(amount,1.1):amount;
}
