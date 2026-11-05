import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState} from '../src/core/gameState.js';
import {autoChallengeTick} from '../src/core/abilityAutomation.js';
import {getWildPokemon,getKillLimit} from '../src/core/wildData.js';
import {tickEconomy} from '../src/core/energySystem.js';
import {effectiveDittoStats} from '../src/core/shopSystem.js';

test('automatic target selection continues after a fixed one-kill victory',()=>{
 const base=initialState();
 assert.equal(getKillLimit(getWildPokemon('magikarp')),1);
 const state={...base,phase:'running',qolUnlocks:['moxie'],automation:{...base.automation,moxie:true},
  killCounts:{...base.killCounts,magikarp:1},
  combat:{...base.combat,lastEvent:{id:1,type:'victory',pokemonId:'magikarp'}}};
 const next=autoChallengeTick(state);
 assert.equal(next.combat.active,true);
 assert.notEqual(next.combat.pokemonId,'magikarp');
});

test('extreme stellar softcap ratio never hangs',()=>{
 const base=initialState();
 const state={...base,unlockedLayer:2,
  particleMilestones:{...base.particleMilestones,노말:1},
  particleBalances:{...base.particleBalances,노말:1000},
  pendingStellar:'1e10000'};
 const next=tickEconomy(state,0.05);
 assert.equal(next.pendingStellar,'1e10000');
});

test('permanent upgrades are included in both stat components',()=>{
 for(const [folder,file] of [['components','TopBar.jsx'],['pages','DittoPage.jsx']]){
  const code=readFileSync(new URL('../src/'+folder+'/'+file,import.meta.url),'utf8');
  assert.ok(code.includes('game.permanentUpgrades'));
  assert.ok(code.includes('effectiveDittoStats({dittoStats,energyUpgrades,permanentUpgrades})'));
 }
 const game={...initialState(),permanentUpgrades:{SU012:1,SU014:1,SU015:1}};
 const regular=effectiveDittoStats(initialState());
 const boosted=effectiveDittoStats(game);
 assert.ok(boosted.hp>regular.hp);
 assert.ok(boosted.attack>regular.attack);
});
