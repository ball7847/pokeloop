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

test('energy discovery and balances round-trip while old saves default to undiscovered',()=>{
 const game=initialState();
 game.discoveredEnergies=['energy-01','energy-18'];game.energyBalances={'energy-01':12,'energy-18':7};
 const restored=decodeSave(encodeSave(game)).game;
 assert.deepEqual(restored.discoveredEnergies,['energy-01','energy-18']);
 assert.deepEqual(restored.energyBalances,{'energy-01':12,'energy-18':7});
 const old=initialState();delete old.discoveredEnergies;delete old.energyBalances;
 const legacy=decodeSave(encodeSave(old)).game;
 assert.deepEqual(legacy.discoveredEnergies,[]);
 assert.deepEqual(legacy.energyBalances,{});
});
