import {decimal,storedAmount,compareAmount} from './bigNumber.js';
import {purchaseWithEnergy} from './energySystem.js';
import {stellarChildBonus} from './stellarUpgrades.js';

// Rejected Draft shop pattern: base cost * growth^currentLevel,
// additive per-level bonuses to the base stat.
export const UPGRADES=Object.freeze([
  {id:'hp',name:'HP 증가',type:'노말',base:1,growth:1.5,bonus:4,unit:'flat',stat:'HP'},
  {id:'attack',name:'공격 증가',type:'노말',base:1,growth:1.5,bonus:1,unit:'flat',stat:'공격'},
  {id:'specialAttack',name:'특수공격 증가',type:'물',base:1,growth:1.5,bonus:1,unit:'flat',stat:'특수공격'},
  {id:'hpMultiplier',name:'HP 증폭',types:['물','땅'],base:10,growth:1.5,bonus:0.04,unit:'percent',stat:'HP'},
  {id:'defense',name:'방어 증가',type:'바위',base:1,growth:1.5,bonus:1,unit:'flat',stat:'방어'},
  {id:'specialDefense',name:'특수방어 증가',type:'페어리',base:1,growth:1.5,bonus:1,unit:'flat',stat:'특수방어'},
  {id:'specialAttackMultiplier',name:'특수공격 증폭',types:['에스퍼','악'],base:10,growth:1.5,bonus:0.04,unit:'percent',stat:'특수공격'},
  {id:'defenseMultiplier',name:'방어 증폭',types:['강철','땅'],base:10,growth:1.5,bonus:0.04,unit:'percent',stat:'방어'},
  {id:'specialDefenseMultiplier',name:'특수방어 증폭',types:['강철','에스퍼'],base:10,growth:1.5,bonus:0.04,unit:'percent',stat:'특수방어'},
  {id:'attackMultiplier',name:'공격 증폭',types:['불꽃','격투'],base:10,growth:1.5,bonus:0.04,unit:'percent',stat:'공격'},
  {id:'speedFlat',name:'스피드 증가',type:'전기',base:10,growth:100,bonus:10,unit:'ms',stat:'스피드'},
  {id:'speed',name:'스피드 증폭',types:['격투','비행'],base:10,growth:100,bonus:0.01,unit:'percent',stat:'스피드'},
  {id:'antidote',name:'해독 증가',type:'독',base:10,growth:1.5,bonus:1,unit:'flat',stat:'해독'},
  {id:'poisonMultiplier',name:'독 증폭',type:'독',base:10,growth:1.5,bonus:0.03,unit:'percent',stat:'독'},
  {id:'regeneration',name:'회복 증가',types:['풀','페어리'],base:10,growth:1.5,bonus:1,unit:'flat',stat:'회복'},
  {id:'regenerationMultiplier',name:'회복 증폭',type:'풀',base:10,growth:1.5,bonus:0.03,unit:'percent',stat:'회복'}
]);
export const AUTOMATIONS=Object.freeze([
  {id:'hunger',name:'끝없는 허기',type:'노말',cost:1,description:'승리 후 현재 HP를 유지하며 같은 적에게 즉시 재도전'},
  {id:'resolve',name:'불굴의 의지',type:'노말',cost:5,description:'패배 후 10초 회복을 마치면 같은 적에게 자동 재도전'}
]);
export const DEFAULT_AUTOMATION=Object.freeze({hunger:false,resolve:false});
export function upgradeCost(id,level){
  const item=UPGRADES.find(x=>x.id===id);
  if(!item||!Number.isSafeInteger(level)||level<0||level>1e6)return null;
  // A mathematically valid level may still produce a cost beyond the supported Decimal range.
  // Treat an unrepresentable cost as maxed instead of crashing the energy tab.
  try{return storedAmount(decimal(item.base).mul(decimal(item.growth).pow(level)));}
  catch(error){if(error instanceof RangeError)return null;throw error;}
}
export function upgradeCosts(id,level){
  const item=UPGRADES.find(x=>x.id===id);
  const cost=upgradeCost(id,level);
  if(!item||cost===null)return null;
  return Object.fromEntries((item.types??[item.type]).map(type=>[type,cost]));
}
export function effectiveDittoStats(state){
  const stats=state.dittoStats;
  const {hp:suHp,attack:suAttack}=stellarChildBonus(state);
  const levels=state.energyUpgrades??{};
  const hpFlat=decimal(levels.hp??0).mul(4),attackFlat=decimal(levels.attack??0);
  const attackMultiplier=1+(levels.attackMultiplier??0)*0.04,hpMultiplier=1+(levels.hpMultiplier??0)*0.04,speed=1+(levels.speed??0)*0.01;
  return {...stats,hp:storedAmount(decimal(stats.hp).add(hpFlat).mul(hpMultiplier).add(suHp)),
    specialAttack:storedAmount(decimal(stats.specialAttack??0).add(levels.specialAttack??0).mul(1+(levels.specialAttackMultiplier??0)*0.04)),
    defense:storedAmount(decimal(stats.defense??0).add(levels.defense??0).mul(1+(levels.defenseMultiplier??0)*0.04)),
    specialDefense:storedAmount(decimal(stats.specialDefense??0).add(levels.specialDefense??0).mul(1+(levels.specialDefenseMultiplier??0)*0.04)),
    regeneration:storedAmount(decimal(stats.regeneration??0).add(levels.regeneration??0).mul(decimal(1).add(decimal(levels.regenerationMultiplier??0).mul(0.03)))),
    attack:storedAmount(decimal(stats.attack).add(attackFlat).mul(attackMultiplier).add(suAttack)),
    antidote:storedAmount(decimal(stats.antidote??0).add(levels.antidote??0)),
    poison:storedAmount(decimal(stats.poison??0).mul(decimal(1).add(decimal(levels.poisonMultiplier??0).mul(0.03)))),
    speed:Math.max(100,(stats.speed-(levels.speedFlat??0)*10)/speed)};
}
export function buyUpgrade(state,id){
  const item=UPGRADES.find(x=>x.id===id);
  if(!item)return state;
  const current=state.energyUpgrades?.[id]??0,costs=upgradeCosts(id,current);
  if(costs===null||Object.entries(costs).some(([type,cost])=>compareAmount(state.energyBalances[type]??0,cost)<0))return state;
  const spent=purchaseWithEnergy(state,costs);
  if(spent===state)return state;
  const updated={...spent,energyUpgrades:{...state.energyUpgrades,[id]:current+1}};
  if(!state.combat.active)return updated;
  // Combat reads effective stats anew on each tick. Preserve current HP when max HP rises.
  const after=effectiveDittoStats(updated);
  // The ongoing attack cycle keeps its original duration. The next cycle
  // picks up the new speed after the next player attack resolves.
  const combat={...state.combat,maxHp:after.hp,
    dittoHp:{...state.combat.dittoHp,max:after.hp}};
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
