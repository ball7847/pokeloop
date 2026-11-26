import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

const cases=[['paralysis','마비'],['poison','독'],['antidote','해독'],['honey','꿀'],['intimidation','위협'],['sound','소리'],['criticalChance','치명타확률'],['criticalMultiplier','치명타배율'],['minDamagePercent','최소 피해량'],['maxDamagePercent','최대 피해량']];
test('all approved special stat icons are local SVG assets and render through shared components',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {homeStatIconUrl,StatIcon,StatLabel,STATUS_STAT_FILES}=await vite.ssrLoadModule('/src/components/StatIcon.jsx');
  assert.deepEqual(STATUS_STAT_FILES,{paralysis:'paralysis.svg',poison:'poison.svg',antidote:'antidote.svg'});
  for(const [stat,label] of cases){
   const svg=readFileSync(new URL('../public/assets/stats/'+stat+'.svg',import.meta.url),'utf8');
   assert.match(svg,/<svg\b/,stat);
   assert.ok(homeStatIconUrl(stat).endsWith('assets/stats/'+stat+'.svg'),stat);
   const icon=renderToStaticMarkup(React.createElement(StatIcon,{stat}));
   const markup=renderToStaticMarkup(React.createElement(StatLabel,{stat,label}));
   assert.ok(icon.includes(stat+'.svg'),stat);
   assert.ok(icon.includes('home-stat-icon'),stat);
   assert.ok(markup.includes(stat+'.svg')&&markup.includes(label),stat);
   assert.doesNotMatch(icon+markup,/extra-stat-icon|✚|✿|♪/);
  }
 }finally{await vite.close();}
});
