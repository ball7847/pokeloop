import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('honey asset is a transparent gold honeycomb and droplet SVG',()=>{
 const svg=readFileSync(new URL('../public/assets/stats/honey.svg',import.meta.url),'utf8');
 assert.match(svg,/<svg /);
 assert.match(svg,/viewBox="0 0 24 24"/);
 assert.match(svg,/fill="#F5B900"/);
 assert.doesNotMatch(svg,/<rect|<image|background|<foreignObject/i);
});
test('honey uses shared icon in stat display rather than flower glyph',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try {
  const {homeStatIconUrl,StatIcon,StatLabel}=await vite.ssrLoadModule('/src/components/StatIcon.jsx');
  assert.ok(homeStatIconUrl('honey').endsWith('assets/stats/honey.svg'));
  const icon=renderToStaticMarkup(React.createElement(StatIcon,{stat:'honey'}));
  const label=renderToStaticMarkup(React.createElement(StatLabel,{stat:'honey',label:'꿀'}));
  assert.match(icon,/honey\.svg/);
  assert.match(label,/honey\.svg/);
  assert.doesNotMatch(icon+label,/extra-stat-icon|✿/);
 }finally{await vite.close();}
});
