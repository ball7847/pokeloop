import test from 'node:test';
import assert from 'node:assert/strict';
import { TOP_STATS, renderTopBar } from '../src/ui/topBar.js';

test('3-column 2-row stats read row-major in approved order', () => {
  assert.deepEqual(TOP_STATS.map(x => x.label), ['HP','공격','특수공격','스피드','방어','특수방어']);
  const html = renderTopBar();
  assert.equal((html.match(/class="stat-box"/g) || []).length, 6);
});
test('combat is right-hand block with only escape control', () => {
  const html = renderTopBar();
  assert.ok(html.indexOf('class="top-stats"') < html.indexOf('class="mini-combat"'));
  assert.match(html, /도망가기<\/button>/);
  assert.match(html, /class="run-away" disabled/);
  assert.doesNotMatch(html, /data-action="ATTACK"/);
});
test('unknown HP and enemy remain unfilled and clearly marked', () => {
  const html = renderTopBar();
  assert.match(html, /적 대기 중/);
  assert.equal((html.match(/— \/ —/g) || []).length, 2);
  assert.equal((html.match(/aria-valuetext="미설정"/g) || []).length, 2);
});
test('HP is clamped, text escaped and known bars are filled', () => {
  const html = renderTopBar({enemy: {name:'<script>',hp:{current:50,max:100}},dittoHp:{current:30,max:60}});
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.equal((html.match(/style="width:50.00%"/g) || []).length, 2);
});
