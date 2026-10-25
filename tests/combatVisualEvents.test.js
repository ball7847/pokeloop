import test from 'node:test';
import assert from 'node:assert/strict';
import {appendDamageEvents,appendStatusDamageEvent} from '../src/core/combatVisualEvents.js';

test('damage visual helper keeps channel order and caps the sum to actual lost HP',()=>{
 const events=[];
 appendDamageEvents(events,'enemy',[{kind:'physical',value:8},{kind:'special',value:6}],10,14);
 assert.deepEqual(events,[{target:'enemy',kind:'physical',value:8},{target:'enemy',kind:'special',value:2}]);
});
test('visual helper supports status damage without changing battle health',()=>{
 const events=[];
 appendStatusDamageEvent(events,'player','poison',3);
 appendStatusDamageEvent(events,'player','poison',0);
 assert.deepEqual(events,[{target:'player',kind:'poison',value:3}]);
});
