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
 assert.equal(a.encounterCode,'W011102');assert.equal(b.encounterCode,'W011302');
});
test('all uncommon candidates only appear in correct 16-position order',()=>{
 const slots=Object.fromEntries(ENCOUNTER_SLOTS.map(s=>[s.id,s.candidates[0]]));
 const state={...initialState(),raritySlotResults:slots};
 assert.deepEqual(appearedInRegion(state,REGION.id).map(p=>p.encounterCode.split('-')[0]),[
 'W010101','W010201','W010302','W010401','W010501','W010602','W010701','W010802','W010901','W011001','W011102','W011201','W011302','W011401','W011502','W011601'
 ]);
});
test('v15 saves remap existing slots without rolling new ones',()=>{
 const state=initialState();
 const payload=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(state)),v=>v.charCodeAt(0))));
 payload.version=15;
 payload.game.raritySlotResults={R10101:'rattata',R11101:'exeggcute',R11201:'sentret',R11302:'zigzagoon',R11401:'tauros'};
 const imported=decodeSave(encode(payload)).game;
 assert.equal(imported.raritySlotResults.W011201,'exeggcute');
 assert.equal(imported.raritySlotResults.W011401,'sentret');
 assert.equal(imported.raritySlotResults.W011502,'zigzagoon');
 assert.equal(imported.raritySlotResults.W011601,'tauros');
 assert.equal(imported.raritySlotResults.W011102,null);
 assert.equal(imported.raritySlotResults.W011302,null);
});
