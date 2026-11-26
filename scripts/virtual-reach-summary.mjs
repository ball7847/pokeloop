import fs from 'node:fs';
import {getWildPokemon} from '../src/core/wildData.js';
const report=JSON.parse(fs.readFileSync('artifacts/virtual-play/report.json','utf8'));
const summary={mode:report.mode,commit:report.commit,durationMs:report.durationMs,results:report.results.map(r=>({seed:r.seed,stop:r.stop,planets:r.planets.map(p=>{
 const killed=p.appeared.filter(id=>p.kills[id]>0).at(-1);
 const challenged=p.appeared.filter(id=>p.firstChallenges[id]).at(-1);
 const pack=(id,snapshot)=>id?{id,name:getWildPokemon(id).name,count:p.kills[id],stats:snapshot?.effective,upgrades:snapshot?.upgrades}:null;
 return {planet:p.planet,reason:p.reason,highest:pack(killed,p.firstVictories[killed]),challenge:pack(challenged,p.firstChallenges[challenged]),final:p.stats.effective,layer:p.unlockedLayer,seconds:p.seconds,pendingSE:p.pendingSE,exactFights:p.exactFights,estimatedFights:p.estimatedFights,uncertain:p.approximateUnresolved,ledger:p.ledger.every(x=>x.ok)};
 })}))};
for(const r of summary.results)console.log('REACH_SUMMARY '+JSON.stringify({mode:summary.mode,commit:summary.commit,durationMs:summary.durationMs,...r}));
