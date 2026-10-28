import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {autoBuyTick,autoChallengeTick} from '../src/core/abilityAutomation.js';
import {AUTOMATIONS} from '../src/core/shopSystem.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';
const ready=()=>({...initialState(),phase:'running'});
test('AB04 to AB06 identities and costs',()=>{
 assert.deepEqual(AUTOMATIONS.slice(2).map(x=>[x.abilityId,x.name,x.type,x.cost]),[
  ['AB04','다운로드','노말',200],['AB05','자기과신','악',10],['AB06','위협','악',25]]);
});
test('download buys by next cost and respects exclusions',()=>{
 let s={...ready(),qolUnlocks:['download'],automation:{download:true},energyBalances:{노말:100,물:100,바위:100},autoBuySelection:{hp:true,attack:true,defense:true,specialAttack:true}};
 const next=autoBuyTick(s,1);
 assert.equal(next.energyUpgrades?.hp,1);
 assert.equal(next.energyUpgrades?.attack??0,0);
 assert.equal(next.energyBalances.노말,99);
 s={...s,autoBuySelection:Object.fromEntries(Object.keys(s.autoBuySelection).map(k=>[k,false]))};
 assert.equal(autoBuyTick(s),s);
});
test('moxie starts unlocked targets, advances on tenth kill and respects defeats',()=>{
 const s={...ready(),qolUnlocks:['moxie'],automation:{moxie:true}};
 assert.equal(autoChallengeTick(s).combat.pokemonId,'rattata');
 const defeated={...s,combat:{...s.combat,lastEvent:{type:'defeat',pokemonId:'rattata'}}};
 assert.equal(autoChallengeTick(defeated),defeated);
 const full={...s,killCounts:{...s.killCounts,rattata:10},combat:{...s.combat,lastEvent:{type:'victory',pokemonId:'rattata'}}};
 assert.equal(autoChallengeTick(full).combat.pokemonId,'pidgey');
});
test('new ability selection and flags persist across save and reset on planet change',()=>{
 let s={...ready(),qolUnlocks:['download','moxie','intimidate'],automation:{download:true,moxie:true,intimidate:true},autoBuySelection:{hp:false}};
 const saved=decodeSave(encodeSave(s)).game;
 assert.equal(saved.autoBuySelection.hp,false);
 assert.equal(saved.automation.moxie,true);
 const next=transition({...saved,combat:{...saved.combat,active:false},pendingStellar:1},{type:'MOVE_PLANET',random:()=>0.5});
 assert.equal(next.automation.moxie,false);
 assert.equal(next.qolUnlocks.includes('download'),false);
});
