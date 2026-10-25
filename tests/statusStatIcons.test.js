import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('uploaded status icons are separate transparent vector silhouettes with eye cutouts',()=>{
 for(const [stat,color] of [['paralysis','#FFD21A'],['poison','#9221C6']]){
  const svg=readFileSync(new URL('../public/assets/stats/'+stat+'.svg',import.meta.url),'utf8');
  assert.match(svg,/<svg /);
  assert.match(svg,/viewBox=/);
  assert.ok(svg.includes('fill="'+color+'"'));
  assert.doesNotMatch(svg,/<rect|<image|background/i);
 }
 const poison=readFileSync(new URL('../public/assets/stats/poison.svg',import.meta.url),'utf8');
 assert.ok(poison.includes('fill-rule="evenodd"'));
});
test('paralysis and poison render with proper shared stat icons and no old text glyphs',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {homeStatIconUrl,StatIcon,StatLabel,STATUS_STAT_FILES}=await vite.ssrLoadModule('/src/components/StatIcon.jsx');
  assert.deepEqual(STATUS_STAT_FILES,{paralysis:'paralysis.svg',poison:'poison.svg',antidote:'antidote.svg'});
  for(const [stat,label] of [['paralysis','마비'],['poison','독']]){
   assert.ok(homeStatIconUrl(stat).endsWith('assets/stats/'+stat+'.svg'));
   const rendered=renderToStaticMarkup(React.createElement(StatLabel,{stat,label}));
   assert.ok(rendered.includes(stat+'.svg'));
   assert.ok(rendered.includes(label));
   assert.ok(renderToStaticMarkup(React.createElement(StatIcon,{stat})).includes('home-stat-icon'));
  }
 }finally{await vite.close();}
});
