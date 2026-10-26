import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {getWildPokemon,appearedInRegion,BERRY_REGION,isPokemonUnlockedInState} from '../src/core/wildData.js';
import {rollDamagePercent} from '../src/core/dittoStats.js';
import {resolveAttack} from '../src/core/combatEngine.js';
import {encodeSave,decodeSave,SAVE_VERSION} from '../src/core/saveSystem.js';

test('Taillow occupies the slot between Weedle and Igglybuff (evolutions excluded)',()=>{
 const s=initialState();
 const ids=appearedInRegion(s,BERRY_REGION.id).map(p=>p.id);
 assert.deepEqual(ids,['caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f']);
 assert.equal(getWildPokemon('jigglypuff'),null);
 assert.equal(getWildPokemon('igglybuff').number,174);
 assert.equal(getWildPokemon('taillow').number,276);
});
test('Berry Forest now unlocks Taillow initially and Igglybuff after one distinct kill',()=>{
 let s=initialState();
 s.activeRegionId=BERRY_REGION.id;
 s.killCounts={...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,meowth:1,geodude:1,exeggcute:1};
 assert.equal(isPokemonUnlockedInState(s,'taillow'),true);
 assert.equal(isPokemonUnlockedInState(s,'igglybuff'),false);
 s.killCounts={...s.killCounts,caterpie:1};
 assert.equal(isPokemonUnlockedInState(s,'igglybuff'),true);
});
test('male Nidoran can deal a 150% damage roll and reward permanent max damage',()=>{
 const n=getWildPokemon('nidoran-m');
 assert.equal(n.maxDamagePercent,150);
 assert.equal(rollDamagePercent(85,()=>1,150),150);
 const c={currentHp:1000,dittoHp:{current:1000,max:1000},enemy:{hp:{current:1000,max:1000}},
   playerStatus:{paralysis:0,poison:0},enemyStatus:{paralysis:0,poison:0}};
 const rolls=[0.1,0.999999];
 resolveAttack(c,'enemy',n,{defense:0,dodge:0},()=>rolls.shift()??0.999999);
 assert.equal(c.currentHp,914.5);
 let s=initialState();
 s.phase='running';s.activeRegionId=BERRY_REGION.id;
 s.killCounts={...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,meowth:1,geodude:1,exeggcute:1,caterpie:1,weedle:1,taillow:1};
 s.dittoStats={...s.dittoStats,hp:10000,attack:10000,speed:1};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'nidoran-m'});
 assert.equal(s.combat.active,true);
 s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
 assert.equal(s.killCounts['nidoran-m'],1);
 assert.equal(s.dittoStats.maxDamagePercent,103.2);
 assert.equal(decodeSave(encodeSave(s)).game.dittoStats.maxDamagePercent,103.2);
});
test('legacy v9 Jigglypuff progress migrates to Igglybuff with 100% max damage default',()=>{
 const s=initialState();
 s.killCounts={...s.killCounts, jigglypuff:7};
 s.dexDiscovered=['jigglypuff'];
 const payload=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(s)),ch=>ch.charCodeAt(0))));
 payload.version=9;
 delete payload.game.killCounts.igglybuff;
 payload.game.killCounts.jigglypuff=7;
 delete payload.game.dittoStats.maxDamagePercent;
 const data=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))));
 const restored=decodeSave(data).game;
 assert.equal(restored.killCounts.igglybuff,7);
 assert.deepEqual(restored.dexDiscovered,['igglybuff']);
 assert.equal(restored.dittoStats.maxDamagePercent,100);
 assert.equal(SAVE_VERSION,10);
});
