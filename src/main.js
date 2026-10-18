import './style.css';
import { PHASE,createGameStore } from './core/gameState.js';
const game=createGameStore();
const app=document.getElementById('app');
const names={ready:'준비',running:'진행 중',paused:'일시정지',finished:'완료'};
const button=(label,action,disabled)=>`<button type="button" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
function render(s){
app.innerHTML=`<div class="game"><header class="top"><div><span class="eyebrow">POKÉLOOP · NEW FOUNDATION</span><h1>PokeLoop</h1></div><span class="status">${names[s.phase]}</span></header><section class="stats"><div>현재 층<strong>${s.floor}</strong></div><div>다음 전투<strong>${s.encounterIndex+1}</strong></div><div>승리<strong>${s.victories}</strong></div></section><main class="stage"><div class="stage-content"><span class="eyebrow">제1장 · 시작</span><h2>${s.phase===PHASE.READY?'새로운 여정':s.phase===PHASE.PAUSED?'잠시 멈춘 여정':s.phase===PHASE.FINISHED?'여정 완료':'여정 진행 중'}</h2><p>게임 구조를 처음부터 재구축하고 있습니다.<br>원작의 전투·층 진행 구조는 다음 단계에서 연결합니다.</p></div></main><footer class="controls">${button('시작','START',s.phase!==PHASE.READY)}${button('일시정지','PAUSE',s.phase!==PHASE.RUNNING)}${button('재개','RESUME',s.phase!==PHASE.PAUSED)}${button('처음부터','RESET',false)}</footer></div>`;
}
app.addEventListener('click',event=>{const el=event.target.closest('[data-action]');if(el&&!el.disabled)game.dispatch({type:el.dataset.action})});
game.subscribe(render);render(game.getState());
