import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {useGameStore} from '../src/store/useGameStore.js';
const dispatch=action=>useGameStore.getState().dispatch(action);
test('React root renders all primary regions and initial stat values',async()=>{
  const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
  let markup;
  try {
    const {App}=await vite.ssrLoadModule('/src/App.jsx');
    markup=renderToStaticMarkup(React.createElement(App));
  } finally {await vite.close();}
  for(const label of ['메타몽','야생','도감','설정','기본 능력치','3,000ms','85%'])
    assert.ok(markup.includes(label),label);
  assert.ok(markup.includes('class="ditto-battle-region"'));
  assert.equal(markup.includes('class="mini-combat"'),false);
});
test('React wild page has 3 Pokemon and 17 empty grid cells',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 let html;
 try {
   const {WildPage}=await vite.ssrLoadModule('/src/pages/WildPage.jsx');
   html=renderToStaticMarkup(React.createElement(WildPage));
 } finally {await vite.close();}
 for(const name of ['꼬렛','구구','망키'])assert.ok(html.includes(name));
 assert.equal((html.match(/class="wild-empty-cell"/g)||[]).length,17);
});
test('Zustand dispatch records only event transitions, never combat ticks',()=>{
 dispatch({type:'RESET'});
 let before=useGameStore.getState().logs.length;
 dispatch({type:'SELECT_WILD',pokemonId:'rattata'});
 let current=useGameStore.getState();
 assert.equal(current.logs.length,before+1);
 const id=current.game.combat.lastEvent.id;
 for(let i=0;i<7;i++)dispatch({type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
 current=useGameStore.getState();
 assert.equal(current.game.combat.lastEvent.id,id);
 assert.equal(current.logs.length,before+1);
 dispatch({type:'FLEE'});
 assert.equal(useGameStore.getState().logs.length,before+2);
});
test('Zustand state maintains existing victory and reward rules',()=>{
 dispatch({type:'RESET'});
 dispatch({type:'SELECT_WILD',pokemonId:'rattata'});
 for(let i=0;i<90 && useGameStore.getState().game.combat.active;i++)
   dispatch({type:'COMBAT_TICK',deltaMs:100,random:()=>0.9999});
 const s=useGameStore.getState().game;
 assert.equal(s.killCounts.rattata,1);
 assert.equal(s.victories,1);
 assert.equal(s.dittoStats.attack,2);
 assert.equal(s.dittoStats.hp,10);
});

test('desktop layout confines scrolling to panels without clipping mobile document',()=>{
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(css,/\@media \(min-width:951px\) \{/);
 assert.match(css,/\.shell \{ height:100dvh; min-height:0; overflow:hidden; \}/);
 assert.match(css,/\.workspace \{ flex:1 1 0; height:0; min-height:0; overflow:hidden; \}/);
 assert.match(css,/\.main \{ min-height:0; min-width:0; overflow-y:auto;/);
 assert.match(css,/\.ditto-page \{ flex:1; height:100%; min-height:0;/);
 assert.match(css,/\.ditto-info-body \{ min-height:0; overflow-y:auto;/);
 assert.match(css,/\.ditto-battle-region \{ min-height:0; overflow-y:auto;/);
 assert.match(css,/\.log-body \{ min-height:0; overflow-y:auto;/);
 assert.match(css,/\@media \(max-width:950px\) \{/);
 assert.match(css,/\.shell \{ height:auto; min-height:100dvh; overflow:visible; \}/);
});

test('wild card layout follows portrait, basic stats, extras, rewards and footer',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
   const {WildPage,visibleWildBasicStats,visibleWildExtraStats}=await vite.ssrLoadModule('/src/pages/WildPage.jsx');
   const html=renderToStaticMarkup(React.createElement(WildPage));
   assert.equal((html.match(/class="wild-card-upper"/g)||[]).length,3);
   assert.equal((html.match(/class="wild-extra-stats"/g)||[]).length,3);
   assert.equal((html.match(/class="wild-rewards"/g)||[]).length,3);
   assert.equal((html.match(/class="wild-card-footer"/g)||[]).length,3);
   assert.ok(html.indexOf('wild-card-portrait')<html.indexOf('wild-basic-stats'));
   assert.ok(html.indexOf('wild-basic-stats')<html.indexOf('wild-extra-stats'));
   assert.ok(html.indexOf('wild-extra-stats')<html.indexOf('wild-rewards'));
   assert.match(html,/2,000ms/);
   assert.equal((html.match(/class="wild-stat-box"/g)||[]).length,9);
   assert.deepEqual(visibleWildBasicStats({hp:3,attack:0,speed:2000}).map(x=>x.key),['hp','speed']);
   assert.deepEqual(visibleWildExtraStats({extraStats:{dodge:0,critChance:12}}),[['critChance',12]]);
   assert.equal((html.match(/class="wild-empty-cell"/g)||[]).length,17);
 }finally{await vite.close();}
});
