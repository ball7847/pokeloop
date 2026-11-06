import test from 'node:test';
import assert from 'node:assert/strict';
import {runMultiPlanet} from './helpers/virtualPlaySimulator.js';
import {createVirtualRandomStreams,DEFAULT_VIRTUAL_SEEDS} from './helpers/seededRandom.js';
import {tickEconomy} from '../src/core/energySystem.js';

// A fixed-action comparison, NOT an independently optimized playthrough.
// All combat, energy spending, SU upgrades, economy ticks and softcap baselines
// are identical to the actual run. Only layer-2 -> normal production is removed.
const num=x=>Number(x??0);
const rounded=x=>Math.round(x*1e6)/1e6;
test('layer-2 normal production ON/OFF SE comparison under identical actions',()=>{
 const all=[];
 for(const seed of DEFAULT_VIRTUAL_SEEDS){
  const rng=createVirtualRandomStreams(seed);
  let activePlanet=1,normalOff=0,pendingOff=0;
  const observed=new Map();
  const observe=({action,deltaMs,before,after})=>{
   const planet=after.planetMoves+1;
   if(planet!==activePlanet){activePlanet=planet;normalOff=0;pendingOff=0;}
   if(action==='ECONOMY_TICK'){
    const shadow=tickEconomy({
     ...before,
     unlockedLayer:1,
     particleBalances:{...before.particleBalances,노말:normalOff},
     pendingStellar:pendingOff
    },deltaMs/1000);
    pendingOff=num(shadow.pendingStellar);
   }else{
    const purchasedNormal=num(after.particleBalances.노말)-num(before.particleBalances.노말);
    if(purchasedNormal>0)normalOff+=purchasedNormal;
   }
   observed.set(planet,{pendingOff,normalOff});
  };
  const result=runMultiPlanet({maxMoves:10,encounterRandom:rng.encounterRandom,combatRandom:rng.combatRandom,logLimit:0,observe});
  const planets=result.planets.map(p=>{
   const obs=observed.get(p.planet);
   assert.ok(obs,'missing economy observation');
   const on=num(p.pendingStellar),off=obs.pendingOff;
   assert.ok(on+1e-5>=off,'counterfactual SE cannot exceed production ON');
   return {planet:p.planet,on:rounded(on),off:rounded(off),delta:rounded(on-off),
    ratio:off>0?rounded(on/off):null,normalFromLayer2:rounded(num(p.particles.노말)-obs.normalOff),
    reason:p.reason};
  });
  all.push({seed,stop:result.stop,planets});
  console.log('LAYER2_SE_SEED '+JSON.stringify({seed,stop:result.stop,planets}));
 }
 console.log('LAYER2_SE_SUMMARY '+JSON.stringify({seeds:all.length,firstPositive:all.map(r=>({seed:r.seed,planet:r.planets.find(p=>p.delta>0)?.planet??null})),positivePlanetCount:all.flatMap(r=>r.planets).filter(p=>p.delta>0).length}));
 assert.equal(all.length,10);
});
