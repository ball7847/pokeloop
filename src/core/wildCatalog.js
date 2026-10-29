import {resolveStats} from './dittoStats.js';

// Static catalog: species stats, rewards, regional membership and encounter codes.
// Encounter rolling, unlock conditions and combat remain in wildData.js.
export const REGION=Object.freeze({id:'starting-plains',name:'시작의 평원',defaultKillLimit:10,rewardDecay:1});
export const BERRY_REGION=Object.freeze({id:'berry-forest',name:'베리숲',defaultKillLimit:10,rewardDecay:1});
export const LAKE_REGION=Object.freeze({id:'moonlit-lake',name:'달빛의 호수',defaultKillLimit:10,rewardDecay:1});
export const REGIONS=Object.freeze([REGION,BERRY_REGION,LAKE_REGION]);
const entries=[
{id:'rattata',number:19,name:'꼬렛',types:['노말'],energyReward:1,hp:3,attack:2,speed:2100,rewards:{attack:1}},
{id:'pidgey',number:16,name:'구구',types:['노말','비행'],energyReward:2,hp:6,attack:2.5,speed:2400,rewards:{hp:1}},
{id:'mankey',number:56,name:'망키',types:['격투'],energyReward:3.5,hp:24,attack:7,speed:1800,rewards:{hp:5.6,attack:2}},
{id:'spearow',number:21,name:'깨비참',types:['노말','비행'],energyReward:3,hp:13.3,attack:2,speed:1300,rewards:{hp:2.1,attack:1}},
{id:'zubat',number:41,name:'주뱃',types:['독','비행'],energyReward:3,hp:10,attack:1.2,speed:800,rewards:{attack:1,speed:-20}},
{id:'meowth',number:52,name:'나옹',types:['노말'],energyReward:10,hp:20,attack:1.8,speed:1100,multiStrike:1000,rewards:{attack:1.5,multiStrike:4}},
{id:'geodude',number:74,name:'꼬마돌',types:['바위','땅'],energyReward:1,hp:40,attack:20,defense:10,speed:6000,rewards:{attack:2,defense:1}},
{id:'exeggcute',number:102,name:'아라리',types:['풀','에스퍼'],energyReward:1,hp:60,attack:4,specialAttack:30,speed:4700,rewards:{specialAttack:3}},
{id:'sentret',number:161,name:'꼬리선',types:['노말'],energyReward:15,hp:100,attack:4.6,speed:2400,rewards:{hp:16.1}},
{id:'tauros',number:128,name:'켄타로스',types:['노말'],energyReward:49,hp:225,attack:20,defense:9.5,specialDefense:7,speed:1500,rewards:{hp:15,attack:5,defense:1,specialDefense:1}}
];
// Encounter codes identify regional slots independently from species IDs.
const region1Codes=Object.freeze(['W010101','W010201','W010401','W010501','W010701','W010901','W011001','W011201','W011401','W011601']);
export const WILD_POKEMON=Object.freeze(entries.map((p,i)=>Object.freeze({...p,...resolveStats(p),encounterCode:region1Codes[i]})));
// Evolution children use their parent's regional slot, but never count as base encounters.
export const PLAINS_EVOLUTIONS=Object.freeze([
 {id:'fearow',number:22,name:'깨비드릴조',types:['노말','비행'],rarity:'uncommon',evolvesFrom:'spearow',encounterCode:'W010401-E1',hp:122,attack:8.8,speed:1000,accuracy:150,criticalChance:8,criticalMultiplier:225,rewards:{accuracy:8,criticalMultiplier:3}}
].map(p=>Object.freeze({...p,...resolveStats(p)})));
export const UNCOMMON_BASE_CHANCE=0;
export const UNCOMMON_STARTERS=Object.freeze([{id:'bulbasaur',number:1,name:'이상해씨',types:['풀','독'],energyReward:132},{id:'charmander',number:4,name:'파이리',types:['불꽃'],energyReward:132},{id:'squirtle',number:7,name:'꼬부기',types:['물'],energyReward:132}].map((p,i)=>Object.freeze({...p,...resolveStats({hp:100,attack:10,speed:3000}),encounterCode:'W010802-0'+(i+1),rarity:'uncommon',rewards:{hp:10,attack:1,speed:-30}})));
export const PLAINS_UNCOMMON=Object.freeze([
 {id:'psyduck',number:54,name:'고라파덕',types:['물'],rarity:'uncommon',encounterCode:'W010302',hp:50,attack:5.2,speed:1400,energyReward:5.5,rewards:{hp:8,attack:2.6}},
 {id:'ponyta',number:77,name:'포니타',types:['불꽃'],rarity:'uncommon',encounterCode:'W010602',hp:77,attack:8.5,speed:800,energyReward:7.7,rewards:{attack:4.1,speed:-20}},
 {id:'ekans',number:23,name:'아보',types:['독'],rarity:'uncommon',encounterCode:'W011102',hp:88,attack:20,speed:2000,dodge:88,poison:20,antidote:100,energyReward:8,rewards:{dodge:20,poison:8}},
 {id:'rookidee',number:821,name:'파라꼬',types:['비행'],rarity:'uncommon',encounterCode:'W011302',hp:176,attack:27,defense:15,specialDefense:15,speed:2300,accuracy:200,energyReward:8,rewards:{hp:8,defense:8,specialDefense:8,accuracy:4}},
 {id:'zigzagoon',number:263,name:'지그제구리',types:['노말'],rarity:'uncommon',encounterCode:'W011502-01',hp:138,attack:13,speed:1100,dodge:26,energyReward:13.4,rewards:{dodge:13}},
 {id:'zigzagoon-galar',number:263,spriteNumber:10174,name:'지그제구리(가라르의 모습)',types:['악','노말'],rarity:'uncommon',encounterCode:'W011502-02',hp:138,attack:26,speed:1100,dodge:13,energyReward:3.4,rewards:{attack:2.6,dodge:13}}
].map(p=>Object.freeze({...p,...resolveStats(p)})));
export const STARTER_IDS=Object.freeze(UNCOMMON_STARTERS.map(p=>p.id));
const berryEntries=[
{id:'caterpie',number:10,name:'캐터피',types:['벌레'],energyReward:3,hp:90,attack:12,speed:3000,rewards:{hp:7}},
{id:'metapod',evolvesFrom:'caterpie',rarity:'common',number:11,name:'단데기',types:['벌레'],energyReward:5,hp:150,attack:20,defense:11,speed:4500,rewards:{hp:10,defense:1}},
{id:'weedle',number:13,name:'뿔충이',types:['벌레','독'],energyReward:3,hp:80,attack:14,speed:3500,rewards:{hp:7}},
{id:'kakuna',evolvesFrom:'weedle',rarity:'common',number:14,name:'딱충이',types:['벌레','독'],energyReward:5,hp:160,attack:20,defense:10,speed:5000,rewards:{hp:10,defense:1}},
{id:'taillow',number:276,name:'테일로',types:['노말','비행'],energyReward:27.6,hp:80,attack:11,speed:1100,rewards:{attack:2.76,speed:-20}},
{id:'swellow',evolvesFrom:'taillow',rarity:'uncommon',number:277,name:'스왈로',types:['노말','비행'],hp:600,attack:15,specialAttack:15,speed:825,accuracy:277,rewards:{accuracy:14}},
{id:'igglybuff',number:174,name:'푸푸린',types:['노말','페어리'],energyReward:39,hp:180,attack:6,specialAttack:20,specialDefense:4,speed:2000,rewards:{hp:18,specialAttack:5}},
{id:'pikachu',number:25,name:'피카츄',types:['전기'],rarity:'uncommon',energyReward:25,hp:250,attack:25,specialAttack:25,speed:1025,paralysis:250,rewards:{attack:25,paralysis:25}},
{id:'nidoran-m',number:32,name:'니드런♂',types:['독'],energyReward:6.9,hp:230,attack:57,speed:2730,accuracy:80,minDamagePercent:50,maxDamagePercent:150,rewards:{attack:5.7,maxDamagePercent:3.2}},
{id:'nidoran-f',number:29,name:'니드런♀',types:['독'],energyReward:6.9,hp:220,attack:21,speed:2750,poison:10,rewards:{hp:12.9,poison:1}},
{id:'tangela',number:114,name:'덩쿠리',types:['풀'],energyReward:11.4,hp:195,specialAttack:15.5,regeneration:5,speed:1600,rewards:{hp:11.4,regeneration:1.14}},
{id:'bidoof',number:399,name:'비버니',types:['노말'],energyReward:40,hp:390,attack:25,specialAttack:15,speed:2900,rewards:{hp:20,attack:4}},
{id:'surskit',number:283,name:'비구술',types:['벌레','물'],energyReward:28,hp:40,attack:30,defense:32,specialAttack:50,specialDefense:52,speed:990,rewards:{speed:-28}},
{id:'tropius',number:357,name:'트로피우스',types:['풀','비행'],energyReward:100,hp:990,attack:68,specialAttack:72,regeneration:46,speed:5100,rewards:{hp:50,attack:10,specialAttack:10,regeneration:10}}
];
// Region 2 slots remain fixed even when conditional Pokémon have not appeared.
// Evolutions inherit their parent's slot and use -E1 for the first evolution.
const berryEncounterCodes=Object.freeze({
  caterpie:'W020101',metapod:'W020101-E1',
  weedle:'W020201',kakuna:'W020201-E1',
  taillow:'W020301',swellow:'W020301-E1',pikachu:'W020502',
  igglybuff:'W020401','nidoran-m':'W020601','nidoran-f':'W020701',tangela:'W020801',bidoof:'W020901',surskit:'W021001',tropius:'W021101'
});
// Region 2 awards each configured energyReward to each of the Pokémon's types.
export const BERRY_POKEMON=Object.freeze(berryEntries.map(p=>Object.freeze({...p,...resolveStats(p),encounterCode:berryEncounterCodes[p.id]})));
const lakeEntries=[
{id:'buizel',number:418,name:'브이젤',types:['물'],hp:550,attack:20,speed:850,multiStrike:2000,energyReward:33,rewards:{attack:3,multiStrike:33},encounterCode:'W030101'},
{id:'magikarp',number:129,name:'잉어킹',types:['물'],hp:95,attack:12.5,speed:1290,dodge:100,energyReward:20,rewards:{},encounterCode:'W030201'},
{id:'gyarados',number:130,name:'갸라도스',types:['물','비행'],rarity:'common',evolvesFrom:'magikarp',hp:950,attack:125,speed:1300,intimidation:500,energyReward:130,rewards:{attack:20,intimidation:16},encounterCode:'W030201-E1'},
{id:'popplio',number:728,name:'누리공',types:['물'],rarity:'uncommon',hp:1500,specialAttack:66,specialDefense:56,sound:40,speed:3000,energyReward:100,rewards:{specialAttack:30,specialDefense:30,sound:10},encounterCode:'W030302-01'},
{id:'sobble',number:816,name:'울머기',types:['물'],rarity:'uncommon',hp:1500,specialAttack:70,specialDefense:40,criticalChance:50,criticalMultiplier:200,speed:3000,energyReward:100,rewards:{specialAttack:40,specialDefense:20,criticalChance:1},encounterCode:'W030302-02'},
{id:'quaxly',number:912,name:'꾸왁스',types:['물'],rarity:'uncommon',hp:1550,attack:65,defense:45,specialDefense:45,dodge:30,multiStrike:300,speed:3000,energyReward:100,rewards:{attack:40,dodge:15,multiStrike:15},encounterCode:'W030302-03'},
{id:'cutiefly',number:742,name:'에블리',types:['벌레','페어리'],hp:400,specialAttack:25,speed:620,energyReward:30.4,rewards:{specialAttack:7,speed:-42},encounterCode:'W030401'},
{id:'ribombee',number:743,name:'에리본',types:['벌레','페어리'],rarity:'uncommon',evolvesFrom:'cutiefly',hp:1200,specialAttack:75,speed:420,energyReward:46.4,rewards:{specialAttack:14,honey:14},encounterCode:'W030401-E1'}
];
export const LAKE_POKEMON=Object.freeze(lakeEntries.map(p=>Object.freeze({...p,...resolveStats(p)})));
export const ALL_POKEMON=Object.freeze([...WILD_POKEMON,...PLAINS_EVOLUTIONS,...UNCOMMON_STARTERS,...PLAINS_UNCOMMON,...BERRY_POKEMON,...LAKE_POKEMON]);
