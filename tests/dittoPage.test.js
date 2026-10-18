import test from 'node:test';
import assert from 'node:assert/strict';
import { DITTO_INFO_TABS, isDittoInfoTab, renderDittoBattle, renderDittoPage } from '../src/ui/dittoPage.js';
import { readFileSync } from 'node:fs';

test('five Ditto info tabs have approved labels and order', () => {
  assert.deepEqual(DITTO_INFO_TABS.map(tab => tab.label), [
    '기본 능력치', '특수 능력치', '보너스', '자동화', '동화도'
  ]);
  assert.ok(isDittoInfoTab('assimilation'));
  assert.equal(isDittoInfoTab('__invalid__'), false);
  assert.equal((renderDittoPage().match(/data-ditto-info-tab=/g) || []).length, 5);
});
test('each info subtab renders distinct content', () => {
  for (const tab of DITTO_INFO_TABS) {
    const html = renderDittoPage({infoTab:tab.id});
    assert.match(html, new RegExp('data-ditto-info-tab="' + tab.id + '" role="tab" aria-selected="true"'));
    assert.match(html, /class="ditto-info-body"/);
  }
  assert.match(renderDittoPage({infoTab:'basic',stats:{hp:10}}), /class="ditto-detail-stats"/);
  assert.match(renderDittoPage({infoTab:'special'}), /특수 능력치 시스템은 추후 연결됩니다/);
  assert.match(renderDittoPage({infoTab:'bonus'}), /보너스 효과 시스템은 추후 연결됩니다/);
  assert.match(renderDittoPage({infoTab:'automation'}), /자동화 기능은 추후 연결됩니다/);
  assert.match(renderDittoPage({infoTab:'assimilation'}), /타입별 동화도 시스템은 추후 연결됩니다/);
});
test('battle region reserves space but is visually empty outside combat', () => {
  const html = renderDittoPage();
  assert.match(html, /class="ditto-battle-region"/);
  assert.doesNotMatch(html, /battle-opponent|battle-vitals|도망가기/);
  const css = readFileSync(new URL('../src/style.css', import.meta.url),'utf8');
  assert.match(css,/\.ditto-battle-region\{min-height:390px/);
});
test('active encounter shows enemy, rewards, bars and escape button', () => {
  const html = renderDittoBattle({
    active:true,
    enemy:{
      name:'적 포켓몬',
      imageUrl:'./enemy.png',
      stats:{ATK:42,SPD:16},
      rewards:{BNN:3},
      hp:{current:50,max:100},
      attackCooldown:{elapsed:300,duration:600}
    },
    dittoHp:{current:25,max:50},
    dittoAttackCooldown:{elapsed:200,duration:400}
  });
  for (const key of ['적 능력치','보상','적 포켓몬','메타몽','적 공격','메타몽 공격','도망가기','BNN','ATK']) assert.ok(html.includes(key), key);
  assert.equal((html.match(/style="width:50.00%"/g) || []).length, 4);
});
test('inactive or missing enemy never shows active battle elements', () => {
  assert.doesNotMatch(renderDittoBattle({active:true}), /battle-opponent/);
  assert.doesNotMatch(renderDittoBattle({active:false,enemy:{name:'x'}}), /battle-opponent/);
});
test('main app persists selected Ditto subtab independently of primary tabs', () => {
  const code = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(code,/let activeDittoInfoTab = 'basic'/);
  assert.match(code,/isDittoInfoTab\(infoTabButton\.dataset\.dittoInfoTab\)/);
  assert.match(code,/renderDittoPage\(\{ infoTab: activeDittoInfoTab, stats: state\.dittoStats, battle: state\.combat \}\)/);
});

test('basic ability tab always shows the four Ditto baseline abilities', () => {
  const stats={hp:10,attack:1,defense:0,specialAttack:0,specialDefense:0,speed:3000,minDamagePercent:85};
  const html=renderDittoPage({stats});
  for(const item of ['HP','공격','스피드','3,000ms','최소 피해량','85%']) assert.ok(html.includes(item));
  assert.doesNotMatch(html,/특수공격|특수방어|<span>방어<\/span>|/);
  assert.equal((html.match(/class="ditto-detail-stat"/g)||[]).length,4);
});
