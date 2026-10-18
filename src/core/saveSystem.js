import {initialState,PHASE} from './gameState.js';
import {WILD_POKEMON} from './wildData.js';
import {resolveStats} from './dittoStats.js';
import {emptyCombat} from './combatEngine.js';

export const SAVE_KEY='pokeloop.save.v1';
export const AUTOSAVE_KEY='pokeloop.autosave.enabled';
export const SAVE_VERSION=1;
export const AUTOSAVE_INTERVAL_MS=30000;
const MAX_SAVE_LENGTH=1000000;
const MAX_STAT=1e15;
const MAX_COUNTER=1e12;
const basicKeys=['hp','attack','defense','specialAttack','specialDefense','speed','minDamagePercent'];
const progressKeys=['floor','encounterIndex','victories','runId','eventSerial'];
const validInteger=(value,max)=>Number.isSafeInteger(value)&&value>=0&&value<=max;

export function gameSnapshot(game){
  return {
    phase:game.phase,
    ...Object.fromEntries(progressKeys.map(key=>[key,game[key]])),
    dittoStats:Object.fromEntries(basicKeys.map(key=>[key,game.dittoStats[key]])),
    killCounts:Object.fromEntries(WILD_POKEMON.map(p=>[p.id,game.killCounts[p.id]??0]))
  };
}
export function encodeSave(game,now=Date.now()){
  const data={version:SAVE_VERSION,savedAt:new Date(now).toISOString(),game:gameSnapshot(game)};
  const bytes=new TextEncoder().encode(JSON.stringify(data));
  let binary='';
  for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
  return btoa(binary);
}
export function decodeSave(encoded){
  if(typeof encoded!=='string'||!encoded.trim()||encoded.length>MAX_SAVE_LENGTH)throw new Error('저장 데이터 크기 또는 형식이 올바르지 않습니다.');
  const clean=encoded.trim();
  if(!/^[a-zA-Z0-9+/]*={0,2}$/.test(clean)||clean.length%4!==0)throw new Error('Base64 형식이 아닙니다.');
  let data;
  try{
    const binary=atob(clean);
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }catch{throw new Error('저장 데이터를 해독할 수 없습니다.');}
  if(!data||data.version!==SAVE_VERSION||!data.game||typeof data.game!=='object')
    throw new Error('지원하지 않는 저장 버전이거나 잘못된 데이터입니다.');
  if(typeof data.savedAt!=='string'||!Number.isFinite(Date.parse(data.savedAt)))
    throw new Error('저장 시점이 올바르지 않습니다.');
  const original=data.game;
  if(![PHASE.READY,PHASE.RUNNING,PHASE.PAUSED,PHASE.FINISHED].includes(original.phase))
    throw new Error('게임 진행 상태가 올바르지 않습니다.');
  const cleanGame=initialState();
  for(const key of progressKeys){
    if(!validInteger(original[key],MAX_COUNTER))throw new Error('진행 기록이 올바르지 않습니다: '+key);
    cleanGame[key]=original[key];
  }
  if(cleanGame.floor<1)throw new Error('지역 진행 정보가 올바르지 않습니다.');
  if(!original.dittoStats||typeof original.dittoStats!=='object')throw new Error('메타몽 능력치가 없습니다.');
  const stats=resolveStats(original.dittoStats);
  for(const key of basicKeys){
    if(typeof stats[key]!=='number'||!Number.isFinite(stats[key])||stats[key]<0||stats[key]>MAX_STAT)
      throw new Error('능력치 값이 올바르지 않습니다: '+key);
  }
  if(stats.speed!==0&&stats.speed<1)throw new Error('스피드 값이 올바르지 않습니다.');
  if(stats.minDamagePercent>100)throw new Error('최소 피해량이 올바르지 않습니다.');
  cleanGame.dittoStats=Object.fromEntries(basicKeys.map(key=>[key,stats[key]]));
  if(!original.killCounts||typeof original.killCounts!=='object')throw new Error('처치 기록이 없습니다.');
  cleanGame.killCounts=Object.fromEntries(WILD_POKEMON.map(p=>{
    const count=original.killCounts[p.id]??0;
    if(!validInteger(count,MAX_COUNTER))throw new Error('처치 횟수가 올바르지 않습니다: '+p.id);
    return [p.id,count];
  }));
  // Active combat is deliberately not persisted. Resuming requires a new battle.
  cleanGame.phase=original.phase===PHASE.RUNNING?PHASE.RUNNING:original.phase;
  cleanGame.combat=emptyCombat(cleanGame.dittoStats.hp);
  return {game:cleanGame,savedAt:data.savedAt};
}
export function getStorage(){
  try{return typeof window!=='undefined'?window.localStorage:null;}catch{return null;}
}
export function loadLocalSave(storage=getStorage()){
  if(!storage)return null;
  const value=storage.getItem(SAVE_KEY);
  return value?decodeSave(value):null;
}
export function writeLocalSave(game,storage=getStorage(),now=Date.now()){
  if(!storage)throw new Error('브라우저 로컬 저장소를 사용할 수 없습니다.');
  const encoded=encodeSave(game,now);
  storage.setItem(SAVE_KEY,encoded);
  return new Date(now).toISOString();
}
export function clearLocalSave(storage=getStorage()){
  if(!storage)throw new Error('브라우저 로컬 저장소를 사용할 수 없습니다.');
  storage.removeItem(SAVE_KEY);
  storage.removeItem(AUTOSAVE_KEY);
}
export function readAutoSaveEnabled(storage=getStorage()){
  try{return storage?.getItem(AUTOSAVE_KEY)!=='false';}catch{return true;}
}
export function writeAutoSaveEnabled(enabled,storage=getStorage()){
  if(!storage)throw new Error('브라우저 로컬 저장소를 사용할 수 없습니다.');
  storage.setItem(AUTOSAVE_KEY,enabled?'true':'false');
}
