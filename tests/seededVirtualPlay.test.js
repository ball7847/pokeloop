import test from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {runMultiPlanet} from './helpers/virtualPlaySimulator.js';
import {createSeededRandom,createVirtualRandomStreams,DEFAULT_VIRTUAL_SEEDS} from './helpers/seededRandom.js';

test('seeded RNG is reproducible and encounter/combat streams independent',()=>{
 const a=createSeededRandom(7847),b=createSeededRandom(7847);
 for(let i=0;i<100;i++){const x=a();assert.equal(x,b());assert.ok(x>=0&&x<1);}
 const a1=createVirtualRandomStreams(7847),a2=createVirtualRandomStreams(7847);
 for(let i=0;i<200;i++)a1.combatRandom();
 assert.equal(a1.encounterRandom(),a2.encounterRandom());
 assert.notDeepEqual(Array.from({length:10},()=>createSeededRandom(7847)()),Array.from({length:10},()=>createSeededRandom(7848)()));
});

test('ten independent seeded virtual playthroughs follow real transitions',()=>{
 const results=[],start=performance.now();
 for(const seed of DEFAULT_VIRTUAL_SEEDS){
  const {encounterRandom,combatRandom}=createVirtualRandomStreams(seed);
  const result=runMultiPlanet({maxMoves:10,encounterRandom,combatRandom,logLimit:seed===7847?5000:0});
  const planets=result.planets.map(p=>({
   planet:p.planet,reason:p.reason,fiveCleared:p.fiveCleared,
   capped:p.capped,incomplete:p.incomplete,battles:p.battles,
   defeats:Object.values(p.defeats).reduce((a,b)=>a+b,0),
   appeared:p.appeared.map(x=>x.id??x),maxStreak:p.maxStreak,
   pendingSE:p.pendingStellar,stellar:p.stellar,totalSE:p.totalStellarEarned,
   stats:p.stats,upgrades:p.stats.upgrades,
   gained:p.gained,spent:p.spent,remaining:p.remaining,
   kills:p.kills,
   ...(seed===7847?{timeline:p.timeline}:{}),
  }));
  for(const move of result.moves)assert.ok(Number(move.gain)>=1,'every moved planet needs at least 1 pending SE');
  results.push({seed,stop:result.stop,moves:result.moves,planets});
 }
 const durationMs=Math.round(performance.now()-start);
 assert.equal(results.length,10);
 console.log('SEEDED_VIRTUAL_PLAY_REPORT '+JSON.stringify({durationMs,results:results.map(({seed,stop,moves,planets})=>({
  seed,stop,moves:moves.length,moveSummaries:moves.map(m=>({from:m.from,to:m.to,gain:m.gain,afterStellar:m.afterStellar,bought:m.bought})),
  planets:planets.map(p=>({planet:p.planet,reason:p.reason,fiveCleared:p.fiveCleared,
    capped:p.capped.length,incomplete:p.incomplete,battles:p.battles,defeats:p.defeats,
    appeared:p.appeared,pendingSE:p.pendingSE,stellar:p.stellar,
    tropiusKills:p.kills.tropius,
    ...(seed===7847?{timeline:p.timeline}:{}),
  }))
 }))}));
});
