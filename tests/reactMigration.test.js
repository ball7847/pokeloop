import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {App,Sidebar,LogPanel} from '../src/App.jsx';
import {TopBar} from '../src/components/TopBar.jsx';
import {DittoPage} from '../src/pages/DittoPage.jsx';
import {WildPage} from '../src/pages/WildPage.jsx';
import {useGameStore} from '../src/store/useGameStore.js';
const dispatch=action=>useGameStore.getState().dispatch(action);
test('React root renders all primary regions and initial stat values',()=>{
  const markup=renderToStaticMarkup(React.createElement(App));
  for(const label of ['메타몽','야생','도감','설정','기본 능력치','3,000ms','85%'])
    assert.ok(markup.includes(label),label);
  assert.ok(markup.includes('class="ditto-battle-region"'));
  assert.equal(markup.includes('class="mini-combat"'),false);
});
test('React wild page has 3 Pokemon and 17 empty grid cells',()=>{
 const html=renderToStaticMarkup(React.createElement(WildPage));
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
