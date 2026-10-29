import {compareAmount,subtractAmount,multiplyAmount,storedAmount} from './bigNumber.js';

// Slot indices are zero based; SU identifiers count occupied positions.
export const STELLAR_UPGRADES=Object.freeze({
  노말:Object.freeze({
    0:Object.freeze({id:'SU011',name:'노말에너지 증폭 I',baseCost:10,costGrowth:100,maxLevel:100,description:'전투 노말에너지 획득량 +10%p/레벨'}),
    2:Object.freeze({id:'SU012',name:'우량아',levelCosts:Object.freeze([1,300,1000]),maxLevel:3,description:'HP +10, 공격 +1 (레벨마다 전체 효과 2배)'}),
    4:Object.freeze({id:'SU013',name:'안흔한 증가',baseCost:1,costGrowth:22,maxLevel:35,description:'안흔한 등급 등장 확률 +1%p/레벨'}),
    6:Object.freeze({id:'SU014',name:'거대화',baseCost:100,costGrowth:2.5,maxLevel:1000,description:'HP +10%/레벨 (레벨 간 합연산)'}),
    7:Object.freeze({id:'SU015',name:'강한 힘',baseCost:133,costGrowth:3,maxLevel:1250,description:'공격 +8%/레벨 (레벨 간 합연산)'})
  })
});
export const STELLAR_UPGRADE_BY_ID=Object.freeze(Object.fromEntries(
  Object.values(STELLAR_UPGRADES).flatMap(slots=>Object.values(slots)).map(node=>[node.id,node])
));
export function stellarUpgradeLevel(state,id){
  const level=state.permanentUpgrades?.[id]??0;
  return Number.isSafeInteger(level)&&level>=0?level:0;
}
export const ownsStellarUpgrade=(state,id)=>stellarUpgradeLevel(state,id)>0;
export const stellarUpgradeMaxed=(state,id)=>{
  const node=STELLAR_UPGRADE_BY_ID[id];
  return !!node&&stellarUpgradeLevel(state,id)>=node.maxLevel;
};
export function stellarUpgradeCost(state,id){
  const node=STELLAR_UPGRADE_BY_ID[id];
  if(!node||stellarUpgradeMaxed(state,id))return null;
  if(node.levelCosts)return node.levelCosts[stellarUpgradeLevel(state,id)]??null;
  try{
    const level=stellarUpgradeLevel(state,id);
    // SU014 costs 100*(5/2)^level; retain exact integer arithmetic before storing.
    if(id==='SU014'){
      // Exact decimal cost as a rational number, without floating point drift.
      const numerator=100n*5n**BigInt(level),denominator=2n**BigInt(level);
      const whole=numerator/denominator,rem=numerator%denominator;
      if(rem===0n)return storedAmount(whole.toString());
      const digits=(rem*5n**BigInt(level)).toString().padStart(level,'0').replace(/0+$/,'');
      return storedAmount(whole.toString()+'.'+digits);
    }
    return storedAmount((BigInt(node.baseCost)*BigInt(node.costGrowth)**BigInt(level)).toString());
  }
  catch(error){if(error instanceof RangeError)return null;throw error;}
}
export function stellarChildBonus(state){
  const level=Math.min(3,stellarUpgradeLevel(state,'SU012'));
  const factor=level===0?0:10*2**(level-1);
  return {hp:factor,attack:factor/10};
}
export const stellarUncommonBonus=state=>Math.min(0.35,stellarUpgradeLevel(state,'SU013')*0.01);
export function buyStellarUpgrade(state,id){
  const cost=stellarUpgradeCost(state,id);
  if(cost===null||compareAmount(state.stellar??0,cost)<0)return state;
  return {...state,stellar:subtractAmount(state.stellar,cost),
    permanentUpgrades:{...state.permanentUpgrades,[id]:stellarUpgradeLevel(state,id)+1}};
}
export function stellarBattleEnergyReward(state,type,amount){
  const level=stellarUpgradeLevel(state,'SU011');
  return type==='노말'&&level>0?multiplyAmount(amount,1+level*0.1):amount;
}
