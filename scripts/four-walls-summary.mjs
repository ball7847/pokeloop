import fs from 'node:fs';
import {getWildPokemon} from '../src/core/wildData.js';
const d=JSON.parse(fs.readFileSync('artifacts/virtual-play/report.json','utf8'));
const ids=['mankey','tauros','tropius','wishiwashi-school'];
const keys=['hp','attack','specialAttack','defense','specialDefense','speed','regeneration','accuracy','dodge','multiStrike','poison','antidote','paralysis','intimidation','piercing','counter','criticalChance','criticalMultiplier','minDamagePercent','maxDamagePercent','sound'];
const pack=s=>s?{stats:Object.fromEntries(keys.map(k=>[k,s.effective[k]])),upgrades:s.upgrades}:null;
console.log('WALL_ENEMY '+JSON.stringify(ids.map(id=>{const p=getWildPokemon(id);return {id,name:p.name,stats:Object.fromEntries(keys.map(k=>[k,p[k]])),energy:p.energyReward}})));
for(const r of d.results){
 const planets=r.planets.map(p=>({planet:p.planet,reason:p.reason,seconds:p.seconds,se:p.pendingSE,layer:p.unlockedLayer,ledger:p.ledger.every(x=>x.ok),uncertain:p.approximateUnresolved,exact:p.exactFights,estimated:p.estimatedFights,walls:ids.map(id=>{
 const events=p.events;const first=events.findIndex(e=>e.kind==='victory'&&e.id===id);
 const before=first<0?events:events.slice(0,first);
 const losses=before.filter(e=>e.kind==='defeat'&&e.id===id).length;
 const farm=before.filter(e=>e.kind==='farm-before-retry'&&e.id===id).reduce((a,e)=>a+e.gainedKills,0);
 const firstLoss=before.findIndex(e=>e.kind==='defeat'&&e.id===id);
 const between=firstLoss<0?[]:before.slice(firstLoss+1).filter(e=>e.kind==='victory'&&e.id!==id);
 const firstFive=events.find(e=>e.kind==='victory'&&e.id===id&&e.kills===5);
 return {id,challenge:pack(p.firstChallenges[id]),win:pack(p.firstVictories[id]),kills:p.kills[id]??0,losses,totalLosses:p.defeats[id]??0,farm,otherKillsAfterLoss:between.length,firstWinTime:first<0?null:events[first].elapsedSeconds,firstFiveTime:firstFive?.elapsedSeconds??null,maxStreak:p.maxStreak[id]??0,attempts:p.encounterAttempts[id]??0};
 })}));
 console.log('WALL_SUMMARY '+JSON.stringify({seed:r.seed,durationMs:d.durationMs,mode:d.mode,stop:r.stop,planets}));
}
