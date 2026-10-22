import test from 'node:test';
import assert from 'node:assert/strict';
import {decimal,storedAmount,addAmount,subtractAmount,multiplyAmount,divideAmount,compareAmount,formatAmount} from '../src/core/bigNumber.js';
import {initialState,transition} from '../src/core/gameState.js';
import {encodeSave,decodeSave,SAVE_VERSION} from '../src/core/saveSystem.js';

test('1e1025 stats survive arithmetic and combat without infinity',()=>{
 assert.equal(storedAmount('1e1025'),'1e1025');
 assert.equal(compareAmount(multiplyAmount('1e1025',2),'1e1025'),1);
 assert.equal(compareAmount(subtractAmount('1e1025','1e1025'),0),0);
 const s=initialState();
 s.dittoStats.hp='1e1025';s.dittoStats.attack='1e1025';
 let fighting=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
 assert.equal(fighting.combat.active,true);
 fighting=transition(fighting,{type:'COMBAT_TICK',deltaMs:3000,random:()=>0.99});
 assert.equal(fighting.victories,1);
 assert.equal(fighting.killCounts.rattata,1);
 assert.equal(compareAmount(fighting.dittoStats.attack,'1e1025'),0);
});
test('large HP and defense sustain against normal enemy',()=>{
 const s=initialState();s.dittoStats.hp='1e1025';s.dittoStats.defense='1e1025';
 const active=transition(s,{type:'SELECT_WILD',pokemonId:'rattata'});
 const ticked=transition(active,{type:'COMBAT_TICK',deltaMs:2000,random:()=>0.5});
 assert.equal(ticked.combat.active,true);
 assert.equal(compareAmount(ticked.combat.currentHp,'1e1025'),0);
});
test('engineering display truncates to three places and preserves tiny positive notice',()=>{
 assert.equal(formatAmount('1e1025'),'100e1023');
 assert.equal(formatAmount('123456789012'),'123.456e9');
 assert.equal(formatAmount('1.123456789'),'1.123');
 assert.equal(formatAmount('0.00000000001'),'<0.001');
 assert.equal(formatAmount(0),'0');
 assert.equal(formatAmount('1e6'),'1e6');
});
test('new save and legacy version 1 are both readable',()=>{
 const s=initialState();s.dittoStats.attack='1e1025';s.dittoStats.hp='1e1025';
 const encoded=encodeSave(s,Date.UTC(2026,9,18));
 assert.equal(decodeSave(encoded).game.dittoStats.attack,'1e1025');
 const raw=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))));
 assert.equal(raw.version,SAVE_VERSION);
 raw.version=1;raw.game.dittoStats.attack=12.5;raw.game.dittoStats.hp=10;
 const text=JSON.stringify(raw);const bytes=new TextEncoder().encode(text);
 const legacy=btoa(String.fromCharCode(...bytes));
 assert.equal(decodeSave(legacy).game.dittoStats.attack,12.5);
 assert.throws(()=>decodeSave(encodeSave({...s,dittoStats:{...s.dittoStats,attack:'Infinity'}})));
});
