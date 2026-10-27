// Items are an achievement-like permanent system. The catalog intentionally has no
// item entries until individual conditions and effects are approved.
export const ITEMS=Object.freeze([]);
export const ITEM_BY_ID=Object.freeze(Object.fromEntries(ITEMS.map(item=>[item.id,item])));

// A condition is {scope:'run'|'lifetime',metric:'victories'|'pokemon:<id>',target:positive integer}.
// Additional future metrics can use recordItemProgress without changing persistence.
export function itemConditionMet(state,condition){
  if(!condition||!['run','lifetime'].includes(condition.scope)||typeof condition.metric!=='string'||
    !Number.isSafeInteger(condition.target)||condition.target<1)return false;
  const record=condition.scope==='run'?state.itemRunProgress:state.itemLifetimeProgress;
  return (record?.[condition.metric]??0)>=condition.target;
}
export function refreshItemPending(state,catalog=ITEMS){
  const owned=new Set(state.itemOwned??[]);
  const pending=new Set(state.itemPending??[]);
  for(const item of catalog){
    if(!owned.has(item.id)&&itemConditionMet(state,item.condition))pending.add(item.id);
  }
  return {...state,itemPending:[...pending]};
}
export function recordItemProgress(state,metric,amount=1,catalog=ITEMS){
  if(!Number.isSafeInteger(amount)||amount<=0||typeof metric!=='string'||!metric)return state;
  const run={...state.itemRunProgress,[metric]:(state.itemRunProgress?.[metric]??0)+amount};
  const lifetime={...state.itemLifetimeProgress,[metric]:(state.itemLifetimeProgress?.[metric]??0)+amount};
  return refreshItemPending({...state,itemRunProgress:run,itemLifetimeProgress:lifetime},catalog);
}
export function collectPendingItems(state,catalog=ITEMS){
  // Refresh once just before resetting the run, then transfer pending to owned.
  const ready=refreshItemPending(state,catalog);
  const valid=new Set(catalog.map(item=>item.id));
  const newlyOwned=(ready.itemPending??[]).filter(id=>valid.has(id));
  return {itemOwned:[...new Set([...(ready.itemOwned??[]),...newlyOwned])],
    itemPending:[],itemRunProgress:{},itemLifetimeProgress:{...ready.itemLifetimeProgress}};
}
export function itemEffectOwned(state,id){return (state.itemOwned??[]).includes(id);}
