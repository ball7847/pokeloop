import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/core/gameState.js';
import {appearedInRegion,ENCOUNTER_SLOTS,REGION} from '../src/core/wildData.js';
import {activePlanetEncounterBonuses,PLANET_ENCOUNTER_BONUSES} from '../src/core/planetEncounterBonuses.js';
import {rollEncounterSlots} from '../src/core/raritySystem.js';

const move=(state,random=()=>.99)=>transition({...state,pendingStellar:1},{type:'MOVE_PLANET',random});
const ids=state=>appearedInRegion(state,REGION.id).map(p=>p.id);
const bonus=(planet,discovered=[])=>activePlanetEncounterBonuses(planet,discovered,ENCOUNTER_SLOTS);

test('planet bonus configuration matches approved 2 / 4 / 6 / 8 multipliers',()=>{
 assert.deepEqual(PLANET_ENCOUNTER_BONUSES.map(x=>[x.planet,x.slotId,x.multiplier]),[
  [2,'W010302',20],[4,'W010602',15],[6,'W011502',10],[8,'W020502',10]
 ]);
 assert.deepEqual(bonus(1),{});
 assert.deepEqual(bonus(2),{W010302:20});
 assert.deepEqual(bonus(3),{W010302:20});
 assert.deepEqual(bonus(4),{W010302:20,W010602:15});
 assert.deepEqual(bonus(5),{W010302:20,W010602:15});
 assert.deepEqual(bonus(6),{W010302:20,W010602:15,W011502:10});
 assert.deepEqual(bonus(7),bonus(6));
 assert.deepEqual(bonus(8),{...bonus(6),W020502:10});
 assert.deepEqual(bonus(10),bonus(8));
});

test('discovered target disables only that bonus, including either Zigzagoon variant',()=>{
 assert.deepEqual(bonus(6,['psyduck','zigzagoon']),{W010602:15});
 assert.deepEqual(bonus(6,['ponyta','zigzagoon-galar']),{W010302:20});
 assert.deepEqual(bonus(6,['psyduck','ponyta','zigzagoon-galar']),{});
 assert.deepEqual(bonus(6,['psyduck','ponyta','zigzagoon']),{});
});

test('bonus probability caps at 100 percent but Ponyta and Zigzagoon remain fallible',()=>{
 let state=transition(initialState(),{type:'START'});
 state=move(state,()=>.99);
 assert.equal(state.planetMoves,1);
 // First uncommon slot: 5% natural ×20 = 100% additional roll.
 assert.equal(ids(state).includes('psyduck'),true);
 state={...state,dexDiscovered:['psyduck']};
 for(let planet=3;planet<=7;planet++){
  state=move(state,()=>.99);
  assert.equal(state.planetMoves,planet-1);
  assert.equal(ids(state).includes('psyduck'),false);
  assert.equal(ids(state).includes('ponyta'),false);
  assert.equal(ids(state).includes('zigzagoon'),false);
  assert.equal(ids(state).includes('zigzagoon-galar'),false);
 }
});

test('natural failure triggers a separate bonus roll, not a guaranteed spawn',()=>{
 const slot=ENCOUNTER_SLOTS.find(s=>s.id==='W010602');
 let draws=0;
 const won=rollEncounterSlots([slot],{chances:{uncommon:.05},bonuses:{W010602:15},
  random:()=>{draws++;return draws===1?.9:.5;}});
 assert.equal(won.W010602,'ponyta');
 assert.equal(draws,2);
 draws=0;
 const lost=rollEncounterSlots([slot],{chances:{uncommon:.05},bonuses:{W010602:15},
  random:()=>{draws++;return .99;}});
 assert.equal(lost.W010602,null);
 assert.equal(draws,2);
 draws=0;
 const natural=rollEncounterSlots([slot],{chances:{uncommon:.05},bonuses:{W010602:15},
  random:()=>{draws++;return 0;}});
 assert.equal(natural.W010602,'ponyta');
 assert.equal(draws,1);
});

test('a successful shared Zigzagoon slot selects exactly one variant',()=>{
 const slot=ENCOUNTER_SLOTS.find(s=>s.id==='W011502');
 let draws=0;
 const result=rollEncounterSlots([slot],{chances:{uncommon:.05},bonuses:{W011502:10},
  random:()=>[.9,.1,.9][draws++]});
 assert.equal(result.W011502,'zigzagoon-galar');
 assert.equal(draws,3);
});

test('manual rarity guarantees and bans retain their original priority',()=>{
 const slot=ENCOUNTER_SLOTS.find(s=>s.id==='W010602');
 assert.equal(rollEncounterSlots([slot],{chances:{uncommon:0},guaranteed:['ponyta'],random:()=>.99}).W010602,'ponyta');
 assert.equal(rollEncounterSlots([slot],{chances:{uncommon:1},bonuses:{W010602:15},
  banished:['ponyta'],random:()=>0}).W010602,null);
});

test('third planet no longer forces Ponyta; old manual guarantee persists',()=>{
 let state=transition(initialState(),{type:'START'});
 state=move(state);state=move(state);
 assert.equal(state.planetMoves,2);
 assert.equal(ids(state).includes('ponyta'),false);
 state={...state,rarityGuarantees:['ekans']};
 state=move(state);
 assert.equal(ids(state).includes('ekans'),true);
 assert.equal(ids(state).includes('ponyta'),false);
});

test('persisting discovery removes next planet bonus',()=>{
 let state=transition(initialState(),{type:'START'});
 state={...state,dexDiscovered:['psyduck','zigzagoon-galar']};
 state=move(state,()=>.99);
 assert.equal(ids(state).includes('psyduck'),false);
 for(let planet=3;planet<=6;planet++)state=move(state,()=>.99);
 assert.equal(state.planetMoves,5);
 assert.equal(ids(state).includes('zigzagoon-galar'),false);
});


test('Pikachu bonus starts at planet eight and stops after discovery',()=>{
 const slot=ENCOUNTER_SLOTS.find(s=>s.id==='W020502');
 assert.deepEqual(slot.candidates,['pikachu']);
 assert.equal(bonus(7).W020502,undefined);
 assert.equal(bonus(8).W020502,10);
 assert.equal(bonus(12).W020502,10);
 assert.equal(bonus(8,['pikachu']).W020502,undefined);
 assert.equal(bonus(12,['pikachu']).W020502,undefined);
 const roll=(planet,discovered,draws)=>rollEncounterSlots([slot],{chances:{uncommon:.05},bonuses:bonus(planet,discovered),random:()=>draws.shift()}).W020502;
 assert.equal(roll(7,[],[.9,.1]),null);
 assert.equal(roll(8,[],[.9,.1]),'pikachu');
 assert.equal(roll(8,[],[.9,.9]),null);
 assert.equal(roll(9,['pikachu'],[.9,.1]),null);
 assert.equal(roll(9,['pikachu'],[0]),'pikachu');
});
test('real planet movement activates Pikachu bonus only from eighth planet until discovery',()=>{
 let state=transition(initialState(),{type:'START'});
 state={...state,planetMoves:5,dexDiscovered:['psyduck','ponyta','zigzagoon'],dexLifetimeKills:{...state.dexLifetimeKills,psyduck:1,ponyta:1,zigzagoon:1}};
 const seventh=move(state,()=>.2);
 assert.equal(seventh.planetMoves,6);
 assert.equal(seventh.raritySlotResults.W020502,null);
 const eighth=move(seventh,()=>.2);
 assert.equal(eighth.planetMoves,7);
 assert.equal(eighth.raritySlotResults.W020502,'pikachu');
 assert.equal(eighth.berryRareAppeared,true);
 assert.equal(move(eighth,()=>.2).raritySlotResults.W020502,'pikachu');
 assert.equal(move({...eighth,dexDiscovered:[...eighth.dexDiscovered,'pikachu']},()=>.2).raritySlotResults.W020502,null);
 assert.equal(move(eighth,()=>.99).raritySlotResults.W020502,null);
});
