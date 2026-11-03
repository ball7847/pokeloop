// Static supply audit: potential rewards are NOT a simulated playthrough.
// Conditional/uncommon/rare encounters are separately labelled; a species can
// appear only after actual unlock, rarity and evolution rules are satisfied.
import {TYPES,typeLayer} from '../src/core/energySystem.js';
import {ALL_POKEMON,getKillLimit,battleEnergyRewards,regionForPokemon,REGIONS} from '../src/core/wildData.js';

const harmonic=n=>Array.from({length:n},(_,i)=>1/(i+1)).reduce((a,b)=>a+b,0);
export function auditTypeEnergy(){
 const rows=ALL_POKEMON.map(p=>{
  const limit=getKillLimit(p),first=battleEnergyRewards(p,0);
  const conditional=!!p.evolvesFrom || (p.rarity!==undefined&&p.rarity!=='common');
  return {id:p.id,name:p.name,region:regionForPokemon(p.id),
   rarity:p.rarity??'common',evolvesFrom:p.evolvesFrom??null,
   fixedLimit:p.maxKillsPerPlanet??null,limit,first,
   maximum:Object.fromEntries(Object.entries(first).map(([type,amount])=>[type,amount*harmonic(limit)])),
   conditional};
 });
 const byType=TYPES.map(type=>{
  const eligible=rows.filter(p=>Object.hasOwn(p.first,type));
  const guaranteed=eligible.filter(p=>!p.conditional);
  const total=list=>list.reduce((sum,p)=>sum+p.maximum[type],0);
  const first=list=>list.reduce((sum,p)=>sum+p.first[type],0);
  return {type,layer:typeLayer(type),
   guaranteedSpecies:guaranteed.length,possibleSpecies:eligible.length,
   guaranteedFirstSupply:first(guaranteed),guaranteedMaxSupply:total(guaranteed),
   possibleFirstSupply:first(eligible),possibleMaxSupply:total(eligible)};
 });
 return {regions:REGIONS.map(r=>r.id),byType,rows};
}
if(process.argv[1]?.endsWith('auditTypeEnergy.mjs')){
 const audit=auditTypeEnergy();
 console.log('TYPE_ENERGY_AUDIT '+JSON.stringify(audit.byType));
 console.log('POKEMON_REWARDS '+JSON.stringify(audit.rows));
}
