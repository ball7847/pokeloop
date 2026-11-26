import fs from 'node:fs';
import {getWildPokemon,REGIONS,ALL_POKEMON} from '../src/core/wildData.js';
const report=JSON.parse(fs.readFileSync('artifacts/virtual-play/report.json','utf8'));
const target=ALL_POKEMON.filter(p=>/^W0[12]/.test(p.encounterCode)&&(!p.rarity||p.rarity==='common')&&!p.evolvesFrom&&p.id!=='tropius').map(p=>p.id);
const name=id=>id?getWildPokemon(id)?.name:null;
const round=v=>typeof v==='number'?Math.round(v*100)/100:v;
const pickStats=s=>s?Object.fromEntries(Object.entries(s.effective).map(([k,v])=>[k,round(v)])):null;
for(const r of report.results){
 const planets=r.planets.map(p=>{
  const kills={},upgrades={},abilities=[];let lastVictory=null,milestone=null,goal19=null;
  for(let i=0;i<p.events.length;i++){
   const e=p.events[i];
   if(e.kind==='victory'){
    kills[e.id]=e.kills;lastVictory={id:e.id,name:name(e.id),count:e.kills,time:e.elapsedSeconds};
    if(!goal19&&target.every(id=>kills[id]>=1))goal19={...lastVictory};
   }
   if(e.kind==='upgrade')upgrades[e.id]=e.level;
   if(e.kind==='automation'||e.kind==='production-purchase')abilities.push(e.id);
   if(!milestone&&e.kind==='particle-milestone'&&e.type==='노말'&&e.level===1){
    const next=p.events[i+1];milestone={time:e.elapsedSeconds,earned:e.earned,lastVictory,uniqueGoal19:target.filter(id=>kills[id]>=1).length,missing:target.filter(id=>!kills[id]).map(name),kills:{...kills},upgrades:{...upgrades},abilities:[...abilities],trigger:next};
   }
  }
  const h=p.appeared.filter(id=>p.kills[id]>0).at(-1);
  const c=p.appeared.filter(id=>p.firstChallenges[id]).at(-1);
  return {planet:p.planet,reason:p.reason,milestone,goal19,highest:name(h),highestCount:p.kills[h],challenge:name(c),challengeCount:p.kills[c],stats:pickStats(p.firstVictories[h]),challengeStats:pickStats(p.firstChallenges[c]),upgrades:p.firstVictories[h]?.upgrades,finalStats:pickStats(p.stats),finalUpgrades:p.stats.upgrades,layer:p.unlockedLayer,startLayer:p.startLayer,seconds:round(p.seconds),se:round(p.pendingSE),exact:p.exactFights,estimated:p.estimatedFights,ledger:p.ledger.every(x=>x.ok),uncertain:p.approximateUnresolved,normalGained:round(p.gained.노말),normalProduced:round(p.production.노말),normalSpent:round(p.spent.노말),normalParticles:round(p.particleEarned.노말),capped:p.capped.length,appeared:p.appeared.length};
 });
 console.log('EARLY_BALANCE_SUMMARY '+JSON.stringify({seed:r.seed,mode:report.mode,durationMs:report.durationMs,targetCount:target.length,stop:r.stop,planets}));
}
