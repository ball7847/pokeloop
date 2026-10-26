import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {BASIC_STAT_KEYS,SPECIAL_STAT_KEYS,visibleBasicStats,visibleSpecialStats} from '../src/core/dittoStats.js';
import {initialState,transition} from '../src/core/gameState.js';
import {appearedInRegion,isPokemonUnlockedInState} from '../src/core/wildData.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

test('exactly eight basic stats, remaining stats special, and default display rules stay intact',()=>{
 assert.deepEqual(BASIC_STAT_KEYS,['hp','attack','defense','specialAttack','specialDefense','speed','minDamagePercent','maxDamagePercent']);
 assert.deepEqual(SPECIAL_STAT_KEYS,['paralysis','poison','antidote','accuracy','dodge']);
 let state=initialState();
 assert.deepEqual(visibleSpecialStats(state.dittoStats),[]);
 assert.deepEqual(visibleBasicStats(state.dittoStats).map(x=>x.key),['hp','attack','speed','minDamagePercent']);
 state.dittoStats={...state.dittoStats,poison:3.5,paralysis:1,accuracy:80};
 assert.deepEqual(visibleSpecialStats(state.dittoStats).map(x=>x.key),['paralysis','poison','accuracy']);
});
test('first parent win alone rolls evolution; no subsequent reroll and save persists',()=>{
 let s=initialState();
 s={...s,phase:'running',activeRegionId:'berry-forest',
 killCounts:{...s.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1,meowth:1,geodude:1,exeggcute:1},
 dittoStats:{...s.dittoStats,hp:1000,attack:1000,speed:100}};
 s=transition(s,{type:'SELECT_WILD',pokemonId:'caterpie'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
 assert.equal(s.killCounts.caterpie,1);
 assert.equal(s.evolutionResults.metapod,true);
 assert.ok(appearedInRegion(s,'berry-forest').some(p=>p.id==='metapod'));
 assert.ok(isPokemonUnlockedInState(s,'metapod'));
 assert.equal(decodeSave(encodeSave(s)).game.evolutionResults.metapod,true);
 s=transition(s,{type:'SELECT_WILD',pokemonId:'caterpie'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
 assert.equal(s.killCounts.caterpie,2);
 assert.equal(s.evolutionResults.metapod,true);
});
test('special Ditto tab is rendered and both energy reward UI variants use appropriate labels',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {DittoPage,INFO_TABS}=await vite.ssrLoadModule('/src/pages/DittoPage.jsx');
  assert.equal(INFO_TABS.find(([id])=>id==='special')[1],'특별 능력치');
  const detail=renderToStaticMarkup(React.createElement(DittoPage,{infoTab:'special',setInfoTab:()=>{}}));
  assert.match(detail,/특별 능력치/);
  assert.match(detail,/ditto-detail-stats/);
  assert.doesNotMatch(detail,/특수 능력치 시스템은 추후 연결됩니다/);
  const {WildPage}=await vite.ssrLoadModule('/src/pages/WildPage.jsx');
  const wild=renderToStaticMarkup(React.createElement(WildPage));
  assert.ok(wild.includes('title="노말 에너지 +1"'));
  assert.ok(wild.includes('assets/types/normal.svg'));
  assert.ok(!wild.includes('>노말 에너지 +1</span>'));
  const {DittoBattle}=await vite.ssrLoadModule('/src/components/CombatPanel.jsx');
  const combatMarkup=renderToStaticMarkup(React.createElement(DittoBattle));
  assert.match(combatMarkup,/ditto-battle-region/);
  const {readFileSync}=await import('node:fs');
  const combatSource=readFileSync(new URL('../src/components/CombatPanel.jsx',import.meta.url),'utf8');
  assert.ok(combatSource.includes('enemy.energyRewards'));
  assert.ok(combatSource.includes('<EnergyTypeIcon type={type}/>'));
  assert.ok(combatSource.includes('{type} 에너지'));
  const {startBattle}=await vite.ssrLoadModule('/src/core/combatEngine.js');
  const started=startBattle(initialState(),'rattata');
  assert.deepEqual(started.combat.enemy.energyRewards,{'노말':1});
 }finally{await vite.close();}
});
