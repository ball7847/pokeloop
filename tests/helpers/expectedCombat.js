import {hitChance} from '../../src/core/combatEngine.js';
import {effectiveDittoStats} from '../../src/core/shopSystem.js';
import {getWildPokemon} from '../../src/core/wildData.js';

// An approximation, NOT a combat transition. Never interpreted as an observed win rate.
const number=value=>Number(value??0);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
// Closed-form average over inclusive integer damage rolls, after defense clipping.
export function averageDamageChannel(atk,def,min=85,max=100){
 const attack=number(atk??0),defense=Math.max(0,number(def??0));
 if(attack<=0)return {mean:0,positive:0};
 const low=Math.max(0,Math.floor(number(min))),high=Math.max(low,Math.floor(number(max)));
 const first=Math.max(low,Math.floor(defense/attack*100)+1);
 if(first>high)return {mean:0,positive:0};
 const n=high-first+1,total=high-low+1;
 return {mean:Math.max(0,attack*((first+high)/200)-defense)*n/total,positive:n/total};
}
export function expectedStrike(attacker,defender){
 const accuracy=hitChance(attacker,defender);
 const physical=averageDamageChannel(attacker.attack,Math.max(0,number(defender.defense??0)-number(attacker.piercing??0)),attacker.minDamagePercent,attacker.maxDamagePercent);
 const special=averageDamageChannel(attacker.specialAttack,Math.max(0,number(defender.specialDefense??0)-number(attacker.sound??0)),attacker.minDamagePercent,attacker.maxDamagePercent);
 const channels=physical.mean+special.mean;
 const positive=1-(1-physical.positive)*(1-special.positive);
 const critical=clamp(number(attacker.criticalChance??0)/100,0,1);
 const multiplier=number(attacker.criticalMultiplier??150)/100;
 const rawMulti=Math.max(0,number(attacker.multiStrike??0))/1000;
 const multi=Math.min(1000,Math.floor(rawMulti))+rawMulti%1;
 // Same hit chance and crit distribution for each bonus hit (expected approximation).
 const expectedDamage=accuracy*channels*(1+critical*(multiplier-1))*(1+multi);
 return {expectedDamage,accuracy,damagingHits:accuracy*positive*(1+multi),expectedPoison:accuracy*number(attacker.poison??0)*(1+multi),
   expectedParalysis:accuracy*number(attacker.paralysis??0)*(1+multi)};
}
// Approximate free counter actions from damaging hits, without recursive counters.
export function expectedCounterActions(strike,defender,remainingHp){
 return remainingHp>0?strike.damagingHits*clamp(number(defender.counter??0)/100,0,1):0;
}
// Event-ordered mean-field model. It cannot model survival probabilities;
// hybrid validates every prediction against the exact engine.
export function estimateExpectedBattle(state,id,{maxSeconds=300,uncertaintyMargin=0.18}={}){
 const pokemon=getWildPokemon(id);
 if(!pokemon)throw Error('Unknown Pokémon: '+id);
 const c=state.combat,player={...effectiveDittoStats(state)},enemy={...(c?.enemy?.statistics??pokemon)};
 const duration=Math.min(300,Math.max(0,maxSeconds))*1000;
 const unsupported=[player,enemy,c?.playerStatus??{},c?.enemyStatus??{}].some(o=>Object.values(o).some(v=>(typeof v==='number'||typeof v==='string'&&/^\d/.test(v))&&!Number.isFinite(Number(v))));
 if(unsupported)return {result:'uncertain',seconds:0,uncertain:true,reason:'numeric-range'};
 player.attack=number(player.attack)*(1-(c?.intimidationDebuffs?.player??Math.min(1,number(enemy.intimidation)*.001)));
 enemy.attack=number(enemy.attack)*(1-(c?.intimidationDebuffs?.enemy??Math.min(1,number(player.intimidation)*.001)));
 const make=(stats,hp,status,timer)=>({stats,max:number(stats.hp),hp:number(hp??stats.hp),poison:number(status?.poison),paralysis:number(status?.paralysis),clock:Math.max(0,number(timer?.duration??stats.speed)-number(timer?.elapsed)),actions:0});
 const p=make(player,c?.currentHp,c?.playerStatus,c?.dittoAttackCooldown),e=make(enemy,c?.enemy?.hp?.current,c?.enemyStatus,c?.enemy?.attackCooldown);
 let elapsed=0,second=1000-number(c?.regenerationElapsedMs);
 const stochastic=[p,e].some(x=>number(x.stats.criticalChance)>0||number(x.stats.multiStrike)>0||number(x.stats.counter)>0||number(x.stats.paralysis)>0||x.paralysis>0||x.poison>0||number(x.stats.poison)>0||number(x.stats.regeneration)>0)||hitChance(player,enemy)<1||hitChance(enemy,player)<1;
 function action(a,b,weight=1,allowCounter=true){
  const delay=a.paralysis*.25*weight;a.paralysis*=1-.25*weight;
  const strike=expectedStrike(a.stats,b.stats);
  // Truncate the mean hit sequence at the first expected lethal hit.
  const rawMulti=Math.max(0,number(a.stats.multiStrike))/1000;
  const hits=1+Math.min(1000,Math.floor(rawMulti))+rawMulti%1;
  const perHit=strike.expectedDamage/hits*weight;
  for(let left=hits;left>0&&a.hp>0&&b.hp>0;left-=1){
   const share=Math.min(1,left);
   b.hp=Math.max(0,b.hp-perHit*share);
   b.poison+=strike.expectedPoison/hits*weight*share;
   b.paralysis+=strike.expectedParalysis/hits*weight*share;
   if(allowCounter&&b.hp>0&&perHit>0){
    const counter=expectedCounterActions({...strike,damagingHits:strike.damagingHits/hits},b.stats,b.hp)*weight*share;
    if(counter>0)action(b,a,counter,false);
   }
  }
  return delay;
 }
 const statusTick=x=>{if(x.hp<=0)return;x.poison=Math.max(0,x.poison-number(x.stats.antidote));x.hp=Math.max(0,x.hp-x.poison);if(x.hp>0)x.hp=Math.min(x.max,x.hp+number(x.stats.regeneration));};
 function finish(result,reason){
  const margin=result==='victory'?p.hp/p.max:result==='defeat'?e.hp/e.max:0;
  const uncertain=result==='uncertain'||stochastic||margin<=uncertaintyMargin;
  return {result,seconds:elapsed/1000,playerHp:p.hp,enemyHp:e.hp,playerStatus:{poison:p.poison,paralysis:p.paralysis},uncertain,reason:reason??(stochastic?'stochastic-mechanics':uncertain?'close-hp-margin':null),playerActions:p.actions,enemyActions:e.actions};
 }
 for(let i=0;i<10000&&elapsed<duration;i++){
  if(p.hp<=0||e.hp<=0)break;
  const delta=Math.min(duration-elapsed,p.clock,e.clock,second);
  elapsed+=delta;p.clock-=delta;e.clock-=delta;second-=delta;
  if(second<=1e-8){statusTick(p);statusTick(e);second=1000;}
  if(p.hp<=0||e.hp<=0)break;
  if(p.clock<=1e-8){p.actions++;p.clock=Math.max(100,number(player.speed)+action(p,e));}
  if(p.hp<=0||e.hp<=0)break;
  if(e.clock<=1e-8){e.actions++;e.clock=Math.max(100,number(enemy.speed)+action(e,p));}
  if(![p.hp,e.hp,p.poison,e.poison,p.paralysis,e.paralysis,p.clock,e.clock].every(Number.isFinite))return {result:'uncertain',seconds:elapsed/1000,uncertain:true,reason:'numeric-range'};
 }
 if(p.hp<=0&&e.hp<=0)return finish('uncertain','simultaneous-expected-ko');
 if(p.hp<=0)return finish('defeat');
 if(e.hp<=0)return finish('victory');
 return finish('uncertain','expected-time-limit');
}
