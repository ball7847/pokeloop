import test from 'node:test';
import assert from 'node:assert/strict';
import { TOP_STATS, renderTopBar } from '../src/ui/topBar.js';

test('3-column 2-row stats read row-major in approved order', () => {
  assert.deepEqual(TOP_STATS.map(x => x.label), ['HP','공격','특수공격','스피드','방어','특수방어']);
  const html = renderTopBar();
  assert.equal((html.match(/class="stat-box"/g) || []).length, 6);
});
test('combat is right-hand block with only escape control', () => {
  const html = renderTopBar({ battle: { active: true, enemy: { name: '야생 적' } } });
  assert.ok(html.indexOf('class="top-stats"') < html.indexOf('class="mini-combat"'));
  assert.match(html, /도망가기<\/button>/);
  assert.match(html, /class="run-away" disabled/);
  assert.doesNotMatch(html, /data-action="ATTACK"/);
});
test('unknown HP and enemy remain unfilled and clearly marked', () => {
  const html = renderTopBar({ battle: { active: true, enemy: { name: '적 대기 중' } } });
  assert.match(html, /적 대기 중/);
  assert.equal((html.match(/— \/ —/g) || []).length, 2);
  assert.equal((html.match(/aria-valuetext="미설정"/g) || []).length, 2);
});
test('HP is clamped, text escaped and known bars are filled', () => {
  const html = renderTopBar({battle: {active:true,enemy: {name:'<script>',hp:{current:50,max:100}},dittoHp:{current:30,max:60}}});
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.equal((html.match(/style="width:50.00%"/g) || []).length, 2);
});

test('out of combat hides whole panel and reduces header to stats', () => {
  for (const battle of [null, {active:false,enemy:{name:'적'}}]) {
    const html=renderTopBar({battle});
    assert.doesNotMatch(html,/class="mini-combat"/);
    assert.doesNotMatch(html,/도망가기/);
    assert.match(html,/class="stat-grid"/);
    assert.match(html,/alt="메타몽"/);
    assert.doesNotMatch(html,/POKÉLOOP|메타몽 능력치<\/strong>/);
  }
});
test('battle active requires an enemy, regardless of game running state', () => {
  assert.doesNotMatch(renderTopBar({battle:{active:true}}),/class="mini-combat"/);
  assert.match(renderTopBar({battle:{active:true,enemy:{name:'적'}}}),/class="mini-combat"/);
});
