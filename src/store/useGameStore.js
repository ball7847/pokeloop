import { create } from 'zustand';
import { initialState, transition } from '../core/gameState.js';

const labels={attack:'공격',hp:'HP'};
const pretty=n=>Number(n.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4});
export function eventMessage(event) {
  if(!event)return null;
  if(event.type==='start')return event.name+'과(와) 전투 시작';
  if(event.type==='victory')return event.name+' '+event.count+'회 처치 · '+
    Object.entries(event.rewards).map(([k,v])=>labels[k]+' +'+pretty(v)).join(', ');
  if(event.type==='defeat')return event.name+'에게 쓰러졌습니다.';
  if(event.type==='flee')return '전투에서 도망쳤습니다.';
  return null;
}
export const useGameStore=create((set,get)=>({
  game:initialState(),
  logs:[],
  dispatch:(action)=>set(previous=>{
    const game=transition(previous.game,action);
    if(game===previous.game)return previous;
    const event=game.combat.lastEvent;
    const isNewEvent=event && event.id > previous.game.eventSerial;
    const message=isNewEvent?eventMessage(event):({
      START:'게임을 시작했습니다.',
      PAUSE:'게임이 일시정지되었습니다.',
      RESUME:'게임을 재개했습니다.',
      RESET:'게임 진행 상태가 초기화되었습니다.'
    })[action.type];
    return {game,logs:message?[message,...previous.logs].slice(0,100):previous.logs};
  })
}));
