import { create } from 'zustand';
import {formatAmount,compareAmount} from '../core/bigNumber.js';
import { initialState, transition } from '../core/gameState.js';
import {REGION,isRegionUnlocked} from '../core/wildData.js';
import {tickEconomy} from '../core/energySystem.js';
import {formatStatValue,statLabel} from '../core/dittoStats.js';
import {loadLocalSave,readAutoSaveEnabled,writeLocalSave,writeAutoSaveEnabled,clearLocalSave} from '../core/saveSystem.js';

function initialPersistence(){
  let local=null,error=null;
  try{local=loadLocalSave();}catch(e){error='로컬 저장 데이터 불러오기 실패: '+e.message;}
  const elapsed=local?.savedAt?Math.max(0,(Date.now()-Date.parse(local.savedAt))/1000):0;
  return {game:local?.game??initialState(),lastSavedAt:local?.savedAt??null,
    offlineRemainingSeconds:(local?.game?.pendingOfflineSeconds??0)+(local?.game?.phase==='running'?elapsed:0),
    autoSaveEnabled:readAutoSaveEnabled(),saveError:error};
}

const pretty=formatAmount;
export function eventMessage(event) {
  if(!event)return null;
  if(event.type==='start')return event.name+'과(와) 전투 시작';
  if(event.type==='victory'){
    const statRewards=Object.entries(event.rewards??{}).map(([k,v])=>
      statLabel(k)+' '+(v<0?'−':'+')+formatStatValue(k,Math.abs(v)));
    const energyRewards=Object.entries(event.energyRewards??{}).filter(([,amount])=>compareAmount(amount,0)>0)
      .map(([type,amount])=>type+' 에너지 +'+pretty(amount));
    const details=[...statRewards,...energyRewards];
    return event.name+' '+event.count+'회 처치'+(details.length?' · '+details.join(', '):'');
  }
  if(event.type==='defeat')return event.name+'에게 쓰러졌습니다.';
  if(event.type==='flee')return '전투에서 도망쳤습니다.';
  return null;
}
export const useGameStore=create((set,get)=>({
  ...initialPersistence(),
  logs:[],
  // Non-persistent visual effects. The engine supplies actual values once per attack.
  damagePopups:[],
  nextDamagePopupId:0,
  pruneDamagePopups:()=>set(previous=>{
    const now=Date.now();
    const remaining=previous.damagePopups.filter(item=>now-item.timestamp<1200);
    return remaining.length===previous.damagePopups.length?previous:{damagePopups:remaining};
  }),
  // UI-only filter persists across page tab unmounts, not in saved game data.
  wildRegionFilter:null,
  energySystemTab:'micro',
  setEnergySystemTab:(tab)=>set({energySystemTab:tab}),
  energySectionTab:'stats',
  setEnergySectionTab:(tab)=>set({energySectionTab:tab}),
  queueOfflineProduction:(seconds)=>set(previous=>
    Number.isFinite(seconds)&&seconds>0
      ?{offlineRemainingSeconds:previous.offlineRemainingSeconds+seconds}
      :previous),
  consumeOfflineProduction:(seconds)=>set(previous=>{
    if(previous.offlineRemainingSeconds<=0)return previous;
    const applied=Math.min(5,Math.max(0,seconds),previous.offlineRemainingSeconds);
    if(applied<=0)return previous;
    return {game:tickEconomy(previous.game,applied),offlineRemainingSeconds:Math.max(0,previous.offlineRemainingSeconds-applied)};
  }),
  setWildRegionFilter:(filter)=>set({wildRegionFilter:filter}),
  saveLocal:()=>{
    const state=get();
    // Persist remaining production explicitly so pauses and mid-catch-up reloads lose nothing.
    const savedAt=writeLocalSave({...state.game,pendingOfflineSeconds:state.offlineRemainingSeconds});
    set({lastSavedAt:savedAt,saveError:null});
    return savedAt;
  },
  setAutoSaveEnabled:(enabled)=>{
    writeAutoSaveEnabled(enabled);
    set({autoSaveEnabled:enabled});
  },
  restoreGame:(game)=>set(previous=>({game,logs:[],damagePopups:[],saveError:null,offlineRemainingSeconds:0,
    wildRegionFilter:previous.wildRegionFilter==='all'||isRegionUnlocked(game,previous.wildRegionFilter)?previous.wildRegionFilter:REGION.id})),
  importGame:(game)=>{
    // Atomic from the player's perspective: do not replace the running game if persistence fails.
    const pending=game.pendingOfflineSeconds??0;
    const savedAt=writeLocalSave({...game,pendingOfflineSeconds:pending});
    set(previous=>({game,logs:[],damagePopups:[],saveError:null,lastSavedAt:savedAt,offlineRemainingSeconds:pending,
      wildRegionFilter:previous.wildRegionFilter==='all'||isRegionUnlocked(game,previous.wildRegionFilter)?previous.wildRegionFilter:REGION.id}));
  },
  resetSavedGame:()=>{
    clearLocalSave();
    set({game:initialState(),logs:[],damagePopups:[],lastSavedAt:null,autoSaveEnabled:true,saveError:null,
      offlineRemainingSeconds:0,wildRegionFilter:REGION.id,energySystemTab:'micro',energySectionTab:'stats'});
  },
  dispatch:(action)=>set(previous=>{
    const game=transition(previous.game,action);
    if(game===previous.game)return previous;
    const event=game.combat.lastEvent;
    const isNewEvent=event && event.id > previous.game.eventSerial;
    const message=isNewEvent?eventMessage(event):({
      START:'게임을 시작했습니다.',
      PAUSE:'게임이 일시정지되었습니다.',
      RESUME:'게임을 재개했습니다.',
      RESET:'게임 진행 상태가 초기화되었습니다.',
      MOVE_PLANET:'메타몽이 행성을 이동하고 대기 스텔라에너지를 흡수했습니다.'
    })[action.type];
    const resetVisuals=['RESET','MOVE_PLANET'].includes(action.type);
    const now=Date.now();
    const incoming=action.type==='COMBAT_TICK'?(game.combatVisualEvents??[]):[];
    const retained=resetVisuals?[]:previous.damagePopups.filter(effect=>now-effect.timestamp<1200);
    const damagePopups=[...retained,...incoming.map((effect,index)=>({
      ...effect,id:previous.nextDamagePopupId+index+1,timestamp:now
    }))].slice(-24);
    return {game,damagePopups,nextDamagePopupId:previous.nextDamagePopupId+incoming.length,
      logs:message?[message,...previous.logs].slice(0,100):previous.logs,
      ...(action.type==='MOVE_PLANET'||action.type==='RESET'?{wildRegionFilter:REGION.id,energySystemTab:'micro',energySectionTab:'stats',offlineRemainingSeconds:0}:{})};
  })
}));
