import test from 'node:test';
import assert from 'node:assert/strict';
import {runMultiPlanet} from './helpers/virtualPlaySimulator.js';

// Explicit full-play audit. This is not a balance change or an invented reward.
// Log lines deliberately carry a structured timeline so the report can be
// generated from the actual game transitions rather than reconstructed guesses.
test('2026-10-28 virtual play: up to 10 real planet moves, stop on repeat stall (RNG 0.5)',()=>{
 const result=runMultiPlanet({maxMoves:10,random:()=>0.5,logLimit:12000,maxBattles:1000,maxTicks:75000});
 for(const p of result.planets){
  assert.ok(p.appeared.every(id=>(p.kills[id]??0)<=10),'kill cap exceeded');
  const fiveEnd=p.events.findIndex(x=>x.kind==='five-phase-completed'||x.kind==='five-phase-completed-after-farming');
  const firstPhase=fiveEnd<0?p.events:p.events.slice(0,fiveEnd+1);
  // Split event lines: GitHub Actions may truncate a very long JSON log line.
  for(let offset=0;offset<firstPhase.length;offset+=15){
   console.log('VPLAY_TIMELINE_CHUNK '+JSON.stringify({planet:p.planet,offset,total:firstPhase.length,
    events:firstPhase.slice(offset,offset+15)}));
  }
 }
 console.log('VPLAY_SUMMARY '+JSON.stringify({
  rng:0.5,stop:result.stop,repeatForecast:result.repeatForecast,moveCount:result.moves.length,
  planets:result.planets.map(p=>({planet:p.planet,reason:p.reason,exitReason:p.exitReason,
   fiveCleared:p.fiveCleared,battles:p.battles,attempts:p.attempts,defeats:p.defeats,
   maxStreak:p.maxStreak,seconds:p.seconds,kills:p.kills,
   appeared:p.appeared,capped:p.capped,incomplete:p.incomplete,
   stats:p.stats,firstChallenges:p.firstChallenges,remaining:p.remaining,
   gained:p.gained,spent:p.spent,production:p.production,
   particles:p.particles,milestones:p.milestones,
   pendingStellar:p.pendingStellar,stellar:p.stellar,totalStellarEarned:p.totalStellarEarned})),
  moves:result.moves,final:{stellar:result.state.stellar,
    totalStellarEarned:result.state.totalStellarEarned,upgrades:result.state.permanentUpgrades,
    planetMoves:result.state.planetMoves,dexDiscovered:result.state.dexDiscovered}
 }));
 assert.ok(result.planets.length>=1);
 assert.ok(result.moves.length<=10);
 if(result.stop.startsWith('repeat-')){
  assert.ok(result.repeatForecast,'repeat stop requires an actual forecast');
  // A repeat forecast can occur exactly on the tenth (final permitted) move.
  assert.ok(result.moves.length<=10,'repeat stop must respect the safety limit');
 }
});