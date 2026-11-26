import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {ACTIVE_UPGRADE_IDS,appearedTargets,availableTargets,decidePlanetExit,nextProductionWait,MAX_PLANET_IDLE_SECONDS,planetPattern} from './helpers/virtualPlaySimulator.js';
import {averageDamageChannel,expectedStrike,expectedCounterActions} from './helpers/expectedCombat.js';
test('simulation active upgrades exclude all ten temporary costs',()=>{
 assert.deepEqual([...ACTIVE_UPGRADE_IDS].sort(),['hp','attack','hpMultiplier','attackMultiplier','antidote','regenerationMultiplier','speedFlat'].sort());
});
test('production waiting requires unlocked active Slow Start and sufficient other types',()=>{
 let s=initialState();
 assert.equal(nextProductionWait(s),null);
 s={...s,pointCirculationUnlocked:true,automation:{...s.automation,point:true}};
 assert.equal(nextProductionWait(s),1);
 s={...s,energyUpgrades:{hp:20,attack:20},unlockedLayer:2};
 assert.equal(nextProductionWait(s),null);
 s={...s,energyBalances:{...s.energyBalances,물:10}};
 assert.equal(nextProductionWait(s,9),null);
 assert.equal(nextProductionWait(s,10),10);
 assert.equal(MAX_PLANET_IDLE_SECONDS,300);
});
test('locked appeared targets prevent false completion',()=>{
 const s=transition(initialState(),{type:'START'});
 assert.ok(appearedTargets(s).length>availableTargets(s).length);
 assert.equal(decidePlanetExit(s,true).status,'STALLED');
 assert.notEqual(planetPattern({unlockedLayer:1}),planetPattern({unlockedLayer:2}));
});
test('expected damage averages clipped integer rolls and applies physical piercing',()=>{
 const mean=averageDamageChannel(100,100,50,150);
 assert.ok(Math.abs(mean.mean-1275/101)<1e-10);
 assert.ok(Math.abs(mean.positive-50/101)<1e-10);
 const strike=expectedStrike({attack:100,piercing:50,minDamagePercent:100,maxDamagePercent:100},{defense:60,counter:50});
 assert.equal(strike.expectedDamage,90);
 assert.equal(expectedCounterActions(strike,{counter:50},10),0.5);
 assert.equal(expectedCounterActions(strike,{counter:50},0),0);
});
