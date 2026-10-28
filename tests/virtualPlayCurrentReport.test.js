import test from 'node:test';
import {runMultiPlanet} from './helpers/virtualPlaySimulator.js';
test('2026-10-28 requested virtual play: before first move balances',()=>{
  const report=runMultiPlanet({maxMoves:2,random:()=>0.5,logLimit:10000,maxBattles:2000,maxTicks:100000});
  for(const planet of report.planets){
    console.log('USER_VIRTUAL_PLANET '+JSON.stringify({planet:planet.planet,reason:planet.reason,fiveCleared:planet.fiveCleared,appeared:planet.appeared,capped:planet.capped,incomplete:planet.incomplete,kills:planet.kills,defeats:planet.defeats,attempts:planet.attempts,maxStreak:planet.maxStreak,stats:planet.stats,firstChallenges:planet.firstChallenges,remaining:planet.remaining,gained:planet.gained,spent:planet.spent,production:planet.production,particles:planet.particles,pendingStellar:planet.pendingStellar,stellar:planet.stellar,totalStellarEarned:planet.totalStellarEarned,battles:planet.battles,events:planet.events}));
  }
  console.log('USER_VIRTUAL_MOVES '+JSON.stringify({moves:report.moves,stop:report.stop,repeatForecast:report.repeatForecast}));
});
