import {REGION,WILD_POKEMON,spriteUrl,isPokemonUnlocked,rewardMultiplier} from '../core/wildData.js';
const labels={attack:'공격',hp:'HP'};
const format=n=>Number(n.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4});
export function renderWildPage(state){
  const counts=state.killCounts;
  const current=state.combat.pokemonId;
  const cards=WILD_POKEMON.map((p,i)=>{
    const count=counts[p.id]||0, unlocked=isPokemonUnlocked(counts,p.id),capped=count>=REGION.defaultKillLimit;
    const fighting=state.combat.active&&current===p.id;
    const disabled=!unlocked||capped||state.combat.active||state.phase==='paused';
    const gain=Object.entries(p.rewards).map(([stat,val])=>labels[stat]+' +'+format(val*rewardMultiplier(count))).join(' · ');
    return '<button type="button" class="wild-card '+(fighting?'is-fighting':!unlocked?'is-locked':'')+
      '" data-pokemon="'+p.id+'" '+(disabled?'disabled':'')+' aria-label="'+p.name+' 선택">'+
      '<span class="wild-order">'+(i+1)+'</span>'+
      '<img src="'+spriteUrl(p.number)+'" alt="'+p.name+'" width="64" height="64">'+
      '<strong>'+p.name+'</strong><span class="wild-kills">'+count+' / '+REGION.defaultKillLimit+'회</span>'+
      '<span class="wild-reward">'+gain+'</span>'+
      '<span class="wild-state">'+(fighting?'전투 중':capped?'완료':!unlocked?'이전 포켓몬 처치 필요':'전투 시작')+'</span></button>';
  });
  while(cards.length<REGION.capacity)cards.push('<div class="wild-empty-cell" aria-hidden="true"></div>');
  const total=WILD_POKEMON.reduce((sum,p)=>sum+(counts[p.id]||0),0);
  return '<section class="wild-page"><div class="wild-header"><div><small>REGION 01</small><h2>'+REGION.name+
    '</h2></div><div class="wild-progress">'+total+' / '+(WILD_POKEMON.length*REGION.defaultKillLimit)+'회 처치</div></div>'+
    '<div class="wild-grid">'+cards.join('')+'</div>'+
    '<p class="wild-footnote">포켓몬을 선택하면 자동 전투가 시작됩니다. 각 포켓몬은 이전 순서의 포켓몬을 1회 처치하면 해금됩니다. 보상은 처치 횟수에 따라 감소합니다.</p></section>';
}
