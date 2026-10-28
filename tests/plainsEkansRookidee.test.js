import test from 'node:test';
import assert from 'node:assert/strict';
import {getWildPokemon,ENCOUNTER_SLOTS,REGION,appearedInRegion,battleEnergyRewards} from '../src/core/wildData.js';
import {initialState} from '../src/core/gameState.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';
const encode=record=>{const bytes=new TextEncoder().encode(JSON.stringify(record));return btoa(Array.from(bytes,x=>String.fromCharCode(x)).join(''));};
test('Ekans and Rookidee preserve exact stats and decaying poison/flying rewards',()=>{
 const a=getWildPokemon('ekans'),b=getWildPokemon('rookidee');
 assert.deepEqual([a.hp,a.attack,a.speed,a.dodge,a.poison,a.antidote,a.energyReward],[88,20,2000,880,20,100,8]);
 assert.deepEqual(a.rewards,{dodge:20,poison:8});
 assert.deepEqual([b.hp,b.attack,b.defense,b.specialDefense,b.speed,b.accuracy,b.energyReward],[176,27,15,15,2300,200,8]);
 assert.deepEqual(b.rewards,{hp:8,defense:8,specialDefense:8,accuracy:4});
 assert.deepEqual(battleEnergyRewards(a,0),{독:8});
 assert.deepEqual(battleEnergyRewards(b,1),{비행:4});
 assert.equal(a.encounterCode,'R11102');assert.equal(b.encounterCode,'R11302');
});
test('all uncommon candidates only appear in correct 16-position order',()=>{
 const slots=Object.fromEntries(ENCOUNTER_SLOTS.map(s=>[s.id,s.candidates[0]]));
 const state={...initialState(),raritySlotResults:slots};
 assert.deepEqual(appearedInRegion(state,REGION.id).map(p=>p.encounterCode.split('-')[0]),[
 'R10101','R10201','R10302','R10401','R10501','R10602','R10701','R10802','R10901','R11001','R11102','R11201','R11302','R11401','R11502','R11601'
 ]);
});
test('v15 saves remap existing slots without rolling new ones',()=>{
 const state=initialState();
 const payload=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(state)),v=>v.charCodeAt(0))));
 payload.version=15;
 payload.game.raritySlotResults={R10101:'rattata',R11101:'exeggcute',R11201:'sentret',R11302:'zigzagoon',R11401:'tauros'};
 const imported=decodeSave(encode(payload)).game;
 assert.equal(imported.raritySlotResults.R11201,'exeggcute');
 assert.equal(imported.raritySlotResults.R11401,'sentret');
 assert.equal(imported.raritySlotResults.R11502,'zigzagoon');
 assert.equal(imported.raritySlotResults.R11601,'tauros');
 assert.equal(imported.raritySlotResults.R11102,null);
 assert.equal(imported.raritySlotResults.R11302,null);
});
