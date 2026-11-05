import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the exact production CombatClock effect, with a fake foreground clock.
// No combat/economy code is modified to accommodate these regression checks.
const source=readFileSync(new URL('../src/components/GameClocks.jsx',import.meta.url),'utf8')
  .replace(/^import .*;\s*$/gm,'')
  .replace(/export function /g,'function ');

function harness(speed=1){
  let now=0, tick, cleanup, lastInterval;
  const seen=[];
  const state={
    simulationSpeed:speed,
    game:{phase:'running',recoveryMs:0,combat:{active:true}},
    offlineRemainingSeconds:0
  };
  const store={
    ...state,
    dispatch(action){
      seen.push(action);
      if(action.type==='RECOVERY_TICK')
        state.game.recoveryMs=Math.max(0,state.game.recoveryMs-action.deltaMs);
    },
    queueOfflineProduction(seconds){
      seen.push({type:'QUEUE',seconds});
      state.offlineRemainingSeconds+=seconds;
    },
    consumeOfflineProduction(seconds){
      const applied=Math.min(5,seconds,state.offlineRemainingSeconds);
      state.offlineRemainingSeconds-=applied;
      seen.push({type:'CONSUME',seconds:applied});
    }
  };
  const listeners=new Map();
  const document={
    hidden:false,
    addEventListener(name,fn){listeners.set(name,fn)},
    removeEventListener(name){listeners.delete(name)}
  };
  const sandbox={
    performance:{now:()=>now},
    document,
    useGameStore:{getState:()=>({...store,...state})},
    useEffect:fn=>{cleanup=fn()},
    setInterval(fn,ms){tick=fn;lastInterval=ms;return 1},
    clearInterval(){},
    AUTOSAVE_INTERVAL_MS:30000
  };
  runInNewContext(source+'\nglobalThis.TestCombatClock=CombatClock;',sandbox);
  sandbox.TestCombatClock();
  assert.equal(lastInterval,100);
  return {
    state,seen,
    step(ms){now+=ms;tick()},
    toggle(speed){state.simulationSpeed=speed},
    hide(){document.hidden=true;listeners.get('visibilitychange')()},
    show(){document.hidden=false;listeners.get('visibilitychange')()},
    phase(phase){state.game.phase=phase},
    cleanup:()=>cleanup?.()
  };
}

const total=(events,type,key='deltaMs')=>events.filter(e=>e.type===type).reduce((sum,e)=>sum+e[key],0);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`expected ${expected}, got ${actual}`);

test('10x steady clock gives exactly tenfold battle and economic time',()=>{
  for(const speed of [1,10]){
    const h=harness(speed);
    for(let i=0;i<10;i++)h.step(100);
    near(total(h.seen,'ECONOMY_TICK'),1000*speed);
    near(total(h.seen,'COMBAT_TICK'),1000*speed);
    assert.equal(h.seen.filter(e=>e.type==='ABILITY_TICK').length,10);
    h.cleanup();
  }
});

test('foreground stall over 5000 simulated ms preserves production via offline queue',()=>{
  const h=harness(10);
  h.step(650);
  near(total(h.seen,'QUEUE','seconds'),6.5);
  near(total(h.seen,'COMBAT_TICK'),6500);
  near(total(h.seen,'CONSUME','seconds'),6.5);
  near(h.state.offlineRemainingSeconds,0);
  assert.equal(h.seen.filter(e=>e.type==='ECONOMY_TICK').length,0);
  h.cleanup();
});

test('visibility changes count hidden time once, without offline combat catch-up',()=>{
  const h=harness(10);
  h.step(100); // 1s foreground
  h.hide();
  h.step(200); // 2s hidden
  h.show();
  h.step(300); // 3s foreground
  near(total(h.seen,'COMBAT_TICK'),4000);
  near(total(h.seen,'ECONOMY_TICK'),4000);
  near(total(h.seen,'QUEUE','seconds'),2);
  near(total(h.seen,'CONSUME','seconds'),2);
  h.cleanup();
});

test('switching speed scales subsequent clock ticks; pausing prevents accrual',()=>{
  const h=harness(1);
  h.step(100);
  h.toggle(10);
  h.step(100);
  h.phase('paused');
  h.step(100);
  h.phase('running');
  h.step(100);
  near(total(h.seen,'COMBAT_TICK'),2100);
  near(total(h.seen,'ECONOMY_TICK'),2100);
  h.cleanup();
});

test('combat-clock speed is not a global timer override; autosave remains 30s',()=>{
  const text=readFileSync(new URL('../src/components/GameClocks.jsx',import.meta.url),'utf8');
  assert.match(text,/\},AUTOSAVE_INTERVAL_MS\)/);
});
