import test from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {mkdirSync,writeFileSync} from 'node:fs';
import {getWildPokemon} from '../src/core/wildData.js';
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
  const result=runMultiPlanet({maxMoves:10,encounterRandom,combatRandom,mode:'hybrid',logLimit:0});
  const planets=result.planets.map(p=>({
   planet:p.planet,reason:p.reason,fiveCleared:p.fiveCleared,
   combatMode:p.combatMode,approximateUnresolved:p.approximateUnresolved,
   uncertainties:p.uncertainties,
   capped:p.capped,incomplete:p.incomplete,battles:p.battles,
   defeats:Object.values(p.defeats).reduce((a,b)=>a+b,0),
   appeared:p.appeared.map(x=>x.id??x),maxStreak:p.maxStreak,
   pendingSE:p.pendingStellar,stellar:p.stellar,totalSE:p.totalStellarEarned,
   stats:p.stats,upgrades:p.stats.upgrades,
   gained:p.gained,spent:p.spent,remaining:p.remaining,production:p.production,unlockedLayer:p.unlockedLayer,startLayer:p.startLayer,layerEvents:p.layerEvents,milestoneEvents:p.milestoneEvents,firstProduction:p.firstProduction,particleEarned:p.particleEarned,firstVictories:p.firstVictories,idleSeconds:p.idleSeconds,locked:p.locked,
   kills:p.kills,
   seconds:p.seconds,particles:p.particles,milestones:p.milestones,abilities:p.abilities,exactRechecks:p.exactRechecks,unresolvedUncertainties:p.unresolvedUncertainties,
   rarity:Object.fromEntries(['common','uncommon','rare','legendary','divine','transcendent'].map(r=>[r,p.appeared.filter(id=>getWildPokemon(id)?.rarity===r||(r==='common'&&!getWildPokemon(id)?.rarity))])),
   timelineFive:p.events.filter(e=>e.phaseGoal===5),
   events:p.events,
  }));
  for(const move of result.moves)assert.ok(Number(move.gain)>=1,'every moved planet needs at least 1 pending SE');
  results.push({seed,stop:result.stop,moves:result.moves,planets});
 }
 const durationMs=Math.round(performance.now()-start);
 assert.equal(results.length,10);
 const report={schemaVersion:2,commit:process.env.GITHUB_SHA??null,createdAt:new Date().toISOString(),mode:'hybrid',durationMs,results};
 if(process.env.GITHUB_ACTIONS==='true'||process.env.VIRTUAL_REPORT_DIR){const dir=process.env.VIRTUAL_REPORT_DIR??'artifacts/virtual-play';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));}
 for(const result of results)console.log('SEEDED_VIRTUAL_PLAY_REPORT '+JSON.stringify({durationMs,results:[result].map(({seed,stop,moves,planets})=>({
 seed,stop,moves:moves.length,
 moveSummaries:seed===7847?moves.map(m=>({gain:+Number(m.gain).toFixed(2),bought:m.bought})):undefined,
 planets:planets.map(p=>({
  planet:p.planet,reason:p.reason,fiveCleared:p.fiveCleared,capped:p.capped.length,
  combatMode:p.combatMode,uncertaintyCount:p.uncertainties.length,approximateUnresolved:p.approximateUnresolved,
  incomplete:p.incomplete,locked:p.locked,battles:p.battles,defeats:p.defeats,unlockedLayer:p.unlockedLayer,startLayer:p.startLayer,layerEvents:p.layerEvents,milestoneEvents:p.milestoneEvents,firstProduction:p.firstProduction,particleEarned:p.particleEarned,production:p.production,idleSeconds:p.idleSeconds,firstVictories:Object.fromEntries(Object.entries(p.firstVictories).filter(([id])=>['tauros','pikachu','gyarados'].includes(id))),
  rare:p.appeared.filter(id=>getWildPokemon(id)?.rarity!=='common'&&!!getWildPokemon(id)?.rarity),
  pendingSE:+Number(p.pendingSE).toFixed(2),
  tropiusKills:p.kills.tropius,
  exactRechecks:p.exactRechecks,
  upgrades:p.upgrades,
 }))
 }))}));
});
