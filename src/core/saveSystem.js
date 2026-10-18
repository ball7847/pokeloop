import {initialState,PHASE} from './gameState.js';
import {WILD_POKEMON,UNCOMMON_STARTERS,STARTER_IDS,getWildPokemon} from './wildData.js';
import {resolveStats} from './dittoStats.js';
import {emptyCombat} from './combatEngine.js';
import {isAmount,storedAmount,compareAmount} from './bigNumber.js';

export const SAVE_KEY='pokeloop.save.v1';
export const AUTOSAVE_KEY='pokeloop.autosave.enabled';
export const SAVE_VERSION=2;
export const AUTOSAVE_INTERVAL_MS=30000;
const MAX_SAVE_LENGTH=1000000;
const MAX_COUNTER=1e12;
const basicKeys=['hp','attack','defense','specialAttack','specialDefense','speed','minDamagePercent'];
const progressKeys=['floor','encounterIndex','victories','runId','eventSerial'];
const validInteger=(value,max)=>Number.isSafeInteger(value)&&value>=0&&value<=max;

export function gameSnapshot(game){
  return {
    phase:game.phase,
    ...Object.fromEntries(progressKeys.map(key=>[key,game[key]])),
    dittoStats:Object.fromEntries(basicKeys.map(key=>[key,game.dittoStats[key]])),
    killCounts:Object.fromEntries([...WILD_POKEMON,...UNCOMMON_STARTERS].map(p=>[p.id,game.killCounts[p.id]??0])),
    uncommonChance:game.uncommonChance??0,
    uncommonStarterId:game.uncommonStarterId??null,
    dexDiscovered:game.dexDiscovered??[],
    energyBalances:game.energyBalances??{},discoveredEnergies:game.discoveredEnergies??[]
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
  if(!data||![1,SAVE_VERSION].includes(data.version)||!data.game||typeof data.game!=='object')
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
    if(['speed','minDamagePercent'].includes(key)){
      if(typeof stats[key]!=='number'||!Number.isFinite(stats[key])||stats[key]<0)
        throw new Error('능력치 값이 올바르지 않습니다: '+key);
    }else if(!isAmount(stats[key])){
      throw new Error('능력치 값이 올바르지 않습니다: '+key);
    }
  }
  if(stats.speed!==0&&stats.speed<1)throw new Error('스피드 값이 올바르지 않습니다.');
  if(stats.minDamagePercent>100)throw new Error('최소 피해량이 올바르지 않습니다.');
  cleanGame.dittoStats=Object.fromEntries(basicKeys.map(key=>[key,['speed','minDamagePercent'].includes(key)?stats[key]:storedAmount(stats[key])]));
  if(!original.killCounts||typeof original.killCounts!=='object')throw new Error('처치 기록이 없습니다.');
  cleanGame.killCounts=Object.fromEntries([...WILD_POKEMON,...UNCOMMON_STARTERS].map(p=>{
    const count=original.killCounts[p.id]??0;
    if(!validInteger(count,MAX_COUNTER))throw new Error('처치 횟수가 올바르지 않습니다: '+p.id);
    return [p.id,count];
  }));
  const starter=original.uncommonStarterId??null;
  if(starter!==null&&!STARTER_IDS.includes(starter))throw new Error('6번 슬롯 정보가 올바르지 않습니다.');
  const chance=original.uncommonChance??0;
  if(typeof chance!=='number'||!Number.isFinite(chance)||chance<0||chance>1)throw new Error('안흔함 확률이 올바르지 않습니다.');
  const found=original.dexDiscovered??[];
  if(!Array.isArray(found)||found.length>8||found.some(id=>typeof id!=='string'||!getWildPokemon(id))||new Set(found).size!==found.length)throw new Error('도감 정보가 올바르지 않습니다.');
  cleanGame.uncommonStarterId=starter;cleanGame.uncommonChance=chance;cleanGame.dexDiscovered=[...found];
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
