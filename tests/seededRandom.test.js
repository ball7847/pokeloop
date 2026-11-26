import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeededRandom,createVirtualRandomStreams} from './helpers/seededRandom.js';

test('seeded RNG is reproducible and encounter/combat streams independent',()=>{
 const a=createSeededRandom(7847),b=createSeededRandom(7847);
 for(let i=0;i<100;i++){const x=a();assert.equal(x,b());assert.ok(x>=0&&x<1);}
 const a1=createVirtualRandomStreams(7847),a2=createVirtualRandomStreams(7847);
 for(let i=0;i<200;i++)a1.combatRandom();
 assert.equal(a1.encounterRandom(),a2.encounterRandom());
 assert.notDeepEqual(Array.from({length:10},()=>createSeededRandom(7847)()),Array.from({length:10},()=>createSeededRandom(7848)()));
});

