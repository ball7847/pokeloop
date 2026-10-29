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

test('intimidation uses transparent dark-red face SVG instead of arrow glyph',async()=>{
 const svg=readFileSync(new URL('../public/assets/stats/intimidation.svg',import.meta.url),'utf8');
 assert.match(svg,/<svg /);
 assert.match(svg,/fill="#96000E"/);
 assert.match(svg,/fill="#fff"/);
 assert.doesNotMatch(svg,/<rect|<image|background/i);
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {homeStatIconUrl,StatIcon,StatLabel}=await vite.ssrLoadModule('/src/components/StatIcon.jsx');
  assert.ok(homeStatIconUrl('intimidation').endsWith('assets/stats/intimidation.svg'));
  const icon=renderToStaticMarkup(React.createElement(StatIcon,{stat:'intimidation'}));
  assert.match(icon,/intimidation\.svg/);
  assert.doesNotMatch(icon,/extra-stat-icon|↓/);
  assert.match(renderToStaticMarkup(React.createElement(StatLabel,{stat:'intimidation',label:'위협'})),/intimidation\.svg/);
 }finally{await vite.close();}
});

test('sound uses the black transparent double-note SVG instead of a text glyph',async()=>{
 const svg=readFileSync(new URL('../public/assets/stats/sound.svg',import.meta.url),'utf8');
 assert.match(svg,/viewBox="0 0 128 128"/);
 assert.match(svg,/fill="#000"/);
 assert.doesNotMatch(svg,/<rect|<image|background|♪/i);
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {homeStatIconUrl,StatIcon,StatLabel}=await vite.ssrLoadModule('/src/components/StatIcon.jsx');
  assert.ok(homeStatIconUrl('sound').endsWith('assets/stats/sound.svg'));
  const icon=renderToStaticMarkup(React.createElement(StatIcon,{stat:'sound'}));
  assert.match(icon,/sound\.svg/);
  assert.doesNotMatch(icon,/extra-stat-icon|♪/);
  assert.match(renderToStaticMarkup(React.createElement(StatLabel,{stat:'sound',label:'소리'})),/sound\.svg/);
 }finally{await vite.close();}
});
