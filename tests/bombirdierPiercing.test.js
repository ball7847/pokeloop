import test from 'node:test';
import assert from 'node:assert/strict';
import {getWildPokemon,battleEnergyRewards,appearedInRegion,LAKE_REGION,getKillLimit} from '../src/core/wildData.js';
import {initialState} from '../src/core/gameState.js';
import {resolveAttack} from '../src/core/combatEngine.js';
import {resolveStats} from '../src/core/dittoStats.js';

test('Bombirdier is the ninth common lake encounter, preserving Wishiwashi codes',()=>{
 const p=getWildPokemon('bombirdier');
 assert.deepEqual({id:p.id,number:p.number,types:p.types,hp:p.hp,attack:p.attack,speed:p.speed,piercing:p.piercing,accuracy:p.accuracy,code:p.encounterCode,rewards:p.rewards},
 {id:'bombirdier',number:962,types:['비행','악'],hp:962,attack:103,speed:1500,piercing:50,accuracy:200,code:'W031101',rewards:{attack:10.3,piercing:10.3,accuracy:9.62}});
 assert.deepEqual(battleEnergyRewards(p),{비행:0,악:0});
 assert.equal(getKillLimit(p),10);
 const initial=initialState();
 const ids=appearedInRegion(initial,LAKE_REGION.id).map(p=>p.id);
 assert.deepEqual(ids.slice(-2),['bombirdier','wishiwashi']);
 assert.equal(getWildPokemon('wishiwashi').encounterCode,'W031001');
 assert.equal(getWildPokemon('wishiwashi-school').encounterCode,'W031001-E1');
});

test('physical piercing reduces physical defense only, without reducing special defense',()=>{
 const target=resolveStats({hp:500,defense:60,specialDefense:60});
 const actor=resolveStats({attack:100,specialAttack:100,piercing:50,accuracy:100,minDamagePercent:100,maxDamagePercent:100});
 const c={enemy:{hp:{current:500}},currentHp:500,dittoHp:{current:500},playerStatus:{paralysis:0,poison:0},enemyStatus:{paralysis:0,poison:0}};
 resolveAttack(c,'player',actor,target,()=>0);
 assert.equal(c.enemy.hp.current,370); // physical 100-(60-50)=90; special 100-60=40 -> 130
});
