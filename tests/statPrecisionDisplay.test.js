import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {formatStatValue,formatBasicStat} from '../src/core/dittoStats.js';
import {eventMessage} from '../src/store/useGameStore.js';

test('every stat uses a single 3-decimal display policy, never altering its underlying value',()=>{
 const original=109.3726984126984;
 for(const key of ['maxDamagePercent','minDamagePercent','accuracy','dodge']){
   assert.equal(formatStatValue(key,original),'109.372%');
 }
 for(const key of ['hp','attack','defense','specialAttack','specialDefense','poison','paralysis','antidote']){
   assert.equal(formatStatValue(key,original),'109.372');
 }
 assert.equal(formatBasicStat('speed',2730.123456),'2,730.123ms');
 assert.equal(formatStatValue('speed',3000),'3,000ms');
 assert.equal(formatStatValue('maxDamagePercent',100),'100%');
 assert.equal(formatStatValue('hp',5.6),'5.6');
 assert.equal(formatStatValue('hp',0),'0');
 assert.equal(original,109.3726984126984);
});
test('victory log uses shared precision and appropriate units',()=>{
 const text=eventMessage({type:'victory',name:'테스트',count:1,rewards:{
   maxDamagePercent:3.1234567,speed:-30.123456,attack:1.234567
 },energyRewards:{노말:2}});
 assert.match(text,/최대 피해량 \+3\.123%/);
 assert.match(text,/스피드 −30\.123ms/);
 assert.match(text,/공격 \+1\.234/);
 assert.match(text,/노말 에너지 \+2/);
});
test('wild cards use the common formatter and render existing stat units',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try {
   const {WildPage}=await vite.ssrLoadModule('/src/pages/WildPage.jsx');
   const markup=renderToStaticMarkup(React.createElement(WildPage));
   assert.match(markup,/2,100ms/);
   assert.match(markup,/1,800ms/);
   assert.match(markup,/야생|시작의 평원/);
 } finally {await vite.close();}
});
