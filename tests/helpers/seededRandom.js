// Deterministic, test-only PRNG. Independent channels prevent combat draws from changing encounters.
export const DEFAULT_VIRTUAL_SEEDS=Object.freeze(Array.from({length:10},(_,i)=>7847+i));
export function deriveSeed(seed,channel){
 if(!Number.isInteger(seed))throw new TypeError('seed must be an integer');
 let h=(seed>>>0)^0x811c9dc5;
 for(let i=0;i<channel.length;i++){h=Math.imul(h^channel.charCodeAt(i),16777619)>>>0;}
 return h>>>0;
}
export function createSeededRandom(seed){
 let state=seed>>>0;
 return ()=>{
  state=(state+0x6D2B79F5)>>>0;
  let t=state;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
export function createVirtualRandomStreams(seed){
 return {
  encounterRandom:createSeededRandom(deriveSeed(seed,'encounter')),
  combatRandom:createSeededRandom(deriveSeed(seed,'combat')),
 };
}
