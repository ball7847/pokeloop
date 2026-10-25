import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('antidote uses transparent purple skull with green medical cross, no background or effects',()=>{
 const svg=readFileSync(new URL('../public/assets/stats/antidote.svg',import.meta.url),'utf8');
 assert.match(svg,/viewBox="0 0 128 128"/);
 assert.match(svg,/fill="#9221c6"/);
 assert.match(svg,/fill="#00cc79"/);
 assert.doesNotMatch(svg,/<rect\b|<image\b|<circle\b|filter=|gradient|sparkle/i);
});
test('antidote stat displays the dedicated icon without fallback glyph',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {homeStatIconUrl,StatIcon,StatLabel,STATUS_STAT_FILES}=await vite.ssrLoadModule('/src/components/StatIcon.jsx');
  assert.equal(STATUS_STAT_FILES.antidote,'antidote.svg');
  assert.ok(homeStatIconUrl('antidote').endsWith('assets/stats/antidote.svg'));
  const markup=renderToStaticMarkup(React.createElement(StatLabel,{stat:'antidote',label:'해독'}));
  assert.match(markup,/antidote\.svg/);
  assert.match(markup,/해독/);
  assert.doesNotMatch(markup,/✚/);
  assert.match(renderToStaticMarkup(React.createElement(StatIcon,{stat:'antidote'})),/home-stat-icon/);
 }finally{await vite.close();}
});
