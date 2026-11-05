import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {playOnePlanet} from './helpers/virtualPlaySimulator.js';
test('first-planet Tropius threshold: source-state snapshot before every attempt',()=>{
 const start=transition(initialState(),{type:'START'});
 const {report}=playOnePlanet(start,{random:()=>0.5,encounterRandom:()=>0.5,mode:'fast',
   logLimit:15000,maxBattles:1500,maxTicks:120000});
 const filtered=report.events.filter(e=>['tropius-prebattle','tropius-estimate'].includes(e.kind));
 const intervals=[];
 for(let i=0;i<report.events.length;i++){
  const e=report.events[i];
  if(e.kind==='tropius-prebattle'){
   const last=report.events.slice(0,i).reverse().find(x=>x.kind==='battle-end');
   intervals.push({index:i,prev:last?{id:last.id,result:last.result,kills:last.kills}:null,probe:e,
    following:report.events.slice(i).find(x=>x.kind==='tropius-estimate')});
  }
 }
 console.log('TROPIUS_AUDIT '+JSON.stringify({attempts:report.attempts.tropius,
  defeats:report.defeats.tropius,kills:report.kills.tropius,
  comparisons:intervals,region3KillCounts:{buizel:report.kills.buizel,cutiefly:report.kills.cutiefly},
  totalProbes:filtered.length}));
 assert.equal(report.kills.tropius,10);
});
