import test from 'node:test';
import {initialState,transition} from '../src/core/gameState.js';
import {playOnePlanet,chooseStellarUpgrades} from './helpers/virtualPlaySimulator.js';
import {createVirtualRandomStreams} from './helpers/seededRandom.js';
import {getWildPokemon} from '../src/core/wildData.js';
function run(label,seed){
 const r=seed===null?{encounterRandom:()=>0.5,combatRandom:()=>0.5}:createVirtualRandomStreams(seed);
 let s=transition(initialState(),{type:'START'}),stop='limit';
 for(let p=1;p<=11;p++){
  const a=playOnePlanet(s,{random:r.combatRandom,encounterRandom:r.encounterRandom,mode:'fast',stopOnVictoryId:'wishiwashi-school',logLimit:12000,maxBattles:1800,maxTicks:150000});
  s=a.state;
  const q=a.report;
  const ids=['tropius','buizel','cutiefly','azurill','wishiwashi-school'];
  const x=Object.fromEntries(ids.map(id=>[id,{kills:q.kills[id]??0,defeats:q.defeats[id]??0,attempts:q.attempts[id]??0,maxStreak:q.maxStreak[id]??0}]));
  const events=q.events.filter(e=>ids.includes(e.id)&&['battle-end','farm-before-retry','deferred'].includes(e.kind)).map(e=>({kind:e.kind,id:e.id,wins:e.wins,kills:e.kills,result:e.result,gainedKills:e.gainedKills}));
  console.log('REGION3_PLANET '+JSON.stringify({label,planet:p,reason:q.reason,encounters:x,events,battles:q.battles,defeats:Object.values(q.defeats).reduce((a,b)=>a+b,0),indeterminate:q.uncertainties.filter(u=>!u.estimatedOutcome).length,incomplete:q.incomplete.map(id=>getWildPokemon(id)?.name??id),stats:q.stats.effective,pendingSE:q.pendingStellar,stellar:q.stellar,permanent:q.stats.permanent}));
  if((s.killCounts['wishiwashi-school']??0)>0){stop='target-clear';break;}
  if(['battle-budget','combat-tick-budget'].includes(q.reason)){stop=q.reason;break;}
  if(p===11)break;
  const old=s;s=transition(s,{type:'MOVE_PLANET',random:r.encounterRandom});
  if(s===old){stop='move-rejected';break;}
  const v=chooseStellarUpgrades(s);s=v.state;
  console.log('REGION3_MOVE '+JSON.stringify({label,planet:p+1,purchases:v.bought,permanent:s.permanentUpgrades,stellar:s.stellar}));
 }
 console.log('REGION3_FINAL '+JSON.stringify({label,stop,moves:s.planetMoves,schoolKills:s.killCounts['wishiwashi-school']??0}));
}
test('fixed-0.5',()=>run('fixed',null));
test('seed-7847',()=>run('seed7847',7847));
