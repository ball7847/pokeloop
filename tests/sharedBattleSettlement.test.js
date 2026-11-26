import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {startBattle,advanceBattle} from '../src/core/combatEngine.js';
import {getWildPokemon,getKillLimit,regionForPokemon,REGIONS,ALL_POKEMON} from '../src/core/wildData.js';
import {settleExpectedBattle} from './helpers/fastBattleSettlement.js';

function ready(id,{count=0,layer=1,hunger=false,honey=0}={}){
 const state=initialState();
 const killCounts=Object.fromEntries(ALL_POKEMON.map(p=>[p.id,1]));
 killCounts[id]=count;
 const slots=Object.fromEntries(ALL_POKEMON.filter(p=>!p.evolvesFrom).map(p=>[p.encounterCode.split('-')[0],p.id]));
 const s={...state,phase:'running',killCounts,activeRegionId:regionForPokemon(id),unlockedLayer:layer,
 raritySlotResults:slots,uncommonChance:.5,dexLifetimeKills:{...killCounts},
 evolutionResults:Object.fromEntries(ALL_POKEMON.filter(p=>p.evolvesFrom).map(p=>[p.id,true])),
 automation:{...state.automation,hunger},qolUnlocks:hunger?['hunger']:[],
 permanentUpgrades:{SU011:2},dittoStats:{...state.dittoStats,hp:100000,attack:100000,speed:100,accuracy:1000000,honey}};
 const active=startBattle(s,id);
 assert.equal(active.combat.active,true,id);
 return active;
}
function check(id,opts={}){
 const s=ready(id,opts);
 // Attack occurs before any status tick or enemy attack for these targets.
 const actual=advanceBattle(s,100,()=>0);
 assert.equal(actual.combat.lastEvent.type,'victory',id);
 const simulated=settleExpectedBattle(s,id,{result:'victory',playerHp:s.combat.currentHp,playerStatus:s.combat.playerStatus},()=>0);
 for(const key of ['dittoStats','killCounts','dexLifetimeKills','dexDiscovered','evolutionResults','energyBalances','particleBalances','particleEarned','unlockedLayer','qolUnlocks','automation','itemRunProgress','itemLifetimeProgress','itemPending','itemOwned','victories','encounterIndex','eventSerial','recoveryMs','retryPokemonId'])assert.deepEqual(simulated[key],actual[key],id+' '+key);
 assert.deepEqual(simulated.combat.lastEvent,actual.combat.lastEvent,id+' event');
 assert.equal(simulated.combat.active,actual.combat.active);
 assert.equal(simulated.combat.currentHp,actual.combat.currentHp);
 if(actual.combat.active)assert.deepEqual(simulated.combat,actual.combat);
 assert.equal(simulated.killCounts[id],(opts.count??0)+1);
 return simulated;
}
test('shared settlement matches real first and repeat victories, honey and hunger carry',()=>{
 check('rattata',{hunger:true,honey:100});
 check('rattata',{count:3,honey:100});
 check('spearow',{hunger:true,honey:100});
 check('rattata',{count:getKillLimit(getWildPokemon('rattata'))-1,hunger:true});
});
test('shared settlement matches real layer unlock and first victory ability grants',()=>{
 const tauros=check('tauros');
 assert.equal(tauros.unlockedLayer,2);
 const pikachu=check('pikachu',{layer:2});
 assert.equal(pikachu.unlockedLayer,3);
 assert.ok(pikachu.energyBalances.전기>0);
 const gyarados=check('gyarados',{layer:2});
 assert.ok(gyarados.qolUnlocks.includes('intimidate'));
});
test('shared settlement honors fixed species cap and uncertain outcomes award nothing',()=>{
 const s=ready('magikarp',{layer:2,hunger:true});
 const next=check('magikarp',{layer:2,hunger:true});
 assert.equal(next.combat.active,false);
 const unknown=settleExpectedBattle(s,'magikarp',{result:'uncertain'},()=>0);
 assert.deepEqual(unknown,s);
 assert.throws(()=>settleExpectedBattle({...s,killCounts:{...s.killCounts,magikarp:1}},'magikarp',{result:'victory',playerHp:1}),/Kill cap exceeded/);
});
test('shared defeat settlement matches real lethal attack and recovery retry',()=>{
 const state=ready('rattata');
 const s={...state,automation:{...state.automation,resolve:true},qolUnlocks:['resolve'],combat:{...state.combat,currentHp:1,dittoHp:{...state.combat.dittoHp,current:1},dittoAttackCooldown:{elapsed:0,duration:3000},enemy:{...state.combat.enemy,attackCooldown:{elapsed:0,duration:100}}}};
 const actual=advanceBattle(s,100,()=>0);
 const estimate=settleExpectedBattle(s,'rattata',{result:'defeat'},()=>0);
 assert.equal(actual.combat.lastEvent.type,'defeat');
 for(const key of ['killCounts','energyBalances','victories','eventSerial','recoveryMs','retryPokemonId'])assert.deepEqual(estimate[key],actual[key],key);
 assert.deepEqual(estimate.combat.lastEvent,actual.combat.lastEvent);
});
