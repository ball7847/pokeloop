import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {LAKE_REGION,LAKE_POKEMON,appearedInRegion,isRegionUnlocked,ENCOUNTER_SLOTS} from '../src/core/wildData.js';
import {resolveAttack,startBattle} from '../src/core/combatEngine.js';
import {resolveStats} from '../src/core/dittoStats.js';

const prepared=()=>{const s=initialState();return {...s,phase:'running',activeRegionId:LAKE_REGION.id,
 killCounts:{...s.killCounts,...Object.fromEntries(['caterpie','weedle','taillow','igglybuff','nidoran-m','nidoran-f','tangela'].map(id=>[id,1]))}}};
test('moonlit lake roster and 3-to-1 uncommon slot are registered',()=>{
 assert.equal(LAKE_POKEMON.length,8);
 const slot=ENCOUNTER_SLOTS.find(s=>s.id==='W030302');
 assert.deepEqual(slot.candidates,['popplio','sobble','quaxly']);
 assert.equal(ENCOUNTER_SLOTS.find(s=>s.id==='W030201').candidates.length,1);
 const s=prepared();assert.ok(isRegionUnlocked(s,LAKE_REGION.id));
 assert.deepEqual(appearedInRegion(s,LAKE_REGION.id).map(p=>p.id),['buizel','magikarp','cutiefly']);
 const rare={...s,raritySlotResults:{W030302:'sobble',W030101:'buizel',W030201:'magikarp',W030401:'cutiefly'}};
 assert.deepEqual(appearedInRegion(rare,LAKE_REGION.id).map(p=>p.id),['buizel','magikarp','sobble','cutiefly']);
});
test('enemy intimidation halves player physical attack at battle start',()=>{
 const s=prepared();const unlocked={...s,evolutionResults:{gyarados:true},killCounts:{...s.killCounts,buizel:1,magikarp:1}};
 const battle=startBattle(unlocked,'gyarados');
 assert.equal(battle.combat.intimidationDebuffs.player,.5);
});
test('sound penetrates special defense, critical multiplies both damage channels',()=>{
 const actor=resolveStats({attack:100,specialAttack:100,sound:30,criticalChance:100,criticalMultiplier:200});
 const enemy=resolveStats({hp:1000,defense:20,specialDefense:50});
 const c={enemy:{hp:{current:1000}},currentHp:1000,dittoHp:{current:1000},
 playerStatus:{paralysis:0,poison:0},enemyStatus:{paralysis:0,poison:0}};
 resolveAttack(c,'player',actor,enemy,()=>0);
 assert.equal(c.enemy.hp.current,740); // (85-20 + 85-(50-30)) * 2 = 260 
});
