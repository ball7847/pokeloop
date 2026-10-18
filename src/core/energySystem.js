import {addAmount,divideAmount,multiplyAmount,compareAmount,decimal,storedAmount} from './bigNumber.js';

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
export const typeLayer=type=>LAYERS.findIndex(layer=>layer.types.includes(type))+1;
const zeros=()=>Object.fromEntries(TYPES.map(type=>[type,0]));
export function initialEconomy(){
  return {essences:zeros(),energyBalances:zeros(),energyEarned:zeros(),energyBank:zeros(),energyMilestones:zeros(),
    unlockedLayer:1,normalFirstMilestonePermanent:false,pendingStellar:0,stellar:0,totalStellarEarned:0,planetMoves:0,
    essenceUpgrades:{},qolUnlocks:[],permanentUpgrades:{}};
}
export function energyMilestoneThreshold(level){
  if(level<=0)return FIRST_MILESTONE;
  // Next milestone scaling is data-driven; first 1025 threshold is canonical.
  return storedAmount(decimal(FIRST_MILESTONE).mul(decimal(1e3).pow(level)));
}
export function productionMultiplier(milestones){
  // Rejected Draft: milestone 1 -> x1; 2-4 -> x1000 each; 5-7 -> x1e6 each; 8+ -> x1e9.
  let d=decimal(1);
  for(let i=2;i<=Math.min(milestones,10);i++)d=d.mul(i<=4?1e3:i<=7?1e6:1e9);
  return storedAmount(d);
}
function processMilestones(economy){
  let e={...economy,energyMilestones:{...economy.energyMilestones}};
  for(let pass=0;pass<10;pass++){
    let changed=false;
    for(const type of TYPES){
      if(typeLayer(type)>e.unlockedLayer)continue;
      const level=e.energyMilestones[type];
      if(level<10&&compareAmount(e.energyEarned[type],energyMilestoneThreshold(level))>=0){
        e.energyMilestones[type]=level+1;changed=true;
      }
    }
    if(e.energyMilestones['노말']>=1&&!e.normalFirstMilestonePermanent)e.normalFirstMilestonePermanent=true;
    const next=LAYERS[e.unlockedLayer-1];
    if(next&&e.unlockedLayer<LAYERS.length&&next.types.some(type=>e.energyMilestones[type]>=1)){
      e.unlockedLayer++;changed=true;
      const bank={...e.energyBank},energy={...e.energyBalances},earned={...e.energyEarned};
      for(const type of LAYERS[e.unlockedLayer-1].types){
        energy[type]=addAmount(energy[type],bank[type]);
        earned[type]=addAmount(earned[type],bank[type]);bank[type]=0;
      }
      e={...e,energyBank:bank,energyBalances:energy,energyEarned:earned};
    }
    if(!changed)break;
  }
  return e;
}
export function grantBattleEssence(state,types,amount){
  if(compareAmount(amount,0)<=0)return state;
  const essence={...state.essences},energy={...state.energyBalances},earned={...state.energyEarned},bank={...state.energyBank};
  for(const type of new Set(types)){
    if(!TYPES.includes(type))continue;
    if(typeLayer(type)>state.unlockedLayer){
      bank[type]=addAmount(bank[type],amount);
    }else{
      essence[type]=addAmount(essence[type],amount);
      energy[type]=addAmount(energy[type],amount);
      earned[type]=addAmount(earned[type],amount);
    }
  }
  return processMilestones({...state,essences:essence,energyBalances:energy,energyEarned:earned,energyBank:bank});
}
export function energyRates(state){
  const rates=zeros();
  for(let layer=2;layer<=state.unlockedLayer;layer++){
    const upper=LAYERS[layer-1],lower=LAYERS[layer-2];
    // A multi-type upper layer uses the arithmetic mean of its type outputs.
    let sum=decimal(0);
    for(const type of upper.types){
      const amount=state.energyBalances[type];
      const mult=productionMultiplier(state.energyMilestones[type]);
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
  if(!state.energyBalances)return state;
  const rates=energyRates(state),energy={...state.energyBalances},earned={...state.energyEarned};
  // Analytic integrated chain: simultaneous continuous production with constant multipliers.
  // Dividing into short steps captures cascading output without tying gains to UI frame rate.
  const steps=Math.max(1,Math.ceil(seconds/0.05)),dt=seconds/steps;
  let pending=state.pendingStellar;
  for(let step=0;step<steps;step++){
    const current={...state,energyBalances:energy};
    const currentRates=energyRates(current);
    const normal=decimal(energy['노말']).mul(productionMultiplier(state.energyMilestones['노말']));
    if(state.energyMilestones['노말']>0){
      pending=addAmount(pending,storedAmount(normal.mul(dt).mul(originalSoftcapMultiplier(pending,state.totalStellarEarned,state.planetMoves))));
    }
    for(const type of TYPES){
      if(compareAmount(currentRates[type],0)>0){
        const gain=multiplyAmount(currentRates[type],dt);
        energy[type]=addAmount(energy[type],gain);earned[type]=addAmount(earned[type],gain);
      }
    }
  }
  return processMilestones({...state,energyBalances:energy,energyEarned:earned,pendingStellar:pending});
}
export function movePlanet(state){
  const base=initialEconomy(),carry=state.normalFirstMilestonePermanent||state.energyMilestones['노말']>=1;
  const stellarGain=state.pendingStellar;
  return {...base,stellar:addAmount(state.stellar,stellarGain),totalStellarEarned:addAmount(state.totalStellarEarned,stellarGain),
    normalFirstMilestonePermanent:carry,planetMoves:state.planetMoves+1,unlockedLayer:carry?2:1,
    energyMilestones:{...base.energyMilestones,노말:carry?1:0},permanentUpgrades:{...state.permanentUpgrades}};
}
