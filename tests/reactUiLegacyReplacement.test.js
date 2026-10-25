import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {initialState,transition} from '../src/core/gameState.js';

test('React entrypoint is the only application bootstrap and mounts App',()=>{
 const entry=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(entry,/createRoot\(document.getElementById\('app'\)\)\.render\(<App \/>\)/);
 const shell=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 for(const component of ['TopBar','DittoPage','WildPage','Sidebar','LogPanel'])
  assert.ok(shell.includes('<'+component));
 assert.doesNotMatch(shell,/innerHTML\s*=/);
});

test('React battle component retains active and inactive branches and controls',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {DittoBattle}=await vite.ssrLoadModule('/src/components/CombatPanel.jsx');
  const inactive=renderToStaticMarkup(React.createElement(DittoBattle));
  assert.doesNotMatch(inactive,/battle-opponent/);
  const src=readFileSync(new URL('../src/components/CombatPanel.jsx',import.meta.url),'utf8');
  for(const required of ['battle-opponent','battle-player-hit-anchor','battle-enemy-hit-anchor','도망가기','HealthBar'])
   assert.ok(src.includes(required));
 }finally{await vite.close();}
});

test('React Ditto tabs retain approved order and active ability presentation',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {DittoPage,INFO_TABS}=await vite.ssrLoadModule('/src/pages/DittoPage.jsx');
  assert.deepEqual(INFO_TABS.map(([id])=>id),['basic','special','bonus','automation','assimilation']);
  const markup=renderToStaticMarkup(React.createElement(DittoPage,{infoTab:'basic',setInfoTab:()=>{}}));
  for(const label of ['HP','공격','스피드','최소 피해량'])assert.ok(markup.includes(label));
  assert.match(markup,/3,000ms/);
 }finally{await vite.close();}
});
