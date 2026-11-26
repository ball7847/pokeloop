import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {UPGRADES,upgradeCost,effectiveDittoStats} from '../src/core/shopSystem.js';
import {grantBattleEnergy} from '../src/core/energySystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

const buy=(state,type,id)=>transition(state,{type,id});
const funded=()=>({...initialState(),phase:'running',unlockedLayer:10,energyBalances:{...initialState().energyBalances,노말:1000,풀:1000,격투:1000,불꽃:1000,물:1000,땅:1000,비행:1000}});
test('normal flat HP/ATK and fire attack multiplier scale independently',()=>{
 let s=funded();
 for(const id of ['hp','hp','attack','attackMultiplier'])s=buy(s,'BUY_UPGRADE',id);
 assert.equal(effectiveDittoStats(s).hp,18);
 assert.equal(effectiveDittoStats(s).attack,2.08);
 assert.equal(s.energyBalances.노말,986.6);
 assert.equal(s.energyBalances.불꽃,990);
 assert.equal(s.particleBalances.노말,13.4);
 assert.equal(s.particleBalances.불꽃,10);
 assert.equal(upgradeCost('hp',1),1.4);
 assert.ok(Math.abs(upgradeCost('attack',2)-1.96)<1e-9);
 assert.equal(upgradeCost('attackMultiplier',1),18);
 assert.equal(buy(s,'BUY_UPGRADE','speed'),s);
});
test('flat upgrades also apply to earned kill rewards before fighting multiplier',()=>{
 const s=funded();
 const withRewards={...s,dittoStats:{...s.dittoStats,hp:31,attack:7.5},energyUpgrades:{hp:3,attack:2,attackMultiplier:4}};
 assert.equal(effectiveDittoStats(withRewards).hp,43);
 assert.equal(effectiveDittoStats(withRewards).attack,11.02);
});
test('automation purchases cost confirmed energy and unlock controls',()=>{
  let s=funded();
  s=buy(s,'BUY_AUTOMATION','hunger');
  s=buy(s,'BUY_AUTOMATION','resolve');
  assert.deepEqual(s.qolUnlocks,['hunger','resolve']);
  assert.equal(s.energyBalances.노말,994);
  assert.equal(s.energyBalances.격투,1000);
  assert.equal(s.automation.hunger,true);
  assert.equal(s.automation.resolve,true);
  assert.equal(buy(s,'BUY_AUTOMATION','hunger'),s);
  s=buy(s,'TOGGLE_AUTOMATION','hunger');
  assert.equal(s.automation.hunger,false);
});
test('hunger carries damaged HP and runs until ten victories without recovery',()=>{
  let s=funded();
  s=buy(s,'BUY_AUTOMATION','hunger');
  s={...s,dittoStats:{...s.dittoStats,attack:10000,speed:1}};
  s=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
  assert.equal(s.combat.active,true);
  for(let count=1;count<=10;count++){
    const hp= count===1?4:s.combat.currentHp;
    s={...s,combat:{...s.combat,currentHp:hp,dittoHp:{...s.combat.dittoHp,current:hp}}};
    s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
    assert.equal(s.killCounts.rattata,count);
    assert.equal(s.recoveryMs,0);
    if(count<10){assert.equal(s.combat.active,true);assert.equal(s.combat.currentHp,4);}
    else assert.equal(s.combat.active,false);
  }
  assert.equal(s.energyBalances.노말>0,true);
});
test('defeat cooldown 10s and resolve auto retry only after recovery',()=>{
  let s=funded();
  s=buy(s,'BUY_AUTOMATION','resolve');
  s=transition(s,{type:'SELECT_WILD',pokemonId:'mankey'});
  s={...s,dittoStats:{...s.dittoStats,hp:1,attack:0},combat:{...s.combat,currentHp:1,dittoHp:{current:1,max:1}}};
  s=transition(s,{type:'COMBAT_TICK',deltaMs:1900,random:()=>0.5});
  assert.equal(s.combat.active,false);
  assert.equal(s.recoveryMs,10000);
  assert.equal(s.retryPokemonId,'mankey');
  assert.equal(transition(s,{type:'SELECT_WILD',pokemonId:'rattata'}),s);
  s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
  assert.equal(s.recoveryMs,5000);
  s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
  assert.equal(s.combat.active,true);
  assert.equal(s.combat.pokemonId,'mankey');
  assert.equal(s.retryPokemonId,null);
});
test('flee triggers five-second cooldown and no automatic retry',()=>{
  let s=funded();
  s=buy(s,'BUY_AUTOMATION','resolve');
  s=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
  s=transition(s,{type:'FLEE'});
  assert.equal(s.recoveryMs,5000);
  assert.equal(s.retryPokemonId,null);
  s=transition(s,{type:'RECOVERY_TICK',deltaMs:5000});
  assert.equal(s.recoveryMs,0);
  assert.equal(s.combat.active,false);
});
test('v5 persists upgrades, automation and recovery and v4 defaults',()=>{
  let s=funded();
  s=buy(s,'BUY_UPGRADE','hp');
  s=buy(s,'BUY_AUTOMATION','resolve');
  s={...s,recoveryMs:4321,retryPokemonId:'rattata'};
  const saved=decodeSave(encodeSave(s)).game;
  assert.equal(saved.energyUpgrades.hp,1);
  assert.equal(saved.automation.resolve,true);
  assert.equal(saved.recoveryMs,4321);
  assert.equal(saved.retryPokemonId,'rattata');
  const payload=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(s)),x=>x.charCodeAt(0))));
  payload.version=4;delete payload.game.recoveryMs;delete payload.game.automation;delete payload.game.retryPokemonId;
  const v4=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))));
  const old=decodeSave(v4).game;
  assert.equal(old.recoveryMs,0);
  assert.equal(old.automation.resolve,false);
});

test('legacy v6 fighting attack upgrade levels migrate without becoming flat attack levels',()=>{
 let s=funded();
 s=buy(s,'BUY_UPGRADE','attackMultiplier');
 s=buy(s,'BUY_UPGRADE','attackMultiplier');
 s=buy(s,'BUY_UPGRADE','hp');
 const raw=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(s)),x=>x.charCodeAt(0))));
 raw.version=6;
 raw.game.energyUpgrades={hp:1,attack:2,speed:0};
 const old=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(raw))));
 const loaded=decodeSave(old).game;
 assert.equal(loaded.energyUpgrades.hp,1);
 assert.equal(loaded.energyUpgrades.attack,0);
 assert.equal(loaded.energyUpgrades.attackMultiplier,2);
 assert.ok(Math.abs(upgradeCost('attackMultiplier',loaded.energyUpgrades.attackMultiplier)-32.4)<1e-9);
 assert.equal(effectiveDittoStats(loaded).attack,1.08);
});


test('antidote costs water and grass 10 then 15 each',()=>{
 let s={...funded(),energyBalances:{...funded().energyBalances,물:30,풀:30}};
 assert.equal(upgradeCost('antidote',0),10);
 assert.equal(upgradeCost('antidote',1),15);
 s=buy(s,'BUY_UPGRADE','antidote');
 assert.equal(effectiveDittoStats(s).antidote,1);
 s=buy(s,'BUY_UPGRADE','antidote');
 for(const t of ['물','풀']){assert.equal(s.energyBalances[t],5);assert.equal(s.particleBalances[t],25);}
 assert.equal(effectiveDittoStats(s).antidote,2);
 assert.equal(buy(s,'BUY_UPGRADE','antidote'),s);
});

test('poison +3% remains multiplicative with temporary normal cost',()=>{
 let s={...funded(),energyBalances:{...funded().energyBalances,노말:2499997.5},dittoStats:{...funded().dittoStats,poison:2.5}};
 assert.equal(upgradeCost('poisonMultiplier',0),999999);
 assert.equal(upgradeCost('poisonMultiplier',1),1499998.5);
 s=buy(s,'BUY_UPGRADE','poisonMultiplier');
 assert.equal(effectiveDittoStats(s).poison,2.575);
 s=buy(s,'BUY_UPGRADE','poisonMultiplier');
 assert.ok(Math.abs(effectiveDittoStats(s).poison-2.65)<1e-10);
 assert.equal(s.energyBalances.노말,0);
 assert.equal(decodeSave(encodeSave(s)).game.energyUpgrades.poisonMultiplier,2);
 assert.equal(effectiveDittoStats({...s,dittoStats:{...s.dittoStats,poison:0}}).poison,0);
});

test('resolve costs five normal energy and rejects insufficient normal funds',()=>{
 let s={...funded(),energyBalances:{...funded().energyBalances,노말:4,격투:1000}};
 assert.equal(buy(s,'BUY_AUTOMATION','resolve'),s);
 s={...s,energyBalances:{...s.energyBalances,노말:5}};
 const purchased=buy(s,'BUY_AUTOMATION','resolve');
 assert.ok(purchased!==s);
 assert.equal(purchased.energyBalances.노말,0);
 assert.equal(purchased.energyBalances.격투,1000);
 assert.equal(purchased.particleBalances.노말,5);
 assert.equal(purchased.automation.resolve,true);
});


test('combat upgrades apply immediately without restoring current HP or restarting battle',()=>{
 let s=funded();
 s={...s,energyBalances:{...s.energyBalances,노말:1000005,물:10,풀:10},
   dittoStats:{...s.dittoStats,poison:5}};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
 assert.equal(s.combat.active,true);
 s={...s,combat:{...s.combat,currentHp:6,dittoHp:{current:6,max:10}}};
 const startId=s.combat.pokemonId;
 s=buy(s,'BUY_UPGRADE','hp');
 assert.equal(s.combat.active,true);
 assert.equal(s.combat.pokemonId,startId);
 assert.equal(s.combat.currentHp,6);
 assert.equal(s.combat.dittoHp.current,6);
 assert.equal(s.combat.dittoHp.max,14);
 assert.equal(s.combat.maxHp,14);
 assert.equal(effectiveDittoStats(s).hp,14);
 s=buy(s,'BUY_UPGRADE','attack');
 assert.equal(effectiveDittoStats(s).attack,2);
 s=buy(s,'BUY_UPGRADE','poisonMultiplier');
 assert.ok(Math.abs(effectiveDittoStats(s).poison-5.15)<1e-9);
 s=buy(s,'BUY_UPGRADE','antidote');
 assert.equal(effectiveDittoStats(s).antidote,1);
 assert.equal(s.combat.currentHp,6);
 assert.equal(s.combat.active,true);
});
test('speed purchased during combat takes effect only after the next player attack',()=>{
 let s=funded();
 s={...s,dittoStats:{...s.dittoStats,attack:0},energyBalances:{...s.energyBalances,노말:999999}};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:1200,random:()=>0.5});
 const oldEnemyElapsed=s.combat.enemy.attackCooldown.elapsed;
 s=buy(s,'BUY_UPGRADE','speed');
 assert.equal(s.combat.dittoAttackCooldown.duration,3000);
 assert.equal(s.combat.dittoAttackCooldown.elapsed,1200);
 assert.equal(s.combat.enemy.attackCooldown.elapsed,oldEnemyElapsed);
 assert.ok(Math.abs(effectiveDittoStats(s).speed-3000/1.01)<1e-8);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:1700,random:()=>0.5});
 assert.equal(s.combat.dittoAttackCooldown.duration,3000);
 assert.equal(s.combat.dittoAttackCooldown.elapsed,2900);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
 assert.ok(Math.abs(s.combat.dittoAttackCooldown.duration-3000/1.01)<1e-8);
 assert.equal(s.combat.dittoAttackCooldown.elapsed,0);
 assert.equal(s.combat.active,true);
});
test('speed upgrades bought repeatedly wait until attack and use latest level',()=>{
 let s=funded();
 s={...s,dittoStats:{...s.dittoStats,hp:1000,attack:0},energyBalances:{...s.energyBalances,노말:999999}};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:1500,random:()=>0.5});
 s=buy(s,'BUY_UPGRADE','speed');
 // Supplement real flying energy for the rapidly increasing second level cost.
 s={...s,energyBalances:{...s.energyBalances,노말:99999900}};
 s=buy(s,'BUY_UPGRADE','speed');
 assert.equal(s.energyUpgrades.speed,2);
 assert.equal(s.combat.dittoAttackCooldown.duration,3000);
 assert.equal(s.combat.dittoAttackCooldown.elapsed,1500);
 const newPeriod=3000/1.02;
 s=transition(s,{type:'COMBAT_TICK',deltaMs:5000,random:()=>0.5});
 assert.ok(Math.abs(s.combat.dittoAttackCooldown.duration-newPeriod)<1e-8);
 assert.ok(Math.abs(s.combat.dittoAttackCooldown.elapsed-(5000-1500-newPeriod))<1e-7);
});
test('cannot buy unaffordable upgrades mid-combat',()=>{
 let s={...initialState(),phase:'running'};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
 const before=s;
 assert.equal(buy(s,'BUY_UPGRADE','hp'),before);
});


test('upgrade costs beyond supported amount range are unavailable instead of throwing',()=>{
  assert.equal(upgradeCost('hp',1000000),null);
});


test('water HP amplifier and temporary normal recovery and special attack costs',()=>{
 let s={...funded(),energyBalances:{...funded().energyBalances,노말:6000000,물:100,풀:100},dittoStats:{...funded().dittoStats,hp:100,specialAttack:4,regeneration:5}};
 assert.equal(upgradeCost('specialAttack',0),999999);
 for(const id of ['hp','specialAttack','specialAttack','hpMultiplier','hpMultiplier','regenerationMultiplier','regenerationMultiplier'])s=buy(s,'BUY_UPGRADE',id);
 const stats=effectiveDittoStats(s);
 assert.ok(Math.abs(stats.hp-112.32)<1e-9);
 assert.equal(stats.specialAttack,6);
 assert.ok(Math.abs(stats.regeneration-5.3)<1e-9);
 assert.equal(s.energyBalances.물,72);assert.equal(s.particleBalances.물,28);
 assert.equal(s.energyBalances.풀,100);assert.equal(s.particleBalances.풀,0);
 assert.equal(decodeSave(encodeSave(s)).game.energyUpgrades.hpMultiplier,2);
 assert.equal(decodeSave(encodeSave(s)).game.energyUpgrades.specialAttack,2);
 assert.equal(decodeSave(encodeSave(s)).game.energyUpgrades.regenerationMultiplier,2);
});

test('HP multiplier can be purchased mid-battle without healing current HP',()=>{
 let s={...funded(),energyBalances:{...funded().energyBalances,물:10}};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
 s={...s,combat:{...s.combat,currentHp:6,dittoHp:{...s.combat.dittoHp,current:6}}};
 s=buy(s,'BUY_UPGRADE','hpMultiplier');
 assert.equal(s.combat.currentHp,6);
 assert.equal(s.combat.dittoHp.current,6);
 assert.equal(s.combat.maxHp,10.4);
 assert.equal(s.combat.dittoHp.max,10.4);
});

test('dual energy upgrade purchases require both currencies and create matching particles',()=>{
 let s={...funded(),unlockedLayer:2,energyBalances:{...funded().energyBalances,노말:40,불꽃:10,물:20,풀:10}};
 for(const id of ['attackMultiplier','hpMultiplier','antidote'])s=buy(s,'BUY_UPGRADE',id);
 assert.equal(s.energyBalances.노말,20);
 for(const t of ['불꽃','물','풀'])assert.equal(s.energyBalances[t],0);
 assert.equal(s.particleBalances.노말,20);
 assert.equal(s.particleBalances.물,20);
 assert.equal(s.particleBalances.불꽃,10);
 assert.equal(s.particleBalances.풀,10);
 assert.equal(buy(s,'BUY_UPGRADE','attackMultiplier'),s);
 const locked={...funded(),unlockedLayer:1};
 assert.equal(buy(locked,'BUY_UPGRADE','hpMultiplier'),locked);
});
test('defense and special stats use flat increases before 4 percent amplifiers',()=>{
 let s={...funded(),dittoStats:{...funded().dittoStats,defense:5,specialDefense:2,specialAttack:10},energyUpgrades:{defense:2,specialDefense:3,specialAttack:4,defenseMultiplier:2,specialDefenseMultiplier:2,specialAttackMultiplier:2}};
 const stats=effectiveDittoStats(s);
 assert.ok(Math.abs(stats.defense-7.56)<1e-8);
 assert.ok(Math.abs(stats.specialDefense-5.4)<1e-8);
 assert.ok(Math.abs(stats.specialAttack-15.12)<1e-8);
 assert.equal(effectiveDittoStats({...s,dittoStats:{...s.dittoStats,defense:0},energyUpgrades:{defenseMultiplier:3}}).defense,0);
});


test('flat electric speed and temporary normal speed amplifier retain effects',()=>{
 let s={...funded(),energyBalances:{...funded().energyBalances,전기:1010,노말:100999899}};
 assert.equal(upgradeCost('speedFlat',0),10);
 assert.equal(upgradeCost('speedFlat',1),1000);
 assert.equal(upgradeCost('speed',0),999999);
 assert.equal(upgradeCost('speed',1),99999900);
 for(const id of ['speedFlat','speed','speedFlat','speed'])s=buy(s,'BUY_UPGRADE',id);
 assert.ok(Math.abs(effectiveDittoStats(s).speed-2980/1.02)<1e-8);
 assert.equal(s.energyBalances.전기,0);
 assert.equal(s.energyBalances.노말,0);
 assert.equal(s.particleBalances.전기,1010);
 assert.equal(decodeSave(encodeSave(s)).game.energyUpgrades.speedFlat,2);
 assert.equal(effectiveDittoStats({...s,dittoStats:{...s.dittoStats,speed:50}}).speed,100);
});

test('normal-grass flat regeneration applies before temporary normal multiplier',()=>{
 let s={...funded(),energyBalances:{...funded().energyBalances,노말:1000054,풀:55},dittoStats:{...funded().dittoStats,regeneration:5}};
 for(const id of ['regeneration','regeneration','regenerationMultiplier'])s=buy(s,'BUY_UPGRADE',id);
 assert.ok(Math.abs(effectiveDittoStats(s).regeneration-7.21)<1e-8);
 assert.equal(s.energyBalances.노말,0);
 assert.equal(s.energyBalances.풀,0);
 assert.equal(decodeSave(encodeSave(s)).game.energyUpgrades.regeneration,2);
});

test('special attack and defense use temporary normal cost with unchanged growth',()=>{
 for(const id of ['specialAttack','specialDefense']){assert.equal(upgradeCost(id,0),999999);assert.equal(upgradeCost(id,1),1499998.5);}
});
