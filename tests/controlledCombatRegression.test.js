import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {WILD_POKEMON,isPokemonUnlockedInState,isRegionUnlocked,REGION,BERRY_REGION,BERRY_POKEMON,UNCOMMON_BASE_CHANCE} from '../src/core/wildData.js';
import {effectiveDittoStats,upgradeCosts} from '../src/core/shopSystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

function battle(s,id,seed=0.5){
 s=transition(s,{type:'SELECT_WILD',pokemonId:id});
 if(!s.combat.active)return {state:s,kind:'blocked',elapsed:0};
 let elapsed=0;
 while(s.combat.active&&elapsed<180000){
   const before=s;
   s=transition(s,{type:'COMBAT_TICK',deltaMs:500,random:typeof seed==='function'?seed:()=>seed});
   elapsed+=500;
   if(s===before)throw new Error('combat tick stalled '+id);
 }
 if(s.combat.active) return {state:s,kind:'timeout',elapsed};
 const kind=s.combat.lastEvent?.type;
 return {state:s,kind,elapsed};
}
 // Current-economy controlled fixtures, not actual progression or win-rate estimates.
function femaleFixture({hp=1000,attack=60,energy=100,poison=0}={}){
 const s=transition(initialState(),{type:'START'});
 const killCounts={...s.killCounts};
 for(const id of ['rattata','pidgey','mankey','spearow','zubat','meowth','geodude','tauros','caterpie','weedle','taillow','igglybuff','nidoran-m'])killCounts[id]=1;
 return {...s,activeRegionId:BERRY_REGION.id,unlockedLayer:2,killCounts,
  dittoStats:{...s.dittoStats,hp,attack,poison,speed:1000,accuracy:100,minDamagePercent:85,maxDamagePercent:100},
  energyBalances:{...s.energyBalances,노말:energy,물:100,풀:100}};
}
test('current female Nidoran: ordinary battles reset HP/status; hunger carries both and honors cap',()=>{
 let s=femaleFixture();
 assert.equal(BERRY_POKEMON.find(p=>p.id==='nidoran-f').poison,10);
 s=transition(s,{type:'BUY_UPGRADE',id:'antidote'});
 assert.equal(s.energyBalances.물,90);assert.equal(s.energyBalances.풀,90);
 const single=battle(s,'nidoran-f',.5);
 assert.equal(single.kind,'victory');
 assert.equal(single.state.killCounts['nidoran-f'],1);
 const next=transition(single.state,{type:'SELECT_WILD',pokemonId:'nidoran-f'});
 assert.equal(next.combat.currentHp,effectiveDittoStats(single.state).hp);
 assert.equal(next.combat.playerStatus.poison,0);
 let chain=transition(s,{type:'BUY_AUTOMATION',id:'hunger'});
 chain=transition(chain,{type:'SELECT_WILD',pokemonId:'nidoran-f'});
 let first=null,steps=0;
 while(chain.combat.active&&steps++<1000){
  chain=transition(chain,{type:'COMBAT_TICK',deltaMs:100,random:()=>.5});
  if(chain.killCounts['nidoran-f']===1&&!first)first=chain;
 }
 assert.ok(first?.combat.active);
 assert.ok(first.combat.currentHp<effectiveDittoStats(first).hp);
 assert.ok(first.combat.playerStatus.poison>0);
 assert.ok(steps<1000);
 assert.ok(chain.killCounts['nidoran-f']<=10);
});
test('current female Nidoran: seeded remaining HP distributions reflect actual battle and antidote',()=>{
 const seeded=seed=>{let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 const base=femaleFixture({hp:500,attack:60});
 let upgraded=base;
 for(let i=0;i<2;i++)upgraded=transition(upgraded,{type:'BUY_UPGRADE',id:'antidote'});
 assert.equal(upgraded.energyUpgrades.antidote,2);
 const distribution=s=>Array.from({length:32},(_,i)=>{
  const v=battle(s,'nidoran-f',seeded(210011+i*1279));
  assert.equal(v.kind,'victory');
  assert.ok(v.state.combat.currentHp>0&&v.state.combat.currentHp<=effectiveDittoStats(s).hp);
  return v.state.combat.currentHp;
 });
 const raw=distribution(base),mitigated=distribution(upgraded);
 assert.deepEqual(raw,distribution(base));
 assert.ok(mitigated.every((hp,i)=>hp>=raw[i]));
 assert.ok(mitigated.some((hp,i)=>hp>raw[i]));
 console.log('CURRENT_FEMALE_NIDORAN_HP_FIXTURE '+JSON.stringify({raw,mitigated}));
});
test('current poison amplification: high normal cost, atomic purchase, +3% per level and actual poison tick',async()=>{
 const {resolveAttack,advanceBattle,startBattle}=await import('../src/core/combatEngine.js');
 const base=femaleFixture({poison:100,energy:999998});
 assert.deepEqual(upgradeCosts('poisonMultiplier',0),{노말:999999});
 assert.equal(transition(base,{type:'BUY_UPGRADE',id:'poisonMultiplier'}),base);
 const funded={...base,energyBalances:{...base.energyBalances,노말:3000000}};
 const one=transition(funded,{type:'BUY_UPGRADE',id:'poisonMultiplier'});
 const two=transition(one,{type:'BUY_UPGRADE',id:'poisonMultiplier'});
 assert.equal(one.energyBalances.노말,2000001);
 assert.equal(one.particleEarned.노말,999999);
 assert.equal(two.energyUpgrades.poisonMultiplier,2);
 assert.ok(Math.abs(effectiveDittoStats(two).poison-106)<1e-8);
 const tick=s=>{
  let q=startBattle({...s,activeRegionId:REGION.id},'rattata');
  const c=structuredClone(q.combat);
  c.enemy.hp={current:1000,max:1000};
  c.enemy.statistics={...c.enemy.statistics,attack:0,specialAttack:0,regeneration:0,antidote:0};
  c.enemy.attackCooldown={elapsed:0,duration:5000};
  c.dittoAttackCooldown={elapsed:0,duration:5000};
  resolveAttack(c,'player',{attack:0,specialAttack:0,accuracy:100,poison:effectiveDittoStats(s).poison},c.enemy.statistics,()=>.5);
  return 1000-advanceBattle({...q,combat:c},1000,()=>.5).combat.enemy.hp.current;
 };
 assert.equal(tick(base),100);
 assert.ok(Math.abs(tick(two)-106)<1e-8);
});
