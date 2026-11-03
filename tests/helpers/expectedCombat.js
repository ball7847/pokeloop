import {hitChance} from '../../src/core/combatEngine.js';
import {effectiveDittoStats} from '../../src/core/shopSystem.js';
import {getWildPokemon} from '../../src/core/wildData.js';

// An approximation, NOT a combat transition. Never interpreted as an observed win rate.
const number=value=>{const n=Number(value);return Number.isFinite(n)?n:Number.MAX_VALUE/1000;};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const avgChannel=(atk,def,min,max)=>{
 const attack=number(atk??0),defense=number(def??0);
 if(attack<=0)return 0;
 const low=clamp(Math.floor(number(min??85)),0,100000);
 const high=Math.max(low,Math.floor(number(max??100)));
 // Damage range rolls are integer-uniform; zero-damage truncation matters.
 const mid=(low+high)/200;
 return Math.max(0,attack*mid-defense);
};
export function expectedStrike(attacker,defender){
 const accuracy=hitChance(attacker,defender);
 const channels=avgChannel(attacker.attack,defender.defense,attacker.minDamagePercent,attacker.maxDamagePercent)+
   avgChannel(attacker.specialAttack,Math.max(0,number(defender.specialDefense??0)-number(attacker.sound??0)),attacker.minDamagePercent,attacker.maxDamagePercent);
 const critical=clamp(number(attacker.criticalChance??0)/100,0,1);
 const multiplier=number(attacker.criticalMultiplier??150)/100;
 const multi=Math.max(0,number(attacker.multiStrike??0))/1000;
 // Same hit chance and crit distribution for each bonus hit (expected approximation).
 const expectedDamage=accuracy*channels*(1+critical*(multiplier-1))*(1+multi);
 return {expectedDamage,accuracy,expectedPoison:accuracy*number(attacker.poison??0)*(1+multi),
   expectedParalysis:accuracy*number(attacker.paralysis??0)*(1+multi)};
}
function effectivePeriod(attacker,paralysisPerSecond){
 const speed=Math.max(100,number(attacker.speed??3000));
 // A paralysis stack delays the *next* attack 25% of the time.
 // Fixed-point approximation rather than applying a permanent attack cancellation.
 return Math.max(100,speed+Math.max(0,paralysisPerSecond)*speed/1000*0.25);
}
export function estimateExpectedBattle(state,id,{maxSeconds=300,uncertaintyMargin=0.18}={}){
 const pokemon=getWildPokemon(id);
 if(!pokemon)throw new Error('Unknown Pokémon: '+id);
 const player={...effectiveDittoStats(state)},enemy={...pokemon};
 player.attack=number(player.attack)*(1-Math.min(1,number(pokemon.intimidation??0)*0.001));
 enemy.attack=number(enemy.attack)*(1-Math.min(1,number(player.intimidation??0)*0.001));
 const playerMax=number(player.hp),enemyMax=number(enemy.hp);
 let playerHp=clamp(number(state.combat?.currentHp??playerMax),0,playerMax);
 let enemyHp=enemyMax;
 let playerPoison=number(state.combat?.playerStatus?.poison??0),enemyPoison=0;
 let playerParalysis=number(state.combat?.playerStatus?.paralysis??0),enemyParalysis=0;
 const playerStrike=expectedStrike(player,enemy),enemyStrike=expectedStrike(enemy,player);
 let playerActions=0,enemyActions=0;
 let playerClock=Math.max(0,number(player.speed)),enemyClock=Math.max(0,number(enemy.speed));
 let elapsed=0;
 if(playerHp<=0)return {result:'defeat',seconds:0,playerHp:0,uncertain:false,reason:'no-hp'};
 const totalSeconds=Math.max(1,Math.min(300,Math.floor(maxSeconds)));
 // 1-second expected-value integration: at most 300 steps, NOT 500ms combat ticks.
 for(let i=0;i<totalSeconds;i++){
   const ps=expectedPeriod(player,enemyStrike.expectedParalysis/Math.max(0.1,number(enemy.speed)/1000));
   const es=expectedPeriod(enemy,playerStrike.expectedParalysis/Math.max(0.1,number(player.speed)/1000));
   const playerCount=playerClock<=1000?1+Math.floor((1000-playerClock)/ps):0;
   const enemyCount=enemyClock<=1000?1+Math.floor((1000-enemyClock)/es):0;
   playerClock=Math.max(0,playerClock-1000)+playerCount*ps;
   enemyClock=Math.max(0,enemyClock-1000)+enemyCount*es;
   playerActions+=playerCount;enemyActions+=enemyCount;
   // Expected combat action damage and status application; both attacks may resolve
   // within this one-second bucket, hence ties are marked uncertain.
   enemyHp-=playerCount*playerStrike.expectedDamage;
   playerHp-=enemyCount*enemyStrike.expectedDamage;
   enemyPoison+=playerCount*playerStrike.expectedPoison;
   playerPoison+=enemyCount*enemyStrike.expectedPoison;
   enemyParalysis+=playerCount*playerStrike.expectedParalysis;
   playerParalysis+=enemyCount*enemyStrike.expectedParalysis;
   enemyPoison=Math.max(0,enemyPoison-number(enemy.antidote??0));
   playerPoison=Math.max(0,playerPoison-number(player.antidote??0));
   enemyHp-=enemyPoison;playerHp-=playerPoison;
   if(enemyHp>0)enemyHp=Math.min(enemyMax,enemyHp+number(enemy.regeneration??0));
   if(playerHp>0)playerHp=Math.min(playerMax,playerHp+number(player.regeneration??0));
   elapsed++;
   if(enemyHp<=0||playerHp<=0){
     const both=enemyHp<=0&&playerHp<=0;
     const gap=Math.abs(playerHp/playerMax-enemyHp/enemyMax);
     return {result:enemyHp<=0&&!both?'victory':both?'uncertain':'defeat',
       seconds:elapsed,playerHp:Math.max(0,playerHp),enemyHp:Math.max(0,enemyHp),
       playerStatus:{poison:playerPoison,paralysis:playerParalysis},
       uncertain:both||gap<=uncertaintyMargin,reason:both?'simultaneous-expected-ko':gap<=uncertaintyMargin?'close-hp-margin':null,
       playerActions,enemyActions};
   }
 }
 return {result:'uncertain',seconds:elapsed,playerHp:Math.max(0,playerHp),enemyHp:Math.max(0,enemyHp),
   playerStatus:{poison:playerPoison,paralysis:playerParalysis},uncertain:true,reason:'expected-time-limit',
   playerActions,enemyActions};
}
function expectedPeriod(attacker,paralysisPerSecond){
 return effectivePeriod(attacker,paralysisPerSecond);
}
