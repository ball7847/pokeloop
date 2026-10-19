import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from './gameState.js';
import {UPGRADES,upgradeCost,effectiveDittoStats} from './shopSystem.js';
import {grantBattleEnergy} from './energySystem.js';
import {encodeSave,decodeSave} from './saveSystem.js';

const buy=(state,type,id)=>transition(state,{type,id});
const funded=()=>({...initialState(),phase:'running',energyBalances:{...initialState().energyBalances,노말:1000,격투:1000,비행:1000}});
test('confirmed upgrade costs and base multipliers',()=>{
  assert.deepEqual(UPGRADES.map(x=>[x.id,x.base,x.growth,x.bonus]),[
    ['hp',1,1.5,.05],['attack',1,1.5,.04],['speed',20,1000,.01]
  ]);
  assert.equal(upgradeCost('hp',1),1.5);
  assert.equal(upgradeCost('attack',2),2.25);
  assert.equal(upgradeCost('speed',1),20000);
  let s=funded();
  s=buy(s,'BUY_UPGRADE','hp');
  s=buy(s,'BUY_UPGRADE','hp');
  s=buy(s,'BUY_UPGRADE','attack');
  s=buy(s,'BUY_UPGRADE','speed');
  const stats=effectiveDittoStats(s);
  assert.equal(stats.hp,11);
  assert.equal(stats.attack,1.04);
  assert.ok(Math.abs(stats.speed-(3000/1.01))<1e-8);
  assert.equal(s.energyBalances.노말,997.5);
  assert.equal(s.energyBalances.격투,999);
  assert.equal(s.energyBalances.비행,980);
  assert.equal(s.particleBalances.노말,2.5);
  assert.equal(s.particleBank.격투,1);
  assert.equal(s.particleBank.비행,20);
  assert.equal(buy(s,'BUY_UPGRADE','speed'),s);
});
test('automation purchases cost confirmed energy and unlock controls',()=>{
  let s=funded();
  s=buy(s,'BUY_AUTOMATION','hunger');
  s=buy(s,'BUY_AUTOMATION','resolve');
  assert.deepEqual(s.qolUnlocks,['hunger','resolve']);
  assert.equal(s.energyBalances.노말,999);
  assert.equal(s.energyBalances.격투,990);
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
    s=transition(s,{type:'COMBAT_TICK',deltaMs:5,random:()=>0.5});
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
  s={...s,dittoStats:{...s.dittoStats,hp:1,attack:0}};
  s=transition(s,{type:'COMBAT_TICK',deltaMs:1900,random:()=>0.5});
  assert.equal(s.combat.active,false);
  assert.equal(s.recoveryMs,10000);
  assert.equal(s.retryPokemonId,'mankey');
  assert.equal(transition(s,{type:'SELECT_WILD',pokemonId:'rattata'}),s);
  s=transition(s,{type:'RECOVERY_TICK',deltaMs:9999});
  assert.equal(s.recoveryMs,1);
  s=transition(s,{type:'RECOVERY_TICK',deltaMs:1});
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
