import test from 'node:test';
import assert from 'node:assert/strict';
import {runMultiPlanet} from './helpers/virtualPlaySimulator.js';
import {createVirtualRandomStreams,DEFAULT_VIRTUAL_SEEDS} from './helpers/seededRandom.js';
import {particleRates} from '../src/core/energySystem.js';

const upper=['불꽃','물','풀'];
const num=x=>Number(x??0);
const round=x=>Number(num(x).toFixed(6));
test('2026-11-06 observational layer-2 economy audit: 10 seeded virtual plays',()=>{
  const reports=[];
  for(const seed of DEFAULT_VIRTUAL_SEEDS){
    const rng=createVirtualRandomStreams(seed);
    const stages=new Map();
    const first={bank:null,unlock:null,production:null,milestone:null};
    const events=[];
    const observe=({action,before,after,battles,seconds})=>{
      const planet=after.planetMoves+1;
      if(!stages.has(planet))stages.set(planet,{planet,normalFromLayer2:0,normalFromPurchases:0,firstRate:null,maxRate:0,firstThreshold:null,layer2Purchased:Object.fromEntries(upper.map(t=>[t,0]))});
      const p=stages.get(planet);
      const fromPurchases=action!=='ECONOMY_TICK'?Math.max(0,num(after.particleBalances.노말)-num(before.particleBalances.노말)):0;
      p.normalFromPurchases+=fromPurchases;
      if(action==='ECONOMY_TICK'){
        const delta=num(after.particleBalances.노말)-num(before.particleBalances.노말);
        if(delta>0)p.normalFromLayer2+=delta;
        const rate=num(particleRates(after).노말);
        p.maxRate=Math.max(p.maxRate,rate);
        if(rate>0&&p.firstRate===null)p.firstRate={rate:round(rate),secondsBefore:seconds,battles};
        if(rate>0&&first.production===null)first.production={planet,rate:round(rate),secondsBefore:seconds,battles};
      }
      for(const t of upper){
        const delta=num(after.particleBalances[t])+num(after.particleBank[t])-num(before.particleBalances[t])-num(before.particleBank[t]);
        if(delta>0&&action!=='ECONOMY_TICK')p.layer2Purchased[t]+=delta;
        if(first.bank===null&&num(after.particleBank[t])>num(before.particleBank[t]))first.bank={planet,type:t,amount:round(after.particleBank[t]),secondsBefore:seconds,battles};
        if(num(after.particleMilestones[t])>=1&&num(before.particleMilestones[t])===0){
          const detail={planet,type:t,particles:round(after.particleBalances[t]),secondsBefore:seconds,battles,action};
          events.push(detail);if(first.milestone===null)first.milestone=detail;
          if(p.firstThreshold===null)p.firstThreshold=detail;
        }
      }
      if(before.unlockedLayer<2&&after.unlockedLayer>=2&&first.unlock===null)first.unlock={planet,normal:round(after.particleBalances.노말),secondsBefore:seconds,battles};
    };
    const result=runMultiPlanet({maxMoves:10,encounterRandom:rng.encounterRandom,combatRandom:rng.combatRandom,logLimit:seed===7847?6000:0,observe});
    const planets=result.planets.map(p=>{
      const x=stages.get(p.planet)??{normalFromLayer2:0,normalFromPurchases:0,firstRate:null,maxRate:0,firstThreshold:null,layer2Purchased:{}};
      const layer2=Object.fromEntries(upper.map(t=>[t,round(p.particles[t])]));
      return {planet:p.planet,reason:p.reason,seconds:round(p.seconds),battles:p.battles,normal:round(p.particles.노말),layer2,layer2Milestones:Object.fromEntries(upper.map(t=>[t,p.milestones[t]])),layer2Purchased:Object.fromEntries(upper.map(t=>[t,round(x.layer2Purchased[t])])),normalFromLayer2:round(x.normalFromLayer2),normalFromPurchases:round(x.normalFromPurchases),firstRate:x.firstRate,maxRate:round(x.maxRate),firstThreshold:x.firstThreshold,normalMilestone:p.milestones.노말,pendingSE:round(p.pendingStellar),fiveCleared:p.fiveCleared,uncertainCount:p.uncertainties.length};
    });
    const line={seed,stop:result.stop,moves:result.moves.length,first,events,planets};
    reports.push(line);
    console.log('LAYER2_SEED_REPORT '+JSON.stringify(line));
    assert.ok(planets.length>=1);
  }
  const summaries={seedCount:reports.length,anyProduction:reports.filter(r=>r.first.production!==null).map(r=>r.seed),anyMilestone:reports.filter(r=>r.first.milestone!==null).map(r=>r.seed)};
  console.log('LAYER2_AUDIT_SUMMARY '+JSON.stringify(summaries));
  assert.equal(reports.length,10);
});