import test from 'node:test';
import {runMultiPlanet} from './helpers/virtualPlaySimulator.js';
import {getWildPokemon} from '../src/core/wildData.js';
const pretty=e=>({...e,name:e.id?getWildPokemon(e.id)?.name:undefined});
test('ad hoc virtual play through third region school form; report only, no gameplay modifications',()=>{
 const run=runMultiPlanet({maxMoves:10,random:()=>0.5,mode:'fast',logLimit:14000,maxBattles:1500,maxTicks:125000});
 for(const report of run.planets){
  const clear=(report.kills['wishiwashi-school']??0)>=1;
  const done=report.events.findIndex(e=>e.kind==='five-phase-completed'||e.kind==='five-phase-completed-after-farming');
  const timeline=report.events.slice(0,done>=0?done+1:undefined).filter(e=>!['expected-combat'].includes(e.kind));
  const info={planet:report.planet,reason:report.reason,fiveCleared:report.fiveCleared,
   region3:{buizel:report.kills.buizel,magikarp:report.kills.magikarp,gyarados:report.kills.gyarados,
    wishiwashi:report.kills.wishiwashi,'wishiwashi-school':report.kills['wishiwashi-school']},
   appeared:report.appeared,kills:report.kills,defeats:report.defeats,battles:report.battles,
   uncertainties:report.uncertainties,attempts:report.attempts,maxStreak:report.maxStreak,
   stats:report.stats,gained:report.gained,spent:report.spent,remaining:report.remaining,
   pendingStellar:report.pendingStellar,events:timeline.map(pretty),afterFive:report.events.length-timeline.length};
  console.log('SCHOOL_PLANET '+JSON.stringify(info));
  if(clear){console.log('SCHOOL_CLEAR_PLANET '+report.planet);break;}
 }
 console.log('SCHOOL_RUN_META '+JSON.stringify({stop:run.stop,moves:run.moves.map(m=>({from:m.from,to:m.to,gain:m.gain,bought:m.bought})),totalPlanets:run.planets.length}));
});
