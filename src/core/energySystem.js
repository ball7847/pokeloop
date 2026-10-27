import {addAmount,subtractAmount,multiplyAmount,compareAmount,decimal,storedAmount,isAmount} from './bigNumber.js';

// The 18 Pokémon types are independent currencies. The order of layers is fixed.
export const TYPES=Object.freeze(['노말','불꽃','물','풀','전기','얼음','격투','독','땅','비행','에스퍼','벌레','바위','고스트','드래곤','악','강철','페어리']);
export const LAYERS=Object.freeze([
  {name:'세계',types:['노말']},
  {name:'탄생',types:['불꽃','물','풀']},
  {name:'에너지',types:['전기']},
  {name:'생태계',types:['벌레','비행']},
  {name:'대지',types:['땅','바위']},
  {name:'전쟁',types:['격투','에스퍼','악']},
  {name:'진보',types:['강철','독']},
  {name:'죽음',types:['얼음','고스트']},
  {name:'불멸',types:['드래곤']},
  {name:'초월',types:['페어리']}
].map((layer,index)=>Object.freeze({...layer,level:index+1,types:Object.freeze(layer.types)})));
export const FIRST_MILESTONE=1025;
export const POINT_CIRCULATION=Object.freeze({id:'point',name:'점의 순환',costs:Object.freeze({노말:10,벌레:10,비행:10}),production:Object.freeze({노말:0.5})});
export function buyPointCirculation(state){
  if(state.pointCirculationUnlocked)return state;
  const purchased=purchaseWithEnergy(state,POINT_CIRCULATION.costs);
  return purchased===state?state:{...purchased,pointCirculationUnlocked:true};
}

const layerByType=new Map(LAYERS.flatMap(layer=>layer.types.map(type=>[type,layer.level])));
export const typeLayer=type=>layerByType.get(type)??0;
const zeros=()=>Object.fromEntries(TYPES.map(type=>[type,0]));
export function initialEconomy(){
  return {energyBalances:zeros(),particleBalances:zeros(),particleEarned:zeros(),particleBank:zeros(),particleMilestones:zeros(),
    unlockedLayer:1,normalFirstMilestonePermanent:false,pendingStellar:0,stellar:0,totalStellarEarned:0,planetMoves:0,
    energyUpgrades:{},qolUnlocks:[],permanentUpgrades:{},pointCirculationUnlocked:false};
}
export function particleMilestoneThreshold(level){
  if(level<=0)return FIRST_MILESTONE;
  // First particle milestone is 1025; later thresholds currently use the provisional existing progression.
  return storedAmount(decimal(FIRST_MILESTONE).mul(decimal(1e3).pow(level)));
}
// Milestones are bounded to 0..10; cache their immutable production factors
// rather than recomputing Decimal powers on every economy substep.
const productionMultipliers=Array.from({length:11},(_,level)=>{
  let d=decimal(1);
  for(let i=2;i<=level;i++)d=d.mul(i<=4?1e3:i<=7?1e6:1e9);
  return storedAmount(d);
});
export function productionMultiplier(milestones){
  if(!Number.isFinite(milestones)||milestones<0)return productionMultipliers[0];
  return productionMultipliers[Math.min(10,Math.floor(milestones))];
}
function processMilestones(economy){
  let e={...economy,particleMilestones:{...economy.particleMilestones}};
  for(let pass=0;pass<12;pass++){
    let changed=false;
    for(const type of TYPES){
      if(typeLayer(type)>e.unlockedLayer)continue;
      const level=e.particleMilestones[type];
      if(level<10&&compareAmount(e.particleEarned[type],particleMilestoneThreshold(level))>=0){
        e.particleMilestones[type]=level+1;changed=true;
      }
    }
    if(e.particleMilestones['노말']>=1&&!e.normalFirstMilestonePermanent)e.normalFirstMilestonePermanent=true;
    const current=LAYERS[e.unlockedLayer-1];
    if(current&&e.unlockedLayer<LAYERS.length&&current.types.some(type=>e.particleMilestones[type]>=1)){
      e.unlockedLayer++;changed=true;
      const bank={...e.particleBank},particles={...e.particleBalances},earned={...e.particleEarned};
      for(const type of LAYERS[e.unlockedLayer-1].types){
        particles[type]=addAmount(particles[type],bank[type]);
        earned[type]=addAmount(earned[type],bank[type]);
        bank[type]=0;
      }
      e={...e,particleBank:bank,particleBalances:particles,particleEarned:earned};
    }
    if(!changed)break;
  }
  return e;
}
// Battles award spendable type energy only. No particle generation occurs at battle end.
export function grantBattleEnergy(state,types,amount){
  if(!isAmount(amount)||compareAmount(amount,0)<=0)return state;
  const energy={...state.energyBalances};
  for(const type of new Set(types)){
    if(TYPES.includes(type))energy[type]=addAmount(energy[type],amount);
  }
  return {...state,energyBalances:energy};
}
// All shop purchases must use this atomic operation, never subtract energy directly.
// Costs are keyed by type; each spent unit creates one particle of that type.
// A locked layer banks 100% until it unlocks. No energy is retroactively deducted.
export function purchaseWithEnergy(state,costs){
  if(!costs||typeof costs!=='object'||Array.isArray(costs)||!Object.keys(costs).length)return state;
  const entries=Object.entries(costs);
  if(entries.some(([type,amount])=>!TYPES.includes(type)||!isAmount(amount)||compareAmount(amount,0)<=0||
      compareAmount(state.energyBalances[type]??0,amount)<0))return state;
  const energy={...state.energyBalances},particles={...state.particleBalances},
    earned={...state.particleEarned},bank={...state.particleBank};
  for(const [type,amount] of entries){
    energy[type]=subtractAmount(energy[type],amount);
    if(typeLayer(type)>state.unlockedLayer)bank[type]=addAmount(bank[type],amount);
    else{
      particles[type]=addAmount(particles[type],amount);
      earned[type]=addAmount(earned[type],amount);
    }
  }
  return processMilestones({...state,energyBalances:energy,particleBalances:particles,particleEarned:earned,particleBank:bank});
}
export function particleRates(state){
  const rates=zeros();
  for(let layer=2;layer<=state.unlockedLayer;layer++){
    const upper=LAYERS[layer-1],lower=LAYERS[layer-2];
    // A multi-type upper layer uses the arithmetic mean of its type outputs.
    let sum=decimal(0);
    for(const type of upper.types){
      if(state.particleMilestones[type]<=0)continue;
      const amount=state.particleBalances[type];
      const mult=productionMultiplier(state.particleMilestones[type]);
      sum=sum.add(decimal(amount).mul(mult));
    }
    const output=sum.div(upper.types.length).div(lower.types.length);
    for(const type of lower.types)rates[type]=storedAmount(output);
  }
  return rates;
}
function originalSoftcapMultiplier(pending,total,planetMoves){
  // Source game: 1st Redraw threshold ~1000; later threshold is lifetime QE.
  const threshold=planetMoves===0?decimal(1000):decimal(total);
  if(threshold.lte(0)||decimal(pending).lt(threshold))return 1;
  const ratio=decimal(pending).div(threshold).toNumber();
  const tier=Math.max(0,Math.floor(Math.log2(ratio))+1);
  let penalty=Math.pow(2,-tier);
  for(let i=1;i<=Math.floor(tier/10);i++)penalty/=Math.max(2,i*10);
  return penalty;
}
export function tickEconomy(state,seconds){
  if(!Number.isFinite(seconds)||seconds<=0||seconds>5)return state;
  if(!state.particleBalances)return state;
  // An untouched first layer has no producer and cannot generate stellar energy.
  // Avoid 20 Decimal-heavy substeps and a no-op Zustand update each tick.
  if(state.unlockedLayer===1&&(state.particleMilestones?.['노말']??0)===0&&!state.pointCirculationUnlocked)return state;
  const particles={...state.particleBalances},earned={...state.particleEarned};
  // Time-stepped cascading particle production with fixed milestone multipliers.
  // Dividing into short steps captures cascading output without tying gains to UI frame rate.
  const steps=Math.max(1,Math.ceil(seconds/0.05)),dt=seconds/steps;
  let pending=state.pendingStellar;
  for(let step=0;step<steps;step++){
    const current={...state,particleBalances:particles};
    const currentRates=particleRates(current);
    const normal=decimal(particles['노말']).mul(productionMultiplier(state.particleMilestones['노말']));
    if(state.particleMilestones['노말']>0){
      pending=addAmount(pending,storedAmount(normal.mul(dt).mul(originalSoftcapMultiplier(pending,state.totalStellarEarned,state.planetMoves))));
    }
    for(const type of TYPES){
      if(compareAmount(currentRates[type],0)>0){
        const gain=multiplyAmount(currentRates[type],dt);
        particles[type]=addAmount(particles[type],gain);earned[type]=addAmount(earned[type],gain);
      }
    }
  }
  const energy=state.pointCirculationUnlocked?
    {...state.energyBalances,노말:addAmount(state.energyBalances['노말']??0,multiplyAmount(POINT_CIRCULATION.production['노말'],seconds))}:
    state.energyBalances;
  return processMilestones({...state,energyBalances:energy,particleBalances:particles,particleEarned:earned,pendingStellar:pending});
}
export function movePlanet(state){
  const base=initialEconomy(),carry=state.normalFirstMilestonePermanent||state.particleMilestones['노말']>=1;
  const stellarGain=state.pendingStellar;
  return {...base,stellar:addAmount(state.stellar,stellarGain),totalStellarEarned:addAmount(state.totalStellarEarned,stellarGain),
    normalFirstMilestonePermanent:carry,planetMoves:state.planetMoves+1,unlockedLayer:carry?2:1,
    particleMilestones:{...base.particleMilestones,노말:carry?1:0},permanentUpgrades:{...state.permanentUpgrades}};
}
