import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState} from '../src/core/gameState.js';
import {startBattle,advanceBattle,resolveAttack} from '../src/core/combatEngine.js';
import {useGameStore} from '../src/store/useGameStore.js';
import {encodeSave,decodeSave} from '../src/core/saveSystem.js';

function combatState(){
 let s={...initialState(),phase:'running'};
 return startBattle(s,'rattata');
}
test('player damage number reflects effective HP loss, including overkill and killing blow',()=>{
 let s=combatState();
 s.dittoStats={...s.dittoStats,attack:1000,speed:100};
 s.combat.dittoAttackCooldown={elapsed:0,duration:100};
 const next=advanceBattle(s,100,()=>0.5);
 assert.equal(next.combat.lastEvent.type,'victory');
 assert.deepEqual(next.combatVisualEvents.map(e=>[e.kind,e.target]),[['damage','enemy']]);
 assert.equal(next.combatVisualEvents[0].value,3);
});
test('attacks emit miss and blocked events without changing actual HP',()=>{
 let s=combatState(),c=structuredClone(s.combat);
 const target={...c.enemy.statistics,hp:3,dodge:100};
 const missed=[];
 const miss=resolveAttack(c,'player',{...s.dittoStats,accuracy:100},target,()=>0.8,missed);
 assert.equal(miss.hit,false);
 assert.equal(missed[0].kind,'miss');
 assert.equal(c.enemy.hp.current,3);
 const blocked=[];
 resolveAttack(c,'player',{...s.dittoStats,attack:1,accuracy:100}, {...target,dodge:0,defense:999},()=>0.5,blocked);
 assert.equal(blocked[0].kind,'blocked');
 assert.equal(blocked[0].value,0);
 assert.equal(c.enemy.hp.current,3);
});
test('poison shows separate event, capped by actor remaining HP even when attack misses',()=>{
 let s=combatState(),c=structuredClone(s.combat);
 c.currentHp=2;
 c.dittoHp.current=2;
 c.playerStatus.poison=5;
 const events=[];
 resolveAttack(c,'player',{...s.dittoStats,accuracy:0,antidote:0},c.enemy.statistics,()=>0.5,events);
 assert.deepEqual(events.map(e=>[e.kind,e.target]),[['miss','enemy'],['poison','player']]);
 assert.equal(events[1].value,2);
 assert.equal(c.currentHp,0);
});
test('simultaneous attack timestamps deliver effects from both combatants',()=>{
 let s=combatState();
 s.combat.dittoAttackCooldown={elapsed:0,duration:100};
 s.combat.enemy.attackCooldown={elapsed:0,duration:100};
 s.combat.enemy.statistics={...s.combat.enemy.statistics,speed:100};
 const next=advanceBattle(s,100,()=>0.5);
 assert.deepEqual(next.combatVisualEvents.map(e=>e.target),['enemy','player']);
 assert.equal(next.combat.active,true);
});
test('store retains lethal visual event when combat becomes inactive and excludes effects from saves',()=>{
 const previous=useGameStore.getState();
 try{
   let s=combatState();
   s.dittoStats={...s.dittoStats,attack:1000,speed:100};
   s.combat.dittoAttackCooldown={elapsed:0,duration:100};
   useGameStore.setState({game:s,damagePopups:[],nextDamagePopupId:0});
   useGameStore.getState().dispatch({type:'COMBAT_TICK',deltaMs:100,random:()=>0.5});
   const now=useGameStore.getState();
   assert.equal(now.game.combat.active,false);
   assert.equal(now.damagePopups.length,1);
   assert.equal(now.damagePopups[0].value,3);
   const saved=decodeSave(encodeSave(now.game));
   assert.equal('combatVisualEvents' in saved.game,false);
   useGameStore.getState().dispatch({type:'RESET'});
   assert.equal(useGameStore.getState().damagePopups.length,0);
 }finally{useGameStore.setState(previous,true);}
});
test('transient popups are bounded and expire after 1200ms',()=>{
 const previous=useGameStore.getState();
 try{
  useGameStore.setState({damagePopups:[{id:1,timestamp:Date.now()-1300},{id:2,timestamp:Date.now()}]});
  useGameStore.getState().pruneDamagePopups();
  assert.deepEqual(useGameStore.getState().damagePopups.map(e=>e.id),[2]);
 }finally{useGameStore.setState(previous,true);}
});
test('damage overlay renders even after battle ends and uses original movement timing',()=>{
 const source=readFileSync(new URL('../src/components/CombatPanel.jsx',import.meta.url),'utf8');
 assert.ok(source.includes('if(!combat.active||!combat.enemy)return <section'));
 assert.ok(source.includes('<DamagePopupLayer/>'));
 assert.ok(source.includes('battle-enemy-hit-anchor'));
 assert.ok(source.includes('battle-player-hit-anchor'));
 const css=readFileSync(new URL('../src/styles/40-world-overrides.css',import.meta.url),'utf8');
 assert.match(css,/pokeloop-float-damage 1\.2s ease-out/);
 assert.match(css,/40px/);
 assert.match(css,/pointer-events:none/);
});
