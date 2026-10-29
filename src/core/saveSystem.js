import {encodeSave,decodeSave} from './saveCodec.js';
export {SAVE_VERSION,gameSnapshot,encodeSave,decodeSave} from './saveCodec.js';

export const SAVE_KEY='pokeloop.save.v1';
export const AUTOSAVE_KEY='pokeloop.autosave.enabled';
export const AUTOSAVE_INTERVAL_MS=30000;

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
