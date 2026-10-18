import { BASIC_STAT_FIELDS, visibleBasicStats, formatBasicStat } from '../core/dittoStats.js';
// Pure renderer for the central Ditto tab. Data is supplied by future game systems.
export const DITTO_INFO_TABS = Object.freeze([
  { id: 'basic', label: '기본 능력치' },
  { id: 'special', label: '특수 능력치' },
  { id: 'bonus', label: '보너스' },
  { id: 'automation', label: '자동화' },
  { id: 'assimilation', label: '동화도' }
]);

const PENDING_TEXT = {
  special: '특수 능력치 시스템은 추후 연결됩니다.',
  bonus: '보너스 효과 시스템은 추후 연결됩니다.',
  automation: '자동화 기능은 추후 연결됩니다.',
  assimilation: '타입별 동화도 시스템은 추후 연결됩니다.'
};
export function isDittoInfoTab(id) {
  return DITTO_INFO_TABS.some(tab => tab.id === id);
}
function escapeHtml(input) {
  return String(input).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}
function numericOrDash(value) {
  return typeof value === 'number' && Number.isFinite(value) ? escapeHtml(value) : '—';
}
function statDetails(stats) {
  const shown = visibleBasicStats(stats);
  return '<div class="ditto-detail-stats">' + shown.map(({ key, label, description }) =>
    '<div class="ditto-detail-stat" title="' + escapeHtml(description) + '"><span>' + label +
    '</span><strong>' + escapeHtml(formatBasicStat(key, stats[key])) + '</strong></div>'
  ).join('') + '</div>';
}
function health(value) {
  if (!value || !Number.isFinite(value.current) || !Number.isFinite(value.max) || value.max <= 0) {
    return { label: '— / —', percent: 0, ready: false };
  }
  const max = value.max;
  const current = Math.min(max, Math.max(0, value.current));
  return { label: escapeHtml(current) + ' / ' + escapeHtml(max), percent: current / max * 100, ready: true };
}
function imageUrl(url) {
  return typeof url === 'string' && (
    url.startsWith('./') || url.startsWith('/') || url.startsWith('https://')
  ) ? escapeHtml(url) : null;
}
function healthBlock(label, hp, kind) {
  const value = health(hp);
  return '<div class="battle-health ' + kind + '"><div class="battle-health-caption"><strong>' +
    escapeHtml(label) + '</strong><span>' + value.label + '</span></div>' +
    '<div class="battle-health-track" role="progressbar" aria-label="' + escapeHtml(label) +
    ' 체력" aria-valuemin="0" aria-valuemax="100" ' +
    (value.ready ? 'aria-valuenow="' + value.percent.toFixed(1) + '"' : 'aria-valuetext="미설정"') +
    '><div class="battle-health-fill" style="width:' + value.percent.toFixed(2) + '%"></div></div></div>';
}
function cooldownBlock(label, cooldown, kind) {
  const valid = cooldown && Number.isFinite(cooldown.elapsed) &&
    Number.isFinite(cooldown.duration) && cooldown.duration > 0;
  const percent = valid ? Math.max(0, Math.min(100, cooldown.elapsed / cooldown.duration * 100)) : 0;
  return '<div class="battle-cooldown ' + kind + '"><span>' + escapeHtml(label) + '</span>' +
    '<div class="battle-cooldown-track" role="progressbar" aria-label="' + escapeHtml(label) +
    '" aria-valuemin="0" aria-valuemax="100" ' +
    (valid ? 'aria-valuenow="' + percent.toFixed(1) + '"' : 'aria-valuetext="미설정"') +
    '><div class="battle-cooldown-fill" style="width:' + percent.toFixed(2) + '%"></div></div></div>';
}
function enemyAbilities(abilities) {
  if (!abilities || typeof abilities !== 'object') return '<p class="battle-muted">적 능력치 정보 없음</p>';
  const fields = Object.entries(abilities).filter(([, value]) =>
    typeof value === 'number' && Number.isFinite(value)).slice(0, 18);
  if (!fields.length) return '<p class="battle-muted">적 능력치 정보 없음</p>';
  return '<div class="battle-enemy-stats">' + fields.map(([key, value]) =>
    '<div><span>' + escapeHtml(key) + '</span><strong>' + numericOrDash(value) + '</strong></div>'
  ).join('') + '</div>';
}
function rewardDetails(rewards) {
  if (!rewards || typeof rewards !== 'object') return '<p class="battle-muted">보상 정보 없음</p>';
  const entries = Object.entries(rewards).filter(([, value]) =>
    typeof value === 'number' && Number.isFinite(value)).slice(0, 12);
  if (!entries.length) return '<p class="battle-muted">보상 정보 없음</p>';
  return '<div class="battle-reward-items">' + entries.map(([key, value]) =>
    '<span><b>' + escapeHtml(key) + '</b> +' + numericOrDash(value) + '</span>'
  ).join('') + '</div>';
}
export function renderDittoBattle(battle = null) {
  const active = battle?.active === true && battle.enemy != null;
  // Keep the structural region even when there is no encounter; hide all battle UI.
  if (!active) return '<section class="ditto-battle-region" aria-label="전투 영역"></section>';
  const enemy = battle.enemy;
  const name = enemy.name ?? '야생 포켓몬';
  const image = imageUrl(enemy.imageUrl);
  return '<section class="ditto-battle-region" aria-label="전투 영역">' +
    '<div class="battle-opponent"><div class="battle-stats-panel"><h3>적 능력치</h3>' +
    enemyAbilities(enemy.stats) + '</div>' +
    '<div class="battle-enemy-image"><strong>' + escapeHtml(name) + '</strong>' +
    (image ? '<img src="' + image + '" alt="' + escapeHtml(name) + '">' :
      '<div class="battle-image-placeholder" aria-hidden="true">?</div>') + '</div>' +
    '<div class="battle-side-panel"><div class="battle-rewards"><h3>보상</h3>' +
    rewardDetails(enemy.rewards) + '</div>' +
    '<button class="battle-escape" type="button" data-flee title="전투에서 도망칩니다">도망가기</button></div></div>' +
    '<div class="battle-vitals">' +
    cooldownBlock('적 공격', enemy.attackCooldown, 'enemy') +
    healthBlock(name, enemy.hp, 'enemy') +
    healthBlock('메타몽', battle.dittoHp, 'ditto') +
    cooldownBlock('메타몽 공격', battle.dittoAttackCooldown, 'ditto') +
    '</div></section>';
}
export function renderDittoPage({ infoTab = 'basic', stats = {}, battle = null } = {}) {
  const selected = isDittoInfoTab(infoTab) ? infoTab : 'basic';
  const tabs = DITTO_INFO_TABS.map(tab =>
    '<button type="button" class="ditto-info-tab ' + (selected === tab.id ? 'is-active' : '') +
    '" data-ditto-info-tab="' + tab.id + '" role="tab" aria-selected="' +
    (selected === tab.id ? 'true' : 'false') + '">' + tab.label + '</button>'
  ).join('');
  const body = selected === 'basic' ? statDetails(stats) :
    '<div class="ditto-info-pending">' + PENDING_TEXT[selected] + '</div>';
  return '<div class="ditto-page"><section class="ditto-info-region" aria-label="메타몽 정보 영역">' +
    '<div class="ditto-info-tabs" role="tablist" aria-label="메타몽 정보 분류">' + tabs + '</div>' +
    '<div class="ditto-info-body" role="tabpanel">' + body + '</div></section>' +
    renderDittoBattle(battle) + '</div>';
}
