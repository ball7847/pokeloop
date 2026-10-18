import { createGameStore } from './core/gameState.js';

const TABS = [
  { id: 'ditto', label: '메타몽' },
  { id: 'wild', label: '야생' },
  { id: 'dex', label: '도감' },
  { id: 'settings', label: '설정' }
];
const game = createGameStore();
const app = document.getElementById('app');
let activeTab = TABS[0].id;
let logs = [];
const phaseLabels = { ready:'대기 중', running:'진행 중', paused:'일시정지', finished:'완료' };

function contents(state) {
  if (activeTab === 'ditto') return '<div class="intro"><span>PARTNER</span><h2>메타몽</h2><p>메타몽의 상세 정보가 표시되는 화면입니다.</p></div><div class="panel ditto-content"><div class="ditto-image" aria-hidden="true">•ᴗ•</div><div><h3>메타몽</h3><p>능력치, 기술, 동화도 등 상세 정보는 추후 구현합니다.</p><small>상세 시스템 준비 중</small></div></div>';
  if (activeTab === 'wild') return '<div class="intro"><span>EXPLORATION</span><h2>야생</h2><p>야생 포켓몬과 층 진행 화면입니다.</p></div><div class="panel empty"><div class="symbol">◇</div><h3>야생 탐험 준비 중</h3><p>전투 시스템은 아직 연결되지 않았습니다.</p></div>';
  if (activeTab === 'dex') return '<div class="intro"><span>COLLECTION</span><h2>도감</h2><p>발견한 포켓몬을 확인하는 화면입니다.</p></div><div class="panel empty"><div class="symbol">▤</div><h3>도감 준비 중</h3><p>도감 데이터는 이후 추가합니다.</p></div>';
  return '<div class="intro"><span>OPTIONS</span><h2>설정</h2><p>기본 게임 상태를 제어할 수 있습니다.</p></div><div class="panel"><h3>게임 상태: ' + phaseLabels[state.phase] + '</h3><div class="actions">' +
    [['시작','START',state.phase !== 'ready'],['일시정지','PAUSE',state.phase !== 'running'],['재개','RESUME',state.phase !== 'paused'],['초기화','RESET',false]].map(([label,action,disabled]) =>
      '<button type="button" data-action="' + action + '" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>').join('') + '</div></div>';
}
function render() {
  const state = game.getState();
  app.innerHTML = '<div class="shell">' +
    '<header class="topbar"><div class="identity"><div class="ditto-mini" aria-hidden="true">•ᴗ•</div><div><small>POKÉLOOP</small><strong>메타몽</strong></div></div><div class="metrics" aria-label="메타몽 간략 정보"><div>상태<strong>' + phaseLabels[state.phase] + '</strong></div><div>현재 층<strong>' + state.floor + '</strong></div><div>승리<strong>' + state.victories + '</strong></div></div></header>' +
    '<div class="workspace"><nav class="sidebar" aria-label="메인 메뉴"><small>MENU</small>' +
    TABS.map(tab => '<button type="button" data-tab="' + tab.id + '" class="tab ' + (activeTab === tab.id ? 'selected' : '') + '" ' + (activeTab === tab.id ? 'aria-current="page"' : '') + '>' + tab.label + '<span>›</span></button>').join('') +
    '</nav><main class="main" id="main-content">' + contents(state) + '</main>' +
    '<aside class="logs" aria-label="이벤트 로그"><div class="logs-header"><div><small>HISTORY</small><h2>로그</h2></div><span class="log-count">' + logs.length + '</span></div><div class="log-body" role="log" aria-live="polite">' +
    (logs.length ? logs.map(log => '<div class="log"><small>시스템</small><p>' + log + '</p></div>').join('') : '<p class="log-empty">표시할 이벤트가 없습니다.</p>') +
    '</div></aside></div></div>';
}
app.addEventListener('click', event => {
  const tab = event.target.closest('[data-tab]');
  if (tab && TABS.some(item => item.id === tab.dataset.tab)) {
    activeTab = tab.dataset.tab;
    render();
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const before = game.getState();
  const action = button.dataset.action;
  const after = game.dispatch({ type: action });
  if (after === before) return;
  const messages = { START:'게임을 시작했습니다.', PAUSE:'게임이 일시정지되었습니다.', RESUME:'게임을 재개했습니다.', RESET:'게임 진행 상태가 초기화되었습니다.' };
  if (messages[action]) logs.unshift(messages[action]);
  logs = logs.slice(0, 100);
  render();
});
game.subscribe(render);
render();
