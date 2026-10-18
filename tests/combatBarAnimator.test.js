import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
async function loadAnimator(){
 const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{return await vite.ssrLoadModule('/src/components/CombatBarAnimator.jsx');}
 finally{await vite.close();}
}
import {initialState,transition} from '../src/core/gameState.js';

test('progress interpolates between 100ms simulation ticks without changing combat',async()=>{
 const {cooldownProgress}=await loadAnimator();
 const cooldown={elapsed:400,duration:2000};
 assert.equal(cooldownProgress(cooldown,0),20);
 assert.equal(cooldownProgress(cooldown,50),22.5);
 assert.equal(cooldownProgress(cooldown,100),25);
 assert.equal(cooldown.elapsed,400);
 assert.equal(cooldownProgress(cooldown,100,false),20);
 assert.equal(cooldownProgress({elapsed:1950,duration:2000},300),100);
 assert.equal(cooldownProgress({elapsed:0,duration:0},10),0);
});
test('painting only updates both bars, not battle state',async()=>{
 const {paintCooldownBars}=await loadAnimator();
 let s=transition(initialState(),{type:'SELECT_WILD',pokemonId:'rattata'});
 s=transition(s,{type:'COMBAT_TICK',deltaMs:350,random:()=>0.5});
 const controls=new Map();
 const root={querySelector(selector){
   if(!controls.has(selector)){
     const fill={style:{}};
     controls.set(selector,{fill,attrs:{},querySelector:()=>fill,setAttribute(k,v){this.attrs[k]=v;}});
   }
   return controls.get(selector);
 }};
 const before=structuredClone(s.combat);
 paintCooldownBars(root,s.combat,50);
 assert.equal(controls.size,2);
 assert.equal(controls.get('.battle-cooldown.enemy [role="progressbar"]').fill.style.transform,'scaleX('+((400/2100))+')');
 assert.deepEqual(s.combat,before);
});
