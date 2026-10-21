import {initialState,PHASE} from './gameState.js';
import {WILD_POKEMON,UNCOMMON_STARTERS,BERRY_POKEMON,ALL_POKEMON,STARTER_IDS,getWildPokemon,REGION,BERRY_REGION,isRegionUnlocked} from './wildData.js';
import {resolveStats} from './dittoStats.js';
import {emptyCombat} from './combatEngine.js';
import {isAmount,storedAmount,compareAmount} from './bigNumber.js';
import {TYPES,LAYERS,initialEconomy} from './energySystem.js';
import {DEFAULT_AUTOMATION} from './shopSystem.js';

export const SAVE_KEY='pokeloop.save.v1';
export const AUTOSAVE_KEY='pokeloop.autosave.enabled';
export const SAVE_VERSION=7;
export const AUTOSAVE_INTERVAL_MS=30000;
const MAX_SAVE_LENGTH=1000000;
const MAX_COUNTER=1e12;
const basicKeys=['hp','attack','defense','specialAttack','specialDefense','speed','minDamagePercent','paralysis','poison','accuracy','dodge'];
const progressKeys=['floor','encounterIndex','victories','runId','eventSerial'];
const validInteger=(value,max)=>Number.isSafeInteger(value)&&value>=0&&value<=max;

export function gameSnapshot(game){
  return {
    phase:game.phase,
    ...Object.fromEntries(progressKeys.map(key=>[key,game[key]])),
    dittoStats:Object.fromEntries(basicKeys.map(key=>[key,game.dittoStats[key]])),
    killCounts:Object.fromEntries(ALL_POKEMON.map(p=>[p.id,game.killCounts[p.id]??0])),
    activeRegionId:game.activeRegionId??REGION.id,berryRareAppeared:game.berryRareAppeared??false,
    uncommonChance:game.uncommonChance??0,
    uncommonStarterId:game.uncommonStarterId??null,
    dexDiscovered:game.dexDiscovered??[],
    automation:game.automation??DEFAULT_AUTOMATION,
    recoveryMs:game.recoveryMs??0,retryPokemonId:game.retryPokemonId??null,
    ...Object.fromEntries(['energyBalances','particleBalances','particleEarned','particleBank','particleMilestones','unlockedLayer',
      'normalFirstMilestonePermanent','pendingStellar','stellar','totalStellarEarned','planetMoves','energyUpgrades',
      'qolUnlocks','permanentUpgrades'].map(key=>[key,game[key]]))
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
  if(!data||![1,2,3,4,5,6,SAVE_VERSION].includes(data.version)||!data.game||typeof data.game!=='object')
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
    if(['speed','minDamagePercent','accuracy','dodge'].includes(key)){
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
  cleanGame.killCounts=Object.fromEntries(ALL_POKEMON.map(p=>{
    const count=original.killCounts[p.id]??0;
    if(!validInteger(count,MAX_COUNTER))throw new Error('처치 횟수가 올바르지 않습니다: '+p.id);
    return [p.id,count];
  }));
  const starter=original.uncommonStarterId??null;
  if(starter!==null&&!STARTER_IDS.includes(starter))throw new Error('6번 슬롯 정보가 올바르지 않습니다.');
  const chance=original.uncommonChance??0;
  if(typeof chance!=='number'||!Number.isFinite(chance)||chance<0||chance>1)throw new Error('안흔함 확률이 올바르지 않습니다.');
  const found=original.dexDiscovered??[];
  if(!Array.isArray(found)||found.length>ALL_POKEMON.length||found.some(id=>typeof id!=='string'||!getWildPokemon(id))||new Set(found).size!==found.length)throw new Error('도감 정보가 올바르지 않습니다.');
  // v3 stored battle essence and freely minted layer energy separately.
  // Preserve both quantities but map them to the new energy and particle roles.
  if(data.version>=3){
    const eco=initialEconomy();
    const previous=data.version===3;
    const records=previous?
      [['energyBalances','essences'],['particleBalances','energyBalances'],
       ['particleEarned','energyEarned'],['particleBank','energyBank']]:
      [['energyBalances','energyBalances'],['particleBalances','particleBalances'],
       ['particleEarned','particleEarned'],['particleBank','particleBank']];
    for(const [target,source] of records){
      const record=original[source]??{};
      if(!record||typeof record!=='object'||Array.isArray(record)||Object.keys(record).some(t=>!TYPES.includes(t)))
        throw new Error('재화 데이터가 올바르지 않습니다: '+source);
      eco[target]=Object.fromEntries(TYPES.map(t=>{
        const value=record[t]??0;
        if(!isAmount(value))throw new Error('재화 값이 올바르지 않습니다: '+source+'/'+t);
        return [t,storedAmount(value)];
      }));
    }
    const milestones=original[previous?'energyMilestones':'particleMilestones']??{};
    if(!milestones||typeof milestones!=='object'||Array.isArray(milestones)||Object.keys(milestones).some(t=>!TYPES.includes(t)))
      throw new Error('이정표 데이터가 올바르지 않습니다.');
    eco.particleMilestones=Object.fromEntries(TYPES.map(t=>{
      const value=milestones[t]??0;
      if(!validInteger(value,10))throw new Error('이정표 단계가 올바르지 않습니다.');
      return [t,value];
    }));
    const layer=original.unlockedLayer??1;
    if(!validInteger(layer,LAYERS.length)||layer<1)throw new Error('계층 상태가 올바르지 않습니다.');
    eco.unlockedLayer=layer;
    if(typeof original.normalFirstMilestonePermanent!=='boolean')throw new Error('노말 이정표 보존 상태가 올바르지 않습니다.');
    eco.normalFirstMilestonePermanent=original.normalFirstMilestonePermanent;
    for(const key of ['pendingStellar','stellar','totalStellarEarned']){
      const value=original[key]??0;
      if(!isAmount(value))throw new Error('스텔라에너지 값이 올바르지 않습니다.');
      eco[key]=storedAmount(value);
    }
    if(!validInteger(original.planetMoves??0,MAX_COUNTER))throw new Error('행성 이동 횟수가 올바르지 않습니다.');
    eco.planetMoves=original.planetMoves??0;
    for(const [target,source] of [['energyUpgrades',previous?'essenceUpgrades':'energyUpgrades'],['permanentUpgrades','permanentUpgrades']]){
      const value=original[source]??{};
      if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>100)throw new Error('강화 기록이 올바르지 않습니다.');
      eco[target]={...value};
    }
    const qol=original.qolUnlocks??[];
    if(!Array.isArray(qol)||qol.length>100||qol.some(v=>typeof v!=='string'||v.length>100))throw new Error('QoL 기록이 올바르지 않습니다.');
    eco.qolUnlocks=[...qol];
    Object.assign(cleanGame,eco);
  }
  // v4 and earlier did not implement these features; new runs default to no cooldown and no purchases.
  if(data.version>=5){
    const levels=original.energyUpgrades??{};
    if(!levels||typeof levels!=='object'||Array.isArray(levels)||Object.keys(levels).some(k=>!['hp','attack','attackMultiplier','speed'].includes(k))||
      Object.values(levels).some(v=>!validInteger(v,1000000)))throw new Error('강화 레벨이 올바르지 않습니다.');
    const owned=original.qolUnlocks??[];
    if(owned.some(k=>!['hunger','resolve'].includes(k)))throw new Error('자동화 해금 데이터가 올바르지 않습니다.');
    const flags=original.automation??{};
    if(!flags||typeof flags!=='object'||Array.isArray(flags)||
      Object.keys(flags).some(k=>!['hunger','resolve'].includes(k))||
      Object.values(flags).some(v=>typeof v!=='boolean'))throw new Error('자동화 활성화 값이 올바르지 않습니다.');
    if(Object.entries(flags).some(([k,v])=>v&&!owned.includes(k)))throw new Error('미해금 자동화 활성화');
    cleanGame.automation={...DEFAULT_AUTOMATION,...flags};
    const remaining=original.recoveryMs??0;
    if(typeof remaining!=='number'||!Number.isFinite(remaining)||remaining<0||remaining>10000)
      throw new Error('회복시간이 올바르지 않습니다.');
    cleanGame.recoveryMs=remaining;
    const retry=original.retryPokemonId??null;
    if(retry!==null&&(!getWildPokemon(retry)||!cleanGame.automation.resolve||remaining===0))
      throw new Error('재도전 대상이 올바르지 않습니다.');
    cleanGame.retryPokemonId=retry;
  }
  // Before v7, "attack" was the fighting-energy +4% multiplier.
  // Carry its purchased level (and next-price progression) into attackMultiplier.
  // The new normal-energy flat attack upgrade starts at level 0.
  if(data.version>=5&&data.version<7){
    const old=cleanGame.energyUpgrades;
    if(Object.hasOwn(old,'attack')){
      cleanGame.energyUpgrades={...old,attackMultiplier:old.attack,attack:0};
    }
  }
  if(data.version>=6){
    if(typeof original.berryRareAppeared!=='boolean')throw new Error('베리숲 안흔함 등장 정보가 올바르지 않습니다.');
    cleanGame.berryRareAppeared=original.berryRareAppeared;
    if(![REGION.id,BERRY_REGION.id].includes(original.activeRegionId))
      throw new Error('지역 정보가 올바르지 않습니다.');
    cleanGame.activeRegionId=original.activeRegionId;
  }
  cleanGame.uncommonStarterId=starter;cleanGame.uncommonChance=chance;cleanGame.dexDiscovered=[...found];
  if(!isRegionUnlocked(cleanGame,cleanGame.activeRegionId))cleanGame.activeRegionId=REGION.id;
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
