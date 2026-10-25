import { create } from 'zustand';
import {formatAmount,compareAmount} from '../core/bigNumber.js';
import { initialState, transition } from '../core/gameState.js';
import {formatStatValue} from '../core/dittoStats.js';
import {loadLocalSave,readAutoSaveEnabled,writeLocalSave,writeAutoSaveEnabled,clearLocalSave} from '../core/saveSystem.js';

function initialPersistence(){
  let local=null,error=null;
  try{local=loadLocalSave();}catch(e){error='로컬 저장 데이터 불러오기 실패: '+e.message;}
  return {game:local?.game??initialState(),lastSavedAt:local?.savedAt??null,autoSaveEnabled:readAutoSaveEnabled(),saveError:error};
}

const labels={hp:'HP',attack:'공격',defense:'방어',specialAttack:'특수공격',specialDefense:'특수방어',speed:'스피드',paralysis:'마비',poison:'독',antidote:'해독',accuracy:'명중',dodge:'회피',minDamagePercent:'최소 피해량',maxDamagePercent:'최대 피해량'};
const pretty=formatAmount;
export function eventMessage(event) {
  if(!event)return null;
  if(event.type==='start')return event.name+'과(와) 전투 시작';
  if(event.type==='victory'){
    const statRewards=Object.entries(event.rewards??{}).map(([k,v])=>
      (labels[k]??k)+' '+(v<0?'−':'+')+formatStatValue(k,Math.abs(v)));
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
  // UI-only filter persists across page tab unmounts, not in saved game data.
  wildRegionFilter:null,
  setWildRegionFilter:(filter)=>set({wildRegionFilter:filter}),
  saveLocal:()=>{
    const savedAt=writeLocalSave(get().game);
    set({lastSavedAt:savedAt,saveError:null});
    return savedAt;
  },
  setAutoSaveEnabled:(enabled)=>{
    writeAutoSaveEnabled(enabled);
    set({autoSaveEnabled:enabled});
  },
  restoreGame:(game)=>set({game,logs:[],saveError:null}),
  resetSavedGame:()=>{
    clearLocalSave();
    set({game:initialState(),logs:[],lastSavedAt:null,autoSaveEnabled:true,saveError:null});
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
    return {game,logs:message?[message,...previous.logs].slice(0,100):previous.logs};
  })
}));
