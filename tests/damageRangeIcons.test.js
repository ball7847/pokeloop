import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('damage range icons use uploaded minimum image and a strictly vertical mirrored maximum',async()=>{
 const read=name=>readFileSync(new URL('../public/assets/stats/'+name+'.svg',import.meta.url),'utf8');
 const min=read('minDamagePercent'),max=read('maxDamagePercent');
 assert.match(min,/data:image\/png;base64,/);
 assert.equal(max.replace(' transform="translate(0 32) scale(1 -1)"',''),min);
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try {
  const {homeStatIconUrl,StatLabel}=await vite.ssrLoadModule('/src/components/StatIcon.jsx');
  for(const stat of ['minDamagePercent','maxDamagePercent']){
   assert.ok(homeStatIconUrl(stat).endsWith(stat+'.svg'));
   assert.match(renderToStaticMarkup(React.createElement(StatLabel,{stat,label:stat})),/home-stat-icon/);
  }
  const {WildPage}=await vite.ssrLoadModule('/src/pages/WildPage.jsx');
  const {useGameStore}=await vite.ssrLoadModule('/src/store/useGameStore.js');
  const old=useGameStore.getState().game;
  try{
   useGameStore.setState({game:{...old,killCounts:{...old.killCounts,rattata:1,pidgey:1,mankey:1,spearow:1},activeRegionId:'berry-forest'}});
   const html=renderToStaticMarkup(React.createElement(WildPage));
   assert.match(html,/maxDamagePercent\.svg/);
  } finally {useGameStore.setState({game:old});}
 }finally{await vite.close();}
});
