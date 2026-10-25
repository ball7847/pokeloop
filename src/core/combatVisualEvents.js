import {compareAmount,subtractAmount} from './bigNumber.js';

// Only presentation events live here. Combat math and HP mutation stay in combatEngine.
// Damage channels are emitted in calculation order, bounded by actual lost HP.
export function appendDamageEvents(events,target,channels,before,total){
  let remaining=compareAmount(before,total)<0?before:total;
  for(const channel of channels){
    if(compareAmount(remaining,0)<=0)break;
    const visible=compareAmount(remaining,channel.value)<0?remaining:channel.value;
    if(compareAmount(visible,0)>0)events.push({target,kind:channel.kind,value:visible});
    remaining=subtractAmount(remaining,visible);
  }
}
export function appendStatusDamageEvent(events,target,kind,value){
  if(compareAmount(value,0)>0)events.push({target,kind,value});
}
