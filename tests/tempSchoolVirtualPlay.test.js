import test from 'node:test';
import {initialState} from '../src/core/gameState.js';
import {playOnePlanet} from './helpers/virtualPlaySimulator.js';

test('temporary virtual-play report: stop precisely on first school-form victory',()=>{
 const {report}=playOnePlanet(initialState(),{
  random:()=>0.5,encounterRandom:()=>0.5,mode:'fast',
  stopOnVictoryId:'wishiwashi-school',logLimit:15000,maxBattles:1500,maxTicks:125000
 });
 console.log('SCHOOL_STOP_META '+JSON.stringify({
  stop:report.reason,combatMode:report.combatMode,battles:report.battles,
  attempts:report.attempts,defeats:report.defeats,maxStreak:report.maxStreak,
  kills:report.kills,appeared:report.appeared,stats:report.stats,
  gained:report.gained,spent:report.spent,production:report.production,remaining:report.remaining,
  particles:report.particles,pendingStellar:report.pendingStellar,seconds:report.seconds,
  uncertainties:report.uncertainties,firstChallenges:report.firstChallenges
 }));
 const events=report.events.filter(e=>e.kind!=='expected-combat');
 for(let i=0;i<events.length;i+=18){
  console.log('SCHOOL_STOP_TIMELINE '+JSON.stringify({offset:i,total:events.length,events:events.slice(i,i+18)}));
 }
 if(report.reason!=='target-clear')throw new Error('Target was not defeated');
});
