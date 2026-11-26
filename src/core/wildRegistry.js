// Data-driven regional membership and evolution graph. No gameplay data here.
const common=p=>!p.rarity||p.rarity==='common';
const empty=Object.freeze([]);
export function createWildRegistry(content){
 const regions=new Map(),pokemon=new Map(),homes=new Map(),children=new Map(),bases=new Map();
 for(const entry of content){
  if(regions.has(entry.region.id))throw Error('Duplicate region '+entry.region.id);
  regions.set(entry.region.id,entry);
  const base=entry.pokemon.filter(p=>!p.evolvesFrom);
  if(entry.order==='slot')base.sort((a,b)=>Number(a.encounterCode.slice(3,5))-Number(b.encounterCode.slice(3,5)));
  bases.set(entry.region.id,Object.freeze(base));
  for(const p of entry.pokemon){
   if(pokemon.has(p.id))throw Error('Duplicate Pokémon '+p.id);
   pokemon.set(p.id,p);homes.set(p.id,entry.region);
   if(p.evolvesFrom){const list=children.get(p.evolvesFrom)??[];list.push(p);children.set(p.evolvesFrom,list);}
  }
 }
 for(const [parent,list] of children){
  if(!pokemon.has(parent))throw Error('Unknown evolution parent '+parent);
  children.set(parent,Object.freeze(list));
 }
 // Reject cycles and cross-region evolution links rather than recursing forever.
 for(const p of pokemon.values()){
  const seen=new Set([p.id]);let next=p;
  while(next.evolvesFrom){
   if(seen.has(next.evolvesFrom))throw Error('Evolution cycle '+p.id);
   seen.add(next.evolvesFrom);
   next=pokemon.get(next.evolvesFrom);
   if(homes.get(next.id)!==homes.get(p.id))throw Error('Cross-region evolution '+p.id);
  }
 }
 for(const entry of content){
  const seen=new Set([entry.region.id]);let current=entry;
  while(current.unlock){
   const {from,count,eligible}=current.unlock;
   if(!Number.isSafeInteger(count)||count<1||!['appeared-base','common-base'].includes(eligible))throw Error('Invalid region unlock '+current.region.id);
   if(seen.has(from)||!regions.has(from))throw Error('Invalid region dependency '+from);
   seen.add(from);current=regions.get(from);
  }
 }
 const baseLineup=(state,id,selected)=>(bases.get(id)??empty).filter(p=>selected(state,p));
 const isUnlocked=(state,id,selected)=>{
  const entry=regions.get(id);
  if(!entry)return false;
  if(!entry.unlock)return true;
  const {from,count,eligible}=entry.unlock;
  if(!isUnlocked(state,from,selected))return false;
  const candidates=eligible==='common-base'?(bases.get(from)??empty).filter(common):baseLineup(state,from,selected);
  return candidates.filter(p=>(state.killCounts?.[p.id]??0)>0).length>=count;
 };
 return Object.freeze({
  pokemon:id=>pokemon.get(id)??null,regionOf:id=>homes.get(id)??null,
  childrenOf:id=>children.get(id)??empty,baseLineup,isUnlocked,
  unlockRequirement:id=>regions.get(id)?.unlock?.count??0,
  appeared(state,id,selected){
   const result=[];
   const insert=p=>{result.push(p);for(const child of children.get(p.id)??empty)if(state?.evolutionResults?.[child.id]===true)insert(child);};
   baseLineup(state,id,selected).forEach(insert);return result;
  }
 });
}
// Single evolution retains the existing random draw even at probability 0 or 1.
// A future explicit resolver must choose zero or one child for a branch.
export function resolveEvolutionVictory(state,children,count,random,chance,branchResolver){
 if(count!==0||children.length===0)return state.evolutionResults;
 if(children.length===1){const p=children[0];return {...state.evolutionResults,[p.id]:random()<chance(p,state)};}
 if(typeof branchResolver!=='function')return state.evolutionResults;
 const selected=branchResolver(children,state,random,chance);
 if(selected!==null&&!children.some(p=>p.id===selected))throw Error('Invalid branch evolution choice');
 return {...state.evolutionResults,...Object.fromEntries(children.map(p=>[p.id,p.id===selected]))};
}
