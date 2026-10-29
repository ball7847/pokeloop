import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/core/gameState.js';
import {SAVE_KEY,AUTOSAVE_KEY,AUTOSAVE_INTERVAL_MS,encodeSave,decodeSave,writeLocalSave,loadLocalSave,clearLocalSave,readAutoSaveEnabled,writeAutoSaveEnabled} from '../src/core/saveSystem.js';

const storage=()=>{
 const map=new Map();
 return {getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key),map};
};
test('Base64 export/import preserves growth, kills, Korean-unicode-safe JSON and version',()=>{
 const game=initialState();game.victories=17;game.dittoStats.attack=12.5;game.killCounts.rattata=8;
 game.phase='running';game.combat.active=true;
 const encoded=encodeSave(game,Date.UTC(2026,9,18));
 assert.match(encoded,/^[A-Za-z0-9+/=]+$/);
 const saved=decodeSave(encoded);
 assert.equal(saved.game.dittoStats.attack,12.5);
 assert.equal(saved.game.killCounts.rattata,8);
 assert.equal(saved.game.victories,17);
 assert.equal(saved.game.phase,'running');
 assert.equal(saved.game.combat.active,false);
 assert.equal(saved.savedAt,'2026-10-18T00:00:00.000Z');
});
test('local save writes, reads, clears and autosave preference survives independently',()=>{
 const mem=storage(),game=initialState();
 assert.equal(AUTOSAVE_INTERVAL_MS,30000);
 assert.equal(readAutoSaveEnabled(mem),true);
 writeAutoSaveEnabled(false,mem);
 assert.equal(mem.getItem(AUTOSAVE_KEY),'false');
 const stamp=writeLocalSave(game,mem,Date.UTC(2026,9,18));
 assert.equal(loadLocalSave(mem).savedAt,stamp);
 assert.ok(mem.getItem(SAVE_KEY));
 clearLocalSave(mem);
 assert.equal(loadLocalSave(mem),null);
 assert.equal(readAutoSaveEnabled(mem),true);
 assert.equal(mem.getItem(AUTOSAVE_KEY),null);
});
test('invalid or malicious saves are rejected without changing state',()=>{
 const game=initialState();
 for(const bad of ['','not-base64','%%%%','a'.repeat(1000004)])assert.throws(()=>decodeSave(bad));
 const mutate=change=>{
   const obj=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(game)),c=>c.charCodeAt(0))));
   change(obj);
   const bytes=new TextEncoder().encode(JSON.stringify(obj));
   return btoa(String.fromCharCode(...bytes));
 };
 assert.throws(()=>decodeSave(mutate(obj=>obj.version=999)));
 assert.throws(()=>decodeSave(mutate(obj=>obj.game.dittoStats.hp=-1)));
 assert.throws(()=>decodeSave(mutate(obj=>obj.game.killCounts.rattata=-9)));
 assert.throws(()=>decodeSave(mutate(obj=>obj.game.floor=0)));
});

test('type energy and particles round-trip as separate 18-type ledgers',()=>{
 const game=initialState();
 game.energyBalances.노말=12;game.energyBalances.페어리=7;
 game.particleBalances.노말=5;game.particleBank.페어리=3;
 const restored=decodeSave(encodeSave(game)).game;
 assert.equal(restored.energyBalances.노말,12);
 assert.equal(restored.energyBalances.페어리,7);
 assert.equal(restored.particleBalances.노말,5);
 assert.equal(restored.particleBank.페어리,3);
 assert.equal(restored.energyBalances.비행,0);
});

test('all combat stats survive save round-trip; old saves default new stats',()=>{
 const game=initialState();
 Object.assign(game.dittoStats,{intimidation:16,sound:10,criticalChance:4.5,criticalMultiplier:225,honey:14});
 const restored=decodeSave(encodeSave(game)).game;
 for(const key of ['intimidation','sound','criticalChance','criticalMultiplier','honey']){
  assert.equal(restored.dittoStats[key],game.dittoStats[key],key);
 }
 // Legacy v17 payloads did not serialize the five new stats. They must remain loadable.
 const previous=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(game)),c=>c.charCodeAt(0))));
 for(const key of ['intimidation','sound','criticalChance','criticalMultiplier','honey'])delete previous.game.dittoStats[key];
 const oldBytes=new TextEncoder().encode(JSON.stringify(previous));
 const oldEncoded=btoa(Array.from(oldBytes,c=>String.fromCharCode(c)).join(''));
 const legacy=decodeSave(oldEncoded).game;
 assert.equal(legacy.dittoStats.intimidation,0);
 assert.equal(legacy.dittoStats.sound,0);
 assert.equal(legacy.dittoStats.criticalChance,0);
 assert.equal(legacy.dittoStats.criticalMultiplier,150);
 assert.equal(legacy.dittoStats.honey,0);
});
test('invalid critical percentages in save cannot bypass validation',()=>{
 const game=initialState();
 const o=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeSave(game)),c=>c.charCodeAt(0))));
 o.game.dittoStats.criticalChance='invalid-number';
 const bytes=new TextEncoder().encode(JSON.stringify(o));
 assert.throws(()=>decodeSave(btoa(Array.from(bytes,c=>String.fromCharCode(c)).join(''))));
});
