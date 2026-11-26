import test from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {execFileSync} from 'node:child_process';
import {compareAmount} from '../src/core/bigNumber.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {getWildPokemon} from '../src/core/wildData.js';
import {runMultiPlanet} from './helpers/virtualPlaySimulator.js';
import {createSeededRandom,createVirtualRandomStreams,DEFAULT_VIRTUAL_SEEDS} from './helpers/seededRandom.js';

test('ten independent seeded virtual playthroughs follow real transitions',()=>{
 const results=[],start=performance.now();
 const mode=process.env.VIRTUAL_MODE??'exact';
 const limits={maxMoves:10,maxBattles:6000,maxTicks:250000,maxPasses:200};
 let commit=process.env.GITHUB_SHA??null;
 if(!commit){try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}}
 let workingTreeDirty=null;try{workingTreeDirty=!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();}catch{}
 for(const seed of DEFAULT_VIRTUAL_SEEDS){
  const {encounterRandom,evolutionRandom,combatRandom}=createVirtualRandomStreams(seed);
  const result=runMultiPlanet({...limits,encounterRandom,evolutionRandom,combatRandom,mode,logLimit:0});
  const planets=result.planets.map(p=>({
   ...p,pendingSE:p.pendingStellar,totalSE:p.totalStellarEarned,upgrades:p.stats.upgrades,
   defeatTotal:Object.values(p.defeats).reduce((a,b)=>a+b,0),
   rarity:Object.fromEntries(['common','uncommon','rare','legendary','divine','transcendent'].map(r=>[r,p.appeared.filter(id=>(getWildPokemon(id)?.rarity??'common')===r)])),
   timelineFive:p.events.filter(e=>e.phaseGoal===5&&!e.extraFarming),
   extraFarming:p.events.filter(e=>e.extraFarming||e.kind==='farm-before-retry'),
  }));
  for(const move of result.moves)assert.ok(compareAmount(move.gain,1)>=0,'every moved planet needs at least 1 pending SE');
  results.push({seed,stop:result.stop,moves:result.moves,planets,repeatForecast:result.repeatForecast,unplayedPlanet:result.unplayedPlanet});
 }
 const durationMs=Math.round(performance.now()-start);
 assert.equal(results.length,10);
 const report={schemaVersion:3,commit,workingTreeDirty,createdAt:new Date().toISOString(),mode,limits,rngChannels:['encounter','evolution','combat'],policy:'low-level-first; five then cap; bounded retries',limitations:['300s per encounter','bounded actions','simulated time not browser wall clock','fast estimates are not observed outcomes'],durationMs,results};
 if(process.env.GITHUB_ACTIONS==='true'||process.env.VIRTUAL_REPORT_DIR){const dir=process.env.VIRTUAL_REPORT_DIR??'artifacts/virtual-play';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));}
 for(const result of results)console.log('SEEDED_VIRTUAL_PLAY_REPORT '+JSON.stringify({durationMs,results:[result].map(({seed,stop,moves,planets})=>({
 seed,stop,moves:moves.length,
 moveSummaries:seed===7847?moves.map(m=>({gain:+Number(m.gain).toFixed(2),bought:m.bought})):undefined,
 planets:planets.map(p=>({
  planet:p.planet,reason:p.reason,fiveCleared:p.fiveCleared,capped:p.capped.length,
  combatMode:p.combatMode,uncertaintyCount:p.uncertainties.length,approximateUnresolved:p.approximateUnresolved,
  incomplete:p.incomplete,locked:p.locked,battles:p.battles,defeats:p.defeats,unlockedLayer:p.unlockedLayer,startLayer:p.startLayer,layerEvents:p.layerEvents,milestoneEvents:p.milestoneEvents,firstProduction:p.firstProduction,particleEarned:p.particleEarned,production:p.production,idleSeconds:p.idleSeconds,firstVictories:Object.fromEntries(Object.entries(p.firstVictories).filter(([id])=>['tauros','pikachu','gyarados'].includes(id))),
  rare:p.appeared.filter(id=>getWildPokemon(id)?.rarity!=='common'&&!!getWildPokemon(id)?.rarity),
  pendingSE:p.pendingSE,
  tropiusKills:p.kills.tropius,
  exactRechecks:p.exactRechecks,
  upgrades:p.upgrades,
 }))
 }))}));
});
