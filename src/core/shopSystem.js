import {decimal,storedAmount,compareAmount} from './bigNumber.js';
import {purchaseWithEnergy} from './energySystem.js';

// Rejected Draft shop pattern: base cost * growth^currentLevel,
// additive per-level bonuses to the base stat.
export const UPGRADES=Object.freeze([
  {id:'hp',name:'HP 강화',type:'노말',base:1,growth:1.5,bonus:4,unit:'flat',stat:'HP'},
  {id:'attack',name:'공격 강화',type:'노말',base:1,growth:1.5,bonus:1,unit:'flat',stat:'공격'},
  {id:'attackMultiplier',name:'공격 증폭',type:'격투',base:1,growth:1.5,bonus:0.04,unit:'percent',stat:'공격'},
  {id:'speed',name:'공격속도 강화',type:'비행',base:20,growth:1000,bonus:0.01,unit:'percent',stat:'공격속도 배율'},
  {id:'antidote',name:'해독',type:'독',base:10,growth:1.5,bonus:1,unit:'flat',stat:'해독'},
  {id:'poisonMultiplier',name:'독 강화',type:'독',base:10,growth:1.5,bonus:0.03,unit:'percent',stat:'독'}
]);
export const AUTOMATIONS=Object.freeze([
  {id:'hunger',name:'끝없는 허기',type:'노말',cost:1,description:'승리 후 현재 HP를 유지하며 같은 적에게 즉시 재도전'},
  {id:'resolve',name:'불굴의 의지',type:'노말',cost:5,description:'패배 후 10초 회복을 마치면 같은 적에게 자동 재도전'}
]);
export const DEFAULT_AUTOMATION=Object.freeze({hunger:false,resolve:false});
export function upgradeCost(id,level){
  const item=UPGRADES.find(x=>x.id===id);
  if(!item||!Number.isSafeInteger(level)||level<0||level>1e6)return null;
  return storedAmount(decimal(item.base).mul(decimal(item.growth).pow(level)));
}
export function effectiveDittoStats(state){
  const stats=state.dittoStats;
  const levels=state.energyUpgrades??{};
  const hpFlat=decimal(levels.hp??0).mul(4),attackFlat=decimal(levels.attack??0);
  const attackMultiplier=1+(levels.attackMultiplier??0)*0.04,speed=1+(levels.speed??0)*0.01;
  return {...stats,hp:storedAmount(decimal(stats.hp).add(hpFlat)),
    attack:storedAmount(decimal(stats.attack).add(attackFlat).mul(attackMultiplier)),
    antidote:storedAmount(decimal(stats.antidote??0).add(levels.antidote??0)),
    poison:storedAmount(decimal(stats.poison??0).mul(decimal(1).add(decimal(levels.poisonMultiplier??0).mul(0.03)))),
    speed:Math.max(1,stats.speed/speed)};
}
export function buyUpgrade(state,id){
  const item=UPGRADES.find(x=>x.id===id);
  if(!item)return state;
  const current=state.energyUpgrades?.[id]??0,cost=upgradeCost(id,current);
  if(cost===null||compareAmount(state.energyBalances[item.type],cost)<0)return state;
  const spent=purchaseWithEnergy(state,{[item.type]:cost});
  if(spent===state)return state;
  const updated={...spent,energyUpgrades:{...state.energyUpgrades,[id]:current+1}};
  if(!state.combat.active)return updated;
  // Combat reads effective stats anew on each tick. Preserve current HP when max HP rises.
  const before=effectiveDittoStats(state),after=effectiveDittoStats(updated);
  const combat={...state.combat,maxHp:after.hp,
    dittoHp:{...state.combat.dittoHp,max:after.hp}};
  if(state.combat.dittoAttackCooldown&&before.speed!==after.speed){
    const old=state.combat.dittoAttackCooldown;
    const duration=Math.max(1,after.speed);
    const progress=Math.max(0,Math.min(1,old.elapsed/Math.max(1,old.duration)));
    combat.dittoAttackCooldown={...old,duration,elapsed:progress*duration};
  }
  return {...updated,combat};
}
export function buyAutomation(state,id){
  const item=AUTOMATIONS.find(x=>x.id===id);
  if(!item||state.qolUnlocks.includes(id))return state;
  const spent=purchaseWithEnergy(state,{[item.type]:item.cost});
  if(spent===state)return state;
  return {...spent,qolUnlocks:[...state.qolUnlocks,id],
    automation:{...state.automation,[id]:true}};
}
export function toggleAutomation(state,id){
  if(!AUTOMATIONS.some(x=>x.id===id)||!state.qolUnlocks.includes(id))return state;
  return {...state,automation:{...state.automation,[id]:!state.automation[id]},
    retryPokemonId:id==='resolve'&&state.automation.resolve?null:state.retryPokemonId};
}
