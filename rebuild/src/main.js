import './style.css';
import { PHASE, createGameStore } from './core/gameState.js';
const game = createGameStore();
const app = document.querySelector('#app');
const labels = { [PHASE.READY]: '대기', [PHASE.RUNNING]: '진행 중', [PHASE.PAUSED]: '일시정지', [PHASE.FINISHED]: '완료' };
function button(text, action, disabled = false) {
  return `<button data-action="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`;
}
function render(state) {
  app.innerHTML = `
    <main class="shell">
      <header class="header"><div><small>REBUILD / FOUNDATION 01</small><h1>PokeLoop</h1></div><strong class="phase">${labels[state.phase]}</strong></header>
      <section class="summary" aria-label="진행 현황">
        <article><span>현재 층</span><b>${state.floor}</b></article>
        <article><span>전투 순서</span><b>${state.encounterIndex + 1}</b></article>
        <article><span>승리</span><b>${state.victories}</b></article>
      </section>
      <section class="stage"><div class="stage-inner"><small>GAME FOUNDATION</small><h2>${state.phase === PHASE.READY ? '새 여정 준비' : state.phase === PHASE.PAUSED ? '진행 일시정지' : state.phase === PHASE.FINISHED ? '여정 완료' : '여정 진행 중'}</h2><p>1단계에서는 게임 상태와 화면 구조만 구현합니다.<br>포켓몬, 적 등장과 자동 전투는 다음 단계에서 연결합니다.</p></div></section>
      <footer class="controls">
        ${button('시작', 'START', state.phase !== PHASE.READY)}
        ${button('일시정지', 'PAUSE', state.phase !== PHASE.RUNNING)}
        ${button('재개', 'RESUME', state.phase !== PHASE.PAUSED)}
        ${button('처음부터', 'RESET')}
      </footer>
    </main>`;
}
app.addEventListener('click', (e) => {
  const control = e.target.closest('[data-action]');
  if (control && !control.disabled) game.dispatch({ type: control.dataset.action });
});
game.subscribe(render);
render(game.getState());
