// UI-only header. No fabricated HP or stats are supplied until battle data exists.
export const TOP_STATS = Object.freeze([
  { id: 'hp', label: 'HP' },
  { id: 'attack', label: '공격' },
  { id: 'specialAttack', label: '특수공격' },
  { id: 'speed', label: '스피드' },
  { id: 'defense', label: '방어' },
  { id: 'specialDefense', label: '특수방어' }
]);

function safeText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}
function hpDisplay(hp) {
  if (!hp || !Number.isFinite(hp.current) || !Number.isFinite(hp.max) || hp.max <= 0) {
    return { text: '— / —', percent: 0, available: false };
  }
  const max = Math.max(1, hp.max);
  const current = Math.max(0, Math.min(hp.current, max));
  return { text: safeText(current) + ' / ' + safeText(max), percent: current / max * 100, available: true };
}
function combatHp(label, hp, kind) {
  const info = hpDisplay(hp);
  return '<div class="combat-unit ' + kind + '">' +
    '<div class="combat-unit-line"><strong>' + safeText(label) + '</strong><span>' + info.text + '</span></div>' +
    '<div class="combat-health" role="progressbar" aria-label="' + safeText(label) + ' HP" aria-valuemin="0" aria-valuemax="100" ' +
    (info.available ? 'aria-valuenow="' + info.percent.toFixed(1) + '"' : 'aria-valuetext="미설정"') + '>' +
    '<div class="combat-health-fill" style="width:' + info.percent.toFixed(2) + '%"></div></div></div>';
}
export function renderTopBar({ stats = {}, enemy = null, dittoHp = null } = {}) {
  const statGrid = TOP_STATS.map(({ id, label }) => {
    const v = stats[id];
    return '<div class="stat-box"><span>' + label + '</span><strong>' +
      (Number.isFinite(v) ? safeText(v) : '—') + '</strong></div>';
  }).join('');
  const enemyName = enemy?.name ?? '적 대기 중';
  const enemyHp = enemy?.hp ?? null;
  const hasValidEnemyImage = typeof enemy?.imageUrl === 'string' && /^(\.\/|\/|https:\/\/)/.test(enemy.imageUrl);
  const portrait = hasValidEnemyImage
    ? '<img src="' + safeText(enemy.imageUrl) + '" alt="' + safeText(enemyName) + '" />'
    : '<span aria-hidden="true">?</span>';
  return '<header class="topbar new-topbar">' +
    '<div class="top-stats" aria-label="메타몽 기본 능력치"><div class="top-stats-title"><span class="eyebrow">POKÉLOOP</span><strong>메타몽 능력치</strong></div>' +
    '<div class="stat-grid">' + statGrid + '</div></div>' +
    '<section class="mini-combat" aria-label="간이전투 영역"><div class="mini-combat-main">' +
    '<div class="combat-portrait">' + portrait + '</div>' +
    '<div class="combat-bars">' + combatHp(enemyName, enemyHp, 'enemy') +
    combatHp('메타몽', dittoHp, 'ditto') + '</div></div>' +
    '<button type="button" class="run-away" disabled title="전투 시스템 연결 후 사용할 수 있습니다">도망가기</button>' +
    '</section></header>';
}
